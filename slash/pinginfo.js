const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pinginfo')
        .setDescription('View information about pings you received while AFK'),
    async execute(interaction) {
        try {
            const { client } = interaction;
            
            // Check if user has ping history
            if (!client.afkPingHistory || !client.afkPingHistory.has(interaction.user.id)) {
                const embed = new EmbedBuilder()
                    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                    .setTitle('No AFK Ping History')
                    .setDescription('You have no recent AFK ping history to display.')
                    .setColor('#0099ff')
                    .setFooter({ text: 'Use the /afk command to set yourself as AFK' })
                    .setTimestamp();
                
                return interaction.reply({ embeds: [embed] });
            }
            
            const pingData = client.afkPingHistory.get(interaction.user.id);
            const { pings, timestamp, count } = pingData;
            
            // Check if there are actually any pings
            if (!pings || pings.length === 0 || count === 0) {
                const embed = new EmbedBuilder()
                    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                    .setTitle('No AFK Pings')
                    .setDescription('You were AFK but did not receive any pings.')
                    .setColor('#0099ff')
                    .setTimestamp();
                
                return interaction.reply({ embeds: [embed] });
            }
            
            // Create embed
            const embed = new EmbedBuilder()
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
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
            }
            
            // Send response
            await interaction.reply({ embeds: [embed] });
            console.log(`[AFK] ${interaction.user.tag} viewed their ping history`);
        } catch (error) {
            console.error('[AFK] Error in pinginfo slash command:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: 'There was an error executing this command!',
                    ephemeral: true 
                });
            }
        }
    }
}; 