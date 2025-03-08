const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('motivation')
        .setDescription('Get a motivational quote'),
    
    async execute(interaction) {
        // List of motivational quotes
        const quotes = [
            {
                text: "Success has no shortcuts, you have to create your own steps.",
                author: "Ratan Tata"
            },
            {
                text: "To gain something in life, you have to lose something.",
                author: "Amitabh Bachchan"
            },
            {
                text: "If you want to achieve your dreams, the most important thing is to get up and start working.",
                author: "Swami Vivekananda"
            },
            {
                text: "Until you believe in yourself, you cannot believe in anyone else.",
                author: "Mahatma Gandhi"
            },
            {
                text: "The secret of success is to start. The secret of success is to always try.",
                author: "Bhagat Singh"
            },
            {
                text: "Your limits begin where your belief ends.",
                author: "A.P.J. Abdul Kalam"
            },
            {
                text: "Never give up in life, no matter how adverse the circumstances may be.",
                author: "Dr. Sarvepalli Radhakrishnan"
            },
            {
                text: "Success means: recognizing your ability, doing your work, and achieving your goal.",
                author: "Dhirubhai Ambani"
            },
            {
                text: "When you want something with all your heart, the entire universe conspires to help you achieve it.",
                author: "Paulo Coelho"
            },
            {
                text: "Your time is limited, so don't waste it living someone else's life.",
                author: "Steve Jobs"
            },
            {
                text: "Dreams are not what you see in your sleep, dreams are those that don't let you sleep.",
                author: "Dr. A.P.J. Abdul Kalam"
            },
            {
                text: "It's never too late in life, whenever you start, that's the right time.",
                author: "Yupi Management Team"
            },
            {
                text: "Every day is a new beginning, give yourself another chance.",
                author: "Yupi Management Team"
            },
            {
                text: "The road to success is always under construction.",
                author: "Yupi Management Team"
            },
            {
                text: "Your thoughts create your world, so think positive.",
                author: "Yupi Management Team"
            }
        ];

        // Choose a random quote
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

        // Create embed
        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setTitle('✨ Motivational Quote ✨')
            .setDescription(`**"${randomQuote.text}"**`)
            .setFooter({ text: `- ${randomQuote.author}` })
            .setTimestamp();

        // Send the quote
        await interaction.reply({ embeds: [embed] });
    }
}; 