const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'blacklist',
    description: 'Blacklist a user from using the bot',
    usage: 'blacklist <add/remove/list> [user]',
    category: 'owner',
    aliases: ['bl'],
    ownerOnly: true,
    cooldown: 3,
    examples: [
        'blacklist add @user',
        'blacklist remove @user',
        'blacklist list'
    ],
    
    async execute(client, message, args) {
        // Check if user is the bot owner
        if (message.author.id !== process.env.OWNER_ID && !client.extraOwners?.includes(message.author.id)) {
            return message.reply('Only the bot owner can use this command.');
        }
        
        // Check if args are provided
        if (!args.length) {
            return message.reply('Please specify an action: `add`, `remove`, or `list`.');
        }
        
        // Get action from args
        const action = args[0].toLowerCase();
        
        // Initialize blacklist if it doesn't exist
        if (!client.blacklistedUsers) {
            client.blacklistedUsers = new Set();
        }
        
        // Handle different actions
        switch (action) {
            case 'add':
                return addToBlacklist(client, message, args);
            case 'remove':
                return removeFromBlacklist(client, message, args);
            case 'list':
                return listBlacklist(client, message);
            default:
                return message.reply('Invalid action. Please use `add`, `remove`, or `list`.');
        }
    }
};

// Function to add a user to the blacklist
async function addToBlacklist(client, message, args) {
    // Check if user is mentioned
    if (!message.mentions.users.size && !args[1]) {
        return message.reply('Please mention a user or provide a user ID to blacklist.');
    }
    
    // Get user from mention or ID
    const user = message.mentions.users.first() || await client.users.fetch(args[1]).catch(() => null);
    
    // If user not found
    if (!user) {
        return message.reply('Could not find that user. Please mention a valid user or provide a valid user ID.');
    }
    
    // Check if user is already blacklisted
    if (client.blacklistedUsers.has(user.id)) {
        return message.reply(`${user.tag} is already blacklisted.`);
    }
    
    // Check if user is the bot owner or an extra owner
    if (user.id === process.env.OWNER_ID || client.extraOwners?.includes(user.id)) {
        return message.reply('You cannot blacklist the bot owner or an extra owner.');
    }
    
    // Add user to blacklist
    client.blacklistedUsers.add(user.id);
    
    // Save blacklist to file
    saveBlacklist(client);
    
    // Create embed
    const embed = new EmbedBuilder()
        .setTitle('User Blacklisted')
        .setDescription(`Added ${user.tag} to the blacklist. They can no longer use bot commands.`)
        .setColor('#FF0000')
        .setTimestamp()
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
    
    // Send embed
    message.reply({ embeds: [embed] });
}

// Function to remove a user from the blacklist
async function removeFromBlacklist(client, message, args) {
    // Check if user is mentioned
    if (!message.mentions.users.size && !args[1]) {
        return message.reply('Please mention a user or provide a user ID to remove from the blacklist.');
    }
    
    // Get user from mention or ID
    const user = message.mentions.users.first() || await client.users.fetch(args[1]).catch(() => null);
    
    // If user not found
    if (!user) {
        return message.reply('Could not find that user. Please mention a valid user or provide a valid user ID.');
    }
    
    // Check if user is not blacklisted
    if (!client.blacklistedUsers.has(user.id)) {
        return message.reply(`${user.tag} is not blacklisted.`);
    }
    
    // Remove user from blacklist
    client.blacklistedUsers.delete(user.id);
    
    // Save blacklist to file
    saveBlacklist(client);
    
    // Create embed
    const embed = new EmbedBuilder()
        .setTitle('User Removed from Blacklist')
        .setDescription(`Removed ${user.tag} from the blacklist. They can now use bot commands again.`)
        .setColor('#00FF00')
        .setTimestamp()
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
    
    // Send embed
    message.reply({ embeds: [embed] });
}

// Function to list blacklisted users
async function listBlacklist(client, message) {
    // Create embed
    const embed = new EmbedBuilder()
        .setTitle('Blacklisted Users')
        .setDescription('Users who are blacklisted from using the bot')
        .setColor('#FF5555')
        .setTimestamp()
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
    
    // Check if there are blacklisted users
    if (client.blacklistedUsers.size > 0) {
        let blacklistText = '';
        
        // Loop through blacklisted users
        for (const userId of client.blacklistedUsers) {
            try {
                // Fetch user
                const user = await client.users.fetch(userId);
                blacklistText += `• ${user.tag} (${userId})\n`;
            } catch (error) {
                blacklistText += `• Unknown User (${userId})\n`;
            }
        }
        
        // Add blacklisted users to embed
        embed.addFields({ name: 'Blacklisted Users', value: blacklistText });
    } else {
        // If no users are blacklisted
        embed.setDescription('No users are currently blacklisted from using the bot.');
    }
    
    // Send embed
    message.reply({ embeds: [embed] });
}

// Function to save blacklist to file
function saveBlacklist(client) {
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }
    
    // Save blacklist to file
    const blacklistPath = path.join(dataDir, 'blacklist.json');
    fs.writeFileSync(blacklistPath, JSON.stringify([...client.blacklistedUsers]));
}

// Function to load blacklist from file (to be called on bot startup)
function loadBlacklist(client) {
    // Create blacklist set if it doesn't exist
    if (!client.blacklistedUsers) {
        client.blacklistedUsers = new Set();
    }
    
    // Check if blacklist file exists
    const blacklistPath = path.join(process.cwd(), 'data', 'blacklist.json');
    if (fs.existsSync(blacklistPath)) {
        // Load blacklist from file
        const blacklist = JSON.parse(fs.readFileSync(blacklistPath, 'utf8'));
        
        // Add users to blacklist
        for (const userId of blacklist) {
            client.blacklistedUsers.add(userId);
        }
    }
} 