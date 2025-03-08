const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'extraowners',
    description: 'Manage extra owners who can use owner-only commands',
    usage: 'extraowners <add/remove/list> [user]',
    category: 'owner',
    aliases: ['addowner', 'removeowner', 'owners'],
    ownerOnly: true,
    cooldown: 3,
    examples: [
        'extraowners add @user',
        'extraowners remove @user',
        'extraowners list'
    ],
    
    async execute(client, message, args) {
        // Check if user is the bot owner
        if (message.author.id !== process.env.OWNER_ID) {
            return message.reply('Only the main bot owner can use this command.');
        }
        
        // Check if args are provided
        if (!args.length) {
            return message.reply('Please specify an action: `add`, `remove`, or `list`.');
        }
        
        // Get action from args
        const action = args[0].toLowerCase();
        
        // Initialize extra owners if it doesn't exist
        if (!client.extraOwners) {
            client.extraOwners = [];
        }
        
        // Handle different actions
        switch (action) {
            case 'add':
                return addExtraOwner(client, message, args);
            case 'remove':
                return removeExtraOwner(client, message, args);
            case 'list':
                return listExtraOwners(client, message);
            default:
                return message.reply('Invalid action. Please use `add`, `remove`, or `list`.');
        }
    }
};

// Function to add an extra owner
async function addExtraOwner(client, message, args) {
    // Check if user is mentioned
    if (!message.mentions.users.size && !args[1]) {
        return message.reply('Please mention a user or provide a user ID to add as an extra owner.');
    }
    
    // Get user from mention or ID
    const user = message.mentions.users.first() || await client.users.fetch(args[1]).catch(() => null);
    
    // If user not found
    if (!user) {
        return message.reply('Could not find that user. Please mention a valid user or provide a valid user ID.');
    }
    
    // Check if user is already an extra owner
    if (client.extraOwners.includes(user.id)) {
        return message.reply(`${user.tag} is already an extra owner.`);
    }
    
    // Check if user is the main bot owner
    if (user.id === process.env.OWNER_ID) {
        return message.reply('You cannot add the main bot owner as an extra owner.');
    }
    
    // Add user to extra owners
    client.extraOwners.push(user.id);
    
    // Save extra owners to file
    saveExtraOwners(client);
    
    // Create embed
    const embed = new EmbedBuilder()
        .setTitle('Extra Owner Added')
        .setDescription(`Added ${user.tag} as an extra owner. They can now use owner-only commands.`)
        .setColor('#00FF00')
        .setTimestamp()
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
    
    // Send embed
    message.reply({ embeds: [embed] });
}

// Function to remove an extra owner
async function removeExtraOwner(client, message, args) {
    // Check if user is mentioned
    if (!message.mentions.users.size && !args[1]) {
        return message.reply('Please mention a user or provide a user ID to remove as an extra owner.');
    }
    
    // Get user from mention or ID
    const user = message.mentions.users.first() || await client.users.fetch(args[1]).catch(() => null);
    
    // If user not found
    if (!user) {
        return message.reply('Could not find that user. Please mention a valid user or provide a valid user ID.');
    }
    
    // Check if user is not an extra owner
    if (!client.extraOwners.includes(user.id)) {
        return message.reply(`${user.tag} is not an extra owner.`);
    }
    
    // Remove user from extra owners
    client.extraOwners = client.extraOwners.filter(id => id !== user.id);
    
    // Save extra owners to file
    saveExtraOwners(client);
    
    // Create embed
    const embed = new EmbedBuilder()
        .setTitle('Extra Owner Removed')
        .setDescription(`Removed ${user.tag} as an extra owner. They can no longer use owner-only commands.`)
        .setColor('#FF0000')
        .setTimestamp()
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
    
    // Send embed
    message.reply({ embeds: [embed] });
}

// Function to list extra owners
async function listExtraOwners(client, message) {
    // Create embed
    const embed = new EmbedBuilder()
        .setTitle('Extra Owners')
        .setDescription('Users who can use owner-only commands')
        .setColor('#00FFFF')
        .setTimestamp()
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
    
    // Add main owner to embed
    try {
        const mainOwner = await client.users.fetch(process.env.OWNER_ID);
        embed.addFields({ name: 'Main Owner', value: `• ${mainOwner.tag} (${mainOwner.id})` });
    } catch (error) {
        embed.addFields({ name: 'Main Owner', value: `• Unknown User (${process.env.OWNER_ID})` });
    }
    
    // Check if there are extra owners
    if (client.extraOwners.length > 0) {
        let ownersText = '';
        
        // Loop through extra owners
        for (const userId of client.extraOwners) {
            try {
                // Fetch user
                const user = await client.users.fetch(userId);
                ownersText += `• ${user.tag} (${userId})\n`;
            } catch (error) {
                ownersText += `• Unknown User (${userId})\n`;
            }
        }
        
        // Add extra owners to embed
        embed.addFields({ name: 'Extra Owners', value: ownersText });
    } else {
        // If no extra owners
        embed.addFields({ name: 'Extra Owners', value: 'No extra owners have been added.' });
    }
    
    // Send embed
    message.reply({ embeds: [embed] });
}

// Function to save extra owners to file
function saveExtraOwners(client) {
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }
    
    // Save extra owners to file
    const ownersPath = path.join(dataDir, 'extraowners.json');
    fs.writeFileSync(ownersPath, JSON.stringify(client.extraOwners));
}

// Function to load extra owners from file (to be called on bot startup)
function loadExtraOwners(client) {
    // Initialize extra owners if it doesn't exist
    if (!client.extraOwners) {
        client.extraOwners = [];
    }
    
    // Check if extra owners file exists
    const ownersPath = path.join(process.cwd(), 'data', 'extraowners.json');
    if (fs.existsSync(ownersPath)) {
        // Load extra owners from file
        client.extraOwners = JSON.parse(fs.readFileSync(ownersPath, 'utf8'));
    }
} 