const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    name: 'setlogchannel',
    description: 'Set a channel for logging moderation actions',
    usage: 'setlogchannel #channel',
    category: 'config',
    aliases: ['logchannel', 'logs'],
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageGuild],
    execute(client, message, args) {
        // Check if a channel was mentioned
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
        
        if (!args[0]) {
            // Check current log channel
            const currentSetting = client.settings?.get(message.guild.id)?.logChannel;
            const currentChannel = currentSetting ? message.guild.channels.cache.get(currentSetting) : null;
            
            const embed = new EmbedBuilder()
                .setTitle('Log Channel Configuration')
                .setDescription(currentChannel 
                    ? `Current log channel is ${currentChannel}`
                    : 'No log channel is currently set')
                .addFields({ name: 'Usage', value: '`-setlogchannel #channel` - Set a log channel\n`-setlogchannel disable` - Disable logging' })
                .setColor('#0099ff')
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Initialize settings for guild if they don't exist
        if (!client.settings) client.settings = new Map();
        if (!client.settings.has(message.guild.id)) {
            client.settings.set(message.guild.id, {});
        }
        
        // Get guild settings
        const guildSettings = client.settings.get(message.guild.id);
        
        // Check if disabling
        if (args[0].toLowerCase() === 'disable' || args[0].toLowerCase() === 'off') {
            // Remove log channel setting
            delete guildSettings.logChannel;
            
            // Save settings
            client.settings.set(message.guild.id, guildSettings);
            
            const embed = new EmbedBuilder()
                .setTitle('Log Channel Disabled')
                .setDescription('Moderation action logging has been disabled.')
                .setColor('#FF0000')
                .setFooter({ text: `Modified by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Validate channel
        if (!channel) {
            return message.reply('Please mention a valid channel or provide a channel ID.');
        }
        
        // Check if channel is a text channel
        if (channel.type !== ChannelType.GuildText) {
            return message.reply('The log channel must be a text channel.');
        }
        
        // Check bot permissions in the channel
        const botPermissions = channel.permissionsFor(message.guild.members.me);
        if (!botPermissions.has(PermissionFlagsBits.SendMessages) || !botPermissions.has(PermissionFlagsBits.EmbedLinks)) {
            return message.reply(`I don't have permission to send messages or embeds in ${channel}. Please adjust my permissions.`);
        }
        
        // Update log channel setting
        guildSettings.logChannel = channel.id;
        
        // Save settings
        client.settings.set(message.guild.id, guildSettings);
        
        // Create response embed
        const embed = new EmbedBuilder()
            .setTitle('Log Channel Set')
            .setDescription(`Moderation actions will now be logged in ${channel}`)
            .setColor('#00FF00')
            .setFooter({ text: `Modified by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
        
        // Send test message to log channel
        const testEmbed = new EmbedBuilder()
            .setTitle('Log Channel Set')
            .setDescription('This channel has been set as the moderation log channel.')
            .setColor('#00FF00')
            .setFooter({ text: `Set by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
        
        channel.send({ embeds: [testEmbed] }).catch(error => {
            console.error(`Error sending test message to log channel: ${error}`);
            message.reply('Failed to send a test message to the log channel. Please check my permissions.');
        });
        
        // Log the change
        console.log(`[LogChannel] ${message.author.tag} set the log channel to #${channel.name} in ${message.guild.name}`);
    }
}; 