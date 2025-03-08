const cron = require('node-cron');
const ModerationCase = require('../models/ModerationCase');
const { EmbedBuilder } = require('discord.js');

/**
 * Schedule cleanup tasks for the bot
 * @param {Client} client - Discord.js client
 */
function scheduleCleanupTasks(client) {
    console.log('Scheduling cleanup tasks...');

    // Schedule task to run at midnight every day
    cron.schedule('0 0 * * *', async () => {
        try {
            await cleanupOldModerationCases(client);
        } catch (error) {
            console.error('Error in cleanup task:', error);
        }
    });

    // Also run once at startup
    setTimeout(async () => {
        try {
            await cleanupOldModerationCases(client);
        } catch (error) {
            console.error('Error in initial cleanup task:', error);
        }
    }, 10000); // Wait 10 seconds after bot startup
}

/**
 * Clean up moderation cases older than 30 days
 * @param {Client} client - Discord.js client
 */
async function cleanupOldModerationCases(client) {
    console.log('Running cleanup of old moderation cases...');
    
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    try {
        // Find cases older than 30 days
        const oldCases = await ModerationCase.find({
            timestamp: { $lt: thirtyDaysAgo }
        });
        
        if (oldCases.length === 0) {
            console.log('No old moderation cases to clean up.');
            return;
        }
        
        console.log(`Found ${oldCases.length} old moderation cases to clean up.`);
        
        // Group cases by guild for reporting
        const casesByGuild = {};
        
        for (const oldCase of oldCases) {
            if (!casesByGuild[oldCase.guildId]) {
                casesByGuild[oldCase.guildId] = [];
            }
            casesByGuild[oldCase.guildId].push(oldCase);
        }
        
        // Delete old cases
        const result = await ModerationCase.deleteMany({
            timestamp: { $lt: thirtyDaysAgo }
        });
        
        console.log(`Deleted ${result.deletedCount} old moderation cases.`);
        
        // Send notification to each guild's log channel
        for (const [guildId, cases] of Object.entries(casesByGuild)) {
            try {
                const guild = await client.guilds.fetch(guildId);
                if (!guild) continue;
                
                // Try to find a log channel
                const settings = client.settings.get(guildId);
                const logChannelId = settings?.logChannelId;
                
                if (!logChannelId) continue;
                
                const logChannel = await guild.channels.fetch(logChannelId);
                if (!logChannel) continue;
                
                // Create embed for notification
                const embed = new EmbedBuilder()
                    .setTitle('Moderation Cases Cleanup')
                    .setDescription(`${cases.length} moderation cases older than 30 days have been automatically deleted.`)
                    .setColor('#FFA500')
                    .addFields({ 
                        name: 'Deleted Cases', 
                        value: `${cases.length} cases from ${new Date(thirtyDaysAgo).toLocaleDateString()} or older.` 
                    })
                    .setFooter({ text: 'Automatic cleanup system' })
                    .setTimestamp();
                
                await logChannel.send({ embeds: [embed] });
            } catch (error) {
                console.error(`Error sending cleanup notification to guild ${guildId}:`, error);
            }
        }
    } catch (error) {
        console.error('Error cleaning up old moderation cases:', error);
    }
}

module.exports = {
    scheduleCleanupTasks
}; 