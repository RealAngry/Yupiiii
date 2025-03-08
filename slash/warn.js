const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a member for breaking rules'),
    async execute(interaction) {
        // Convert the regular command to work with interactions
        try {
            // Create a mock message object for compatibility
            const message = {
                guild: interaction.guild,
                channel: interaction.channel,
                author: interaction.user,
                member: interaction.member,
                reply: (content) => interaction.reply(content)
            };
            
            // Get args from options if needed
            const args = [];
            
            // Execute the command
            await require('../commands/moderation/warn.js').execute(interaction.client, message, args);
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'There was an error executing this command!',
                ephemeral: true 
            });
        }
    }
};