const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'antinuke',
    description: 'Configure anti-nuke protection for the server',
    usage: 'antinuke <option> <value>',
    category: 'automod',
    aliases: ['antiraidplus', 'serversecurity'],
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 10,
    examples: [
        'antinuke enable',
        'antinuke disable',
        'antinuke level low',
        'antinuke level medium',
        'antinuke level high',
        'antinuke level extreme',
        'antinuke status',
        'antinuke whitelist add @user',
        'antinuke whitelist remove @user',
        'antinuke whitelist list'
    ],
    async execute(client, message, args) {
        // Check if user has permission
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('You need Administrator permission to use this command.');
        }

        // Initialize settings if they don't exist
        if (!client.settings.has(message.guild.id)) {
            client.settings.set(message.guild.id, {});
        }

        const guildSettings = client.settings.get(message.guild.id);
        
        // Initialize anti-nuke settings if they don't exist
        if (!guildSettings.antinuke) {
            guildSettings.antinuke = {
                enabled: false,
                level: 'medium',     // low, medium, high, extreme
                whitelistedUsers: [],
                lastUpdated: Date.now()
            };
            client.settings.set(message.guild.id, guildSettings);
        }

        // If no args, show current settings
        if (!args.length) {
            return showStatus(client, message);
        }

        const option = args[0].toLowerCase();

        switch (option) {
            case 'enable':
                guildSettings.antinuke.enabled = true;
                guildSettings.antinuke.lastUpdated = Date.now();
                client.settings.set(message.guild.id, guildSettings);
                return message.reply('Anti-nuke protection has been enabled.');

            case 'disable':
                guildSettings.antinuke.enabled = false;
                guildSettings.antinuke.lastUpdated = Date.now();
                client.settings.set(message.guild.id, guildSettings);
                return message.reply('Anti-nuke protection has been disabled.');

            case 'level':
                if (!args[1] || !['low', 'medium', 'high', 'extreme'].includes(args[1].toLowerCase())) {
                    return message.reply('Please provide a valid security level: low, medium, high, or extreme.');
                }
                guildSettings.antinuke.level = args[1].toLowerCase();
                guildSettings.antinuke.lastUpdated = Date.now();
                client.settings.set(message.guild.id, guildSettings);
                return message.reply(`Anti-nuke security level set to ${args[1].toLowerCase()}.`);

            case 'status':
                return showStatus(client, message);

            case 'whitelist':
                if (!args[1]) {
                    return message.reply('Please specify a whitelist action: add, remove, or list.');
                }

                const whitelistAction = args[1].toLowerCase();

                switch (whitelistAction) {
                    case 'add':
                        if (!message.mentions.users.size) {
                            return message.reply('Please mention a user to whitelist.');
                        }
                        
                        const userToAdd = message.mentions.users.first();
                        
                        if (guildSettings.antinuke.whitelistedUsers.includes(userToAdd.id)) {
                            return message.reply(`${userToAdd.tag} is already whitelisted.`);
                        }
                        
                        guildSettings.antinuke.whitelistedUsers.push(userToAdd.id);
                        guildSettings.antinuke.lastUpdated = Date.now();
                        client.settings.set(message.guild.id, guildSettings);
                        return message.reply(`Added ${userToAdd.tag} to the anti-nuke whitelist.`);

                    case 'remove':
                        if (!message.mentions.users.size) {
                            return message.reply('Please mention a user to remove from the whitelist.');
                        }
                        
                        const userToRemove = message.mentions.users.first();
                        
                        if (!guildSettings.antinuke.whitelistedUsers.includes(userToRemove.id)) {
                            return message.reply(`${userToRemove.tag} is not whitelisted.`);
                        }
                        
                        guildSettings.antinuke.whitelistedUsers = guildSettings.antinuke.whitelistedUsers.filter(id => id !== userToRemove.id);
                        guildSettings.antinuke.lastUpdated = Date.now();
                        client.settings.set(message.guild.id, guildSettings);
                        return message.reply(`Removed ${userToRemove.tag} from the anti-nuke whitelist.`);

                    case 'list':
                        return showWhitelist(client, message);

                    default:
                        return message.reply('Invalid whitelist action. Use `add`, `remove`, or `list`.');
                }

            default:
                return message.reply('Invalid option. Use `enable`, `disable`, `level`, `status`, or `whitelist`.');
        }
    }
};

// Function to show current anti-nuke settings
async function showStatus(client, message) {
    const guildSettings = client.settings.get(message.guild.id);
    const antinuke = guildSettings.antinuke || {
        enabled: false,
        level: 'medium',
        whitelistedUsers: [],
        lastUpdated: Date.now()
    };

    const securityLevelInfo = {
        low: 'Monitors suspicious activities but only takes action against the most obvious nuke attempts.',
        medium: 'Provides balanced protection against common nuke attacks while minimizing false positives.',
        high: 'Aggressively monitors and prevents potential nuke attacks with stricter thresholds.',
        extreme: 'Maximum protection with zero tolerance for suspicious activities. May have false positives.'
    };

    const securityLevelActions = {
        low: '• Ban users who delete multiple channels\n• Ban users who mass-ban members',
        medium: '• All Low level protections\n• Ban users who delete roles\n• Ban users who create suspicious webhooks',
        high: '• All Medium level protections\n• Ban users who mass-create channels or roles\n• Prevent rapid permission changes',
        extreme: '• All High level protections\n• Only trusted users can perform administrative actions\n• Automatic lockdown during suspicious activity'
    };

    const embed = new EmbedBuilder()
        .setTitle('Anti-Nuke Configuration')
        .setDescription(`Current anti-nuke settings for ${message.guild.name}`)
        .addFields(
            { name: 'Status', value: antinuke.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
            { name: 'Security Level', value: antinuke.level.charAt(0).toUpperCase() + antinuke.level.slice(1), inline: true },
            { name: 'Whitelisted Users', value: antinuke.whitelistedUsers.length > 0 
                ? `${antinuke.whitelistedUsers.length} users` 
                : 'None', inline: true },
            { name: 'Security Level Description', value: securityLevelInfo[antinuke.level] },
            { name: 'Protection Actions', value: securityLevelActions[antinuke.level] },
            { name: 'Last Updated', value: new Date(antinuke.lastUpdated).toLocaleString() }
        )
        .setColor(antinuke.enabled ? '#00FF00' : '#FF0000')
        .setFooter({ text: 'Use antinuke <option> <value> to change settings' })
        .setTimestamp();

    return message.reply({ embeds: [embed] });
}

// Function to show whitelist
async function showWhitelist(client, message) {
    const guildSettings = client.settings.get(message.guild.id);
    const antinuke = guildSettings.antinuke || {
        enabled: false,
        level: 'medium',
        whitelistedUsers: [],
        lastUpdated: Date.now()
    };

    const embed = new EmbedBuilder()
        .setTitle('Anti-Nuke Whitelist')
        .setDescription(`Users whitelisted from anti-nuke protection in ${message.guild.name}`)
        .setColor('#00FFFF')
        .setTimestamp();

    if (antinuke.whitelistedUsers.length > 0) {
        let whitelistText = '';
        
        for (const userId of antinuke.whitelistedUsers) {
            try {
                const user = await client.users.fetch(userId);
                whitelistText += `• ${user.tag} (${userId})\n`;
            } catch (error) {
                whitelistText += `• Unknown User (${userId})\n`;
            }
        }
        
        embed.addFields({ name: 'Whitelisted Users', value: whitelistText });
    } else {
        embed.setDescription('No users are currently whitelisted from anti-nuke protection.');
    }

    return message.reply({ embeds: [embed] });
} 