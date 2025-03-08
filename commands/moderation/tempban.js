const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');

module.exports = {
    name: 'tempban',
    description: 'Temporarily ban a member from the server',
    usage: 'tempban @user [time] [reason]',
    category: 'moderation',
    aliases: ['tban'],
    cooldown: 5,
    permissions: [PermissionFlagsBits.BanMembers],
    async execute(client, message, args) {
        // Check if a user was mentioned
        if (!args[0]) {
            return message.reply('Please specify a user to temporarily ban!');
        }
        
        // Get target user
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        // Check if trying to ban self
        if (target && target.id === message.author.id) {
            return message.reply('You cannot ban yourself!');
        }
        
        // Check if time was specified
        if (!args[1]) {
            return message.reply('Please specify a time for the temporary ban! Example: `-tempban @user 1d Reason`');
        }
        
        // Parse time
        const time = ms(args[1]);
        if (!time || isNaN(time)) {
            return message.reply('Please provide a valid time! Example: 1m, 1h, 1d, 1w');
        }
        
        // Get reason
        const reason = args.slice(2).join(' ') || 'No reason provided';
        
        // Check if user exists in the guild
        if (target) {
            // Check if user is bannable
            if (!target.bannable) {
                return message.reply('I cannot ban this user! Do they have a higher role?');
            }
            
            try {
                // Ban the user
                await target.ban({ reason: `Tempban by ${message.author.tag}: ${reason}` });
                
                // Create success embed
                const embed = new EmbedBuilder()
                    .setTitle('Member Temporarily Banned')
                    .setDescription(`**${target.user.tag}** has been banned for ${args[1]}.`)
                    .addFields(
                        { name: 'User', value: `${target.user.tag} (${target.id})` },
                        { name: 'Moderator', value: message.author.tag },
                        { name: 'Reason', value: reason },
                        { name: 'Duration', value: args[1] },
                        { name: 'Unbanned At', value: `<t:${Math.floor((Date.now() + time) / 1000)}:F>` }
                    )
                    .setColor('#FF0000')
                    .setThumbnail(target.user.displayAvatarURL())
                    .setTimestamp();
                
                message.reply({ embeds: [embed] });
                
                // Try to DM the banned user
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setTitle(`You were temporarily banned from ${message.guild.name}`)
                        .addFields(
                            { name: 'Reason', value: reason },
                            { name: 'Moderator', value: message.author.tag },
                            { name: 'Duration', value: args[1] },
                            { name: 'Unbanned At', value: `<t:${Math.floor((Date.now() + time) / 1000)}:F>` }
                        )
                        .setColor('#FF0000')
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
                            .setTitle('Member Temporarily Banned')
                            .setDescription(`**${target.user.tag}** has been banned for ${args[1]}.`)
                            .addFields(
                                { name: 'User ID', value: target.id },
                                { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },
                                { name: 'Reason', value: reason },
                                { name: 'Duration', value: args[1] },
                                { name: 'Unbanned At', value: `<t:${Math.floor((Date.now() + time) / 1000)}:F>` }
                            )
                            .setColor('#FF0000')
                            .setThumbnail(target.user.displayAvatarURL())
                            .setTimestamp();
                        
                        logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                    }
                }
                
                // Schedule unban
                setTimeout(async () => {
                    try {
                        // Unban the user
                        await message.guild.members.unban(target.id, 'Temporary ban expired');
                        
                        console.log(`[TempBan] Unbanned ${target.user.tag} after ${args[1]} in ${message.guild.name}`);
                        
                        // Log unban to channel if set
                        if (logChannelId) {
                            const logChannel = message.guild.channels.cache.get(logChannelId);
                            if (logChannel) {
                                const unbanEmbed = new EmbedBuilder()
                                    .setTitle('Member Unbanned')
                                    .setDescription(`**${target.user.tag}** has been automatically unbanned (temporary ban expired).`)
                                    .addFields(
                                        { name: 'User ID', value: target.id },
                                        { name: 'Original Ban Reason', value: reason },
                                        { name: 'Ban Duration', value: args[1] }
                                    )
                                    .setColor('#00FF00')
                                    .setTimestamp();
                                
                                logChannel.send({ embeds: [unbanEmbed] }).catch(() => {});
                            }
                        }
                    } catch (error) {
                        console.error(`[TempBan] Failed to unban ${target.id}: ${error}`);
                    }
                }, time);
                
            } catch (error) {
                console.error(`Error banning user: ${error}`);
                message.reply(`Failed to ban ${target.user.tag}: ${error.message}`);
            }
        } else {
            // Cannot tempban by ID since we need the user object to DM them
            return message.reply('Could not find that user in the server! They must be in the server to use tempban.');
        }
    }
}; 