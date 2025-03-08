const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'voiceunmute',
    description: 'Unmute a member in voice channels',
    usage: 'voiceunmute @user [reason]',
    category: 'moderation',
    aliases: ['vunmute'],
    cooldown: 3,
    permissions: [PermissionFlagsBits.MuteMembers],
    async execute(client, message, args) {
        // Check if a user was mentioned
        if (!args[0]) {
            return message.reply('Please specify a user to voice unmute!');
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
            return message.reply('I cannot unmute this user! Do they have a higher role?');
        }
        
        // Check if already unmuted
        if (!target.voice.serverMute) {
            return message.reply('That user is not muted in voice channels!');
        }
        
        // Get reason
        let reason = args.slice(1).join(' ');
        if (!reason) reason = 'No reason provided';
        
        try {
            // Unmute the user in voice
            await target.voice.setMute(false, reason);
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('Member Voice Unmuted')
                .setDescription(`**${target.user.tag}** has been unmuted in voice channels.`)
                .addFields(
                    { name: 'User', value: `${target.user.tag} (${target.id})` },
                    { name: 'Moderator', value: message.author.tag },
                    { name: 'Reason', value: reason }
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
                        .setTitle('Member Voice Unmuted')
                        .setDescription(`**${target.user.tag}** has been unmuted in voice channels.`)
                        .addFields(
                            { name: 'User ID', value: target.id },
                            { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },
                            { name: 'Reason', value: reason },
                            { name: 'Voice Channel', value: target.voice.channel.name }
                        )
                        .setColor('#00FF00')
                        .setThumbnail(target.user.displayAvatarURL())
                        .setTimestamp();
                    
                    logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }
        } catch (error) {
            console.error(`Error voice unmuting user: ${error}`);
            message.reply(`Failed to voice unmute ${target.user.tag}: ${error.message}`);
        }
    }
}; 