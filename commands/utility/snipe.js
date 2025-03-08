const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'snipe',
    description: 'View recently deleted or edited messages',
    usage: 'snipe [type] [user] [index]',
    category: 'utility',
    aliases: ['s', 'sn'],
    cooldown: 5,
    execute(client, message, args) {
        // Initialize snipe collections if they don't exist
        if (!client.snipes) {
            client.snipes = {
                deleted: new Map(),
                edited: new Map()
            };
        }
        
        // Default values
        let type = 'deleted';
        let userFilter = null;
        let index = 0;
        
        // Parse arguments
        if (args.length > 0) {
            // Check for type
            if (['deleted', 'edited', 'del', 'edit', 'd', 'e'].includes(args[0].toLowerCase())) {
                type = args[0].toLowerCase() === 'd' || args[0].toLowerCase() === 'del' ? 'deleted' : 
                       args[0].toLowerCase() === 'e' || args[0].toLowerCase() === 'edit' ? 'edited' : args[0].toLowerCase();
                args.shift();
            }
            
            // Check for user mention
            if (args.length > 0 && message.mentions.users.size > 0) {
                userFilter = message.mentions.users.first();
                // Remove the mention from args
                args = args.filter(arg => !arg.includes(userFilter.id));
            }
            
            // Check for index
            if (args.length > 0 && !isNaN(args[0])) {
                index = parseInt(args[0]) - 1; // Convert to 0-based index
                if (index < 0) index = 0;
            }
        }
        
        // Get the appropriate snipe collection
        const snipeMap = client.snipes[type].get(message.channel.id) || [];
        
        // Filter by user if specified
        const filteredSnipes = userFilter ? 
            snipeMap.filter(snipe => snipe.author.id === userFilter.id) : 
            snipeMap;
        
        // Check if there are any snipes
        if (filteredSnipes.length === 0) {
            return message.reply(`No ${type} messages found${userFilter ? ` from ${userFilter.tag}` : ''} in this channel.`);
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
                    .setCustomId(`snipe_prev_${message.author.id}`)
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(index === 0),
                new ButtonBuilder()
                    .setCustomId(`snipe_next_${message.author.id}`)
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(index === filteredSnipes.length - 1),
                new ButtonBuilder()
                    .setCustomId(`snipe_switch_${message.author.id}`)
                    .setLabel(type === 'deleted' ? 'Show Edited' : 'Show Deleted')
                    .setStyle(ButtonStyle.Primary)
            );
        
        // Send the embed with buttons
        message.reply({ 
            embeds: [embed], 
            components: [row] 
        }).then(sentMessage => {
            // Create a collector for button interactions
            const collector = sentMessage.createMessageComponentCollector({ 
                time: 60000 // 1 minute
            });
            
            // Store current state
            let currentIndex = index;
            let currentType = type;
            let currentSnipes = filteredSnipes;
            
            collector.on('collect', async interaction => {
                // Only allow the command user to interact with buttons
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({ 
                        content: 'These buttons are not for you!', 
                        ephemeral: true 
                    });
                }
                
                // Handle button interactions
                if (interaction.customId === `snipe_prev_${message.author.id}`) {
                    currentIndex--;
                } else if (interaction.customId === `snipe_next_${message.author.id}`) {
                    currentIndex++;
                } else if (interaction.customId === `snipe_switch_${message.author.id}`) {
                    // Switch between deleted and edited
                    currentType = currentType === 'deleted' ? 'edited' : 'deleted';
                    
                    // Get the new snipe collection
                    const newSnipeMap = client.snipes[currentType].get(message.channel.id) || [];
                    
                    // Filter by user if specified
                    currentSnipes = userFilter ? 
                        newSnipeMap.filter(snipe => snipe.author.id === userFilter.id) : 
                        newSnipeMap;
                    
                    // Reset index
                    currentIndex = 0;
                    
                    // Check if there are any snipes
                    if (currentSnipes.length === 0) {
                        return interaction.update({ 
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
                            .setCustomId(`snipe_prev_${message.author.id}`)
                            .setLabel('Previous')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentIndex === 0),
                        new ButtonBuilder()
                            .setCustomId(`snipe_next_${message.author.id}`)
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(currentIndex === currentSnipes.length - 1),
                        new ButtonBuilder()
                            .setCustomId(`snipe_switch_${message.author.id}`)
                            .setLabel(currentType === 'deleted' ? 'Show Edited' : 'Show Deleted')
                            .setStyle(ButtonStyle.Primary)
                    );
                
                // Update the message
                await interaction.update({ 
                    embeds: [updatedEmbed], 
                    components: [updatedRow] 
                });
            });
            
            collector.on('end', () => {
                // Remove buttons when collector expires
                sentMessage.edit({ components: [] }).catch(() => {});
            });
        }).catch(console.error);
    }
}; 