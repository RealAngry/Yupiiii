const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Displays detailed information about the server'),
    
    async execute(interaction, client) {
        const guild = interaction.guild;
        
        // Get server creation date
        const createdAt = guild.createdAt;
        const createdAtFormatted = `<t:${Math.floor(createdAt.getTime() / 1000)}:F>`;
        const createdAtRelative = `<t:${Math.floor(createdAt.getTime() / 1000)}:R>`;
        
        // Get member counts
        const totalMembers = guild.memberCount;
        const botCount = guild.members.cache.filter(member => member.user.bot).size;
        const humanCount = totalMembers - botCount;
        
        // Get channel counts
        const channels = guild.channels.cache;
        const textChannels = channels.filter(c => c.type === 0).size;
        const voiceChannels = channels.filter(c => c.type === 2).size;
        const categoryChannels = channels.filter(c => c.type === 4).size;
        const forumChannels = channels.filter(c => c.type === 15).size;
        const announcementChannels = channels.filter(c => c.type === 5).size;
        
        // Get role count (excluding @everyone)
        const roleCount = guild.roles.cache.size - 1;
        
        // Get emoji counts
        const emojiCount = guild.emojis.cache.size;
        const animatedEmojiCount = guild.emojis.cache.filter(emoji => emoji.animated).size;
        const staticEmojiCount = emojiCount - animatedEmojiCount;
        
        // Get boost information
        const boostLevel = guild.premiumTier;
        const boostCount = guild.premiumSubscriptionCount;
        
        // Get server features
        const features = guild.features.length > 0 
            ? guild.features.map(feature => `• ${feature.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}`).join('\n')
            : 'None';
        
        // Create embed
        const embed = new EmbedBuilder()
            .setTitle(`${guild.name} Server Information`)
            .setColor('#5865F2')
            .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
            .addFields(
                { name: '📋 General Information', value: [
                    `**ID:** ${guild.id}`,
                    `**Owner:** <@${guild.ownerId}>`,
                    `**Created:** ${createdAtFormatted}`,
                    `**Created:** ${createdAtRelative}`,
                    `**Verification Level:** ${getVerificationLevel(guild.verificationLevel)}`,
                    `**Explicit Content Filter:** ${getContentFilterLevel(guild.explicitContentFilter)}`
                ].join('\n'), inline: false },
                
                { name: '👥 Members', value: [
                    `**Total:** ${totalMembers}`,
                    `**Humans:** ${humanCount}`,
                    `**Bots:** ${botCount}`
                ].join('\n'), inline: true },
                
                { name: '💬 Channels', value: [
                    `**Total:** ${channels.size}`,
                    `**Text:** ${textChannels}`,
                    `**Voice:** ${voiceChannels}`,
                    `**Categories:** ${categoryChannels}`,
                    `**Forums:** ${forumChannels}`,
                    `**Announcements:** ${announcementChannels}`
                ].join('\n'), inline: true },
                
                { name: '🏷️ Other', value: [
                    `**Roles:** ${roleCount}`,
                    `**Emojis:** ${emojiCount} (${staticEmojiCount} static, ${animatedEmojiCount} animated)`,
                    `**Boost Level:** ${boostLevel}`,
                    `**Boosts:** ${boostCount}`
                ].join('\n'), inline: true }
            );
        
        // Add server features if there are any
        if (guild.features.length > 0) {
            embed.addFields({ name: '✨ Server Features', value: features, inline: false });
        }
        
        // Add server banner if there is one
        if (guild.banner) {
            embed.setImage(guild.bannerURL({ size: 1024 }));
        }
        
        // Add server description if there is one
        if (guild.description) {
            embed.setDescription(guild.description);
        }
        
        // Send embed
        await interaction.reply({ embeds: [embed] });
    }
};

// Helper functions
function getVerificationLevel(level) {
    const levels = {
        0: 'None',
        1: 'Low',
        2: 'Medium',
        3: 'High',
        4: 'Very High'
    };
    return levels[level] || 'Unknown';
}

function getContentFilterLevel(level) {
    const levels = {
        0: 'Disabled',
        1: 'Members Without Roles',
        2: 'All Members'
    };
    return levels[level] || 'Unknown';
}