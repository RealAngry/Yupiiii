const { EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const User = require('../../models/user');

module.exports = {
    name: 'customstatus',
    description: 'Set a custom status that appears in your profile',
    usage: 'customstatus <status text>',
    category: 'utility',
    aliases: ['setstatus', 'status'],
    cooldown: 60,
    examples: [
        'customstatus Coding a new bot',
        'customstatus Playing games with friends',
        'customstatus clear'
    ],
    async execute(client, message, args) {
        if (!args.length) {
            return message.reply('Please provide a status message or use `customstatus clear` to remove your current status.');
        }
        
        // Check if user wants to clear their status
        if (args[0].toLowerCase() === 'clear') {
            try {
                // Find and update user in database
                const updatedUser = await User.findOneAndUpdate(
                    { userId: message.author.id },
                    { $unset: { customStatus: 1 } },
                    { new: true, upsert: true }
                );
                
                const embed = new EmbedBuilder()
                    .setTitle('Status Cleared')
                    .setDescription('Your custom status has been removed.')
                    .setColor('#00FFFF')
                    .setFooter({ text: `Requested by ${message.author.tag}` })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error clearing custom status:', error);
                return message.reply('There was an error clearing your status. Please try again later.');
            }
        }
        
        // Get the status text
        const statusText = args.join(' ');
        
        // Check if status is too long
        if (statusText.length > 100) {
            return message.reply('Your status cannot be longer than 100 characters.');
        }
        
        try {
            // Find and update user in database
            const updatedUser = await User.findOneAndUpdate(
                { userId: message.author.id },
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
                .setFooter({ text: `Requested by ${message.author.tag}` })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error setting custom status:', error);
            return message.reply('There was an error setting your status. Please try again later.');
        }
    }
}; 