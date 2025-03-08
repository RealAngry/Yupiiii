const { EmbedBuilder } = require('discord.js');
const math = require('mathjs');

module.exports = {
    name: 'calculator',
    description: 'Calculate mathematical expressions',
    usage: 'calculator <expression>',
    category: 'utility',
    aliases: ['calc', 'math', 'calculate'],
    cooldown: 3,
    examples: [
        'calculator 2+2',
        'calculator 5*5',
        'calculator sin(45 deg)',
        'calculator 2^10',
        'calculator 5!'
    ],
    async execute(client, message, args) {
        // Check if expression is provided
        if (!args.length) {
            return message.reply('Bhai expression to batao! Example: `' + client.prefix + 'calculator 2+2`');
        }
        
        // Join args to form the expression
        const expression = args.join(' ');
        
        try {
            // Evaluate the expression
            const result = math.evaluate(expression);
            
            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('🧮 Calculator Result')
                .addFields(
                    { name: 'Expression', value: '```' + expression + '```' },
                    { name: 'Result', value: '```' + result + '```' }
                )
                .setColor('#00FFFF')
                .setFooter({ text: 'Powered by mathjs | Try complex expressions like sin(45 deg)' })
                .setTimestamp();
            
            // Send the result
            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Calculator error:', error);
            
            // Create error embed
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Calculation Error')
                .setDescription('Arre bhai, ye kya expression hai? Samajh nahi aaya mujhe!')
                .addFields(
                    { name: 'Expression', value: '```' + expression + '```' },
                    { name: 'Error', value: '```' + error.message + '```' }
                )
                .setColor('#FF0000')
                .setFooter({ text: 'Try something like 2+2 or sin(45 deg)' })
                .setTimestamp();
            
            // Send the error
            await message.reply({ embeds: [errorEmbed] });
        }
    }
}; 