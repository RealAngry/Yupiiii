const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'random',
    description: 'Generate random numbers, pick from choices, flip coins, roll dice, etc.',
    usage: 'random <type> [options]',
    category: 'fun',
    aliases: ['rand', 'rng'],
    cooldown: 3,
    examples: [
        'random number 1 100',
        'random choice Pizza Burger Tacos',
        'random coin',
        'random dice',
        'random dice 2',
        'random 8ball Will I win?'
    ],
    execute(client, message, args) {
        if (!args.length) {
            return message.reply('Please specify what type of random generation you want. Options: `number`, `choice`, `coin`, `dice`, `8ball`');
        }
        
        const type = args[0].toLowerCase();
        
        switch (type) {
            case 'number':
                return randomNumber(message, args);
            case 'choice':
            case 'pick':
                return randomChoice(message, args);
            case 'coin':
            case 'flip':
                return coinFlip(message);
            case 'dice':
            case 'roll':
                return rollDice(message, args);
            case '8ball':
                return eightBall(message, args);
            default:
                return message.reply('Invalid random type. Options: `number`, `choice`, `coin`, `dice`, `8ball`');
        }
    }
};

// Generate a random number between min and max
function randomNumber(message, args) {
    if (args.length < 3) {
        return message.reply('Please provide minimum and maximum values. Example: `random number 1 100`');
    }
    
    const min = parseInt(args[1]);
    const max = parseInt(args[2]);
    
    if (isNaN(min) || isNaN(max)) {
        return message.reply('Please provide valid numbers for minimum and maximum values.');
    }
    
    if (min >= max) {
        return message.reply('The minimum value must be less than the maximum value.');
    }
    
    const result = Math.floor(Math.random() * (max - min + 1)) + min;
    
    const embed = new EmbedBuilder()
        .setTitle('🎲 Random Number')
        .setDescription(`I generated a random number between **${min}** and **${max}**`)
        .addFields({ name: 'Result', value: `**${result}**` })
        .setColor('#00FFFF')
        .setFooter({ text: `Requested by ${message.author.tag}` })
        .setTimestamp();
    
    return message.reply({ embeds: [embed] });
}

// Pick a random choice from provided options
function randomChoice(message, args) {
    if (args.length < 2) {
        return message.reply('Please provide at least two choices. Example: `random choice Pizza Burger Tacos`');
    }
    
    const choices = args.slice(1);
    const result = choices[Math.floor(Math.random() * choices.length)];
    
    const embed = new EmbedBuilder()
        .setTitle('🎯 Random Choice')
        .setDescription(`I picked a random option from your choices`)
        .addFields(
            { name: 'Choices', value: choices.map(c => `• ${c}`).join('\n') },
            { name: 'Result', value: `**${result}**` }
        )
        .setColor('#00FFFF')
        .setFooter({ text: `Requested by ${message.author.tag}` })
        .setTimestamp();
    
    return message.reply({ embeds: [embed] });
}

// Flip a coin
function coinFlip(message) {
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    const emoji = result === 'Heads' ? '🪙' : '💿';
    
    const embed = new EmbedBuilder()
        .setTitle(`${emoji} Coin Flip`)
        .setDescription(`I flipped a coin for you`)
        .addFields({ name: 'Result', value: `**${result}**` })
        .setColor('#00FFFF')
        .setFooter({ text: `Requested by ${message.author.tag}` })
        .setTimestamp();
    
    return message.reply({ embeds: [embed] });
}

// Roll dice
function rollDice(message, args) {
    const count = args.length > 1 ? parseInt(args[1]) : 1;
    
    if (isNaN(count) || count < 1 || count > 10) {
        return message.reply('Please provide a valid number of dice between 1 and 10.');
    }
    
    const results = [];
    let total = 0;
    
    for (let i = 0; i < count; i++) {
        const roll = Math.floor(Math.random() * 6) + 1;
        results.push(roll);
        total += roll;
    }
    
    const embed = new EmbedBuilder()
        .setTitle('🎲 Dice Roll')
        .setDescription(`I rolled ${count} ${count === 1 ? 'die' : 'dice'} for you`)
        .addFields(
            { name: 'Results', value: results.map((r, i) => `Die ${i+1}: **${r}**`).join('\n') },
            { name: 'Total', value: `**${total}**` }
        )
        .setColor('#00FFFF')
        .setFooter({ text: `Requested by ${message.author.tag}` })
        .setTimestamp();
    
    return message.reply({ embeds: [embed] });
}

// Magic 8-ball
function eightBall(message, args) {
    if (args.length < 2) {
        return message.reply('Please ask a question for the 8-ball. Example: `random 8ball Will I win?`');
    }
    
    const question = args.slice(1).join(' ');
    
    const responses = [
        'It is certain.',
        'It is decidedly so.',
        'Without a doubt.',
        'Yes, definitely.',
        'You may rely on it.',
        'As I see it, yes.',
        'Most likely.',
        'Outlook good.',
        'Yes.',
        'Signs point to yes.',
        'Reply hazy, try again.',
        'Ask again later.',
        'Better not tell you now.',
        'Cannot predict now.',
        'Concentrate and ask again.',
        'Don\'t count on it.',
        'My reply is no.',
        'My sources say no.',
        'Outlook not so good.',
        'Very doubtful.'
    ];
    
    const result = responses[Math.floor(Math.random() * responses.length)];
    
    const embed = new EmbedBuilder()
        .setTitle('🎱 Magic 8-Ball')
        .setDescription(`You asked: **${question}**`)
        .addFields({ name: 'Answer', value: `**${result}**` })
        .setColor('#00FFFF')
        .setFooter({ text: `Requested by ${message.author.tag}` })
        .setTimestamp();
    
    return message.reply({ embeds: [embed] });
} 