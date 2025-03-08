const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'lockchannel',
    description: 'Lock a channel to prevent members from sending messages',
    usage: 'lockchannel [channel] [reason]',
    category: 'moderation',
    aliases: ['lock', 'lockdown'],
    permissions: PermissionFlagsBits.ManageChannels,
    cooldown: 5,
    examples: [
        'lockchannel',
        'lockchannel #general',
        'lockchannel #general Raid prevention'
    ],
    execute(client, message, args) {
        // Get target channel (mentioned or current)
        let channel = message.mentions.channels.first();
        
        if (!channel && args[0]) {
            // Try to find by ID or name
            channel = message.guild.channels.cache.get(args[0]) || 
                     message.guild.channels.cache.find(c => 
                         c.name.toLowerCase() === args[0].toLowerCase() ||
                         c.name.toLowerCase().includes(args[0].toLowerCase())
                     );
        }
        
        // Default to current channel if no channel specified
        if (!channel) {
            channel = message.channel;
        }
        
        // Check if bot has permission to manage the channel
        if (!channel.permissionsFor(message.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
            return message.reply(`I don't have permission to manage ${channel}.`);
        }
        
        // Get reason
        const reasonIndex = args.findIndex(arg => arg === channel.name || arg === channel.id || arg.includes(channel.id));
        const reason = reasonIndex !== -1 
            ? args.slice(reasonIndex + 1).join(' ') || 'No reason provided' 
            : args.join(' ') || 'No reason provided';
        
        // Lock channel for @everyone role
        channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            SendMessages: false,
            AddReactions: false
        }).then(() => {
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('Channel Locked')
                .setDescription(`${channel} has been locked. Members can no longer send messages.`)
                .addFields({ name: 'Reason', value: reason })
                .setColor('#FF0000')
                .setFooter({ text: `Locked by ${message.author.tag}` })
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
            
            // Send notification in the locked channel
            if (channel.id !== message.channel.id) {
                const lockNotification = new EmbedBuilder()
                    .setTitle('🔒 Channel Locked')
                    .setDescription(`This channel has been locked by a moderator.`)
                    .addFields({ name: 'Reason', value: reason })
                    .setColor('#FF0000')
                    .setFooter({ text: `Locked by ${message.author.tag}` })
                    .setTimestamp();
                
                channel.send({ embeds: [lockNotification] }).catch(() => {
                    // If we can't send a message, just ignore
                });
            }
        }).catch(error => {
            console.error(`Error locking channel: ${error}`);
            message.reply(`Failed to lock ${channel}. Please check my permissions and try again.`);
        });
    }
}; 