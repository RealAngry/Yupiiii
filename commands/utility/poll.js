const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'poll',
    description: 'Create a poll with up to 10 options',
    usage: 'poll <question> | <option1> | <option2> | ... | <option10>',
    category: 'utility',
    aliases: ['createpoll', 'vote'],
    cooldown: 30,
    permissions: [PermissionFlagsBits.ManageMessages],
    examples: [
        'poll Do you like the bot? | Yes | No | Maybe',
        'poll What\'s your favorite color? | Red | Blue | Green | Yellow | Purple'
    ],
    async execute(client, message, args) {
        // Delete the command message
        if (message.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
            message.delete().catch(error => console.error('Failed to delete poll command message:', error));
        }
        
        // Join all arguments and split by the pipe character
        const pollArgs = args.join(' ').split('|').map(arg => arg.trim());
        
        // Check if there are enough arguments
        if (pollArgs.length < 3) {
            return message.channel.send('Please provide a question and at least 2 options separated by `|`.\nExample: `poll Question | Option 1 | Option 2`');
        }
        
        // Extract question and options
        const question = pollArgs[0];
        const options = pollArgs.slice(1);
        
        // Limit options to 10
        if (options.length > 10) {
            return message.channel.send('You can only have up to 10 options in a poll.');
        }
        
        // Emoji numbers for reactions
        const emojiNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
        
        // Create the poll embed
        const embed = new EmbedBuilder()
            .setTitle('📊 ' + question)
            .setDescription(options.map((option, index) => `${emojiNumbers[index]} ${option}`).join('\n\n'))
            .setColor('#00FFFF')
            .setFooter({ text: `Poll created by ${message.author.tag}` })
            .setTimestamp();
        
        // Send the poll embed
        const pollMessage = await message.channel.send({ embeds: [embed] });
        
        // Add reactions for each option
        for (let i = 0; i < options.length; i++) {
            await pollMessage.react(emojiNumbers[i]);
        }
    }
}; 