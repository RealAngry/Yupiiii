const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'serveravatar',
    description: 'Display the server\'s avatar/icon',
    usage: 'serveravatar',
    category: 'utility',
    aliases: ['servericon', 'guildavatar', 'guildicon'],
    cooldown: 5,
    
    async execute(client, message, args) {
        // Check if the server has an icon
        if (!message.guild.iconURL()) {
            return message.reply('This server does not have a icon।');
        }
        
        // Get the server icon in different formats
        const iconPNG = message.guild.iconURL({ format: 'png', size: 4096 });
        const iconJPG = message.guild.iconURL({ format: 'jpg', size: 4096 });
        const iconWEBP = message.guild.iconURL({ format: 'webp', size: 4096 });
        const iconGIF = message.guild.iconURL({ format: 'gif', size: 4096, dynamic: true });
        
        // Create an embed with the server icon
        const embed = new EmbedBuilder()
            .setTitle(`${message.guild.name} Server Icon`)
            .setColor('#00FFFF')
            .setImage(iconPNG || iconJPG || iconWEBP || iconGIF)
            .setDescription('To download the icon, click on the links below:')
            .addFields(
                { name: 'PNG', value: `[Download](${iconPNG})`, inline: true },
                { name: 'JPG', value: `[Download](${iconJPG})`, inline: true },
                { name: 'WEBP', value: `[Download](${iconWEBP})`, inline: true },
                { name: 'GIF', value: message.guild.icon && message.guild.icon.startsWith('a_') ? `[Download](${iconGIF})` : 'Not available', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `${message.author.tag} Requested`, iconURL: message.author.displayAvatarURL() });
        
        // Send the embed
        message.reply({ embeds: [embed] });
    }
}; 