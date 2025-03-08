const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create a poll with up to 5 options')
        .addStringOption(option => 
            option.setName('question')
                .setDescription('The poll question')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('option1')
                .setDescription('First option')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('option2')
                .setDescription('Second option')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('option3')
                .setDescription('Third option')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('option4')
                .setDescription('Fourth option')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('option5')
                .setDescription('Fifth option')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    
    async execute(interaction, client) {
        const question = interaction.options.getString('question');
        
        // Collect all provided options
        const options = [];
        for (let i = 1; i <= 5; i++) {
            const option = interaction.options.getString(`option${i}`);
            if (option) options.push(option);
        }
        
        // Emoji numbers for reactions
        const emojiNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
        
        // Create the poll embed
        const embed = new EmbedBuilder()
            .setTitle('📊 ' + question)
            .setDescription(options.map((option, index) => `${emojiNumbers[index]} ${option}`).join('\n\n'))
            .setColor('#00FFFF')
            .setFooter({ text: `Poll created by ${interaction.user.tag}` })
            .setTimestamp();
        
        // Send the poll embed
        await interaction.reply({ embeds: [embed] });
        
        // Get the message to add reactions
        const message = await interaction.fetchReply();
        
        // Add reactions for each option
        for (let i = 0; i < options.length; i++) {
            await message.react(emojiNumbers[i]);
        }
    }
}; 