const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const User = require('../models/user');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('customstatus')
        .setDescription('Set a custom status that appears in your profile')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set your custom status')
                .addStringOption(option => 
                    option.setName('status')
                        .setDescription('Your custom status text')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear your custom status')),
    
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'clear') {
            try {
                // Find and update user in database
                const updatedUser = await User.findOneAndUpdate(
                    { userId: interaction.user.id },
                    { $unset: { customStatus: 1 } },
                    { new: true, upsert: true }
                );
                
                const embed = new EmbedBuilder()
                    .setTitle('Status Cleared')
                    .setDescription('Your custom status has been removed.')
                    .setColor('#00FFFF')
                    .setFooter({ text: `Requested by ${interaction.user.tag}` })
                    .setTimestamp();
                
                return interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error clearing custom status:', error);
                return interaction.reply({ 
                    content: 'There was an error clearing your status. Please try again later.',
                    ephemeral: true 
                });
            }
        } else if (subcommand === 'set') {
            const statusText = interaction.options.getString('status');
            
            // Check if status is too long
            if (statusText.length > 100) {
                return interaction.reply({ 
                    content: 'Your status cannot be longer than 100 characters.',
                    ephemeral: true 
                });
            }
            
            try {
                // Find and update user in database
                const updatedUser = await User.findOneAndUpdate(
                    { userId: interaction.user.id },
                    { 
                        $set: { 
                            customStatus: statusText,
                            statusUpdatedAt: new Date()
                        } 
                    },
                    { new: true, upsert: true }
                );
                
                const embed = new EmbedBuilder()
                    .setTitle('Status Updated')
                    .setDescription('Your custom status has been set.')
                    .addFields(
                        { name: 'New Status', value: statusText }
                    )
                    .setColor('#00FFFF')
                    .setFooter({ text: `Requested by ${interaction.user.tag}` })
                    .setTimestamp();
                
                return interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error setting custom status:', error);
                return interaction.reply({ 
                    content: 'There was an error setting your status. Please try again later.',
                    ephemeral: true 
                });
            }
        }
    }
}; 