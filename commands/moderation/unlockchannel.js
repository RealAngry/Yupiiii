const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'unlockchannel',
    description: 'Unlock a channel to allow members to send messages',
    usage: 'unlockchannel [channel] [reason]',
    category: 'moderation',
    aliases: ['unlock', 'unlockdown'],
    permissions: PermissionFlagsBits.ManageChannels,
    cooldown: 5,
    examples: [
        'unlockchannel',
        'unlockchannel #general',
        'unlockchannel #general Raid over'
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
        
        // Unlock channel for @everyone role
        channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            SendMessages: null, // Reset to default
            AddReactions: null  // Reset to default
        }).then(() => {
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('Channel Unlocked')
                .setDescription(`${channel} has been unlocked. Members can now send messages.`)
                .addFields({ name: 'Reason', value: reason })
                .setColor('#00FF00')
                .setFooter({ text: `Unlocked by ${message.author.tag}` })
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
            
            // Send notification in the unlocked channel
            if (channel.id !== message.channel.id) {
                const unlockNotification = new EmbedBuilder()
                    .setTitle('🔓 Channel Unlocked')
                    .setDescription(`This channel has been unlocked by a moderator.`)
                    .addFields({ name: 'Reason', value: reason })
                    .setColor('#00FF00')
                    .setFooter({ text: `Unlocked by ${message.author.tag}` })
                    .setTimestamp();
                
                channel.send({ embeds: [unlockNotification] }).catch(() => {
                    // If we can't send a message, just ignore
                });
            }
        }).catch(error => {
            console.error(`Error unlocking channel: ${error}`);
            message.reply(`Failed to unlock ${channel}. Please check my permissions and try again.`);
        });
    }
}; 