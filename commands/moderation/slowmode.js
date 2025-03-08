const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'slowmode',
    description: 'Set the slowmode delay for a channel',
    usage: 'slowmode [seconds/off] [channel]',
    category: 'moderation',
    aliases: ['slow', 'ratelimit'],
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageChannels],
    async execute(client, message, args) {
        // Get the channel (current channel or mentioned channel)
        const channel = message.mentions.channels.first() || message.channel;
        
        // Check if bot has permission to manage the channel
        if (!channel.permissionsFor(message.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
            return message.reply(`I don't have permission to manage ${channel}.`);
        }
        
        // If no args, show current slowmode
        if (!args[0]) {
            const currentSlowmode = channel.rateLimitPerUser;
            
            const embed = new EmbedBuilder()
                .setTitle('Slowmode Information')
                .setDescription(`Current slowmode in ${channel} is **${currentSlowmode}** seconds.`)
                .addFields({ name: 'Usage', value: '`-slowmode [seconds/off] [#channel]`' })
                .setColor('#0099ff')
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Parse slowmode value
        let seconds;
        
        if (args[0].toLowerCase() === 'off' || args[0] === '0') {
            seconds = 0;
        } else {
            seconds = parseInt(args[0]);
            
            // Validate input
            if (isNaN(seconds)) {
                return message.reply('Please provide a valid number of seconds or "off".');
            }
            
            // Check limits (0-21600 seconds, which is 6 hours)
            if (seconds < 0 || seconds > 21600) {
                return message.reply('Slowmode can be between 0 and 21600 seconds (6 hours).');
            }
        }
        
        try {
            // Set slowmode
            await channel.setRateLimitPerUser(seconds, `Slowmode ${seconds > 0 ? 'enabled' : 'disabled'} by ${message.author.tag}`);
            
            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('Slowmode Updated')
                .setDescription(seconds > 0 
                    ? `Slowmode in ${channel} has been set to **${seconds}** seconds.`
                    : `Slowmode in ${channel} has been disabled.`)
                .addFields({ name: 'Moderator', value: message.author.tag })
                .setColor(seconds > 0 ? '#FFA500' : '#00FF00')
                .setFooter({ text: `Channel ID: ${channel.id}` })
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
            
            // Send notification in the affected channel if it's not the current channel
            if (channel.id !== message.channel.id) {
                const notificationEmbed = new EmbedBuilder()
                    .setTitle('Slowmode Updated')
                    .setDescription(seconds > 0 
                        ? `Slowmode in this channel has been set to **${seconds}** seconds by ${message.author}.`
                        : `Slowmode in this channel has been disabled by ${message.author}.`)
                    .setColor(seconds > 0 ? '#FFA500' : '#00FF00')
                    .setTimestamp();
                
                channel.send({ embeds: [notificationEmbed] }).catch(() => {});
            }
            
            // Get guild settings
            const guildSettings = client.settings?.get(message.guild.id) || {};
            
            // Log to channel if set
            const logChannelId = guildSettings.logChannel;
            if (logChannelId) {
                const logChannel = message.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('Slowmode Updated')
                        .setDescription(seconds > 0 
                            ? `Slowmode in ${channel} has been set to **${seconds}** seconds.`
                            : `Slowmode in ${channel} has been disabled.`)
                        .addFields(
                            { name: 'Channel', value: `${channel} (${channel.id})` },
                            { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` }
                        )
                        .setColor(seconds > 0 ? '#FFA500' : '#00FF00')
                        .setTimestamp();
                    
                    logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }
        } catch (error) {
            console.error(`Error in slowmode command: ${error}`);
            message.reply(`Failed to set slowmode: ${error.message}`);
        }
    }
}; 