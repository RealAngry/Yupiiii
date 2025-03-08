const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'modlogs',
    description: 'View moderation logs for a user',
    usage: 'modlogs @user',
    category: 'moderation',
    aliases: ['userlogs', 'history'],
    cooldown: 5,
    permissions: [PermissionFlagsBits.ModerateMembers],
    async execute(client, message, args) {
        // Check if a user was mentioned
        if (!args[0]) {
            return message.reply('Please specify a user to view moderation logs for!');
        }
        
        // Get target user
        const target = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
        
        // Check if user exists
        if (!target) {
            return message.reply('Could not find that user!');
        }
        
        // Initialize modlogs array if it doesn't exist
        if (!client.modlogs) client.modlogs = new Map();
        
        // Initialize guild modlogs if they don't exist
        if (!client.modlogs.has(message.guild.id)) {
            client.modlogs.set(message.guild.id, new Map());
        }
        
        // Get user modlogs
        const guildModlogs = client.modlogs.get(message.guild.id);
        const userLogs = guildModlogs.get(target.id) || [];
        
        // Get warnings if they exist
        let warnings = [];
        if (client.warnings && client.warnings.has(message.guild.id)) {
            const guildWarnings = client.warnings.get(message.guild.id);
            warnings = guildWarnings.get(target.id) || [];
        }
        
        // Create embed
        const embed = new EmbedBuilder()
            .setTitle(`Moderation Logs for ${target.tag}`)
            .setThumbnail(target.displayAvatarURL())
            .setColor('#0099ff')
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
        
        // Add user info
        embed.addFields(
            { name: 'User ID', value: target.id },
            { name: 'Account Created', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:F>` }
        );
        
        // Add member info if in guild
        const member = message.guild.members.cache.get(target.id);
        if (member) {
            embed.addFields(
                { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` },
                { name: 'Roles', value: member.roles.cache.size > 1 ? member.roles.cache.filter(r => r.id !== message.guild.id).map(r => r.toString()).join(', ') : 'None' }
            );
        }
        
        // Add warnings
        if (warnings.length > 0) {
            const warningList = warnings.map(warning => {
                const moderator = message.guild.members.cache.get(warning.moderator)?.user.tag || 'Unknown Moderator';
                const time = new Date(warning.timestamp).toLocaleString();
                return `**ID:** ${warning.id} | **Reason:** ${warning.reason} | **Moderator:** ${moderator} | **Date:** ${time}`;
            }).join('\n');
            
            embed.addFields({ name: `Warnings [${warnings.length}]`, value: warningList.length > 1024 ? `${warningList.substring(0, 1020)}...` : warningList });
        } else {
            embed.addFields({ name: 'Warnings', value: 'No warnings found' });
        }
        
        // Add modlogs
        if (userLogs.length > 0) {
            const logList = userLogs.map(log => {
                const moderator = message.guild.members.cache.get(log.moderatorId)?.user.tag || 'Unknown Moderator';
                const time = new Date(log.timestamp).toLocaleString();
                return `**Action:** ${log.action} | **Reason:** ${log.reason} | **Moderator:** ${moderator} | **Date:** ${time}`;
            }).join('\n');
            
            embed.addFields({ name: `Moderation Actions [${userLogs.length}]`, value: logList.length > 1024 ? `${logList.substring(0, 1020)}...` : logList });
        } else {
            embed.addFields({ name: 'Moderation Actions', value: 'No moderation actions found' });
        }
        
        // Send embed
        message.reply({ embeds: [embed] });
    }
}; 