const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('random')
        .setDescription('Generate random numbers, pick choices, flip coins, roll dice, etc.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('number')
                .setDescription('Generate a random number between min and max')
                .addIntegerOption(option => 
                    option.setName('min')
                        .setDescription('Minimum value')
                        .setRequired(true))
                .addIntegerOption(option => 
                    option.setName('max')
                        .setDescription('Maximum value')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('choice')
                .setDescription('Pick a random option from your choices')
                .addStringOption(option => 
                    option.setName('choices')
                        .setDescription('List of choices separated by spaces or commas')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('coin')
                .setDescription('Flip a coin'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('dice')
                .setDescription('Roll one or more dice')
                .addIntegerOption(option => 
                    option.setName('count')
                        .setDescription('Number of dice to roll (1-10)')
                        .setMinValue(1)
                        .setMaxValue(10)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('8ball')
                .setDescription('Ask the magic 8-ball a question')
                .addStringOption(option => 
                    option.setName('question')
                        .setDescription('Your question for the 8-ball')
                        .setRequired(true))),
    
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'number':
                return randomNumber(interaction);
            case 'choice':
                return randomChoice(interaction);
            case 'coin':
                return coinFlip(interaction);
            case 'dice':
                return rollDice(interaction);
            case '8ball':
                return eightBall(interaction);
        }
    }
};

// Generate a random number between min and max
async function randomNumber(interaction) {
    const min = interaction.options.getInteger('min');
    const max = interaction.options.getInteger('max');
    
    if (min >= max) {
        return interaction.reply({ 
            content: 'The minimum value must be less than the maximum value.',
            ephemeral: true 
        });
    }
    
    const result = Math.floor(Math.random() * (max - min + 1)) + min;
    
    const embed = new EmbedBuilder()
        .setTitle('🎲 Random Number')
        .setDescription(`I generated a random number between **${min}** and **${max}**`)
        .addFields({ name: 'Result', value: `**${result}**` })
        .setColor('#00FFFF')
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();
    
    return interaction.reply({ embeds: [embed] });
}

// Pick a random choice from provided options
async function randomChoice(interaction) {
    const choicesInput = interaction.options.getString('choices');
    
    // Split by commas or spaces
    let choices = choicesInput.includes(',') 
        ? choicesInput.split(',').map(c => c.trim()).filter(c => c)
        : choicesInput.split(' ').filter(c => c);
    
    if (choices.length < 2) {
        return interaction.reply({ 
            content: 'Please provide at least two choices separated by spaces or commas.',
            ephemeral: true 
        });
    }
    
    const result = choices[Math.floor(Math.random() * choices.length)];
    
    const embed = new EmbedBuilder()
        .setTitle('🎯 Random Choice')
        .setDescription(`I picked a random option from your choices`)
        .addFields(
            { name: 'Choices', value: choices.map(c => `• ${c}`).join('\n') },
            { name: 'Result', value: `**${result}**` }
        )
        .setColor('#00FFFF')
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();
    
    return interaction.reply({ embeds: [embed] });
}

// Flip a coin
async function coinFlip(interaction) {
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    const emoji = result === 'Heads' ? '🪙' : '💿';
    
    const embed = new EmbedBuilder()
        .setTitle(`${emoji} Coin Flip`)
        .setDescription(`I flipped a coin for you`)
        .addFields({ name: 'Result', value: `**${result}**` })
        .setColor('#00FFFF')
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();
    
    return interaction.reply({ embeds: [embed] });
}

// Roll dice
async function rollDice(interaction) {
    const count = interaction.options.getInteger('count') || 1;
    
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
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();
    
    return interaction.reply({ embeds: [embed] });
}

// Magic 8-ball
async function eightBall(interaction) {
    const question = interaction.options.getString('question');
    
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
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();
    
    return interaction.reply({ embeds: [embed] });
} 