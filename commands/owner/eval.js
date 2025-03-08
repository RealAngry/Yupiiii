const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { inspect } = require('util');

module.exports = {
    name: 'eval',
    description: 'Evaluate JavaScript code (Owner only)',
    usage: 'eval <code>',
    category: 'owner',
    aliases: ['evaluate', 'exec'],
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 0,
    examples: [
        'eval message.guild.name',
        'eval client.users.cache.size',
        'eval client.guilds.cache.map(g => g.name).join("\\n")'
    ],
    async execute(client, message, args) {
        // Check if user is the bot owner
        if (message.author.id !== process.env.OWNER_ID && !client.extraOwners.has(message.author.id)) {
            return message.reply('This command can only be used by the bot owner.');
        }

        // Check if code is provided
        if (!args.length) {
            return message.reply('Please provide code to evaluate.');
        }

        // Get code to evaluate
        const code = args.join(' ');
        
        // Create loading message
        const loadingMessage = await message.reply('Evaluating code...');
        
        try {
            // Evaluate code
            let evaled = eval(code);
            
            // Handle promises
            if (evaled instanceof Promise) {
                loadingMessage.edit('Awaiting promise...');
                evaled = await evaled;
            }
            
            // Convert result to string
            const result = inspect(evaled, { depth: 0 });
            
            // Check if result is too long
            if (result.length > 4000) {
                // Split result into chunks
                const chunks = splitString(result, 4000);
                
                // Send first chunk as embed
                const embed = new EmbedBuilder()
                    .setTitle('Evaluation Result (1/' + chunks.length + ')')
                    .setDescription('```js\n' + chunks[0] + '\n```')
                    .setColor('#00FF00')
                    .setFooter({ text: 'Evaluation completed successfully' })
                    .setTimestamp();
                
                await loadingMessage.edit({ content: null, embeds: [embed] });
                
                // Send remaining chunks
                for (let i = 1; i < chunks.length; i++) {
                    const chunkEmbed = new EmbedBuilder()
                        .setTitle('Evaluation Result (' + (i + 1) + '/' + chunks.length + ')')
                        .setDescription('```js\n' + chunks[i] + '\n```')
                        .setColor('#00FF00')
                        .setTimestamp();
                    
                    await message.channel.send({ embeds: [chunkEmbed] });
                }
            } else {
                // Send result as embed
                const embed = new EmbedBuilder()
                    .setTitle('Evaluation Result')
                    .setDescription('```js\n' + result + '\n```')
                    .setColor('#00FF00')
                    .setFooter({ text: 'Evaluation completed successfully' })
                    .setTimestamp();
                
                await loadingMessage.edit({ content: null, embeds: [embed] });
            }
        } catch (error) {
            // Send error as embed
            const embed = new EmbedBuilder()
                .setTitle('Evaluation Error')
                .setDescription('```js\n' + error.stack + '\n```')
                .setColor('#FF0000')
                .setFooter({ text: 'Evaluation failed' })
                .setTimestamp();
            
            await loadingMessage.edit({ content: null, embeds: [embed] });
        }
    }
};

// Helper function to split string into chunks
function splitString(str, maxLength) {
    const chunks = [];
    let i = 0;
    
    while (i < str.length) {
        chunks.push(str.substring(i, i + maxLength));
        i += maxLength;
    }
    
    return chunks;
} 