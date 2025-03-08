const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'messageReactionRemove',
    async execute(reaction, user, client) {
        // Ignore bot reactions
        if (user.bot) return;
        
        // If the reaction is partial, fetch it
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Error fetching reaction:', error);
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
        
        // Check if the member has the role
        if (!member.roles.cache.has(role.id)) return;
        
        // Check if the bot can manage the role
        if (!role.editable) {
            console.error(`Cannot remove role ${role.name} - higher than bot's highest role`);
            return;
        }
        
        try {
            // Remove the role from the member
            await member.roles.remove(role, 'Reaction Role Removed');
            
            console.log(`[ReactionRole] Removed role ${role.name} from ${member.user.tag} in ${guild.name}`);
            
            // Try to DM the user
            try {
                const embed = new EmbedBuilder()
                    .setTitle('Role Removed')
                    .setDescription(`The role **${role.name}** has been removed from you in **${guild.name}**.`)
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
                        .setTitle('Reaction Role Removed')
                        .setDescription(`${role} has been removed from ${member.user.tag}.`)
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
            console.error(`Error removing role from member: ${error}`);
        }
    }
}; 