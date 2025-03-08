const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Display a user\'s custom profile with badges')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to view the profile of')
                .setRequired(false)),
    
    async execute(interaction, client) {
        // Initialize profiles collection if it doesn't exist
        if (!client.profiles) {
            client.profiles = new Map();
        }
        
        // Initialize badges collection if it doesn't exist
        if (!client.badges) {
            client.badges = new Map([
                ['owner', { name: 'Bot Owner', emoji: '👑', description: 'The owner of the bot' }],
                ['developer', { name: 'Bot Developer', emoji: '⚙️', description: 'A developer of the bot' }],
                ['admin', { name: 'Bot Admin', emoji: '🛡️', description: 'An administrator of the bot' }],
                ['moderator', { name: 'Bot Moderator', emoji: '🔨', description: 'A moderator of the bot' }],
                ['supporter', { name: 'Bot Supporter', emoji: '💎', description: 'A supporter of the bot' }],
                ['partner', { name: 'Bot Partner', emoji: '🤝', description: 'A partner of the bot' }],
                ['bug_hunter', { name: 'Bug Hunter', emoji: '🐛', description: 'Found and reported bugs in the bot' }],
                ['early_supporter', { name: 'Early Supporter', emoji: '🌟', description: 'Supported the bot early in its development' }],
                ['premium', { name: 'Premium User', emoji: '💰', description: 'A premium user of the bot' }]
            ]);
        }
        
        // Get target user (option or interaction user)
        const user = interaction.options.getUser('user') || interaction.user;
        
        // Get user profile or create a new one
        if (!client.profiles.has(user.id)) {
            // Create default profile
            const defaultProfile = {
                bio: 'No bio set.',
                badges: [],
                customTitle: '',
                xp: 0,
                level: 0,
                joinedAt: Date.now(),
                lastUpdated: Date.now()
            };
            
            // Set default badges based on user role
            const isMainOwner = user.id === (process.env.OWNER_ID || client.config?.ownerId);
            const isExtraOwner = client.extraOwners && client.extraOwners.has(user.id);
            
            if (isMainOwner) {
                defaultProfile.badges.push('owner');
            } else if (isExtraOwner) {
                defaultProfile.badges.push('admin');
            }
            
            client.profiles.set(user.id, defaultProfile);
        }
        
        const profile = client.profiles.get(user.id);
        
        // Get member if in guild
        const member = interaction.guild.members.cache.get(user.id);
        
        // Create embed
        const embed = new EmbedBuilder()
            .setTitle(profile.customTitle || `${user.tag}'s Profile`)
            .setColor(member ? member.displayHexColor : '#00FFFF')
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: 'User ID', value: user.id, inline: true },
                { name: 'Created Account', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .setTimestamp();
        
        // Add member-specific info if available
        if (member) {
            embed.addFields(
                { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: 'Highest Role', value: `${member.roles.highest}`, inline: true }
            );
        }
        
        // Add bio
        embed.addFields({ name: 'Bio', value: profile.bio || 'No bio set.' });
        
        // Add badges if any
        if (profile.badges && profile.badges.length > 0) {
            const badgesList = profile.badges.map(badgeId => {
                const badge = client.badges.get(badgeId);
                return badge ? `${badge.emoji} **${badge.name}** - ${badge.description}` : null;
            }).filter(badge => badge !== null);
            
            if (badgesList.length > 0) {
                embed.addFields({ name: 'Badges', value: badgesList.join('\n') });
            }
        }
        
        // Add XP and level if enabled
        if (profile.xp !== undefined && profile.level !== undefined) {
            embed.addFields({ 
                name: 'Experience', 
                value: `Level: ${profile.level}\nXP: ${profile.xp}`, 
                inline: true 
            });
        }
        
        await interaction.reply({ embeds: [embed] });
    }
}; 