const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nukewhitelist')
        .setDescription('Manage the anti-nuke whitelist')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a user to the anti-nuke whitelist')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to add to the whitelist')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a user from the anti-nuke whitelist')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove from the whitelist')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all users in the anti-nuke whitelist')),
    
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
                level: 'medium',
                whitelistedUsers: [],
                lastUpdated: Date.now()
            };
            client.settings.set(interaction.guild.id, guildSettings);
        }
        
        // Get subcommand
        const subcommand = interaction.options.getSubcommand();
        
        // Handle different subcommands
        switch (subcommand) {
            case 'add':
                return addToWhitelist(client, interaction, guildSettings);
            case 'remove':
                return removeFromWhitelist(client, interaction, guildSettings);
            case 'list':
                return listWhitelist(client, interaction, guildSettings);
        }
    }
};

// Function to add a user to the whitelist
async function addToWhitelist(client, interaction, guildSettings) {
    // Get user from options
    const user = interaction.options.getUser('user');
    
    // Check if user is already whitelisted
    if (guildSettings.antinuke.whitelistedUsers.includes(user.id)) {
        return interaction.editReply(`${user.tag} is already whitelisted.`);
    }
    
    // Add user to whitelist
    guildSettings.antinuke.whitelistedUsers.push(user.id);
    guildSettings.antinuke.lastUpdated = Date.now();
    client.settings.set(interaction.guild.id, guildSettings);
    
    // Create embed
    const embed = new EmbedBuilder()
        .setTitle('Anti-Nuke Whitelist')
        .setDescription(`Added ${user.tag} to the anti-nuke whitelist.`)
        .setColor('#00FF00')
        .setTimestamp()
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
    
    // Send embed
    interaction.editReply({ embeds: [embed] });
}

// Function to remove a user from the whitelist
async function removeFromWhitelist(client, interaction, guildSettings) {
    // Get user from options
    const user = interaction.options.getUser('user');
    
    // Check if user is not whitelisted
    if (!guildSettings.antinuke.whitelistedUsers.includes(user.id)) {
        return interaction.editReply(`${user.tag} is not whitelisted.`);
    }
    
    // Remove user from whitelist
    guildSettings.antinuke.whitelistedUsers = guildSettings.antinuke.whitelistedUsers.filter(id => id !== user.id);
    guildSettings.antinuke.lastUpdated = Date.now();
    client.settings.set(interaction.guild.id, guildSettings);
    
    // Create embed
    const embed = new EmbedBuilder()
        .setTitle('Anti-Nuke Whitelist')
        .setDescription(`Removed ${user.tag} from the anti-nuke whitelist.`)
        .setColor('#FF0000')
        .setTimestamp()
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
    
    // Send embed
    interaction.editReply({ embeds: [embed] });
}

// Function to list whitelisted users
async function listWhitelist(client, interaction, guildSettings) {
    // Create embed
    const embed = new EmbedBuilder()
        .setTitle('Anti-Nuke Whitelist')
        .setDescription(`Users whitelisted from anti-nuke protection in ${interaction.guild.name}`)
        .setColor('#00FFFF')
        .setTimestamp()
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
    
    // Check if there are whitelisted users
    if (guildSettings.antinuke.whitelistedUsers.length > 0) {
        let whitelistText = '';
        
        // Loop through whitelisted users
        for (const userId of guildSettings.antinuke.whitelistedUsers) {
            try {
                // Fetch user
                const user = await client.users.fetch(userId);
                whitelistText += `• ${user.tag} (${userId})\n`;
            } catch (error) {
                whitelistText += `• Unknown User (${userId})\n`;
            }
        }
        
        // Add whitelisted users to embed
        embed.addFields({ name: 'Whitelisted Users', value: whitelistText });
    } else {
        // If no users are whitelisted
        embed.setDescription('No users are currently whitelisted from anti-nuke protection.');
    }
    
    // Send embed
    interaction.editReply({ embeds: [embed] });
} 