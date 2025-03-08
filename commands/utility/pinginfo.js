const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'pinginfo',
    description: 'View information about pings you received while AFK',
    usage: 'pinginfo',
    category: 'utility',
    aliases: ['pings', 'afkpings'],
    cooldown: 5,
    execute(client, message, args) {
        // Check if user has ping history
        if (!client.afkPingHistory || !client.afkPingHistory.has(message.author.id)) {
            const embed = new EmbedBuilder()
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setTitle('No AFK Ping History')
                .setDescription('You have no recent AFK ping history to display.')
                .setColor('#0099ff')
                .setFooter({ text: `Use ${client.prefix}afk to set yourself as AFK` })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        const pingData = client.afkPingHistory.get(message.author.id);
        const { pings, timestamp, count } = pingData;
        
        // Check if there are actually any pings
        if (!pings || pings.length === 0 || count === 0) {
            const embed = new EmbedBuilder()
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setTitle('No AFK Pings')
                .setDescription('You were AFK but did not receive any pings.')
                .setColor('#0099ff')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Create embed
        const embed = new EmbedBuilder()
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setTitle('AFK Ping Information')
            .setDescription(`You received ${count} ping${count === 1 ? '' : 's'} while you were AFK.`)
            .setColor('#0099ff')
            .setFooter({ text: 'AFK ping history' })
            .setTimestamp(timestamp);
        
        // Add ping information (up to 10 pings to avoid embed limits)
        const displayPings = pings.slice(0, 10);
        
        if (displayPings.length > 0) {
            displayPings.forEach((ping, index) => {
                const timeSince = Math.floor((Date.now() - ping.timestamp) / 1000 / 60);
                embed.addFields({
                    name: `Ping #${index + 1} (${timeSince} minutes ago)`,
                    value: `From: <@${ping.userId}> (${ping.user})\nChannel: <#${ping.channelId}>\nMessage: ${ping.content.length > 100 ? ping.content.substring(0, 97) + '...' : ping.content}`
                });
            });
            
            // Add note if there are more pings
            if (pings.length > 10) {
                embed.addFields({
                    name: 'Additional Pings',
                    value: `${pings.length - 10} more ping${pings.length - 10 === 1 ? '' : 's'} not shown.`
                });
            }
        } else {
            embed.setDescription('No ping details available.');
        }
        
        // Send response
        message.reply({ embeds: [embed] }).catch(console.error);
    }
}; 