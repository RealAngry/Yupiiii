const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationCase = require('../../models/ModerationCase');

module.exports = {
    name: 'masswarn',
    description: 'Warn multiple users at once',
    usage: 'masswarn <@user1> <@user2> ... <reason>',
    category: 'moderation',
    aliases: ['warnall', 'multiwarn'],
    permissions: [PermissionFlagsBits.ModerateMembers],
    cooldown: 10,
    examples: [
        'masswarn @user1 @user2 @user3 Spamming in chat',
        'masswarn @user1 @user2 Breaking server rules'
    ],
    async execute(client, message, args) {
        // Check if user has permission
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('You need Moderate Members permission to use this command.');
        }

        // Check if there are enough arguments
        if (args.length < 2) {
            return message.reply('Please mention at least one user and provide a reason.');
        }

        // Get all mentioned users
        const mentionedUsers = message.mentions.users;
        
        // Check if any users were mentioned
        if (mentionedUsers.size === 0) {
            return message.reply('Please mention at least one user to warn.');
        }

        // Get reason (everything after the last mention)
        let reason = '';
        let foundLastMention = false;
        
        for (const arg of args) {
            if (!foundLastMention && arg.match(/<@!?(\d+)>/)) {
                const userId = arg.match(/<@!?(\d+)>/)[1];
                if (userId === mentionedUsers.last().id) {
                    foundLastMention = true;
                }
            } else if (foundLastMention) {
                reason += arg + ' ';
            }
        }
        
        reason = reason.trim();
        
        // If no reason was provided, use default
        if (!reason) {
            reason = 'No reason provided';
        }

        // Check if trying to warn self
        if (mentionedUsers.has(message.author.id)) {
            return message.reply('You cannot warn yourself.');
        }

        // Check if trying to warn the bot
        if (mentionedUsers.has(client.user.id)) {
            return message.reply('You cannot warn me.');
        }

        // Create loading message
        const loadingEmbed = new EmbedBuilder()
            .setTitle('Processing Mass Warning')
            .setDescription(`Warning ${mentionedUsers.size} users...`)
            .setColor('#FFA500')
            .setTimestamp();
        
        const loadingMessage = await message.reply({ embeds: [loadingEmbed] });

        // Process each user
        const successfulWarns = [];
        const failedWarns = [];

        for (const [userId, user] of mentionedUsers) {
            try {
                // Get member object
                const member = await message.guild.members.fetch(userId).catch(() => null);
                
                // Skip if member not found or has higher role
                if (!member) {
                    failedWarns.push({ user, reason: 'User not found in server' });
                    continue;
                }
                
                if (member.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
                    failedWarns.push({ user, reason: 'User has higher or equal role' });
                    continue;
                }

                // Get next case number
                const caseNumber = await ModerationCase.getNextCaseNumber(message.guild.id);
                
                // Create moderation case
                const moderationCase = new ModerationCase({
                    guildId: message.guild.id,
                    caseNumber: caseNumber,
                    userId: userId,
                    moderatorId: message.author.id,
                    action: 'warn',
                    reason: reason
                });
                
                // Save to database
                await moderationCase.save();
                
                // Try to DM the user
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setTitle(`Warning from ${message.guild.name}`)
                        .setDescription(`You have been warned by ${message.author.tag}`)
                        .addFields(
                            { name: 'Reason', value: reason },
                            { name: 'Case ID', value: `#${caseNumber}` }
                        )
                        .setColor('#FFA500')
                        .setTimestamp();
                    
                    await user.send({ embeds: [dmEmbed] });
                } catch (error) {
                    console.error(`Could not send DM to ${user.tag}`, error);
                }
                
                // Add to successful warns
                successfulWarns.push({ user, caseNumber });
            } catch (error) {
                console.error(`Error warning user ${user.tag}:`, error);
                failedWarns.push({ user, reason: 'Internal error' });
            }
        }

        // Create result embed
        const resultEmbed = new EmbedBuilder()
            .setTitle('Mass Warning Results')
            .setDescription(`Warned ${successfulWarns.length} out of ${mentionedUsers.size} users`)
            .setColor(successfulWarns.length > 0 ? '#00FF00' : '#FF0000')
            .setTimestamp();
        
        // Add successful warns
        if (successfulWarns.length > 0) {
            let successText = '';
            for (const warn of successfulWarns) {
                successText += `• ${warn.user.tag} (Case #${warn.caseNumber})\n`;
            }
            resultEmbed.addFields({ name: '✅ Successfully Warned', value: successText });
        }
        
        // Add failed warns
        if (failedWarns.length > 0) {
            let failText = '';
            for (const warn of failedWarns) {
                failText += `• ${warn.user.tag} - ${warn.reason}\n`;
            }
            resultEmbed.addFields({ name: '❌ Failed to Warn', value: failText });
        }
        
        // Add reason
        resultEmbed.addFields({ name: 'Reason', value: reason });
        
        // Edit loading message with result
        await loadingMessage.edit({ embeds: [resultEmbed] });
        
        // Log to moderation channel if configured
        const guildSettings = client.settings.get(message.guild.id);
        if (guildSettings && guildSettings.logChannelId) {
            const logChannel = message.guild.channels.cache.get(guildSettings.logChannelId);
            
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('Mass Warning')
                    .setDescription(`${message.author.tag} warned ${successfulWarns.length} users`)
                    .addFields(
                        { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },
                        { name: 'Reason', value: reason },
                        { name: 'Channel', value: `${message.channel} (${message.channel.id})` },
                        { name: 'Warned Users', value: successfulWarns.length > 0 
                            ? successfulWarns.map(w => `${w.user.tag} (Case #${w.caseNumber})`).join('\n')
                            : 'None'
                        }
                    )
                    .setColor('#FFA500')
                    .setTimestamp();
                
                await logChannel.send({ embeds: [logEmbed] });
            }
        }
    }
}; 