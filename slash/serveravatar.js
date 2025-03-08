const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serveravatar')
        .setDescription('Display the server\'s avatar/icon'),
    
    async execute(interaction, client) {
        await interaction.deferReply();
        
        // Check if the server has an icon
        if (!interaction.guild.iconURL()) {
            return interaction.editReply('This server does not have an icon.');
        }
        
        // Get the server icon in different formats
        const iconPNG = interaction.guild.iconURL({ format: 'png', size: 4096 });
        const iconJPG = interaction.guild.iconURL({ format: 'jpg', size: 4096 });
        const iconWEBP = interaction.guild.iconURL({ format: 'webp', size: 4096 });
        const iconGIF = interaction.guild.iconURL({ format: 'gif', size: 4096, dynamic: true });
        
        // Create an embed with the server icon
        const embed = new EmbedBuilder()
            .setTitle(`${interaction.guild.name}'s Server Icon`)
            .setColor('#00FFFF')
            .setImage(iconPNG || iconJPG || iconWEBP || iconGIF)
            .setDescription('Click on the links below to download the icon:')
            .addFields(
                { name: 'PNG', value: `[Download](${iconPNG})`, inline: true },
                { name: 'JPG', value: `[Download](${iconJPG})`, inline: true },
                { name: 'WEBP', value: `[Download](${iconWEBP})`, inline: true },
                { name: 'GIF', value: interaction.guild.icon && interaction.guild.icon.startsWith('a_') ? `[Download](${iconGIF})` : 'Not available', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
        
        // Send the embed
        interaction.editReply({ embeds: [embed] });
    }
}; 