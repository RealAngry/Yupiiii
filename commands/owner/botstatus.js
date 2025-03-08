const { EmbedBuilder, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'botstatus',
    description: 'Change the bot\'s status and activity',
    usage: 'botstatus <status> <activity> <text>',
    category: 'owner',
    aliases: ['status', 'presence'],
    ownerOnly: true,
    cooldown: 10,
    examples: [
        'botstatus online playing with commands',
        'botstatus idle listening to music',
        'botstatus dnd watching servers',
        'botstatus invisible competing in events',
        'botstatus reset'
    ],
    
    async execute(client, message, args) {
        // Check if user is the bot owner or an extra owner
        if (message.author.id !== process.env.OWNER_ID && !client.extraOwners?.includes(message.author.id)) {
            return message.reply('Only the bot owner can use this command.');
        }
        
        // Check if args are provided
        if (!args.length) {
            return message.reply('Please provide a status type (online, idle, dnd, invisible) and activity.');
        }
        
        // If resetting status
        if (args[0].toLowerCase() === 'reset') {
            // Reset status to default
            client.user.setPresence({
                status: 'online',
                activities: [{
                    name: `${client.guilds.cache.size} servers | ${process.env.PREFIX}help`,
                    type: ActivityType.Watching
                }]
            });
            
            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('Bot Status Reset')
                .setDescription('Reset the bot status to default.')
                .setColor('#00FF00')
                .setTimestamp()
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
            
            // Send embed
            return message.reply({ embeds: [embed] });
        }
        
        // Get status type
        const statusType = args[0].toLowerCase();
        
        // Validate status type
        if (!['online', 'idle', 'dnd', 'invisible'].includes(statusType)) {
            return message.reply('Invalid status type. Please use `online`, `idle`, `dnd`, or `invisible`.');
        }
        
        // Check if activity type is provided
        if (args.length < 2) {
            return message.reply('Please provide an activity type (playing, listening, watching, competing, streaming).');
        }
        
        // Get activity type
        const activityType = args[1].toLowerCase();
        
        // Map activity type to ActivityType enum
        const activityTypeMap = {
            'playing': ActivityType.Playing,
            'listening': ActivityType.Listening,
            'watching': ActivityType.Watching,
            'competing': ActivityType.Competing,
            'streaming': ActivityType.Streaming
        };
        
        // Validate activity type
        if (!Object.keys(activityTypeMap).includes(activityType)) {
            return message.reply('Invalid activity type. Please use `playing`, `listening`, `watching`, `competing`, or `streaming`.');
        }
        
        // Check if activity text is provided
        if (args.length < 3) {
            return message.reply('Please provide activity text.');
        }
        
        // Get activity text
        const activityText = args.slice(2).join(' ');
        
        // Set bot status
        client.user.setPresence({
            status: statusType,
            activities: [{
                name: activityText,
                type: activityTypeMap[activityType],
                url: activityType === 'streaming' ? 'https://www.twitch.tv/discord' : null
            }]
        });
        
        // Save status to file
        saveStatus(statusType, activityType, activityText);
        
        // Create embed
        const embed = new EmbedBuilder()
            .setTitle('Bot Status Updated')
            .setDescription(`Status set to **${statusType}** with activity **${activityType} ${activityText}**.`)
            .setColor('#00FF00')
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
        
        // Send embed
        message.reply({ embeds: [embed] });
    }
};

// Function to save status to file
function saveStatus(statusType, activityType, activityText) {
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }
    
    // Create status object
    const status = {
        status: statusType,
        activity: activityType,
        text: activityText,
        updatedAt: Date.now()
    };
    
    // Save status to file
    const statusPath = path.join(dataDir, 'status.json');
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
}

// Function to load status from file (to be called on bot startup)
function loadStatus(client) {
    // Check if status file exists
    const statusPath = path.join(process.cwd(), 'data', 'status.json');
    if (fs.existsSync(statusPath)) {
        try {
            // Load status from file
            const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
            
            // Map activity type to ActivityType enum
            const activityTypeMap = {
                'playing': ActivityType.Playing,
                'listening': ActivityType.Listening,
                'watching': ActivityType.Watching,
                'competing': ActivityType.Competing,
                'streaming': ActivityType.Streaming
            };
            
            // Set bot status
            client.user.setPresence({
                status: status.status,
                activities: [{
                    name: status.text,
                    type: activityTypeMap[status.activity],
                    url: status.activity === 'streaming' ? 'https://www.twitch.tv/discord' : null
                }]
            });
            
            console.log(`Loaded custom status: ${status.status} ${status.activity} ${status.text}`);
        } catch (error) {
            console.error('Error loading status:', error);
            
            // Set default status
            client.user.setPresence({
                status: 'online',
                activities: [{
                    name: `${client.guilds.cache.size} servers | ${process.env.PREFIX}help`,
                    type: ActivityType.Watching
                }]
            });
        }
    } else {
        // Set default status
        client.user.setPresence({
            status: 'online',
            activities: [{
                name: `${client.guilds.cache.size} servers | ${process.env.PREFIX}help`,
                type: ActivityType.Watching
            }]
        });
    }
} 