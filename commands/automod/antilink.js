const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'antilink',
    description: 'Configure anti-link protection for the server',
    usage: 'antilink <on/off>',
    category: 'automod',
    aliases: ['links'],
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageGuild],
    execute(client, message, args) {
        // Check if an option was provided
        if (!args[0]) {
            // Check current status
            const currentSetting = client.settings?.get(message.guild.id)?.antilink || false;
            
            const embed = new EmbedBuilder()
                .setTitle('Anti-Link System')
                .setDescription(`Anti-Link is currently **${currentSetting ? 'enabled' : 'disabled'}**`)
                .addFields({ name: 'Usage', value: '`!antilink on` - Enable anti-link\n`!antilink off` - Disable anti-link' })
                .setColor(currentSetting ? '#00FF00' : '#FF0000')
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Get option
        const option = args[0].toLowerCase();
        
        // Validate option
        if (!['on', 'off', 'enable', 'disable'].includes(option)) {
            return message.reply('Invalid option! Please use `on` or `off`.');
        }
        
        // Initialize settings for guild if they don't exist
        if (!client.settings) client.settings = new Map();
        if (!client.settings.has(message.guild.id)) {
            client.settings.set(message.guild.id, {});
        }
        
        // Get guild settings
        const guildSettings = client.settings.get(message.guild.id);
        
        // Update antilink setting
        const newSetting = ['on', 'enable'].includes(option);
        guildSettings.antilink = newSetting;
        
        // Save settings
        client.settings.set(message.guild.id, guildSettings);
        
        // Create response embed
        const embed = new EmbedBuilder()
            .setTitle('Anti-Link System')
            .setDescription(`Anti-Link has been **${newSetting ? 'enabled' : 'disabled'}**`)
            .setColor(newSetting ? '#00FF00' : '#FF0000')
            .setFooter({ text: `Modified by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
        
        // Log the change
        console.log(`[AntiLink] ${message.author.tag} ${newSetting ? 'enabled' : 'disabled'} anti-link in ${message.guild.name}`);
    }
}; 