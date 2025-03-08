const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'unhidechannel',
    description: 'Unhide a channel for everyone',
    usage: 'unhidechannel [channel] [reason]',
    category: 'moderation',
    aliases: ['unhide', 'showchannel', 'show'],
    permissions: PermissionFlagsBits.ManageChannels,
    cooldown: 5,
    examples: [
        'unhidechannel',
        'unhidechannel #general',
        'unhidechannel #general Maintenance complete'
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
        
        // Unhide channel for @everyone role
        channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            ViewChannel: null // Reset to default
        }).then(() => {
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('Channel Unhidden')
                .setDescription(`${channel} has been unhidden for everyone.`)
                .addFields({ name: 'Reason', value: reason })
                .setColor('#00FF00')
                .setFooter({ text: `Unhidden by ${message.author.tag}` })
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
        }).catch(error => {
            console.error(`Error unhiding channel: ${error}`);
            message.reply(`Failed to unhide ${channel}. Please check my permissions and try again.`);
        });
    }
};