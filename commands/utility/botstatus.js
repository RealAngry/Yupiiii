const { EmbedBuilder, PermissionFlagsBits, ActivityType } = require('discord.js');

module.exports = {
    name: 'botstatus',
    description: 'Change the bot\'s status and activity',
    usage: 'botstatus <status> <activity> [text]',
    category: 'utility',
    aliases: ['setstatus', 'botactivity'],
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 10,
    examples: [
        'botstatus online playing Minecraft',
        'botstatus idle listening to music',
        'botstatus dnd watching YouTube',
        'botstatus invisible competing in a tournament'
    ],
    async execute(client, message, args) {
        // Check if user has permission
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('You need Administrator permission to change the bot\'s status.');
        }
        
        // Check if user is bot owner
        const ownerId = process.env.OWNER_ID;
        if (ownerId && message.author.id !== ownerId) {
            return message.reply('Only the bot owner can change the bot\'s status.');
        }
        
        // Check for required arguments
        if (args.length < 2) {
            return message.reply(`Please provide a status and activity type. Usage: \`${client.prefix}${this.usage}\``);
        }
        
        // Parse status
        const statusArg = args[0].toLowerCase();
        let status;
        
        switch (statusArg) {
            case 'online':
                status = 'online';
                break;
            case 'idle':
                status = 'idle';
                break;
            case 'dnd':
            case 'donotdisturb':
                status = 'dnd';
                break;
            case 'invisible':
            case 'offline':
                status = 'invisible';
                break;
            default:
                return message.reply('Invalid status. Please use `online`, `idle`, `dnd`, or `invisible`.');
        }
        
        // Parse activity type
        const activityArg = args[1].toLowerCase();
        let activityType;
        
        switch (activityArg) {
            case 'playing':
                activityType = ActivityType.Playing;
                break;
            case 'streaming':
                activityType = ActivityType.Streaming;
                break;
            case 'listening':
                activityType = ActivityType.Listening;
                break;
            case 'watching':
                activityType = ActivityType.Watching;
                break;
            case 'competing':
                activityType = ActivityType.Competing;
                break;
            default:
                return message.reply('Invalid activity type. Please use `playing`, `streaming`, `listening`, `watching`, or `competing`.');
        }
        
        // Get activity text
        const activityText = args.slice(2).join(' ');
        
        if (!activityText && activityType !== ActivityType.Custom) {
            return message.reply('Please provide text for the activity.');
        }
        
        try {
            // Set the bot's presence
            await client.user.setPresence({
                status: status,
                activities: [{
                    name: activityText,
                    type: activityType
                }]
            });
            
            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('Bot Status Updated')
                .setDescription('The bot\'s status and activity have been updated.')
                .addFields(
                    { name: 'Status', value: status, inline: true },
                    { name: 'Activity', value: getActivityName(activityType), inline: true },
                    { name: 'Text', value: activityText || 'None', inline: true }
                )
                .setColor('#00FFFF')
                .setFooter({ text: `Updated by ${message.author.tag}` })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error setting bot status:', error);
            return message.reply('There was an error setting the bot\'s status. Please try again later.');
        }
    }
};

// Helper function to get activity name from type
function getActivityName(activityType) {
    switch (activityType) {
        case ActivityType.Playing:
            return 'Playing';
        case ActivityType.Streaming:
            return 'Streaming';
        case ActivityType.Listening:
            return 'Listening to';
        case ActivityType.Watching:
            return 'Watching';
        case ActivityType.Competing:
            return 'Competing in';
        case ActivityType.Custom:
            return 'Custom';
        default:
            return 'Unknown';
    }
} 