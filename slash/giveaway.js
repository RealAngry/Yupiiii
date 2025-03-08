const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Create and manage giveaways')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start a new giveaway')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to start the giveaway in')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('Duration of the giveaway (e.g., 1d, 12h, 30m)')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('winners')
                        .setDescription('Number of winners')
                        .setMinValue(1)
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('prize')
                        .setDescription('The prize for the giveaway')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('end')
                .setDescription('End a giveaway')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('The message ID of the giveaway to end')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all active giveaways'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        try {
            const { client } = interaction;
            
            // Initialize giveaways collection if it doesn't exist
            if (!client.giveaways) {
                client.giveaways = new Map();
            }
            
            const subCommand = interaction.options.getSubcommand();
            
            switch (subCommand) {
                case 'start': {
                    // Get options
                    const channel = interaction.options.getChannel('channel');
                    const durationArg = interaction.options.getString('duration');
                    const winners = interaction.options.getInteger('winners');
                    const prize = interaction.options.getString('prize');
                    
                    // Validate channel
                    if (!channel.isTextBased()) {
                        return interaction.reply({
                            content: 'The channel must be a text channel.',
                            ephemeral: true
                        });
                    }
                    
                    // Parse duration
                    let duration;
                    try {
                        duration = ms(durationArg);
                        if (!duration) throw new Error('Invalid duration');
                    } catch (error) {
                        return interaction.reply({
                            content: 'Please provide a valid duration (e.g., 1d, 12h, 30m).',
                            ephemeral: true
                        });
                    }
                    
                    // Create giveaway embed
                    const endTime = Date.now() + duration;
                    const giveawayEmbed = new EmbedBuilder()
                        .setTitle('🎉 GIVEAWAY 🎉')
                        .setDescription(`**${prize}**\n\nReact with 🎉 to enter!\nEnds: <t:${Math.floor(endTime / 1000)}:R>\nHosted by: ${interaction.user}`)
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
                    
                    // Defer reply
                    await interaction.deferReply();
                    
                    // Send giveaway message
                    channel.send({ embeds: [giveawayEmbed], components: [row] }).then(giveawayMessage => {
                        // Store giveaway data
                        const giveawayData = {
                            messageId: giveawayMessage.id,
                            channelId: channel.id,
                            guildId: interaction.guild.id,
                            prize: prize,
                            winners: winners,
                            endTime: endTime,
                            hostId: interaction.user.id,
                            participants: new Set(),
                            ended: false
                        };
                        
                        client.giveaways.set(giveawayMessage.id, giveawayData);
                        
                        // Set timeout to end the giveaway
                        setTimeout(() => {
                            endGiveaway(client, giveawayMessage.id);
                        }, duration);
                        
                        // Confirm to user
                        interaction.editReply(`Giveaway started in ${channel}! It will end in ${durationArg}.`);
                    }).catch(error => {
                        console.error('Error starting giveaway:', error);
                        interaction.editReply('There was an error starting the giveaway.');
                    });
                    
                    break;
                }
                
                case 'end': {
                    const messageId = interaction.options.getString('message_id');
                    
                    // Check if giveaway exists
                    if (!client.giveaways.has(messageId)) {
                        return interaction.reply({
                            content: 'Could not find a giveaway with that message ID.',
                            ephemeral: true
                        });
                    }
                    
                    // End the giveaway
                    await interaction.deferReply();
                    await endGiveaway(client, messageId);
                    
                    // Confirm to user
                    interaction.editReply('Giveaway ended successfully!');
                    
                    break;
                }
                
                case 'list': {
                    // Get all active giveaways for this guild
                    const guildGiveaways = Array.from(client.giveaways.values())
                        .filter(g => g.guildId === interaction.guild.id && !g.ended);
                    
                    if (guildGiveaways.length === 0) {
                        return interaction.reply({
                            content: 'There are no active giveaways in this server.',
                            ephemeral: true
                        });
                    }
                    
                    // Create embed
                    const embed = new EmbedBuilder()
                        .setTitle('Active Giveaways')
                        .setColor('#FF00FF')
                        .setFooter({ text: `Total: ${guildGiveaways.length} giveaways` })
                        .setTimestamp();
                    
                    // Add giveaways to embed
                    guildGiveaways.forEach((giveaway, index) => {
                        const channel = interaction.guild.channels.cache.get(giveaway.channelId);
                        const timeLeft = giveaway.endTime - Date.now();
                        
                        embed.addFields({
                            name: `${index + 1}. ${giveaway.prize}`,
                            value: `Channel: ${channel ? `<#${channel.id}>` : 'Unknown'}\nEnds: <t:${Math.floor(giveaway.endTime / 1000)}:R>\nWinners: ${giveaway.winners}\nParticipants: ${giveaway.participants.size}\nID: \`${giveaway.messageId}\``
                        });
                    });
                    
                    interaction.reply({ embeds: [embed] });
                    
                    break;
                }
            }
        } catch (error) {
            console.error('Error in giveaway command:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: 'There was an error executing this command!',
                    ephemeral: true
                });
            } else if (interaction.deferred) {
                await interaction.editReply('There was an error executing this command!');
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