const { EmbedBuilder } = require('discord.js');
const moment = require('moment');

module.exports = {
    name: 'userinfo',
    description: 'Display information about a user',
    usage: 'userinfo [@user]',
    category: 'utility',
    aliases: ['user', 'whois', 'ui'],
    cooldown: 5,
    execute(client, message, args) {
        // Get target user (mentioned user or message author)
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        const user = target.user;
        
        // Format dates
        const joinedAt = moment(target.joinedAt).format('MMMM Do YYYY, h:mm:ss a');
        const createdAt = moment(user.createdAt).format('MMMM Do YYYY, h:mm:ss a');
        const joinedDays = moment().diff(moment(target.joinedAt), 'days');
        const createdDays = moment().diff(moment(user.createdAt), 'days');
        
        // Get user status
        let status = 'Offline';
        if (target.presence) {
            status = {
                online: 'Online',
                idle: 'Idle',
                dnd: 'Do Not Disturb',
                offline: 'Offline'
            }[target.presence.status] || 'Offline';
        }
        
        // Get user activity
        let activity = 'None';
        if (target.presence && target.presence.activities && target.presence.activities.length > 0) {
            try {
                const act = target.presence.activities[0];
                
                // Skip if activity is null or undefined
                if (!act) {
                    activity = 'None';
                }
                // Handle custom status
                else if (act.type === 0 || act.type === 'CUSTOM_STATUS' || act.type === 'Custom Status') {
                    activity = `Custom Status: ${act.state || 'None'}`;
                } 
                // Handle other activity types
                else if (act.type !== undefined && act.name) {
                    // Convert activity type to string properly
                    let activityType = 'Playing';
                    
                    // Handle different activity types
                    try {
                        const actType = parseInt(act.type);
                        switch (actType) {
                            case 1:
                                activityType = 'Streaming';
                                break;
                            case 2:
                                activityType = 'Listening to';
                                break;
                            case 3:
                                activityType = 'Watching';
                                break;
                            case 4:
                                activityType = 'Custom Status:';
                                break;
                            case 5:
                                activityType = 'Competing in';
                                break;
                            default:
                                activityType = 'Playing';
                        }
                    } catch (e) {
                        console.error('Error parsing activity type:', e);
                    }
                    
                    activity = `${activityType} ${act.name}`;
                }
            } catch (error) {
                console.error('Error processing activity:', error);
                activity = 'Unknown Activity';
            }
        }
        
        // Get user roles (excluding @everyone)
        const roles = target.roles.cache
            .filter(role => role.id !== message.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString())
            .join(', ') || 'None';
        
        // Get user permissions
        const permissions = target.permissions.toArray().map(perm => {
            return perm.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
        }).join(', ');
        
        // Create embed
        const embed = new EmbedBuilder()
            .setTitle(`User Information - ${user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setColor(target.displayHexColor === '#000000' ? '#FFFFFF' : target.displayHexColor)
            .addFields(
                { name: 'User ID', value: user.id, inline: true },
                { name: 'Nickname', value: target.nickname || 'None', inline: true },
                { name: 'Status', value: status, inline: true },
                { name: 'Activity', value: activity, inline: true },
                { name: 'Account Created', value: `${createdAt} (${createdDays} days ago)`, inline: false },
                { name: 'Joined Server', value: `${joinedAt} (${joinedDays} days ago)`, inline: false }
            )
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
        
        // Add roles if they exist and aren't too long
        if (roles.length < 1024) {
            embed.addFields({ name: `Roles [${target.roles.cache.size - 1}]`, value: roles });
        } else {
            embed.addFields({ name: `Roles [${target.roles.cache.size - 1}]`, value: 'Too many roles to display' });
        }
        
        // Add key permissions if they aren't too long
        if (permissions.length < 1024) {
            embed.addFields({ name: 'Key Permissions', value: permissions || 'None' });
        } else {
            embed.addFields({ name: 'Key Permissions', value: 'Too many permissions to display' });
        }
        
        // Add badges if user has any
        const flags = user.flags?.toArray() || [];
        if (flags.length > 0) {
            const badges = flags.map(flag => {
                return {
                    'HOUSE_BRAVERY': 'HypeSquad Bravery',
                    'HOUSE_BRILLIANCE': 'HypeSquad Brilliance',
                    'HOUSE_BALANCE': 'HypeSquad Balance',
                    'EARLY_SUPPORTER': 'Early Supporter',
                    'TEAM_USER': 'Team User',
                    'SYSTEM': 'System',
                    'VERIFIED_BOT': 'Verified Bot',
                    'VERIFIED_DEVELOPER': 'Verified Bot Developer',
                    'DISCORD_EMPLOYEE': 'Discord Staff',
                    'PARTNERED_SERVER_OWNER': 'Partnered Server Owner',
                    'HYPESQUAD_EVENTS': 'HypeSquad Events',
                    'BUGHUNTER_LEVEL_1': 'Bug Hunter (Level 1)',
                    'BUGHUNTER_LEVEL_2': 'Bug Hunter (Level 2)',
                    'EARLY_VERIFIED_BOT_DEVELOPER': 'Early Verified Bot Developer',
                    'DISCORD_CERTIFIED_MODERATOR': 'Discord Certified Moderator'
                }[flag] || flag;
            }).join(', ');
            
            embed.addFields({ name: 'Badges', value: badges });
        }
        
        // Send embed
        message.reply({ embeds: [embed] });
    }
}; 