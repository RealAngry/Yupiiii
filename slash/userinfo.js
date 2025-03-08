const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Display information about a user')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to get information about')
                .setRequired(false)),
    
    async execute(interaction, client) {
        try {
            // Create a mock message object for compatibility
            const message = {
                guild: interaction.guild,
                channel: interaction.channel,
                author: interaction.user,
                member: interaction.member,
                mentions: {
                    members: {
                        first: () => interaction.options.getMember('user') || interaction.member
                    }
                },
                reply: (content) => {
                    if (!interaction.replied && !interaction.deferred) {
                        return interaction.reply(content);
                    }
                    return null;
                }
            };
            
            // Get args from options
            const args = [];
            const targetUser = interaction.options.getUser('user');
            if (targetUser) {
                args.push(targetUser.id);
            }
            
            // Execute the command
            await require('../commands/utility/userinfo.js').execute(client, message, args);
            
            // Mark interaction as handled
            interaction.isHandled = true;
        } catch (error) {
            console.error('Error in slash userinfo command:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: 'There was an error executing this command!',
                    ephemeral: true 
                });
            }
        }
    }
};