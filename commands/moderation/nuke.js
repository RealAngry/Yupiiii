const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationCase = require('../../models/ModerationCase');

module.exports = {
    name: 'nuke',
    description: 'Completely clear a channel by cloning it and deleting the original',
    usage: 'nuke [channel] [reason]',
    category: 'moderation',
    aliases: ['nukechannel'],
    permissions: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.Administrator],
    cooldown: 30,
    examples: [
        'nuke',
        'nuke #general',
        'nuke #general Too much spam'
    ],
    async execute(client, message, args) {
        // Check if user has permission
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels) || 
            !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('You need the Manage Channels and Administrator permissions to use this command.');
        }
        
        // Check if bot has permission
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return message.reply('I do not have permission to manage channels.');
        }
        
        // Get target channel
        let channel = message.mentions.channels.first() || message.channel;
        
        // Get reason
        const reason = args.filter(arg => !arg.startsWith('<#')).join(' ') || 'No reason provided';
        
        // Confirmation message
        const confirmEmbed = new EmbedBuilder()
            .setTitle('⚠️ Channel Nuke Confirmation')
            .setDescription(`Are you sure you want to nuke ${channel}? This will delete all messages in the channel permanently.`)
            .addFields(
                { name: 'Channel', value: `${channel}`, inline: true },
                { name: 'Reason', value: reason, inline: true }
            )
            .setColor('#FF0000')
            .setFooter({ text: 'Reply with "yes" to confirm or "no" to cancel within 30 seconds' })
            .setTimestamp();
        
        const confirmMsg = await message.reply({ embeds: [confirmEmbed] });
        
        // Create a filter for the collector
        const filter = m => m.author.id === message.author.id && ['yes', 'no'].includes(m.content.toLowerCase());
        
        // Create a message collector
        const collector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });
        
        collector.on('collect', async m => {
            if (m.content.toLowerCase() === 'yes') {
                try {
                    // Send a message that will be kept in the new channel
                    const nukeMessage = await channel.send('This channel is being nuked...');
                    
                    // Clone the channel
                    const position = channel.position;
                    const newChannel = await channel.clone({
                        reason: `Nuked by ${message.author.tag}: ${reason}`
                    });
                    
                    // Set the position to be the same as the original
                    await newChannel.setPosition(position);
                    
                    // Delete the original channel
                    await channel.delete(`Nuked by ${message.author.tag}: ${reason}`);
                    
                    // Create moderation case
                    const highestCase = await ModerationCase.findOne({})
                        .sort({ caseNumber: -1 })
                        .limit(1);
                    
                    const caseNumber = highestCase ? highestCase.caseNumber + 1 : 1;
                    
                    const newCase = new ModerationCase({
                        caseNumber: caseNumber,
                        userId: message.author.id, // In this case, the user is the one who initiated the action
                        moderatorId: message.author.id,
                        action: 'channel_nuke',
                        reason: `Channel: ${channel.name} - ${reason}`,
                        timestamp: new Date()
                    });
                    
                    await newCase.save();
                    
                    // Send success message in the new channel
                    const embed = new EmbedBuilder()
                        .setTitle('💥 Channel Nuked')
                        .setDescription(`This channel has been nuked by ${message.author.tag}`)
                        .addFields(
                            { name: 'Reason', value: reason },
                            { name: 'Case ID', value: `#${caseNumber}` }
                        )
                        .setColor('#FF9900')
                        .setImage('https://media.giphy.com/media/oe33xf3B50fsc/giphy.gif')
                        .setFooter({ text: `Nuked by ${message.author.tag}` })
                        .setTimestamp();
                    
                    return newChannel.send({ embeds: [embed] });
                } catch (error) {
                    console.error('Error nuking channel:', error);
                    return message.reply('There was an error nuking the channel. Please check my permissions and try again.');
                }
            } else {
                return message.reply('Channel nuke cancelled.');
            }
        });
        
        collector.on('end', collected => {
            if (collected.size === 0) {
                message.reply('Channel nuke cancelled due to timeout.');
            }
        });
    }
}; 