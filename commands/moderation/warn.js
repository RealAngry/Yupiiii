const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'warn',
    description: 'Warn a member for breaking rules',
    usage: 'warn @user [reason]',
    category: 'moderation',
    aliases: ['warning'],
    cooldown: 3,
    permissions: [PermissionFlagsBits.ModerateMembers],
    execute(client, message, args) {
        // Check if a user was mentioned
        if (!args[0]) {
            return message.reply('Please specify a user to warn!');
        }
        
        // Get target user
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        // Check if user exists
        if (!target) {
            return message.reply('Could not find that user!');
        }
        
        // Check if trying to warn self
        if (target.id === message.author.id) {
            return message.reply('You cannot warn yourself!');
        }
        
        // Check if trying to warn a bot
        if (target.user.bot) {
            return message.reply('You cannot warn a bot!');
        }
        
        // Get reason
        let reason = args.slice(1).join(' ');
        if (!reason) reason = 'No reason provided';
        
        // Initialize warnings for guild if they don't exist
        if (!client.warnings) client.warnings = new Map();
        if (!client.warnings.has(message.guild.id)) {
            client.warnings.set(message.guild.id, new Map());
        }
        
        // Get guild warnings
        const guildWarnings = client.warnings.get(message.guild.id);
        
        // Get user warnings
        if (!guildWarnings.has(target.id)) {
            guildWarnings.set(target.id, []);
        }
        
        const userWarnings = guildWarnings.get(target.id);
        
        // Create warning object
        const warning = {
            moderator: message.author.id,
            reason: reason,
            timestamp: Date.now(),
            id: Math.random().toString(36).substring(2, 8).toUpperCase() // Generate a random ID
        };
        
        // Add warning to user's warnings
        userWarnings.push(warning);
        
        // Save warnings
        guildWarnings.set(target.id, userWarnings);
        client.warnings.set(message.guild.id, guildWarnings);
        
        // Create success embed
        const embed = new EmbedBuilder()
            .setTitle('Member Warned')
            .setDescription(`**${target.user.tag}** has been warned.`)
            .addFields(
                { name: 'Reason', value: reason },
                { name: 'Moderator', value: message.author.tag },
                { name: 'Warning ID', value: warning.id },
                { name: 'Total Warnings', value: userWarnings.length.toString() }
            )
            .setColor('#FFA500')
            .setThumbnail(target.user.displayAvatarURL())
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
        
        // Try to DM the warned user
        try {
            const dmEmbed = new EmbedBuilder()
                .setTitle(`You were warned in ${message.guild.name}`)
                .setDescription('Please make sure to follow the server rules to avoid further consequences.')
                .addFields(
                    { name: 'Reason', value: reason },
                    { name: 'Moderator', value: message.author.tag },
                    { name: 'Warning ID', value: warning.id },
                    { name: 'Total Warnings', value: userWarnings.length.toString() }
                )
                .setColor('#FFA500')
                .setTimestamp();
            
            target.user.send({ embeds: [dmEmbed] }).catch(() => {});
        } catch (error) {
            console.error(`Could not send DM to ${target.user.tag}`, error);
        }
        
        // Get guild settings
        const guildSettings = client.settings?.get(message.guild.id) || {};
        
        // Log to channel if set
        const logChannelId = guildSettings.logChannel;
        if (logChannelId) {
            const logChannel = message.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('Member Warned')
                    .setDescription(`**${target.user.tag}** has been warned.`)
                    .addFields(
                        { name: 'User ID', value: target.id },
                        { name: 'Reason', value: reason },
                        { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },
                        { name: 'Warning ID', value: warning.id },
                        { name: 'Total Warnings', value: userWarnings.length.toString() }
                    )
                    .setColor('#FFA500')
                    .setThumbnail(target.user.displayAvatarURL())
                    .setTimestamp();
                
                logChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }
        }
        
        // Check for automatic actions based on warning count
        if (userWarnings.length >= 5) {
            message.channel.send(`⚠️ ${target.user.tag} now has ${userWarnings.length} warnings. Consider taking stronger moderation action.`);
        }
    }
}; 