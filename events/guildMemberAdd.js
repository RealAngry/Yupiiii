const { EmbedBuilder } = require('discord.js');
const Guild = require('../models/guild');

module.exports = {
    name: 'guildMemberAdd',
    execute(member, client) {
        handleMemberJoin(member, client);
    }
};

async function handleMemberJoin(member, client) {
    const guild = member.guild;
    
    // Get guild settings
    const guildSettings = client.settings?.get(guild.id) || {};
    
    // Check if anti-raid is enabled
    if (guildSettings.antiraid) {
        // Initialize tracking maps if they don't exist
        if (!client.raidMode) client.raidMode = new Map();
        if (!client.joinedMembers) client.joinedMembers = new Map();
        
        // Get current time
        const now = Date.now();
        
        // Initialize guild's joined members tracking if it doesn't exist
        if (!client.joinedMembers.has(guild.id)) {
            client.joinedMembers.set(guild.id, []);
        }
        
        // Get guild's joined members
        const joinedMembers = client.joinedMembers.get(guild.id);
        
        // Add current member to joined members
        joinedMembers.push({
            id: member.id,
            timestamp: now
        });
        
        // Remove members who joined more than 10 seconds ago
        const recentJoins = joinedMembers.filter(join => now - join.timestamp < 10000);
        client.joinedMembers.set(guild.id, recentJoins);
        
        // Check if there's a raid (more than 10 joins in 10 seconds)
        if (recentJoins.length >= 10 && !client.raidMode.get(guild.id)) {
            // Enable raid mode
            client.raidMode.set(guild.id, true);
            
            console.log(`[AntiRaid] Raid detected in ${guild.name}! ${recentJoins.length} members joined in 10 seconds.`);
            
            // Log to channel if set
            const logChannelId = guildSettings.logChannel;
            if (logChannelId) {
                const logChannel = guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setTitle('⚠️ RAID DETECTED ⚠️')
                        .setDescription(`A raid has been detected! ${recentJoins.length} members joined in the last 10 seconds.`)
                        .setColor('#FF0000')
                        .setTimestamp();
                    
                    logChannel.send({ embeds: [embed] }).catch(() => {});
                }
            }
            
            // Disable raid mode after 5 minutes
            setTimeout(() => {
                if (client.raidMode.get(guild.id)) {
                    client.raidMode.set(guild.id, false);
                    
                    console.log(`[AntiRaid] Raid mode disabled in ${guild.name}.`);
                    
                    // Log to channel if set
                    if (logChannelId) {
                        const logChannel = guild.channels.cache.get(logChannelId);
                        if (logChannel) {
                            const embed = new EmbedBuilder()
                                .setTitle('Raid Mode Disabled')
                                .setDescription('Raid mode has been automatically disabled after 5 minutes.')
                                .setColor('#00FF00')
                                .setTimestamp();
                            
                            logChannel.send({ embeds: [embed] }).catch(() => {});
                        }
                    }
                }
            }, 5 * 60 * 1000); // 5 minutes
        }
        
        // If raid mode is active, take action on new members
        if (client.raidMode.get(guild.id)) {
            try {
                // Kick the member
                await member.kick('Anti-raid protection');
                
                console.log(`[AntiRaid] Kicked ${member.user.tag} due to raid protection in ${guild.name}.`);
                
                // Log to channel if set
                const logChannelId = guildSettings.logChannel;
                if (logChannelId) {
                    const logChannel = guild.channels.cache.get(logChannelId);
                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('Anti-Raid Action')
                            .setDescription(`${member.user.tag} was kicked due to raid protection.`)
                            .addFields(
                                { name: 'User ID', value: member.id },
                                { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>` }
                            )
                            .setColor('#FFA500')
                            .setThumbnail(member.user.displayAvatarURL())
                            .setTimestamp();
                        
                        logChannel.send({ embeds: [embed] }).catch(() => {});
                    }
                }
            } catch (error) {
                console.error(`[AntiRaid] Failed to kick ${member.user.tag}: ${error}`);
            }
            
            return; // Skip welcome message and autoroles during raid
        }
    }
    
    // Apply bot/human roles
    try {
        // Get guild data from database
        const guildData = await Guild.findOne({ guildId: guild.id });
        
        if (guildData) {
            // Check if member is a bot and bot role is set
            if (member.user.bot && guildData.botRole) {
                const botRole = guild.roles.cache.get(guildData.botRole);
                if (botRole && botRole.editable) {
                    await member.roles.add(botRole, 'Auto Bot Role');
                    console.log(`[AutoRole] Added bot role ${botRole.name} to ${member.user.tag} in ${guild.name}`);
                    
                    // Log to channel if set
                    const logChannelId = guildSettings.logChannel || guildData.logChannel;
                    if (logChannelId) {
                        const logChannel = guild.channels.cache.get(logChannelId);
                        if (logChannel) {
                            const embed = new EmbedBuilder()
                                .setTitle('Bot Role Applied')
                                .setDescription(`${member.user.tag} has been given the bot role.`)
                                .addFields(
                                    { name: 'User', value: `${member.user.tag} (${member.id})` },
                                    { name: 'Role', value: botRole.toString() }
                                )
                                .setColor('#9B59B6')
                                .setThumbnail(member.user.displayAvatarURL())
                                .setTimestamp();
                            
                            logChannel.send({ embeds: [embed] }).catch(() => {});
                        }
                    }
                }
            }
            // Check if member is a human and human role is set
            else if (!member.user.bot && guildData.humanRole) {
                const humanRole = guild.roles.cache.get(guildData.humanRole);
                if (humanRole && humanRole.editable) {
                    await member.roles.add(humanRole, 'Auto Human Role');
                    console.log(`[AutoRole] Added human role ${humanRole.name} to ${member.user.tag} in ${guild.name}`);
                    
                    // Log to channel if set
                    const logChannelId = guildSettings.logChannel || guildData.logChannel;
                    if (logChannelId) {
                        const logChannel = guild.channels.cache.get(logChannelId);
                        if (logChannel) {
                            const embed = new EmbedBuilder()
                                .setTitle('Human Role Applied')
                                .setDescription(`${member.user.tag} has been given the human role.`)
                                .addFields(
                                    { name: 'User', value: `${member.user.tag} (${member.id})` },
                                    { name: 'Role', value: humanRole.toString() }
                                )
                                .setColor('#3498DB')
                                .setThumbnail(member.user.displayAvatarURL())
                                .setTimestamp();
                            
                            logChannel.send({ embeds: [embed] }).catch(() => {});
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error(`[AutoRole] Failed to apply bot/human role to ${member.user.tag}: ${error}`);
    }
    
    // Apply autoroles if configured
    if (guildSettings.autoroles && guildSettings.autoroles.length > 0) {
        try {
            // Get roles that still exist in the guild
            const validRoles = guildSettings.autoroles
                .map(roleId => guild.roles.cache.get(roleId))
                .filter(role => role && role.editable);
            
            if (validRoles.length > 0) {
                // Add roles to the member
                await member.roles.add(validRoles, 'Autorole');
                
                console.log(`[Autorole] Added ${validRoles.length} roles to ${member.user.tag} in ${guild.name}`);
                
                // Log to channel if set
                const logChannelId = guildSettings.logChannel;
                if (logChannelId) {
                    const logChannel = guild.channels.cache.get(logChannelId);
                    if (logChannel) {
                        const roleList = validRoles.map(role => role.toString()).join(', ');
                        
                        const embed = new EmbedBuilder()
                            .setTitle('Autoroles Applied')
                            .setDescription(`${member.user.tag} has been given the following roles:`)
                            .addFields(
                                { name: 'User', value: `${member.user.tag} (${member.id})` },
                                { name: 'Roles', value: roleList }
                            )
                            .setColor('#00FF00')
                            .setThumbnail(member.user.displayAvatarURL())
                            .setTimestamp();
                        
                        logChannel.send({ embeds: [embed] }).catch(() => {});
                    }
                }
            }
        } catch (error) {
            console.error(`[Autorole] Failed to add roles to ${member.user.tag}: ${error}`);
        }
    }
    
    // Welcome message
    const welcomeChannelId = guildSettings.welcomeChannel;
    if (welcomeChannelId) {
        const welcomeChannel = guild.channels.cache.get(welcomeChannelId);
        if (welcomeChannel) {
            try {
                // Check if a custom welcome message is set
                if (guildSettings.welcomeMessage) {
                    // Create welcome embed with variables replaced
                    const welcomeEmbed = createWelcomeEmbed(guildSettings.welcomeMessage, member);
                    
                    // Send custom welcome message
                    welcomeChannel.send({ embeds: [welcomeEmbed] }).catch(error => {
                        console.error(`[Welcome] Failed to send custom welcome message: ${error}`);
                    });
                } else {
                    // Send default welcome message
                    const embed = new EmbedBuilder()
                        .setTitle('New Member')
                        .setDescription(`Welcome to ${guild.name}, ${member}!`)
                        .addFields(
                            { name: 'Member Count', value: `${guild.memberCount}` },
                            { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>` }
                        )
                        .setColor('#00FF00')
                        .setThumbnail(member.user.displayAvatarURL())
                        .setTimestamp();
                    
                    welcomeChannel.send({ embeds: [embed] }).catch(error => {
                        console.error(`[Welcome] Failed to send default welcome message: ${error}`);
                    });
                }
            } catch (error) {
                console.error(`[Welcome] Error creating welcome message: ${error}`);
            }
        }
    }
}

// Function to create welcome embed with variables
function createWelcomeEmbed(data, member) {
    const embed = new EmbedBuilder();
    const user = member.user;
    const guild = member.guild;
    
    // Replace variables in string
    const replaceVariables = (text) => {
        if (!text) return text;
        
        return text
            .replace(/{user}/g, `<@${user.id}>`)
            .replace(/{username}/g, user.username)
            .replace(/{tag}/g, user.tag)
            .replace(/{id}/g, user.id)
            .replace(/{createdAt}/g, `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`)
            .replace(/{userAvatar}/g, user.displayAvatarURL({ dynamic: true }))
            .replace(/{server}/g, guild.name)
            .replace(/{memberCount}/g, guild.memberCount)
            .replace(/{owner}/g, guild.ownerId ? `<@${guild.ownerId}>` : 'Unknown');
    };
    
    // Set basic properties
    if (data.title) embed.setTitle(replaceVariables(data.title));
    if (data.description) embed.setDescription(replaceVariables(data.description));
    if (data.color) embed.setColor(data.color);
    if (data.url) embed.setURL(replaceVariables(data.url));
    if (data.timestamp) embed.setTimestamp();
    if (data.thumbnail) embed.setThumbnail(replaceVariables(data.thumbnail));
    if (data.image) embed.setImage(replaceVariables(data.image));
    
    // Set author
    if (data.author) {
        const authorData = {
            name: replaceVariables(data.author.name) || user.tag
        };
        
        if (data.author.icon_url) authorData.iconURL = replaceVariables(data.author.icon_url);
        if (data.author.url) authorData.url = replaceVariables(data.author.url);
        
        embed.setAuthor(authorData);
    }
    
    // Set footer
    if (data.footer) {
        const footerData = {
            text: replaceVariables(data.footer.text) || `Welcome to ${guild.name}!`
        };
        
        if (data.footer.icon_url) footerData.iconURL = replaceVariables(data.footer.icon_url);
        
        embed.setFooter(footerData);
    }
    
    // Add fields
    if (data.fields && Array.isArray(data.fields)) {
        data.fields.forEach(field => {
            if (field.name && field.value) {
                embed.addFields({
                    name: replaceVariables(field.name),
                    value: replaceVariables(field.value),
                    inline: field.inline === true
                });
            }
        });
    }
    
    return embed;
} 