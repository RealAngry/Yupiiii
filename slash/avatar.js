const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Display a user\'s avatar')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get the avatar of')
                .setRequired(false)),
    
    async execute(interaction, client) {
        // Get target user (option or interaction user)
        const user = interaction.options.getUser('user') || interaction.user;
        
        // Get avatar URLs
        const avatarURL = user.displayAvatarURL({ size: 4096, dynamic: true });
        
        // Create embed
        const embed = new EmbedBuilder()
            .setTitle(`${user.tag}'s Avatar`)
            .setColor('#00FFFF')
            .setImage(avatarURL)
            .setDescription(`[PNG](${user.displayAvatarURL({ size: 4096, format: 'png' })}) | [JPG](${user.displayAvatarURL({ size: 4096, format: 'jpg' })}) | [WEBP](${user.displayAvatarURL({ size: 4096, format: 'webp' })})${user.avatar && user.avatar.startsWith('a_') ? ` | [GIF](${user.displayAvatarURL({ size: 4096, format: 'gif' })})` : ''}`)
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .setTimestamp();
        
        // Get member if in guild
        const member = interaction.guild.members.cache.get(user.id);
        
        // If user has a server-specific avatar, add it to the embed
        if (member && member.displayAvatarURL({ dynamic: true }) !== avatarURL) {
            const serverAvatarURL = member.displayAvatarURL({ size: 4096, dynamic: true });
            
            embed.addFields({
                name: 'Server-Specific Avatar',
                value: `[PNG](${member.displayAvatarURL({ size: 4096, format: 'png' })}) | [JPG](${member.displayAvatarURL({ size: 4096, format: 'jpg' })}) | [WEBP](${member.displayAvatarURL({ size: 4096, format: 'webp' })})${member.avatar && member.avatar.startsWith('a_') ? ` | [GIF](${member.displayAvatarURL({ size: 4096, format: 'gif' })})` : ''}`
            });
            
            // Set server avatar as the main image if available
            embed.setImage(serverAvatarURL);
            embed.setThumbnail(avatarURL);
            embed.setTitle(`${user.tag}'s Server Avatar`);
        }
        
        await interaction.reply({ embeds: [embed] });
    }
}; 