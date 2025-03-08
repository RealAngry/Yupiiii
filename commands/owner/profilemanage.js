const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'profilemanage',
    description: 'Manage user profiles and badges',
    usage: 'profilemanage [set/add/remove/list] [user] [option] [value]',
    category: 'owner',
    aliases: ['pmanage', 'managep'],
    ownerOnly: true,
    cooldown: 5,
    examples: [
        'profilemanage set @user bio This is a new bio',
        'profilemanage set @user title Custom Title',
        'profilemanage add @user badge developer',
        'profilemanage remove @user badge moderator',
        'profilemanage list badges',
        'profilemanage list @user badges'
    ],
    execute(client, message, args) {
        // Check if user is bot owner or extra owner
        const isOwner = message.author.id === (process.env.OWNER_ID || client.config?.ownerId);
        const isExtraOwner = client.extraOwners && client.extraOwners.has(message.author.id);
        
        if (!isOwner && !isExtraOwner) {
            return message.reply('Only the bot owner can use this command.');
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
        
        // Check for required arguments
        if (!args[0]) {
            const embed = new EmbedBuilder()
                .setTitle('Profile Management Help')
                .setDescription('Manage user profiles and badges')
                .addFields(
                    { name: 'Set Profile Information', value: `\`${client.prefix}profilemanage set @user [bio/title] [value]\`` },
                    { name: 'Add Badge', value: `\`${client.prefix}profilemanage add @user badge [badge_id]\`` },
                    { name: 'Remove Badge', value: `\`${client.prefix}profilemanage remove @user badge [badge_id]\`` },
                    { name: 'List Badges', value: `\`${client.prefix}profilemanage list badges\`` },
                    { name: 'List User Badges', value: `\`${client.prefix}profilemanage list @user badges\`` }
                )
                .setColor('#800080')
                .setFooter({ text: 'Profile Management System' });
            
            return message.reply({ embeds: [embed] });
        }
        
        const subCommand = args[0].toLowerCase();
        
        // Handle list command
        if (subCommand === 'list') {
            // List all available badges
            if (args[1] && args[1].toLowerCase() === 'badges') {
                const badgesList = Array.from(client.badges.entries()).map(([id, badge]) => {
                    return `${badge.emoji} **${badge.name}** (\`${id}\`) - ${badge.description}`;
                });
                
                const embed = new EmbedBuilder()
                    .setTitle('Available Badges')
                    .setDescription(badgesList.join('\n'))
                    .setColor('#00FFFF')
                    .setFooter({ text: `Requested by ${message.author.tag}` })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            // List user badges
            const user = message.mentions.users.first();
            if (!user) {
                return message.reply('Please mention a user to list their badges.');
            }
            
            if (args[2] && args[2].toLowerCase() === 'badges') {
                // Get user profile
                if (!client.profiles.has(user.id)) {
                    return message.reply(`${user.tag} doesn't have a profile yet.`);
                }
                
                const profile = client.profiles.get(user.id);
                
                if (!profile.badges || profile.badges.length === 0) {
                    return message.reply(`${user.tag} doesn't have any badges.`);
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
                    .setFooter({ text: `Requested by ${message.author.tag}` })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            return message.reply(`Invalid list option. Use \`${client.prefix}profilemanage list badges\` or \`${client.prefix}profilemanage list @user badges\`.`);
        }
        
        // All other commands require a user
        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('Please mention a user to manage their profile.');
        }
        
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
        
        // Handle set command
        if (subCommand === 'set') {
            if (!args[2]) {
                return message.reply(`Please specify what to set. Usage: \`${client.prefix}profilemanage set @user [bio/title] [value]\``);
            }
            
            const option = args[2].toLowerCase();
            const value = args.slice(3).join(' ');
            
            if (!value) {
                return message.reply(`Please provide a value to set. Usage: \`${client.prefix}profilemanage set @user ${option} [value]\``);
            }
            
            switch (option) {
                case 'bio':
                    profile.bio = value;
                    profile.lastUpdated = Date.now();
                    client.profiles.set(user.id, profile);
                    
                    return message.reply(`Updated ${user.tag}'s bio.`);
                
                case 'title':
                    profile.customTitle = value;
                    profile.lastUpdated = Date.now();
                    client.profiles.set(user.id, profile);
                    
                    return message.reply(`Updated ${user.tag}'s custom title.`);
                
                default:
                    return message.reply(`Invalid option. You can set \`bio\` or \`title\`.`);
            }
        }
        
        // Handle add command
        if (subCommand === 'add') {
            if (!args[2] || args[2].toLowerCase() !== 'badge' || !args[3]) {
                return message.reply(`Please specify a badge to add. Usage: \`${client.prefix}profilemanage add @user badge [badge_id]\``);
            }
            
            const badgeId = args[3].toLowerCase();
            
            if (!client.badges.has(badgeId)) {
                return message.reply(`Invalid badge ID. Use \`${client.prefix}profilemanage list badges\` to see available badges.`);
            }
            
            if (profile.badges.includes(badgeId)) {
                return message.reply(`${user.tag} already has the ${client.badges.get(badgeId).name} badge.`);
            }
            
            profile.badges.push(badgeId);
            profile.lastUpdated = Date.now();
            client.profiles.set(user.id, profile);
            
            const badge = client.badges.get(badgeId);
            
            const embed = new EmbedBuilder()
                .setTitle('Badge Added')
                .setDescription(`Added the ${badge.emoji} **${badge.name}** badge to ${user.tag}.`)
                .setColor('#00FF00')
                .setFooter({ text: `Added by ${message.author.tag}` })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Handle remove command
        if (subCommand === 'remove') {
            if (!args[2] || args[2].toLowerCase() !== 'badge' || !args[3]) {
                return message.reply(`Please specify a badge to remove. Usage: \`${client.prefix}profilemanage remove @user badge [badge_id]\``);
            }
            
            const badgeId = args[3].toLowerCase();
            
            if (!profile.badges.includes(badgeId)) {
                return message.reply(`${user.tag} doesn't have the ${client.badges.has(badgeId) ? client.badges.get(badgeId).name : badgeId} badge.`);
            }
            
            profile.badges = profile.badges.filter(b => b !== badgeId);
            profile.lastUpdated = Date.now();
            client.profiles.set(user.id, profile);
            
            const badge = client.badges.get(badgeId);
            
            const embed = new EmbedBuilder()
                .setTitle('Badge Removed')
                .setDescription(`Removed the ${badge.emoji} **${badge.name}** badge from ${user.tag}.`)
                .setColor('#FF0000')
                .setFooter({ text: `Removed by ${message.author.tag}` })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        return message.reply(`Invalid subcommand. Use \`${client.prefix}profilemanage\` to see available options.`);
    }
}; 