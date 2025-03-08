const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('snipe')
        .setDescription('View recently deleted or edited messages')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of messages to snipe')
                .setRequired(false)
                .addChoices(
                    { name: 'Deleted', value: 'deleted' },
                    { name: 'Edited', value: 'edited' }
                ))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Filter messages by user')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('index')
                .setDescription('Index of the message to view (1-based)')
                .setMinValue(1)
                .setRequired(false)),
    async execute(interaction) {
        try {
            const { client } = interaction;
            
            // Initialize snipe collections if they don't exist
            if (!client.snipes) {
                client.snipes = {
                    deleted: new Map(),
                    edited: new Map()
                };
            }
            
            // Get options
            const type = interaction.options.getString('type') || 'deleted';
            const userFilter = interaction.options.getUser('user');
            let index = (interaction.options.getInteger('index') || 1) - 1; // Convert to 0-based index
            
            // Get the appropriate snipe collection
            const snipeMap = client.snipes[type].get(interaction.channel.id) || [];
            
            // Filter by user if specified
            const filteredSnipes = userFilter ? 
                snipeMap.filter(snipe => snipe.author.id === userFilter.id) : 
                snipeMap;
            
            // Check if there are any snipes
            if (filteredSnipes.length === 0) {
                return interaction.reply({
                    content: `No ${type} messages found${userFilter ? ` from ${userFilter.tag}` : ''} in this channel.`,
                    ephemeral: true
                });
            }
            
            // Check if index is valid
            if (index >= filteredSnipes.length) {
                index = filteredSnipes.length - 1;
            }
            
            // Get the snipe at the specified index
            const snipe = filteredSnipes[index];
            
            // Create embed
            const embed = new EmbedBuilder()
                .setAuthor({ 
                    name: `${snipe.author.tag} ${type === 'deleted' ? 'deleted' : 'edited'} a message`, 
                    iconURL: snipe.author.displayAvatarURL() 
                })
                .setDescription(snipe.content || 'No content')
                .setColor(type === 'deleted' ? '#FF0000' : '#FFA500')
                .setFooter({ 
                    text: `${index + 1}/${filteredSnipes.length} • ${type === 'edited' ? 'Old content shown' : 'Deleted message'}` 
                })
                .setTimestamp(snipe.timestamp);
            
            // Add image if there was one
            if (snipe.image) {
                embed.setImage(snipe.image);
            }
            
            // Add new content if it was edited
            if (type === 'edited' && snipe.newContent) {
                embed.addFields({ name: 'New Content', value: snipe.newContent });
            }
            
            // Create navigation buttons
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`snipe_prev_${interaction.user.id}`)
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(index === 0),
                    new ButtonBuilder()
                        .setCustomId(`snipe_next_${interaction.user.id}`)
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(index === filteredSnipes.length - 1),
                    new ButtonBuilder()
                        .setCustomId(`snipe_switch_${interaction.user.id}`)
                        .setLabel(type === 'deleted' ? 'Show Edited' : 'Show Deleted')
                        .setStyle(ButtonStyle.Primary)
                );
            
            // Send the embed with buttons
            await interaction.reply({ 
                embeds: [embed], 
                components: [row] 
            });
            
            // Create a collector for button interactions
            const message = await interaction.fetchReply();
            const collector = message.createMessageComponentCollector({ 
                time: 60000 // 1 minute
            });
            
            // Store current state
            let currentIndex = index;
            let currentType = type;
            let currentSnipes = filteredSnipes;
            
            collector.on('collect', async buttonInteraction => {
                // Only allow the command user to interact with buttons
                if (buttonInteraction.user.id !== interaction.user.id) {
                    return buttonInteraction.reply({ 
                        content: 'These buttons are not for you!', 
                        ephemeral: true 
                    });
                }
                
                // Handle button interactions
                if (buttonInteraction.customId === `snipe_prev_${interaction.user.id}`) {
                    currentIndex--;
                } else if (buttonInteraction.customId === `snipe_next_${interaction.user.id}`) {
                    currentIndex++;
                } else if (buttonInteraction.customId === `snipe_switch_${interaction.user.id}`) {
                    // Switch between deleted and edited
                    currentType = currentType === 'deleted' ? 'edited' : 'deleted';
                    
                    // Get the new snipe collection
                    const newSnipeMap = client.snipes[currentType].get(interaction.channel.id) || [];
                    
                    // Filter by user if specified
                    currentSnipes = userFilter ? 
                        newSnipeMap.filter(snipe => snipe.author.id === userFilter.id) : 
                        newSnipeMap;
                    
                    // Reset index
                    currentIndex = 0;
                    
                    // Check if there are any snipes
                    if (currentSnipes.length === 0) {
                        return buttonInteraction.update({ 
                            content: `No ${currentType} messages found${userFilter ? ` from ${userFilter.tag}` : ''} in this channel.`,
                            embeds: [],
                            components: []
                        });
                    }
                }
                
                // Get the snipe at the current index
                const currentSnipe = currentSnipes[currentIndex];
                
                // Update the embed
                const updatedEmbed = new EmbedBuilder()
                    .setAuthor({ 
                        name: `${currentSnipe.author.tag} ${currentType === 'deleted' ? 'deleted' : 'edited'} a message`, 
                        iconURL: currentSnipe.author.displayAvatarURL() 
                    })
                    .setDescription(currentSnipe.content || 'No content')
                    .setColor(currentType === 'deleted' ? '#FF0000' : '#FFA500')
                    .setFooter({ 
                        text: `${currentIndex + 1}/${currentSnipes.length} • ${currentType === 'edited' ? 'Old content shown' : 'Deleted message'}` 
                    })
                    .setTimestamp(currentSnipe.timestamp);
                
                // Add image if there was one
                if (currentSnipe.image) {
                    updatedEmbed.setImage(currentSnipe.image);
                }
                
                // Add new content if it was edited
                if (currentType === 'edited' && currentSnipe.newContent) {
                    updatedEmbed.addFields({ name: 'New Content', value: currentSnipe.newContent });
                }
                
                // Update the buttons
                const updatedRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`snipe_prev_${interaction.user.id}`)
                            .setLabel('Previous')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentIndex === 0),
                        new ButtonBuilder()
                            .setCustomId(`snipe_next_${interaction.user.id}`)
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentIndex === currentSnipes.length - 1),
                        new ButtonBuilder()
                            .setCustomId(`snipe_switch_${interaction.user.id}`)
                            .setLabel(currentType === 'deleted' ? 'Show Edited' : 'Show Deleted')
                            .setStyle(ButtonStyle.Primary)
                    );
                
                // Update the message
                await buttonInteraction.update({ 
                    embeds: [updatedEmbed], 
                    components: [updatedRow] 
                });
            });
            
            collector.on('end', () => {
                // Remove buttons when collector expires
                interaction.editReply({ components: [] }).catch(() => {});
            });
        } catch (error) {
            console.error('Error in snipe command:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: 'There was an error executing this command!',
                    ephemeral: true 
                });
            }
        }
    }
}; 