const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');

module.exports = {
    name: 'voicemute',
    description: 'Mute a member in voice channels',
    usage: 'voicemute @user [time] [reason]',
    category: 'moderation',
    aliases: ['vmute'],
    cooldown: 3,
    permissions: [PermissionFlagsBits.MuteMembers],
    async execute(client, message, args) {
        // Check if a user was mentioned
        if (!args[0]) {
            return message.reply('Please specify a user to voice mute!');
        }
        
        // Get target user
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        // Check if user exists
        if (!target) {
            return message.reply('Could not find that user!');
        }
        
        // Check if user is in a voice channel
        if (!target.voice.channel) {
            return message.reply('That user is not in a voice channel!');
        }
        
        // Check if user is moderatable
        if (!target.moderatable) {
            return message.reply('I cannot mute this user! Do they have a higher role?');
        }
        
        // Check if trying to mute self
        if (target.id === message.author.id) {
            return message.reply('You cannot voice mute yourself!');
        }
        
        // Check if already muted
        if (target.voice.serverMute) {
            return message.reply('That user is already muted in voice channels!');
        }
        
        // Default mute time (null = indefinite)
        let muteTime = null;
        let timeString = 'indefinitely';
        
        // Check if a time was specified
        if (args[1] && /^\d+[smhdw]$/.test(args[1])) {
            const parsedTime = ms(args[1]);
            if (parsedTime) {
                muteTime = parsedTime;
                timeString = args[1];
                args.splice(1, 1);
            }
        }
        
        // Get reason
        let reason = args.slice(1).join(' ');
        if (!reason) reason = 'No reason provided';
        
        try {
            // Mute the user in voice
            await target.voice.setMute(true, reason);
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('Member Voice Muted')
                .setDescription(`**${target.user.tag}** has been muted in voice channels${muteTime ? ` for ${timeString}` : ' indefinitely'}.`)
                .addFields(
                    { name: 'User', value: `${target.user.tag} (${target.id})` },
                    { name: 'Moderator', value: message.author.tag },
                    { name: 'Reason', value: reason },
                    { name: 'Duration', value: timeString }
                )
                .setColor('#FFA500')
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
                        .setTitle('Member Voice Muted')
                        .setDescription(`**${target.user.tag}** has been muted in voice channels${muteTime ? ` for ${timeString}` : ' indefinitely'}.`)
                        .addFields(
                            { name: 'User ID', value: target.id },
                            { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },
                            { name: 'Reason', value: reason },
                            { name: 'Duration', value: timeString },
                            { name: 'Voice Channel', value: target.voice.channel.name }
                        )
                        .setColor('#FFA500')
                        .setThumbnail(target.user.displayAvatarURL())
                        .setTimestamp();
                    
                    logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }
            
            // If a time was specified, schedule unmute
            if (muteTime) {
                setTimeout(async () => {
                    try {
                        // Check if user is still in a voice channel and still muted
                        if (target.voice.channel && target.voice.serverMute) {
                            await target.voice.setMute(false, 'Voice mute duration expired');
                            
                            console.log(`[VoiceMute] Unmuted ${target.user.tag} after ${timeString} in ${message.guild.name}`);
                            
                            // Log to channel if set
                            if (logChannelId) {
                                const logChannel = message.guild.channels.cache.get(logChannelId);
                                if (logChannel) {
                                    const unmuteEmbed = new EmbedBuilder()
                                        .setTitle('Member Voice Unmuted')
                                        .setDescription(`**${target.user.tag}** has been automatically unmuted in voice channels (duration expired).`)
                                        .addFields(
                                            { name: 'User ID', value: target.id },
                                            { name: 'Original Mute Reason', value: reason },
                                            { name: 'Mute Duration', value: timeString }
                                        )
                                        .setColor('#00FF00')
                                        .setTimestamp();
                                    
                                    logChannel.send({ embeds: [unmuteEmbed] }).catch(() => {});
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`[VoiceMute] Failed to unmute ${target.id}: ${error}`);
                    }
                }, muteTime);
            }
        } catch (error) {
            console.error(`Error voice muting user: ${error}`);
            message.reply(`Failed to voice mute ${target.user.tag}: ${error.message}`);
        }
    }
}; 