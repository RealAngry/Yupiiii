const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'nukewhitelist',
    description: 'Manage the anti-nuke whitelist',
    usage: 'nukewhitelist <add/remove/list> [user]',
    category: 'automod',
    aliases: ['nwl', 'antinukewhitelist'],
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 5,
    examples: [
        'nukewhitelist add @user',
        'nukewhitelist remove @user',
        'nukewhitelist list'
    ],
    
    async execute(client, message, args) {
        // Check if user has administrator permission
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('You need Administrator permission to use this command.');
        }
        
        // Check if args are provided
        if (!args.length) {
            return message.reply('Please specify an action: `add`, `remove`, or `list`.');
        }
        
        // Get action from args
        const action = args[0].toLowerCase();
        
        // Initialize settings if they don't exist
        if (!client.settings.has(message.guild.id)) {
            client.settings.set(message.guild.id, {});
        }

        const guildSettings = client.settings.get(message.guild.id);
        
        // Initialize anti-nuke settings if they don't exist
        if (!guildSettings.antinuke) {
            guildSettings.antinuke = {
                enabled: false,
                level: 'medium',
                whitelistedUsers: [],
                lastUpdated: Date.now()
            };
            client.settings.set(message.guild.id, guildSettings);
        }
        
        // Handle different actions
        switch (action) {
            case 'add':
                return addToWhitelist(client, message, args, guildSettings);
            case 'remove':
                return removeFromWhitelist(client, message, args, guildSettings);
            case 'list':
                return listWhitelist(client, message, guildSettings);
            default:
                return message.reply('Invalid action. Please use `add`, `remove`, or `list`.');
        }
    }
};

// Function to add a user to the whitelist
async function addToWhitelist(client, message, args, guildSettings) {
    // Check if user is mentioned
    if (!message.mentions.users.size && !args[1]) {
        return message.reply('Please mention a user or provide a user ID to add to the whitelist.');
    }
    
    // Get user from mention or ID
    const user = message.mentions.users.first() || await client.users.fetch(args[1]).catch(() => null);
    
    // If user not found
    if (!user) {
        return message.reply('Could not find that user. Please mention a valid user or provide a valid user ID.');
    }
    
    // Check if user is already whitelisted
    if (guildSettings.antinuke.whitelistedUsers.includes(user.id)) {
        return message.reply(`${user.tag} is already whitelisted.`);
    }
    
    // Add user to whitelist
    guildSettings.antinuke.whitelistedUsers.push(user.id);
    guildSettings.antinuke.lastUpdated = Date.now();
    client.settings.set(message.guild.id, guildSettings);
    
    // Create embed
    const embed = new EmbedBuilder()
        .setTitle('Anti-Nuke Whitelist')
        .setDescription(`Added ${user.tag} to the anti-nuke whitelist.`)
        .setColor('#00FF00')
        .setTimestamp()
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
    
    // Send embed
    message.reply({ embeds: [embed] });
}

// Function to remove a user from the whitelist
async function removeFromWhitelist(client, message, args, guildSettings) {
    // Check if user is mentioned
    if (!message.mentions.users.size && !args[1]) {
        return message.reply('Please mention a user or provide a user ID to remove from the whitelist.');
    }
    
    // Get user from mention or ID
    const user = message.mentions.users.first() || await client.users.fetch(args[1]).catch(() => null);
    
    // If user not found
    if (!user) {
        return message.reply('Could not find that user. Please mention a valid user or provide a valid user ID.');
    }
    
    // Check if user is not whitelisted
    if (!guildSettings.antinuke.whitelistedUsers.includes(user.id)) {
        return message.reply(`${user.tag} is not whitelisted.`);
    }
    
    // Remove user from whitelist
    guildSettings.antinuke.whitelistedUsers = guildSettings.antinuke.whitelistedUsers.filter(id => id !== user.id);
    guildSettings.antinuke.lastUpdated = Date.now();
    client.settings.set(message.guild.id, guildSettings);
    
    // Create embed
    const embed = new EmbedBuilder()
        .setTitle('Anti-Nuke Whitelist')
        .setDescription(`Removed ${user.tag} from the anti-nuke whitelist.`)
        .setColor('#FF0000')
        .setTimestamp()
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
    
    // Send embed
    message.reply({ embeds: [embed] });
}

// Function to list whitelisted users
async function listWhitelist(client, message, guildSettings) {
    // Create embed
    const embed = new EmbedBuilder()
        .setTitle('Anti-Nuke Whitelist')
        .setDescription(`Users whitelisted from anti-nuke protection in ${message.guild.name}`)
        .setColor('#00FFFF')
        .setTimestamp()
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
    
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
    message.reply({ embeds: [embed] });
} 