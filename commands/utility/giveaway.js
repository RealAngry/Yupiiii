const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');

module.exports = {
    name: 'giveaway',
    description: 'Create and manage giveaways',
    usage: 'giveaway [start/end/list] [options]',
    category: 'utility',
    aliases: ['g', 'gw'],
    cooldown: 5,
    permissions: PermissionFlagsBits.ManageGuild,
    examples: [
        'giveaway start #channel 1d 2w Nitro Classic',
        'giveaway end 123456789012345678',
        'giveaway list'
    ],
    execute(client, message, args) {
        // Initialize giveaways collection if it doesn't exist
        if (!client.giveaways) {
            client.giveaways = new Map();
        }
        
        const subCommand = args[0]?.toLowerCase();
        
        if (!subCommand || !['start', 'end', 'list'].includes(subCommand)) {
            const embed = new EmbedBuilder()
                .setTitle('Giveaway Command Help')
                .setDescription('Create and manage giveaways')
                .addFields(
                    { name: 'Start a giveaway', value: `\`${client.prefix}giveaway start #channel [duration] [winners] [prize]\`` },
                    { name: 'End a giveaway', value: `\`${client.prefix}giveaway end [message_id]\`` },
                    { name: 'List active giveaways', value: `\`${client.prefix}giveaway list\`` }
                )
                .setColor('#FF00FF')
                .setFooter({ text: 'Giveaway System' });
            
            return message.reply({ embeds: [embed] });
        }
        
        switch (subCommand) {
            case 'start': {
                // Check for required arguments
                if (args.length < 5) {
                    return message.reply('Please provide all required arguments: `giveaway start #channel [duration] [winners] [prize]`');
                }
                
                // Get channel
                const channel = message.mentions.channels.first();
                if (!channel) {
                    return message.reply('Please mention a valid channel.');
                }
                
                // Get duration
                const durationArg = args[2];
                let duration;
                try {
                    duration = ms(durationArg);
                    if (!duration) throw new Error('Invalid duration');
                } catch (error) {
                    return message.reply('Please provide a valid duration (e.g., 1d, 12h, 30m).');
                }
                
                // Get winners count
                const winnersArg = args[3];
                const winners = parseInt(winnersArg);
                if (isNaN(winners) || winners < 1) {
                    return message.reply('Please provide a valid number of winners (minimum 1).');
                }
                
                // Get prize
                const prize = args.slice(4).join(' ');
                if (!prize) {
                    return message.reply('Please provide a prize for the giveaway.');
                }
                
                // Create giveaway embed
                const endTime = Date.now() + duration;
                const giveawayEmbed = new EmbedBuilder()
                    .setTitle('🎉 GIVEAWAY 🎉')
                    .setDescription(`**${prize}**\n\nReact with 🎉 to enter!\nEnds: <t:${Math.floor(endTime / 1000)}:R>\nHosted by: ${message.author}`)
                    .addFields(
                        { name: 'Winners', value: `${winners}`, inline: true },
                        { name: 'Ends At', value: `<t:${Math.floor(endTime / 1000)}:F>`, inline: true }
                    )
                    .setColor('#FF00FF')
                    .setFooter({ text: `Giveaway ID: ${Date.now()}` })
                    .setTimestamp(endTime);
                
                // Create buttons
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('giveaway_enter')
                            .setLabel('Enter Giveaway')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('🎉'),
                        new ButtonBuilder()
                            .setCustomId('giveaway_info')
                            .setLabel('Info')
                            .setStyle(ButtonStyle.Secondary)
                    );
                
                // Send giveaway message
                channel.send({ embeds: [giveawayEmbed], components: [row] }).then(giveawayMessage => {
                    // Store giveaway data
                    const giveawayData = {
                        messageId: giveawayMessage.id,
                        channelId: channel.id,
                        guildId: message.guild.id,
                        prize: prize,
                        winners: winners,
                        endTime: endTime,
                        hostId: message.author.id,
                        participants: new Set(),
                        ended: false
                    };
                    
                    client.giveaways.set(giveawayMessage.id, giveawayData);
                    
                    // Set timeout to end the giveaway
                    setTimeout(() => {
                        endGiveaway(client, giveawayMessage.id);
                    }, duration);
                    
                    // Confirm to user
                    message.reply(`Giveaway started in ${channel}! It will end in ${durationArg}.`);
                }).catch(error => {
                    console.error('Error starting giveaway:', error);
                    message.reply('There was an error starting the giveaway.');
                });
                
                break;
            }
            
            case 'end': {
                // Check for required arguments
                if (!args[1]) {
                    return message.reply('Please provide the message ID of the giveaway to end.');
                }
                
                const messageId = args[1];
                
                // Check if giveaway exists
                if (!client.giveaways.has(messageId)) {
                    return message.reply('Could not find a giveaway with that message ID.');
                }
                
                // End the giveaway
                endGiveaway(client, messageId);
                
                // Confirm to user
                message.reply('Giveaway ended successfully!');
                
                break;
            }
            
            case 'list': {
                // Get all active giveaways for this guild
                const guildGiveaways = Array.from(client.giveaways.values())
                    .filter(g => g.guildId === message.guild.id && !g.ended);
                
                if (guildGiveaways.length === 0) {
                    return message.reply('There are no active giveaways in this server.');
                }
                
                // Create embed
                const embed = new EmbedBuilder()
                    .setTitle('Active Giveaways')
                    .setColor('#FF00FF')
                    .setFooter({ text: `Total: ${guildGiveaways.length} giveaways` })
                    .setTimestamp();
                
                // Add giveaways to embed
                guildGiveaways.forEach((giveaway, index) => {
                    const channel = message.guild.channels.cache.get(giveaway.channelId);
                    const timeLeft = giveaway.endTime - Date.now();
                    
                    embed.addFields({
                        name: `${index + 1}. ${giveaway.prize}`,
                        value: `Channel: ${channel ? `<#${channel.id}>` : 'Unknown'}\nEnds: <t:${Math.floor(giveaway.endTime / 1000)}:R>\nWinners: ${giveaway.winners}\nParticipants: ${giveaway.participants.size}\nID: \`${giveaway.messageId}\``
                    });
                });
                
                message.reply({ embeds: [embed] });
                
                break;
            }
        }
    }
};

// Function to end a giveaway
async function endGiveaway(client, messageId) {
    // Get giveaway data
    const giveaway = client.giveaways.get(messageId);
    if (!giveaway || giveaway.ended) return;
    
    // Mark as ended
    giveaway.ended = true;
    client.giveaways.set(messageId, giveaway);
    
    try {
        // Get guild, channel and message
        const guild = client.guilds.cache.get(giveaway.guildId);
        if (!guild) throw new Error('Guild not found');
        
        const channel = guild.channels.cache.get(giveaway.channelId);
        if (!channel) throw new Error('Channel not found');
        
        const message = await channel.messages.fetch(messageId).catch(() => null);
        if (!message) throw new Error('Message not found');
        
        // Convert participants set to array
        const participants = Array.from(giveaway.participants);
        
        // Check if there are enough participants
        if (participants.length === 0) {
            // No participants
            const endedEmbed = EmbedBuilder.from(message.embeds[0])
                .setTitle('🎉 GIVEAWAY ENDED 🎉')
                .setDescription(`**${giveaway.prize}**\n\nNo one entered the giveaway.`)
                .setColor('#FF0000');
            
            await message.edit({ embeds: [endedEmbed], components: [] });
            
            channel.send({
                content: 'No one entered the giveaway!',
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Giveaway Ended')
                        .setDescription(`No winners for **${giveaway.prize}**`)
                        .setColor('#FF0000')
                        .setTimestamp()
                ]
            });
            
            return;
        }
        
        // Select winners
        const winnerCount = Math.min(giveaway.winners, participants.length);
        const winners = [];
        
        for (let i = 0; i < winnerCount; i++) {
            const winnerIndex = Math.floor(Math.random() * participants.length);
            winners.push(participants[winnerIndex]);
            participants.splice(winnerIndex, 1);
        }
        
        // Update giveaway message
        const winnerMentions = winners.map(id => `<@${id}>`).join(', ');
        
        const endedEmbed = EmbedBuilder.from(message.embeds[0])
            .setTitle('🎉 GIVEAWAY ENDED 🎉')
            .setDescription(`**${giveaway.prize}**\n\nWinners: ${winnerMentions}`)
            .setColor('#00FF00');
        
        await message.edit({ embeds: [endedEmbed], components: [] });
        
        // Send winner announcement
        channel.send({
            content: `Congratulations ${winnerMentions}! You won **${giveaway.prize}**!`,
            embeds: [
                new EmbedBuilder()
                    .setTitle('Giveaway Winners')
                    .setDescription(`🎉 The giveaway for **${giveaway.prize}** has ended!\n\n**Winners:** ${winnerMentions}`)
                    .setColor('#00FF00')
                    .setTimestamp()
            ]
        });
    } catch (error) {
        console.error('Error ending giveaway:', error);
    }
} 