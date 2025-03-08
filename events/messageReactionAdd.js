const { EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');

// Get the Starboard model
let Starboard;
try {
    Starboard = mongoose.model('Starboard');
} catch (error) {
    // If the model doesn't exist yet, it will be created in the command files
    console.log('Starboard model not loaded yet, skipping initialization in event');
}

module.exports = {
    name: 'messageReactionAdd',
    async execute(reaction, user, client) {
        // Ignore bot reactions
        if (user.bot) return;
        
        // When a reaction is received, check if the structure is partial
        if (reaction.partial) {
            // If the message this reaction belongs to was removed, the fetching might result in an error
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message reaction:', error);
                return;
            }
        }
        
        // If the message is partial, fetch it
        if (reaction.message.partial) {
            try {
                await reaction.message.fetch();
            } catch (error) {
                console.error('Error fetching message:', error);
                return;
            }
        }
        
        // Get guild settings
        const guild = reaction.message.guild;
        if (!guild) return; // Not in a guild
        
        const guildSettings = client.settings?.get(guild.id) || {};
        
        // Check if reaction roles are configured
        if (!guildSettings.reactionRoles || guildSettings.reactionRoles.length === 0) return;
        
        // Find the reaction role message
        const reactionRole = guildSettings.reactionRoles.find(rr => rr.messageId === reaction.message.id);
        if (!reactionRole) return; // Not a reaction role message
        
        // Get the emoji ID or name
        const emoji = reaction.emoji.id || reaction.emoji.name;
        
        // Find the role for this emoji
        const roleConfig = reactionRole.roles.find(r => r.emoji === emoji);
        if (!roleConfig) return; // No role for this emoji
        
        // Get the role
        const role = guild.roles.cache.get(roleConfig.roleId);
        if (!role) {
            console.error(`Role ${roleConfig.roleId} not found for reaction role`);
            return;
        }
        
        // Get the member
        const member = await guild.members.fetch(user.id).catch(console.error);
        if (!member) return;
        
        // Check if the bot can manage the role
        if (!role.editable) {
            console.error(`Cannot assign role ${role.name} - higher than bot's highest role`);
            
            // Try to DM the user
            try {
                const embed = new EmbedBuilder()
                    .setTitle('Role Assignment Failed')
                    .setDescription(`I couldn't assign you the role ${role.name} because it's higher than my highest role.`)
                    .setColor('#FF0000')
                    .setTimestamp();
                
                user.send({ embeds: [embed] }).catch(() => {});
            } catch (error) {
                console.error(`Could not send DM to ${user.tag}`, error);
            }
            
            // Remove the reaction
            reaction.users.remove(user.id).catch(console.error);
            return;
        }
        
        try {
            // Add the role to the member
            await member.roles.add(role, 'Reaction Role');
            
            console.log(`[ReactionRole] Added role ${role.name} to ${member.user.tag} in ${guild.name}`);
            
            // Try to DM the user
            try {
                const embed = new EmbedBuilder()
                    .setTitle('Role Added')
                    .setDescription(`You have been given the role **${role.name}** in **${guild.name}**.`)
                    .setColor(role.hexColor)
                    .setTimestamp();
                
                user.send({ embeds: [embed] }).catch(() => {});
            } catch (error) {
                console.error(`Could not send DM to ${user.tag}`, error);
            }
            
            // Log to channel if set
            const logChannelId = guildSettings.logChannel;
            if (logChannelId) {
                const logChannel = guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('Reaction Role Added')
                        .setDescription(`${member.user.tag} has been given the role ${role}.`)
                        .addFields(
                            { name: 'User', value: `${member.user.tag} (${member.id})` },
                            { name: 'Role', value: `${role.name} (${role.id})` },
                            { name: 'Message', value: `[Jump to Message](${reaction.message.url})` }
                        )
                        .setColor(role.hexColor)
                        .setThumbnail(member.user.displayAvatarURL())
                        .setTimestamp();
                    
                    logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }
        } catch (error) {
            console.error(`Error adding role to member: ${error}`);
            
            // Try to DM the user
            try {
                const embed = new EmbedBuilder()
                    .setTitle('Role Assignment Failed')
                    .setDescription(`I couldn't assign you the role ${role.name}. Error: ${error.message}`)
                    .setColor('#FF0000')
                    .setTimestamp();
                
                user.send({ embeds: [embed] }).catch(() => {});
            } catch (dmError) {
                console.error(`Could not send DM to ${user.tag}`, dmError);
            }
            
            // Remove the reaction
            reaction.users.remove(user.id).catch(console.error);
        }
        
        // Handle starboard functionality
        if (reaction.emoji.name === '⭐') {
            try {
                // Skip if Starboard model isn't loaded yet
                if (!Starboard) {
                    Starboard = mongoose.model('Starboard');
                }
                
                // Get starboard configuration for this guild
                const starboard = await Starboard.findOne({ guildId: reaction.message.guild.id });
                
                // If starboard is not set up or disabled, ignore
                if (!starboard || !starboard.enabled) return;
                
                // Get the starboard channel
                const starboardChannel = reaction.message.guild.channels.cache.get(starboard.channelId);
                if (!starboardChannel) return;
                
                // Check if the channel is in the ignored list
                if (starboard.ignoredChannels.includes(reaction.message.channel.id)) return;
                
                // Check if the message has enough star reactions
                const starCount = reaction.count;
                if (starCount < starboard.threshold) return;
                
                // Create the starboard embed
                await createStarboardMessage(reaction.message, starCount, starboardChannel);
            } catch (error) {
                console.error('Error handling starboard reaction:', error);
            }
        }
    }
};

// Function to create or update a starboard message
async function createStarboardMessage(message, starCount, starboardChannel) {
    try {
        // Check if message is already in the starboard
        const existingMessages = await starboardChannel.messages.fetch({ limit: 100 });
        const existingStarMessage = existingMessages.find(m => 
            m.embeds.length > 0 && 
            m.embeds[0].footer && 
            m.embeds[0].footer.text && 
            m.embeds[0].footer.text.startsWith('⭐') && 
            m.embeds[0].footer.text.endsWith(message.id)
        );
        
        // Create the embed for the starboard
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('Starred Message')
            .setDescription(message.content || '*No text content*')
            .addFields({ name: 'Source', value: `[Jump to message](${message.url})` })
            .setTimestamp(message.createdAt)
            .setFooter({ text: `⭐ ${starCount} | ${message.id}` });
        
        // Add author information if available
        if (message.author) {
            embed.setAuthor({
                name: message.author.tag,
                iconURL: message.author.displayAvatarURL({ dynamic: true })
            });
        }
        
        // Add image if the message has one
        if (message.attachments.size > 0) {
            const attachment = message.attachments.first();
            const isImage = attachment.contentType && attachment.contentType.startsWith('image/');
            if (isImage) {
                embed.setImage(attachment.url);
            }
        }
        
        // If the message has embeds, add a field with a link
        if (message.embeds.length > 0) {
            embed.addFields({ name: 'Contains Embed', value: 'Original message contains an embed that cannot be displayed here.' });
        }
        
        // If the message is already in the starboard, update it
        if (existingStarMessage) {
            await existingStarMessage.edit({ embeds: [embed] });
        } else {
            // Otherwise, create a new starboard message
            await starboardChannel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error('Error creating starboard message:', error);
    }
} 