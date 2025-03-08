const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const math = require('mathjs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calculator')
        .setDescription('Calculate a mathematical expression')
        .addStringOption(option => 
            option.setName('expression')
                .setDescription('The mathematical expression to evaluate')
                .setRequired(true)),
    
    async execute(interaction, client) {
        const expression = interaction.options.getString('expression');
        
        try {
            // Evaluate the expression
            const result = math.evaluate(expression);
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('📊 Calculator')
                .setDescription('Here is the result of your calculation:')
                .addFields(
                    { name: 'Expression', value: `\`${expression}\`` },
                    { name: 'Result', value: `\`${result}\`` }
                )
                .setColor('#3498db')
                .setFooter({ text: 'Powered by mathjs' })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            // Create error embed
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Calculation Error')
                .setDescription('There was an error evaluating your expression.')
                .addFields(
                    { name: 'Expression', value: `\`${expression}\`` },
                    { name: 'Error', value: `\`${error.message}\`` },
                    { name: 'Valid Examples', value: '`2 + 2`, `sin(45 deg)`, `5 * (3 + 2)`, `sqrt(16)`' }
                )
                .setColor('#e74c3c')
                .setFooter({ text: 'Try a different expression' })
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}; 