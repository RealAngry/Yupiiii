const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'serversecurity',
    description: 'View and manage server security settings',
    usage: 'serversecurity [status]',
    category: 'automod',
    aliases: ['security', 'securitystatus'],
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 10,
    examples: [
        'serversecurity status',
        'serversecurity'
    ],
    
    async execute(client, message, args) {
        // Check if user has administrator permission
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('You need Administrator permission to use this command.');
        }
        
        // Initialize settings if they don't exist
        if (!client.settings.has(message.guild.id)) {
            client.settings.set(message.guild.id, {});
        }

        const guildSettings = client.settings.get(message.guild.id);
        
        // Get security settings
        const antiNuke = guildSettings.antinuke || { enabled: false, level: 'medium' };
        const antiRaid = guildSettings.antiraid || { enabled: false };
        const antiSpam = guildSettings.antispam || { enabled: false };
        const antiLink = guildSettings.antilink || { enabled: false };
        
        // Create embed
        const embed = new EmbedBuilder()
            .setTitle('Server Security Status')
            .setDescription(`Security overview for ${message.guild.name}`)
            .setColor('#FF5555')
            .addFields(
                { name: 'Anti-Nuke Protection', value: antiNuke.enabled ? `✅ Enabled (Level: ${antiNuke.level})` : '❌ Disabled', inline: true },
                { name: 'Anti-Raid Protection', value: antiRaid.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: 'Anti-Spam Protection', value: antiSpam.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: 'Anti-Link Protection', value: antiLink.enabled ? '✅ Enabled' : '❌ Disabled', inline: true }
            )
            .addFields(
                { name: 'Security Score', value: calculateSecurityScore(guildSettings) + '/10', inline: true },
                { name: 'Recommendations', value: getSecurityRecommendations(guildSettings, message.guild), inline: false }
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
        
        // Send embed
        message.reply({ embeds: [embed] });
    }
};

// Calculate security score based on enabled protections and settings
function calculateSecurityScore(guildSettings) {
    let score = 0;
    
    // Anti-Nuke
    if (guildSettings.antinuke?.enabled) {
        score += 2;
        // Additional points for higher security levels
        if (guildSettings.antinuke.level === 'high') score += 1;
        if (guildSettings.antinuke.level === 'extreme') score += 2;
    }
    
    // Anti-Raid
    if (guildSettings.antiraid?.enabled) score += 2;
    
    // Anti-Spam
    if (guildSettings.antispam?.enabled) score += 2;
    
    // Anti-Link
    if (guildSettings.antilink?.enabled) score += 1;
    
    // Verification Level
    if (guildSettings.verificationLevel === 'HIGH') score += 0.5;
    if (guildSettings.verificationLevel === 'VERY_HIGH') score += 1;
    
    return Math.min(10, score);
}

// Get security recommendations based on current settings
function getSecurityRecommendations(guildSettings, guild) {
    const recommendations = [];
    
    // Anti-Nuke recommendations
    if (!guildSettings.antinuke?.enabled) {
        recommendations.push('• Enable Anti-Nuke protection to prevent server nuking');
    } else if (guildSettings.antinuke.level === 'low') {
        recommendations.push('• Consider increasing Anti-Nuke security level for better protection');
    }
    
    // Anti-Raid recommendations
    if (!guildSettings.antiraid?.enabled) {
        recommendations.push('• Enable Anti-Raid protection to prevent mass joins');
    }
    
    // Anti-Spam recommendations
    if (!guildSettings.antispam?.enabled) {
        recommendations.push('• Enable Anti-Spam protection to prevent spam messages');
    }
    
    // Anti-Link recommendations
    if (!guildSettings.antilink?.enabled) {
        recommendations.push('• Enable Anti-Link protection to prevent unwanted links');
    }
    
    // Verification Level recommendations
    if (guild.verificationLevel === 'NONE' || guild.verificationLevel === 'LOW') {
        recommendations.push('• Increase server verification level in server settings');
    }
    
    // If all protections are enabled
    if (recommendations.length === 0) {
        return 'Your server has good security measures in place. Consider reviewing whitelist settings periodically.';
    }
    
    return recommendations.join('\n');
} 