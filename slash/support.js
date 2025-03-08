const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('support')
        .setDescription('Get an invite link to the official Dash Bot support server'),
    
    async execute(interaction, client) {
        const supportLink = 'https://discord.gg/NGuuJRytZg';
        
        const embed = new EmbedBuilder()
            .setTitle('Dash Bot Support Server')
            .setDescription(`Need help with Dash Bot? Join our official support server for assistance, feature requests, bug reports, and to connect with other users!`)
            .setColor('#00FFFF')
            .addFields(
                { name: 'Support Server Link', value: `[Click here to join](${supportLink})` },
                { name: 'What you will find there', value: '• Direct support from the bot developers\n• Command tutorials and guides\n• Announcements about new features\n• Community suggestions and feedback\n• Report bugs and issues' }
            )
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'Thank you for using Dash Bot!' })
            .setTimestamp();
            
        await interaction.reply({ embeds: [embed] });
    }
}; 