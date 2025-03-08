const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botdescription')
        .setDescription('Change the bot\'s description')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => 
            option.setName('description')
                .setDescription('The new description for the bot')
                .setRequired(true)),
    
    async execute(interaction, client) {
        // Check if user is bot owner
        const ownerId = process.env.OWNER_ID;
        if (ownerId && interaction.user.id !== ownerId) {
            return interaction.reply({ 
                content: 'Only the bot owner can change the bot\'s description.',
                ephemeral: true 
            });
        }
        
        // Get the description
        const description = interaction.options.getString('description');
        
        try {
            // Store the description in the client for future use
            client.description = description;
            
            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('Bot Description Updated')
                .setDescription('The bot\'s description has been updated.')
                .addFields(
                    { name: 'New Description', value: description }
                )
                .setColor('#00FFFF')
                .setFooter({ text: `Updated by ${interaction.user.tag}` })
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error setting bot description:', error);
            return interaction.reply({ 
                content: 'There was an error setting the bot\'s description. Please try again later.',
                ephemeral: true 
            });
        }
    }
}; 