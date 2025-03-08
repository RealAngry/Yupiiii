const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'antispamconfig',
    description: 'Configure the anti-spam filter settings',
    usage: 'antispamconfig <option> <value>',
    category: 'automod',
    aliases: ['spamconfig', 'configspam'],
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 10,
    examples: [
        'antispamconfig enable',
        'antispamconfig disable',
        'antispamconfig threshold 5',
        'antispamconfig interval 3000',
        'antispamconfig action warn',
        'antispamconfig action mute',
        'antispamconfig action kick',
        'antispamconfig action ban',
        'antispamconfig status'
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
        
        // Initialize anti-spam settings if they don't exist
        if (!guildSettings.antispam) {
            guildSettings.antispam = {
                enabled: false,
                threshold: 5,      // Number of messages
                interval: 3000,    // Time in milliseconds (3 seconds)
                action: 'warn'     // warn, mute, kick, ban
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
                guildSettings.antispam.enabled = true;
                client.settings.set(message.guild.id, guildSettings);
                return message.reply('Anti-spam filter has been enabled.');

            case 'disable':
                guildSettings.antispam.enabled = false;
                client.settings.set(message.guild.id, guildSettings);
                return message.reply('Anti-spam filter has been disabled.');

            case 'threshold':
                if (!args[1] || isNaN(args[1]) || parseInt(args[1]) < 1) {
                    return message.reply('Please provide a valid threshold number (minimum 1).');
                }
                guildSettings.antispam.threshold = parseInt(args[1]);
                client.settings.set(message.guild.id, guildSettings);
                return message.reply(`Anti-spam threshold set to ${args[1]} messages.`);

            case 'interval':
                if (!args[1] || isNaN(args[1]) || parseInt(args[1]) < 1000) {
                    return message.reply('Please provide a valid interval in milliseconds (minimum 1000ms).');
                }
                guildSettings.antispam.interval = parseInt(args[1]);
                client.settings.set(message.guild.id, guildSettings);
                return message.reply(`Anti-spam interval set to ${args[1]}ms (${args[1]/1000} seconds).`);

            case 'action':
                if (!args[1] || !['warn', 'mute', 'kick', 'ban'].includes(args[1].toLowerCase())) {
                    return message.reply('Please provide a valid action: warn, mute, kick, or ban.');
                }
                guildSettings.antispam.action = args[1].toLowerCase();
                client.settings.set(message.guild.id, guildSettings);
                return message.reply(`Anti-spam action set to ${args[1].toLowerCase()}.`);

            case 'status':
                return showStatus(client, message);

            default:
                return message.reply('Invalid option. Use `enable`, `disable`, `threshold`, `interval`, `action`, or `status`.');
        }
    }
};

// Function to show current anti-spam settings
async function showStatus(client, message) {
    const guildSettings = client.settings.get(message.guild.id);
    const antispam = guildSettings.antispam || {
        enabled: false,
        threshold: 5,
        interval: 3000,
        action: 'warn'
    };

    const embed = new EmbedBuilder()
        .setTitle('Anti-Spam Configuration')
        .setDescription(`Current anti-spam settings for ${message.guild.name}`)
        .addFields(
            { name: 'Status', value: antispam.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
            { name: 'Threshold', value: `${antispam.threshold} messages`, inline: true },
            { name: 'Interval', value: `${antispam.interval}ms (${antispam.interval/1000} seconds)`, inline: true },
            { name: 'Action', value: `${antispam.action.charAt(0).toUpperCase() + antispam.action.slice(1)}`, inline: true }
        )
        .setColor(antispam.enabled ? '#00FF00' : '#FF0000')
        .setFooter({ text: 'Use antispamconfig <option> <value> to change settings' })
        .setTimestamp();

    return message.reply({ embeds: [embed] });
} 