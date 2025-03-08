const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'avatar',
    description: 'Display a user\'s avatar',
    usage: 'avatar [user]',
    category: 'utility',
    aliases: ['av', 'pfp', 'icon'],
    permissions: PermissionFlagsBits.SendMessages,
    cooldown: 5,
    examples: [
        'avatar',
        'avatar @user',
        'avatar 123456789012345678'
    ],
    execute(client, message, args) {
        // Get target user (mentioned, ID, or message author)
        let user = message.mentions.users.first();
        
        if (!user && args[0]) {
            // Try to find by ID
            user = client.users.cache.get(args[0]);
        }
        
        if (!user && args[0]) {
            // Try to find by username
            const username = args.join(' ').toLowerCase();
            user = client.users.cache.find(u => 
                u.username.toLowerCase() === username || 
                u.username.toLowerCase().includes(username) ||
                (u.tag && u.tag.toLowerCase().includes(username))
            );
        }
        
        // Default to message author if no user found
        if (!user) {
            user = message.author;
        }
        
        // Get avatar URLs
        const avatarURL = user.displayAvatarURL({ size: 4096, dynamic: true });
        
        // Create embed
        const embed = new EmbedBuilder()
            .setTitle(`${user.tag}'s Avatar`)
            .setColor('#00FFFF')
            .setImage(avatarURL)
            .setDescription(`[PNG](${user.displayAvatarURL({ size: 4096, format: 'png' })}) | [JPG](${user.displayAvatarURL({ size: 4096, format: 'jpg' })}) | [WEBP](${user.displayAvatarURL({ size: 4096, format: 'webp' })})${user.avatar && user.avatar.startsWith('a_') ? ` | [GIF](${user.displayAvatarURL({ size: 4096, format: 'gif' })})` : ''}`)
            .setFooter({ text: `Requested by ${message.author.tag}` })
            .setTimestamp();
        
        // Get member if in guild
        const member = message.guild.members.cache.get(user.id);
        
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
        
        message.reply({ embeds: [embed] });
    }
}; 