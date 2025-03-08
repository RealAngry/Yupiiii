const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    name: 'ignorechannel',
    description: 'Manage channels that should be ignored by moderation features',
    usage: 'ignorechannel [add/remove/list] [channel]',
    category: 'config',
    aliases: ['igch', 'ignorech'],
    permissions: PermissionFlagsBits.ManageGuild,
    cooldown: 5,
    examples: [
        'ignorechannel add #general',
        'ignorechannel remove #general',
        'ignorechannel list'
    ],
    execute(client, message, args) {
        // Initialize ignored channels collection if it doesn't exist
        if (!client.ignoredChannels) {
            client.ignoredChannels = new Map();
        }
        
        // Get guild ignored channels
        if (!client.ignoredChannels.has(message.guild.id)) {
            client.ignoredChannels.set(message.guild.id, new Set());
        }
        
        const ignoredChannels = client.ignoredChannels.get(message.guild.id);
        const subCommand = args[0]?.toLowerCase();
        
        if (!subCommand || !['add', 'remove', 'list'].includes(subCommand)) {
            const embed = new EmbedBuilder()
                .setTitle('Ignore Channel Command Help')
                .setDescription('Manage channels that should be ignored by moderation features')
                .addFields(
                    { name: 'Add a channel to ignored list', value: `\`${client.prefix}ignorechannel add #channel\`` },
                    { name: 'Remove a channel from ignored list', value: `\`${client.prefix}ignorechannel remove #channel\`` },
                    { name: 'List all ignored channels', value: `\`${client.prefix}ignorechannel list\`` }
                )
                .setColor('#00FFFF')
                .setFooter({ text: 'Ignore Channel System' });
            
            return message.reply({ embeds: [embed] });
        }
        
        switch (subCommand) {
            case 'add': {
                // Check for required arguments
                if (!args[1]) {
                    return message.reply('Please mention a channel to add to the ignored list.');
                }
                
                // Get channel from mention
                const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
                if (!channel) {
                    return message.reply('Please mention a valid channel.');
                }
                
                // Check if channel is already in ignored list
                if (ignoredChannels.has(channel.id)) {
                    return message.reply(`${channel.name} is already in the ignored channels list.`);
                }
                
                // Add channel to ignored list
                ignoredChannels.add(channel.id);
                client.ignoredChannels.set(message.guild.id, ignoredChannels);
                
                // Create embed
                const embed = new EmbedBuilder()
                    .setTitle('Ignored Channel Added')
                    .setDescription(`${channel} has been added to the ignored channels list.`)
                    .setColor('#00FF00')
                    .setFooter({ text: `Added by ${message.author.tag}` })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            case 'remove': {
                // Check for required arguments
                if (!args[1]) {
                    return message.reply('Please mention a channel to remove from the ignored list.');
                }
                
                // Get channel from mention
                const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
                if (!channel) {
                    return message.reply('Please mention a valid channel.');
                }
                
                // Check if channel is in ignored list
                if (!ignoredChannels.has(channel.id)) {
                    return message.reply(`${channel.name} is not in the ignored channels list.`);
                }
                
                // Remove channel from ignored list
                ignoredChannels.delete(channel.id);
                client.ignoredChannels.set(message.guild.id, ignoredChannels);
                
                // Create embed
                const embed = new EmbedBuilder()
                    .setTitle('Ignored Channel Removed')
                    .setDescription(`${channel} has been removed from the ignored channels list.`)
                    .setColor('#FF0000')
                    .setFooter({ text: `Removed by ${message.author.tag}` })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            case 'list': {
                // Check if ignored channels list is empty
                if (ignoredChannels.size === 0) {
                    return message.reply('The ignored channels list is empty.');
                }
                
                // Create embed
                const embed = new EmbedBuilder()
                    .setTitle('Ignored Channels List')
                    .setDescription('Channels that are ignored by moderation features:')
                    .setColor('#00FFFF')
                    .setFooter({ text: `Total: ${ignoredChannels.size} channels` })
                    .setTimestamp();
                
                // Add channels to embed
                const channelsList = Array.from(ignoredChannels).map(channelId => {
                    const channel = message.guild.channels.cache.get(channelId);
                    return channel ? `• ${channel} (${channelId})` : `• Deleted Channel (${channelId})`;
                });
                
                // Split into chunks if there are many channels
                const chunkSize = 15;
                for (let i = 0; i < channelsList.length; i += chunkSize) {
                    const chunk = channelsList.slice(i, i + chunkSize);
                    embed.addFields({ 
                        name: `Channels ${i + 1}-${Math.min(i + chunkSize, channelsList.length)}`, 
                        value: chunk.join('\n') 
                    });
                }
                
                return message.reply({ embeds: [embed] });
            }
        }
    }
}; 