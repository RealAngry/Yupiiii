const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ModerationCase = require('../models/ModerationCase');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('Completely clear a channel by cloning it and deleting the original')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels | PermissionFlagsBits.Administrator)
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('The channel to nuke (defaults to current channel)')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for nuking the channel')
                .setRequired(false)),
    
    async execute(interaction, client) {
        // Defer reply since this operation might take some time
        await interaction.deferReply({ ephemeral: true });
        
        // Check if bot has permission
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.editReply({ 
                content: 'I do not have permission to manage channels.',
                ephemeral: true 
            });
        }
        
        // Get target channel
        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
        
        // Get reason
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        // Confirmation message
        const confirmEmbed = new EmbedBuilder()
            .setTitle('⚠️ Channel Nuke Confirmation')
            .setDescription(`Are you sure you want to nuke ${targetChannel}? This will delete all messages in the channel permanently.`)
            .addFields(
                { name: 'Channel', value: `${targetChannel}`, inline: true },
                { name: 'Reason', value: reason, inline: true }
            )
            .setColor('#FF0000')
            .setFooter({ text: 'Click the buttons below to confirm or cancel' })
            .setTimestamp();
        
        // Create buttons for confirmation
        const confirmButton = new ButtonBuilder()
            .setCustomId('confirm_nuke')
            .setLabel('Confirm Nuke')
            .setStyle(ButtonStyle.Danger);
        
        const cancelButton = new ButtonBuilder()
            .setCustomId('cancel_nuke')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary);
        
        const row = new ActionRowBuilder()
            .addComponents(confirmButton, cancelButton);
        
        // Send confirmation message with buttons
        const confirmMessage = await interaction.editReply({
            embeds: [confirmEmbed],
            components: [row],
            ephemeral: true
        });
        
        // Create a collector for button interactions
        const filter = i => i.user.id === interaction.user.id && 
                           (i.customId === 'confirm_nuke' || i.customId === 'cancel_nuke');
        
        const collector = interaction.channel.createMessageComponentCollector({ 
            filter, 
            time: 30000, 
            max: 1 
        });
        
        collector.on('collect', async i => {
            if (i.customId === 'confirm_nuke') {
                try {
                    await i.update({ 
                        content: 'Nuking channel...',
                        embeds: [],
                        components: [],
                        ephemeral: true
                    });
                    
                    // Send a message that will be kept in the new channel
                    const nukeMessage = await targetChannel.send('This channel is being nuked...');
                    
                    // Clone the channel
                    const position = targetChannel.position;
                    const newChannel = await targetChannel.clone({
                        reason: `Nuked by ${interaction.user.tag}: ${reason}`
                    });
                    
                    // Set the position to be the same as the original
                    await newChannel.setPosition(position);
                    
                    // Delete the original channel
                    await targetChannel.delete(`Nuked by ${interaction.user.tag}: ${reason}`);
                    
                    // Create moderation case
                    const highestCase = await ModerationCase.findOne({})
                        .sort({ caseNumber: -1 })
                        .limit(1);
                    
                    const caseNumber = highestCase ? highestCase.caseNumber + 1 : 1;
                    
                    const newCase = new ModerationCase({
                        caseNumber: caseNumber,
                        userId: interaction.user.id, // In this case, the user is the one who initiated the action
                        moderatorId: interaction.user.id,
                        action: 'channel_nuke',
                        reason: `Channel: ${targetChannel.name} - ${reason}`,
                        timestamp: new Date()
                    });
                    
                    await newCase.save();
                    
                    // Send success message in the new channel
                    const embed = new EmbedBuilder()
                        .setTitle('💥 Channel Nuked')
                        .setDescription(`This channel has been nuked by ${interaction.user.tag}`)
                        .addFields(
                            { name: 'Reason', value: reason },
                            { name: 'Case ID', value: `#${caseNumber}` }
                        )
                        .setColor('#FF9900')
                        .setImage('https://media.giphy.com/media/oe33xf3B50fsc/giphy.gif')
                        .setFooter({ text: `Nuked by ${interaction.user.tag}` })
                        .setTimestamp();
                    
                    await newChannel.send({ embeds: [embed] });
                } catch (error) {
                    console.error('Error nuking channel:', error);
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ 
                            content: 'There was an error nuking the channel. Please check my permissions and try again.',
                            ephemeral: true 
                        });
                    } else {
                        await interaction.reply({ 
                            content: 'There was an error nuking the channel. Please check my permissions and try again.',
                            ephemeral: true 
                        });
                    }
                }
            } else {
                await i.update({ 
                    content: 'Channel nuke cancelled.',
                    embeds: [],
                    components: [],
                    ephemeral: true
                });
            }
        });
        
        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({
                    content: 'Channel nuke cancelled due to timeout.',
                    embeds: [],
                    components: [],
                    ephemeral: true
                });
            }
        });
    }
}; 