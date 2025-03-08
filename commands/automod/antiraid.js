const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'antiraid',
    description: 'Configure anti-raid protection for the server',
    usage: 'antiraid <on/off>',
    category: 'automod',
    aliases: ['raid'],
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageGuild],
    execute(client, message, args) {
        // Check if an option was provided
        if (!args[0]) {
            // Check current status
            const currentSetting = client.settings?.get(message.guild.id)?.antiraid || false;
            
            const embed = new EmbedBuilder()
                .setTitle('Anti-Raid System')
                .setDescription(`Anti-Raid is currently **${currentSetting ? 'enabled' : 'disabled'}**`)
                .addFields({ name: 'Usage', value: '`-antiraid on` - Enable anti-raid\n`-antiraid off` - Disable anti-raid' })
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
        
        // Update antiraid setting
        const newSetting = ['on', 'enable'].includes(option);
        guildSettings.antiraid = newSetting;
        
        // Initialize raid tracking if enabling
        if (newSetting && !client.raidMode) {
            client.raidMode = new Map();
            client.joinedMembers = new Map();
        }
        
        // Save settings
        client.settings.set(message.guild.id, guildSettings);
        
        // Create response embed
        const embed = new EmbedBuilder()
            .setTitle('Anti-Raid System')
            .setDescription(`Anti-Raid has been **${newSetting ? 'enabled' : 'disabled'}**`)
            .setColor(newSetting ? '#00FF00' : '#FF0000')
            .setFooter({ text: `Modified by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
        
        // Log the change
        console.log(`[AntiRaid] ${message.author.tag} ${newSetting ? 'enabled' : 'disabled'} anti-raid in ${message.guild.name}`);
    }
}; 