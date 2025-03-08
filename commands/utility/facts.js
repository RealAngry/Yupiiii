const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'facts',
    description: 'Get a random interesting fact',
    usage: 'facts',
    category: 'utility',
    aliases: ['fact', 'funfact', 'didyouknow'],
    cooldown: 5,
    permissions: [],
    async execute(message, args, client) {
        // List of interesting facts
        const facts = [
            "A day on Venus is longer than a year on Venus. Venus takes 243 Earth days to rotate once, but only 225 Earth days to orbit the Sun.",
            "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly good to eat.",
            "The shortest war in history was between Britain and Zanzibar on August 27, 1896. Zanzibar surrendered after 38 minutes.",
            "The average person will spend six months of their life waiting for red lights to turn green.",
            "A group of flamingos is called a 'flamboyance'.",
            "Cows have best friends and get stressed when they are separated.",
            "The world's oldest known living tree is a Great Basin Bristlecone Pine that is over 5,000 years old.",
            "A bolt of lightning is five times hotter than the surface of the sun.",
            "The Hawaiian alphabet has only 12 letters: A, E, I, O, U, H, K, L, M, N, P, and W.",
            "Octopuses have three hearts, nine brains, and blue blood.",
            "The fingerprints of koalas are so similar to humans that they have on occasion been confused at crime scenes.",
            "The Eiffel Tower can be 15 cm taller during the summer due to thermal expansion of the iron.",
            "A day on Mercury lasts about 176 Earth days, while a year on Mercury takes only 88 Earth days.",
            "The Great Wall of China is not visible from space with the naked eye, contrary to popular belief.",
            "Bananas are berries, but strawberries are not.",
            "The average cloud weighs about 1.1 million pounds.",
            "There are more possible iterations of a game of chess than there are atoms in the observable universe.",
            "The Yupi bot was created to provide the best Discord experience with moderation, fun, and utility features.",
            "The Yupi Management Team is constantly working to improve the bot with new features and updates.",
            "Yupi's dashboard allows server admins to easily configure all bot settings without using commands.",
            "Yupi supports both regular commands and slash commands for maximum flexibility.",
            "The Yupi bot can handle moderation, fun activities, utility functions, and much more in your Discord server."
        ];

        // Choose a random fact
        const randomFact = facts[Math.floor(Math.random() * facts.length)];

        // Create embed
        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('🧠 Did You Know? 🧠')
            .setDescription(`**${randomFact}**`)
            .setFooter({ text: 'Brought to you by Yupi Management Team' })
            .setTimestamp();

        // Send the fact
        message.channel.send({ embeds: [embed] });
    }
}; 