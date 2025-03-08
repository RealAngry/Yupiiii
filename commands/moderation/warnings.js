const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const moment = require('moment');

module.exports = {
    name: 'warnings',
    description: 'View warnings for a user',
    usage: 'warnings @user',
    category: 'moderation',
    aliases: ['warns', 'infractions'],
    cooldown: 3,
    permissions: [PermissionFlagsBits.ModerateMembers],
    execute(client, message, args) {
        // Check if a user was mentioned
        if (!args[0]) {
            return message.reply('Please specify a user to view warnings for!');
        }
        
        // Get target user
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        // Check if user exists
        if (!target) {
            return message.reply('Could not find that user!');
        }
        
        // Check if warnings exist for this guild
        if (!client.warnings || !client.warnings.has(message.guild.id)) {
            return message.reply(`${target.user.tag} has no warnings.`);
        }
        
        // Get guild warnings
        const guildWarnings = client.warnings.get(message.guild.id);
        
        // Check if user has warnings
        if (!guildWarnings.has(target.id) || guildWarnings.get(target.id).length === 0) {
            return message.reply(`${target.user.tag} has no warnings.`);
        }
        
        // Get user warnings
        const userWarnings = guildWarnings.get(target.id);
        
        // Create embed
        const embed = new EmbedBuilder()
            .setTitle(`Warnings for ${target.user.tag}`)
            .setDescription(`Total warnings: ${userWarnings.length}`)
            .setColor('#FFA500')
            .setThumbnail(target.user.displayAvatarURL())
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
        
        // Add warnings to embed (up to 10 most recent)
        const recentWarnings = userWarnings.slice(-10).reverse(); // Get 10 most recent warnings
        
        for (let i = 0; i < recentWarnings.length; i++) {
            const warning = recentWarnings[i];
            const moderator = message.guild.members.cache.get(warning.moderator)?.user.tag || 'Unknown Moderator';
            const time = moment(warning.timestamp).format('MMMM Do YYYY, h:mm:ss a');
            
            embed.addFields({
                name: `Warning ${userWarnings.length - i} (ID: ${warning.id})`,
                value: `**Reason:** ${warning.reason}\n**Moderator:** ${moderator}\n**Date:** ${time}`
            });
        }
        
        // If there are more than 10 warnings, add a note
        if (userWarnings.length > 10) {
            embed.setDescription(`Total warnings: ${userWarnings.length} (showing 10 most recent)`);
        }
        
        message.reply({ embeds: [embed] });
    }
}; 