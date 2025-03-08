const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'clearwarns',
    description: 'Clear warnings for a user',
    usage: 'clearwarns @user [warning_id/all]',
    category: 'moderation',
    aliases: ['clearwarnings', 'delwarn', 'removewarning'],
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageGuild],
    execute(client, message, args) {
        // Check if a user was mentioned
        if (!args[0]) {
            return message.reply('Please specify a user to clear warnings for!');
        }
        
        // Get target user
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        // Check if user exists
        if (!target) {
            return message.reply('Could not find that user!');
        }
        
        // Check if warnings exist for this guild
        if (!client.warnings || !client.warnings.has(message.guild.id)) {
            return message.reply(`${target.user.tag} has no warnings to clear.`);
        }
        
        // Get guild warnings
        const guildWarnings = client.warnings.get(message.guild.id);
        
        // Check if user has warnings
        if (!guildWarnings.has(target.id) || guildWarnings.get(target.id).length === 0) {
            return message.reply(`${target.user.tag} has no warnings to clear.`);
        }
        
        // Get user warnings
        const userWarnings = guildWarnings.get(target.id);
        
        // Check if warning ID or 'all' was specified
        if (!args[1]) {
            return message.reply(`Please specify a warning ID or 'all' to clear all warnings. Use the \`warnings\` command to view warning IDs.`);
        }
        
        // Check if clearing all warnings
        if (args[1].toLowerCase() === 'all') {
            // Clear all warnings
            guildWarnings.set(target.id, []);
            
            // Save warnings
            client.warnings.set(message.guild.id, guildWarnings);
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('Warnings Cleared')
                .setDescription(`All warnings for **${target.user.tag}** have been cleared.`)
                .addFields(
                    { name: 'Cleared By', value: message.author.tag },
                    { name: 'Warnings Removed', value: userWarnings.length.toString() }
                )
                .setColor('#00FF00')
                .setThumbnail(target.user.displayAvatarURL())
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
            
            // Get guild settings
            const guildSettings = client.settings?.get(message.guild.id) || {};
            
            // Log to channel if set
            const logChannelId = guildSettings.logChannel;
            if (logChannelId) {
                const logChannel = message.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('All Warnings Cleared')
                        .setDescription(`All warnings for **${target.user.tag}** have been cleared.`)
                        .addFields(
                            { name: 'User ID', value: target.id },
                            { name: 'Cleared By', value: `${message.author.tag} (${message.author.id})` },
                            { name: 'Warnings Removed', value: userWarnings.length.toString() }
                        )
                        .setColor('#00FF00')
                        .setThumbnail(target.user.displayAvatarURL())
                        .setTimestamp();
                    
                    logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }
            
            return;
        }
        
        // Get warning ID
        const warningId = args[1].toUpperCase();
        
        // Find warning with matching ID
        const warningIndex = userWarnings.findIndex(warning => warning.id === warningId);
        
        // Check if warning exists
        if (warningIndex === -1) {
            return message.reply(`Could not find a warning with ID \`${warningId}\`. Use the \`warnings\` command to view warning IDs.`);
        }
        
        // Get warning
        const warning = userWarnings[warningIndex];
        
        // Remove warning
        userWarnings.splice(warningIndex, 1);
        
        // Save warnings
        guildWarnings.set(target.id, userWarnings);
        client.warnings.set(message.guild.id, guildWarnings);
        
        // Create success embed
        const embed = new EmbedBuilder()
            .setTitle('Warning Removed')
            .setDescription(`Warning with ID \`${warningId}\` has been removed from **${target.user.tag}**.`)
            .addFields(
                { name: 'Reason', value: warning.reason },
                { name: 'Cleared By', value: message.author.tag },
                { name: 'Remaining Warnings', value: userWarnings.length.toString() }
            )
            .setColor('#00FF00')
            .setThumbnail(target.user.displayAvatarURL())
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
        
        // Get guild settings
        const guildSettings = client.settings?.get(message.guild.id) || {};
        
        // Log to channel if set
        const logChannelId = guildSettings.logChannel;
        if (logChannelId) {
            const logChannel = message.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('Warning Removed')
                    .setDescription(`Warning with ID \`${warningId}\` has been removed from **${target.user.tag}**.`)
                    .addFields(
                        { name: 'User ID', value: target.id },
                        { name: 'Warning Reason', value: warning.reason },
                        { name: 'Cleared By', value: `${message.author.tag} (${message.author.id})` },
                        { name: 'Remaining Warnings', value: userWarnings.length.toString() }
                    )
                    .setColor('#00FF00')
                    .setThumbnail(target.user.displayAvatarURL())
                    .setTimestamp();
                
                logChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }
        }
    }
}; 