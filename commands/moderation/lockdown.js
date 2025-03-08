const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'lockdown',
    description: 'Lock or unlock a channel to prevent members from sending messages',
    usage: 'lockdown [on/off] [reason]',
    category: 'moderation',
    aliases: ['lock', 'unlock'],
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageChannels],
    async execute(client, message, args) {
        // Get the channel (current channel or mentioned channel)
        const channel = message.mentions.channels.first() || message.channel;
        
        // Check if bot has permission to manage the channel
        if (!channel.permissionsFor(message.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
            return message.reply(`I don't have permission to manage ${channel}.`);
        }
        
        // Default to toggle if no argument provided
        let lockStatus = !channel.permissionsFor(message.guild.roles.everyone).has(PermissionFlagsBits.SendMessages);
        
        // Check if a specific option was provided
        if (args[0]) {
            if (['on', 'enable', 'lock'].includes(args[0].toLowerCase())) {
                lockStatus = true;
            } else if (['off', 'disable', 'unlock'].includes(args[0].toLowerCase())) {
                lockStatus = false;
            }
        }
        
        // Get reason
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        try {
            // Update permissions
            await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                SendMessages: !lockStatus
            }, { reason: `Lockdown ${lockStatus ? 'enabled' : 'disabled'} by ${message.author.tag}: ${reason}` });
            
            // Create embed
            const embed = new EmbedBuilder()
                .setTitle(`Channel ${lockStatus ? 'Locked' : 'Unlocked'}`)
                .setDescription(`${channel} has been ${lockStatus ? 'locked' : 'unlocked'}.`)
                .addFields(
                    { name: 'Moderator', value: message.author.tag },
                    { name: 'Reason', value: reason }
                )
                .setColor(lockStatus ? '#FF0000' : '#00FF00')
                .setFooter({ text: `Channel ID: ${channel.id}` })
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
            
            // Send notification in the affected channel if it's not the current channel
            if (channel.id !== message.channel.id) {
                const notificationEmbed = new EmbedBuilder()
                    .setTitle(`Channel ${lockStatus ? 'Locked' : 'Unlocked'}`)
                    .setDescription(`This channel has been ${lockStatus ? 'locked' : 'unlocked'} by ${message.author}.`)
                    .addFields({ name: 'Reason', value: reason })
                    .setColor(lockStatus ? '#FF0000' : '#00FF00')
                    .setTimestamp();
                
                channel.send({ embeds: [notificationEmbed] }).catch(() => {});
            }
            
            // Get guild settings
            const guildSettings = client.settings?.get(message.guild.id) || {};
            
            // Log to channel if set
            const logChannelId = guildSettings.logChannel;
            if (logChannelId) {
                const logChannel = message.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle(`Channel ${lockStatus ? 'Locked' : 'Unlocked'}`)
                        .setDescription(`${channel} has been ${lockStatus ? 'locked' : 'unlocked'}.`)
                        .addFields(
                            { name: 'Channel', value: `${channel} (${channel.id})` },
                            { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },
                            { name: 'Reason', value: reason }
                        )
                        .setColor(lockStatus ? '#FF0000' : '#00FF00')
                        .setTimestamp();
                    
                    logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }
        } catch (error) {
            console.error(`Error in lockdown command: ${error}`);
            message.reply(`Failed to ${lockStatus ? 'lock' : 'unlock'} the channel: ${error.message}`);
        }
    }
}; 