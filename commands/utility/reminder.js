const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'reminder',
    description: 'Set a reminder for yourself',
    usage: 'reminder <time> <reminder text>',
    category: 'utility',
    aliases: ['remind', 'remindme'],
    cooldown: 5,
    examples: [
        'reminder 1h Check on the server',
        'reminder 30m Go to the meeting',
        'reminder 2h30m Finish the project'
    ],
    async execute(client, message, args) {
        if (args.length < 2) {
            return message.reply('Please provide a time and a reminder message. Example: `reminder 1h Check on the server`');
        }
        
        // Parse the time argument
        const timeArg = args[0].toLowerCase();
        const reminderText = args.slice(1).join(' ');
        
        // Convert time to milliseconds
        const timeInMs = parseTime(timeArg);
        
        if (!timeInMs) {
            return message.reply('Invalid time format. Please use a format like `1h`, `30m`, `2h30m`, etc.');
        }
        
        // Check if the time is too short or too long
        if (timeInMs < 1000 * 60) { // Less than 1 minute
            return message.reply('Reminder time must be at least 1 minute.');
        }
        
        if (timeInMs > 1000 * 60 * 60 * 24 * 7) { // More than 1 week
            return message.reply('Reminder time cannot be longer than 1 week.');
        }
        
        // Calculate when the reminder will trigger
        const now = Date.now();
        const reminderTime = now + timeInMs;
        
        // Format the time for display
        const formattedTime = formatTime(timeInMs);
        
        // Confirmation embed
        const confirmEmbed = new EmbedBuilder()
            .setTitle('✅ Reminder Set')
            .setDescription(`I'll remind you in **${formattedTime}**`)
            .addFields(
                { name: 'Reminder', value: reminderText },
                { name: 'Time', value: `<t:${Math.floor(reminderTime / 1000)}:R>` }
            )
            .setColor('#00FFFF')
            .setFooter({ text: `Requested by ${message.author.tag}` })
            .setTimestamp();
        
        await message.reply({ embeds: [confirmEmbed] });
        
        // Set the timeout for the reminder
        setTimeout(async () => {
            try {
                const reminderEmbed = new EmbedBuilder()
                    .setTitle('⏰ Reminder')
                    .setDescription(reminderText)
                    .setColor('#00FFFF')
                    .setFooter({ text: `Reminder set ${formattedTime} ago` })
                    .setTimestamp();
                
                await message.author.send({ 
                    content: `Hey ${message.author}, here's your reminder!`,
                    embeds: [reminderEmbed] 
                });
            } catch (error) {
                console.error('Failed to send reminder DM:', error);
                // If DM fails, try to send in the channel
                try {
                    await message.channel.send({
                        content: `${message.author}, I couldn't DM you, but here's your reminder:`,
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('⏰ Reminder')
                                .setDescription(reminderText)
                                .setColor('#00FFFF')
                                .setFooter({ text: `Reminder set ${formattedTime} ago` })
                                .setTimestamp()
                        ]
                    });
                } catch (channelError) {
                    console.error('Failed to send reminder to channel:', channelError);
                }
            }
        }, timeInMs);
    }
};

// Helper function to parse time strings like "1h30m" into milliseconds
function parseTime(timeString) {
    const regex = /(\d+)([hms])/g;
    let match;
    let ms = 0;
    
    while ((match = regex.exec(timeString)) !== null) {
        const value = parseInt(match[1]);
        const unit = match[2];
        
        if (unit === 'h') ms += value * 60 * 60 * 1000;
        else if (unit === 'm') ms += value * 60 * 1000;
        else if (unit === 's') ms += value * 1000;
    }
    
    return ms > 0 ? ms : null;
}

// Helper function to format milliseconds into a readable time string
function formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    
    const parts = [];
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    if (seconds > 0 && parts.length === 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
    
    return parts.join(', ');
} 