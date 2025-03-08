const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ping',
    description: 'Check the bot\'s latency and API response time',
    usage: 'ping',
    category: 'utility',
    aliases: ['latency'],
    cooldown: 5,
    execute(client, message, args) {
        // Send initial message
        message.channel.send('Pinging...').then(sent => {
            // Calculate round-trip latency
            const tripLatency = sent.createdTimestamp - message.createdTimestamp;
            
            // Get WebSocket latency
            const wsLatency = client.ws.ping;
            
            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('🏓 Pong!')
                .addFields(
                    { name: 'Bot Latency', value: `${tripLatency}ms`, inline: true },
                    { name: 'API Latency', value: `${wsLatency}ms`, inline: true }
                )
                .setColor(getLatencyColor(wsLatency))
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            
            // Edit the message with the embed
            sent.edit({ content: null, embeds: [embed] });
        });
    }
};

// Helper function to determine color based on latency
function getLatencyColor(ping) {
    if (ping < 100) return '#00FF00'; // Green for good ping
    if (ping < 200) return '#FFFF00'; // Yellow for okay ping
    return '#FF0000'; // Red for bad ping
} 