const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('antinuke')
        .setDescription('Configure anti-nuke protection for the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('enable')
                .setDescription('Enable anti-nuke protection'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable anti-nuke protection'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('level')
                .setDescription('Set the security level for anti-nuke protection')
                .addStringOption(option =>
                    option.setName('level')
                        .setDescription('The security level to set')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Low', value: 'low' },
                            { name: 'Medium', value: 'medium' },
                            { name: 'High', value: 'high' },
                            { name: 'Extreme', value: 'extreme' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Show current anti-nuke settings'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('whitelist_add')
                .setDescription('Add a user to the anti-nuke whitelist')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to whitelist')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('whitelist_remove')
                .setDescription('Remove a user from the anti-nuke whitelist')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove from whitelist')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('whitelist_list')
                .setDescription('List all whitelisted users')),
    
    async execute(interaction, client) {
        await interaction.deferReply();
        
        // Initialize settings if they don't exist
        if (!client.settings.has(interaction.guild.id)) {
            client.settings.set(interaction.guild.id, {});
        }

        const guildSettings = client.settings.get(interaction.guild.id);
        
        // Initialize anti-nuke settings if they don't exist
        if (!guildSettings.antinuke) {
            guildSettings.antinuke = {
                enabled: false,
                level: 'medium',     // low, medium, high, extreme
                whitelistedUsers: [],
                lastUpdated: Date.now()
            };
            client.settings.set(interaction.guild.id, guildSettings);
        }
        
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'enable':
                guildSettings.antinuke.enabled = true;
                guildSettings.antinuke.lastUpdated = Date.now();
                client.settings.set(interaction.guild.id, guildSettings);
                return interaction.editReply('Anti-nuke protection has been enabled.');
                
            case 'disable':
                guildSettings.antinuke.enabled = false;
                guildSettings.antinuke.lastUpdated = Date.now();
                client.settings.set(interaction.guild.id, guildSettings);
                return interaction.editReply('Anti-nuke protection has been disabled.');
                
            case 'level':
                const level = interaction.options.getString('level');
                guildSettings.antinuke.level = level;
                guildSettings.antinuke.lastUpdated = Date.now();
                client.settings.set(interaction.guild.id, guildSettings);
                return interaction.editReply(`Anti-nuke security level set to ${level}.`);
                
            case 'status':
                return showStatus(client, interaction);
                
            case 'whitelist_add':
                const userToAdd = interaction.options.getUser('user');
                
                if (guildSettings.antinuke.whitelistedUsers.includes(userToAdd.id)) {
                    return interaction.editReply(`${userToAdd.tag} is already whitelisted.`);
                }
                
                guildSettings.antinuke.whitelistedUsers.push(userToAdd.id);
                guildSettings.antinuke.lastUpdated = Date.now();
                client.settings.set(interaction.guild.id, guildSettings);
                return interaction.editReply(`Added ${userToAdd.tag} to the anti-nuke whitelist.`);
                
            case 'whitelist_remove':
                const userToRemove = interaction.options.getUser('user');
                
                if (!guildSettings.antinuke.whitelistedUsers.includes(userToRemove.id)) {
                    return interaction.editReply(`${userToRemove.tag} is not whitelisted.`);
                }
                
                guildSettings.antinuke.whitelistedUsers = guildSettings.antinuke.whitelistedUsers.filter(id => id !== userToRemove.id);
                guildSettings.antinuke.lastUpdated = Date.now();
                client.settings.set(interaction.guild.id, guildSettings);
                return interaction.editReply(`Removed ${userToRemove.tag} from the anti-nuke whitelist.`);
                
            case 'whitelist_list':
                return showWhitelist(client, interaction);
        }
    }
};

// Function to show current anti-nuke settings
async function showStatus(client, interaction) {
    const guildSettings = client.settings.get(interaction.guild.id);
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
        .setDescription(`Current anti-nuke settings for ${interaction.guild.name}`)
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
        .setFooter({ text: 'Use /antinuke commands to change settings' })
        .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
}

// Function to show whitelist
async function showWhitelist(client, interaction) {
    const guildSettings = client.settings.get(interaction.guild.id);
    const antinuke = guildSettings.antinuke || {
        enabled: false,
        level: 'medium',
        whitelistedUsers: [],
        lastUpdated: Date.now()
    };

    const embed = new EmbedBuilder()
        .setTitle('Anti-Nuke Whitelist')
        .setDescription(`Users whitelisted from anti-nuke protection in ${interaction.guild.name}`)
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

    return interaction.editReply({ embeds: [embed] });
} 