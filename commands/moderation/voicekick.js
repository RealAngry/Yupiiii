const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'voicekick',
    description: 'Kick a member from a voice channel',
    usage: 'voicekick @user [reason]',
    category: 'moderation',
    aliases: ['vkick'],
    cooldown: 3,
    permissions: [PermissionFlagsBits.MoveMembers],
    async execute(client, message, args) {
        // Check if a user was mentioned
        if (!args[0]) {
            return message.reply('Please specify a user to voice kick!');
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
            return message.reply('I cannot voice kick this user! Do they have a higher role?');
        }
        
        // Check if trying to kick self
        if (target.id === message.author.id) {
            return message.reply('You cannot voice kick yourself!');
        }
        
        // Get voice channel info before disconnecting
        const voiceChannel = target.voice.channel;
        
        // Get reason
        let reason = args.slice(1).join(' ');
        if (!reason) reason = 'No reason provided';
        
        try {
            // Disconnect the user from voice
            await target.voice.disconnect(reason);
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('Member Voice Kicked')
                .setDescription(`**${target.user.tag}** has been kicked from the voice channel.`)
                .addFields(
                    { name: 'User', value: `${target.user.tag} (${target.id})` },
                    { name: 'Moderator', value: message.author.tag },
                    { name: 'Voice Channel', value: voiceChannel.name },
                    { name: 'Reason', value: reason }
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
                        .setTitle('Member Voice Kicked')
                        .setDescription(`**${target.user.tag}** has been kicked from the voice channel.`)
                        .addFields(
                            { name: 'User ID', value: target.id },
                            { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },
                            { name: 'Voice Channel', value: voiceChannel.name },
                            { name: 'Reason', value: reason }
                        )
                        .setColor('#FFA500')
                        .setThumbnail(target.user.displayAvatarURL())
                        .setTimestamp();
                    
                    logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }
        } catch (error) {
            console.error(`Error voice kicking user: ${error}`);
            message.reply(`Failed to voice kick ${target.user.tag}: ${error.message}`);
        }
    }
}; 