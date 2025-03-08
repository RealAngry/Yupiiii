const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reminder')
        .setDescription('Set a reminder for yourself')
        .addStringOption(option => 
            option.setName('time')
                .setDescription('Time until reminder (e.g. 1h, 30m, 2h30m)')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('message')
                .setDescription('What to remind you about')
                .setRequired(true)),
    
    async execute(interaction, client) {
        const timeArg = interaction.options.getString('time').toLowerCase();
        const reminderText = interaction.options.getString('message');
        
        // Convert time to milliseconds
        const timeInMs = parseTime(timeArg);
        
        if (!timeInMs) {
            return interaction.reply({ 
                content: 'Invalid time format. Please use a format like `1h`, `30m`, `2h30m`, etc.',
                ephemeral: true 
            });
        }
        
        // Check if the time is too short or too long
        if (timeInMs < 1000 * 60) { // Less than 1 minute
            return interaction.reply({ 
                content: 'Reminder time must be at least 1 minute.',
                ephemeral: true 
            });
        }
        
        if (timeInMs > 1000 * 60 * 60 * 24 * 7) { // More than 1 week
            return interaction.reply({ 
                content: 'Reminder time cannot be longer than 1 week.',
                ephemeral: true 
            });
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
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .setTimestamp();
        
        await interaction.reply({ embeds: [confirmEmbed] });
        
        // Set the timeout for the reminder
        setTimeout(async () => {
            try {
                const reminderEmbed = new EmbedBuilder()
                    .setTitle('⏰ Reminder')
                    .setDescription(reminderText)
                    .setColor('#00FFFF')
                    .setFooter({ text: `Reminder set ${formattedTime} ago` })
                    .setTimestamp();
                
                await interaction.user.send({ 
                    content: `Hey ${interaction.user}, here's your reminder!`,
                    embeds: [reminderEmbed] 
                });
            } catch (error) {
                console.error('Failed to send reminder DM:', error);
                // If DM fails, try to send in the channel
                try {
                    await interaction.followUp({
                        content: `${interaction.user}, I couldn't DM you, but here's your reminder:`,
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