const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationCase = require('../../models/ModerationCase');

module.exports = {
    name: 'ban',
    description: 'Ban a member from the server',
    usage: 'ban @user [days] [reason]',
    category: 'moderation',
    aliases: ['banuser'],
    cooldown: 5,
    permissions: [PermissionFlagsBits.BanMembers],
    async execute(client, message, args) {
        // Check if a user was mentioned
        if (!args[0]) {
            return message.reply('Please specify a user to ban!');
        }
        
        // Get target user
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        // Check if trying to ban self
        if (target && target.id === message.author.id) {
            return message.reply('You cannot ban yourself!');
        }
        
        // Check if user is bannable
        if (target && !target.bannable) {
            return message.reply('I cannot ban this user! Do they have a higher role?');
        }

        // Check if user is already banned
        try {
            const bannedUsers = await message.guild.bans.fetch();
            if (bannedUsers.has(target.id)) {
                return message.reply(`${target.user.tag} is already banned from this server.`);
            }
        } catch (error) {
            console.error(`Error checking ban status: ${error}`);
            // Continue with the ban attempt even if we can't check current bans
        }
        
        // Parse delete message days (0-7)
        let days = 0;
        if (args[1] && !isNaN(args[1]) && args[1] >= 0 && args[1] <= 7) {
            days = parseInt(args[1]);
            args.splice(1, 1);
        }
        
        // Get reason
        let reason = args.slice(1).join(' ');
        if (!reason) reason = 'No reason provided';
        
        const banOptions = {
            deleteMessageDays: days,
            reason: reason
        };
        
        try {
            // Get the next case number
            const caseNumber = await ModerationCase.getNextCaseNumber(message.guild.id);
            
            // Check if user exists in the guild
            if (target) {
                // Ban the user
                await target.ban(banOptions);
                
                const embed = createBanEmbed(target.user, reason, message.author, days, caseNumber);
                await message.reply({ embeds: [embed] });
                
                // Try to DM the banned user
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setTitle(`You were banned from ${message.guild.name}`)
                        .addFields(
                            { name: 'Reason', value: reason },
                            { name: 'Moderator', value: message.author.tag },
                            { name: 'Case ID', value: `#${caseNumber}` }
                        )
                        .setColor('#FF0000')
                        .setTimestamp();
                    
                    await target.user.send({ embeds: [dmEmbed] }).catch(() => {});
                } catch (error) {
                    console.error(`Could not send DM to ${target.user.tag}`, error);
                }

                // Save the moderation action to MongoDB
                const moderationCase = new ModerationCase({
                    caseNumber: caseNumber,
                    userId: target.id,
                    moderatorId: message.author.id,
                    action: 'ban',
                    reason: reason,
                    guildId: message.guild.id
                });

                await moderationCase.save();
                console.log(`Saved moderation action: ban for user ${target.id} (Case #${caseNumber})`);
            } else {
                // Ban user by ID (even if not in the guild)
                const bannedUser = await message.guild.members.ban(args[0], banOptions);
                
                const embed = createBanEmbed(bannedUser, reason, message.author, days, caseNumber);
                await message.reply({ embeds: [embed] });
                
                // Save the moderation action to MongoDB
                const moderationCase = new ModerationCase({
                    caseNumber: caseNumber,
                    userId: args[0],
                    moderatorId: message.author.id,
                    action: 'ban',
                    reason: reason,
                    guildId: message.guild.id
                });

                await moderationCase.save();
                console.log(`Saved moderation action: ban for user ID ${args[0]} (Case #${caseNumber})`);
            }
        } catch (error) {
            console.error(`Error in ban command:`, error);
            message.reply(`An error occurred while trying to ban the user: ${error.message}`);
        }
    }
};

function createBanEmbed(user, reason, moderator, days, caseNumber) {
    return new EmbedBuilder()
        .setTitle('Member Banned')
        .setDescription(`**${user.tag || user}** has been banned from the server.`)
        .addFields(
            { name: 'Reason', value: reason },
            { name: 'Moderator', value: moderator.tag },
            { name: 'Message History Deleted', value: `${days} days` },
            { name: 'Case ID', value: `#${caseNumber}` }
        )
        .setColor('#FF0000')
        .setThumbnail(user.displayAvatarURL ? user.displayAvatarURL() : null)
        .setTimestamp();
} 