const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActivityType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botstatus')
        .setDescription('Change the bot\'s status and activity')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => 
            option.setName('status')
                .setDescription('The bot\'s online status')
                .setRequired(true)
                .addChoices(
                    { name: 'Online', value: 'online' },
                    { name: 'Idle', value: 'idle' },
                    { name: 'Do Not Disturb', value: 'dnd' },
                    { name: 'Invisible', value: 'invisible' }
                ))
        .addStringOption(option => 
            option.setName('activity')
                .setDescription('The type of activity')
                .setRequired(true)
                .addChoices(
                    { name: 'Playing', value: 'playing' },
                    { name: 'Streaming', value: 'streaming' },
                    { name: 'Listening', value: 'listening' },
                    { name: 'Watching', value: 'watching' },
                    { name: 'Competing', value: 'competing' }
                ))
        .addStringOption(option => 
            option.setName('text')
                .setDescription('The text for the activity')
                .setRequired(true)),
    
    async execute(interaction, client) {
        // Check if user is bot owner
        const ownerId = process.env.OWNER_ID;
        if (ownerId && interaction.user.id !== ownerId) {
            return interaction.reply({ 
                content: 'Only the bot owner can change the bot\'s status.',
                ephemeral: true 
            });
        }
        
        // Get options
        const status = interaction.options.getString('status');
        const activityArg = interaction.options.getString('activity');
        const activityText = interaction.options.getString('text');
        
        // Parse activity type
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
                .setFooter({ text: `Updated by ${interaction.user.tag}` })
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error setting bot status:', error);
            return interaction.reply({ 
                content: 'There was an error setting the bot\'s status. Please try again later.',
                ephemeral: true 
            });
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