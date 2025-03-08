const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profilemanage')
        .setDescription('Manage user profiles and badges')
        .addSubcommandGroup(group =>
            group
                .setName('set')
                .setDescription('Set profile information')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('bio')
                        .setDescription('Set a user\'s bio')
                        .addUserOption(option =>
                            option.setName('user')
                                .setDescription('The user to set the bio for')
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName('bio')
                                .setDescription('The new bio text')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('title')
                        .setDescription('Set a user\'s custom title')
                        .addUserOption(option =>
                            option.setName('user')
                                .setDescription('The user to set the title for')
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName('title')
                                .setDescription('The new custom title')
                                .setRequired(true))))
        .addSubcommandGroup(group =>
            group
                .setName('badge')
                .setDescription('Manage user badges')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('add')
                        .setDescription('Add a badge to a user')
                        .addUserOption(option =>
                            option.setName('user')
                                .setDescription('The user to add the badge to')
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName('badge')
                                .setDescription('The badge ID to add')
                                .setRequired(true)
                                .addChoices(
                                    { name: 'Bot Owner', value: 'owner' },
                                    { name: 'Bot Developer', value: 'developer' },
                                    { name: 'Bot Admin', value: 'admin' },
                                    { name: 'Bot Moderator', value: 'moderator' },
                                    { name: 'Bot Supporter', value: 'supporter' },
                                    { name: 'Bot Partner', value: 'partner' },
                                    { name: 'Bug Hunter', value: 'bug_hunter' },
                                    { name: 'Early Supporter', value: 'early_supporter' },
                                    { name: 'Premium User', value: 'premium' }
                                )))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('remove')
                        .setDescription('Remove a badge from a user')
                        .addUserOption(option =>
                            option.setName('user')
                                .setDescription('The user to remove the badge from')
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName('badge')
                                .setDescription('The badge ID to remove')
                                .setRequired(true)
                                .addChoices(
                                    { name: 'Bot Owner', value: 'owner' },
                                    { name: 'Bot Developer', value: 'developer' },
                                    { name: 'Bot Admin', value: 'admin' },
                                    { name: 'Bot Moderator', value: 'moderator' },
                                    { name: 'Bot Supporter', value: 'supporter' },
                                    { name: 'Bot Partner', value: 'partner' },
                                    { name: 'Bug Hunter', value: 'bug_hunter' },
                                    { name: 'Early Supporter', value: 'early_supporter' },
                                    { name: 'Premium User', value: 'premium' }
                                ))))
        .addSubcommandGroup(group =>
            group
                .setName('list')
                .setDescription('List badges')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('all')
                        .setDescription('List all available badges'))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('user')
                        .setDescription('List a user\'s badges')
                        .addUserOption(option =>
                            option.setName('user')
                                .setDescription('The user to list badges for')
                                .setRequired(true)))),
    
    async execute(interaction, client) {
        try {
            // Check if user is bot owner or extra owner
            const isOwner = interaction.user.id === (process.env.OWNER_ID || client.config?.ownerId);
            const isExtraOwner = client.extraOwners && client.extraOwners.has(interaction.user.id);
            
            if (!isOwner && !isExtraOwner) {
                return interaction.reply({ 
                    content: 'Only the bot owner can use this command.',
                    ephemeral: true 
                });
            }
            
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
            
            const group = interaction.options.getSubcommandGroup();
            const subCommand = interaction.options.getSubcommand();
            
            // Handle list commands
            if (group === 'list') {
                // List all available badges
                if (subCommand === 'all') {
                    const badgesList = Array.from(client.badges.entries()).map(([id, badge]) => {
                        return `${badge.emoji} **${badge.name}** (\`${id}\`) - ${badge.description}`;
                    });
                    
                    const embed = new EmbedBuilder()
                        .setTitle('Available Badges')
                        .setDescription(badgesList.join('\n'))
                        .setColor('#00FFFF')
                        .setFooter({ text: `Requested by ${interaction.user.tag}` })
                        .setTimestamp();
                    
                    return interaction.reply({ embeds: [embed] });
                }
                
                // List user badges
                if (subCommand === 'user') {
                    const user = interaction.options.getUser('user');
                    
                    // Get user profile
                    if (!client.profiles.has(user.id)) {
                        return interaction.reply({ 
                            content: `${user.tag} doesn't have a profile yet.`,
                            ephemeral: true 
                        });
                    }
                    
                    const profile = client.profiles.get(user.id);
                    
                    if (!profile.badges || profile.badges.length === 0) {
                        return interaction.reply({ 
                            content: `${user.tag} doesn't have any badges.`,
                            ephemeral: true 
                        });
                    }
                    
                    const badgesList = profile.badges.map(badgeId => {
                        const badge = client.badges.get(badgeId);
                        return badge ? `${badge.emoji} **${badge.name}** (\`${badgeId}\`) - ${badge.description}` : null;
                    }).filter(badge => badge !== null);
                    
                    const embed = new EmbedBuilder()
                        .setTitle(`${user.tag}'s Badges`)
                        .setDescription(badgesList.join('\n'))
                        .setColor('#00FFFF')
                        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                        .setFooter({ text: `Requested by ${interaction.user.tag}` })
                        .setTimestamp();
                    
                    return interaction.reply({ embeds: [embed] });
                }
            }
            
            // Handle set commands
            if (group === 'set') {
                const user = interaction.options.getUser('user');
                
                // Get or create user profile
                if (!client.profiles.has(user.id)) {
                    client.profiles.set(user.id, {
                        bio: 'No bio set.',
                        badges: [],
                        customTitle: '',
                        xp: 0,
                        level: 0,
                        joinedAt: Date.now(),
                        lastUpdated: Date.now()
                    });
                }
                
                const profile = client.profiles.get(user.id);
                
                if (subCommand === 'bio') {
                    const bio = interaction.options.getString('bio');
                    
                    profile.bio = bio;
                    profile.lastUpdated = Date.now();
                    client.profiles.set(user.id, profile);
                    
                    return interaction.reply({ 
                        content: `Updated ${user.tag}'s bio.`,
                        ephemeral: true 
                    });
                }
                
                if (subCommand === 'title') {
                    const title = interaction.options.getString('title');
                    
                    profile.customTitle = title;
                    profile.lastUpdated = Date.now();
                    client.profiles.set(user.id, profile);
                    
                    return interaction.reply({ 
                        content: `Updated ${user.tag}'s custom title.`,
                        ephemeral: true 
                    });
                }
            }
            
            // Handle badge commands
            if (group === 'badge') {
                const user = interaction.options.getUser('user');
                const badgeId = interaction.options.getString('badge');
                
                // Get or create user profile
                if (!client.profiles.has(user.id)) {
                    client.profiles.set(user.id, {
                        bio: 'No bio set.',
                        badges: [],
                        customTitle: '',
                        xp: 0,
                        level: 0,
                        joinedAt: Date.now(),
                        lastUpdated: Date.now()
                    });
                }
                
                const profile = client.profiles.get(user.id);
                
                if (subCommand === 'add') {
                    if (profile.badges.includes(badgeId)) {
                        return interaction.reply({ 
                            content: `${user.tag} already has the ${client.badges.get(badgeId).name} badge.`,
                            ephemeral: true 
                        });
                    }
                    
                    profile.badges.push(badgeId);
                    profile.lastUpdated = Date.now();
                    client.profiles.set(user.id, profile);
                    
                    const badge = client.badges.get(badgeId);
                    
                    const embed = new EmbedBuilder()
                        .setTitle('Badge Added')
                        .setDescription(`Added the ${badge.emoji} **${badge.name}** badge to ${user.tag}.`)
                        .setColor('#00FF00')
                        .setFooter({ text: `Added by ${interaction.user.tag}` })
                        .setTimestamp();
                    
                    return interaction.reply({ embeds: [embed] });
                }
                
                if (subCommand === 'remove') {
                    if (!profile.badges.includes(badgeId)) {
                        return interaction.reply({ 
                            content: `${user.tag} doesn't have the ${client.badges.get(badgeId).name} badge.`,
                            ephemeral: true 
                        });
                    }
                    
                    profile.badges = profile.badges.filter(b => b !== badgeId);
                    profile.lastUpdated = Date.now();
                    client.profiles.set(user.id, profile);
                    
                    const badge = client.badges.get(badgeId);
                    
                    const embed = new EmbedBuilder()
                        .setTitle('Badge Removed')
                        .setDescription(`Removed the ${badge.emoji} **${badge.name}** badge from ${user.tag}.`)
                        .setColor('#FF0000')
                        .setFooter({ text: `Removed by ${interaction.user.tag}` })
                        .setTimestamp();
                    
                    return interaction.reply({ embeds: [embed] });
                }
            }
        } catch (error) {
            console.error('Error executing profilemanage command:', error);
            return interaction.reply({ 
                content: 'An error occurred while executing this command. Please try again later.',
                ephemeral: true 
            });
        }
    }
}; 