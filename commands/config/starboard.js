const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const mongoose = require('mongoose');

// Create a Starboard schema if it doesn't exist
let Starboard;
try {
    Starboard = mongoose.model('Starboard');
} catch (error) {
    const StarboardSchema = new mongoose.Schema({
        guildId: { type: String, required: true, unique: true },
        channelId: { type: String, required: true },
        threshold: { type: Number, default: 3 },
        enabled: { type: Boolean, default: true },
        ignoredChannels: [String],
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    });
    
    Starboard = mongoose.model('Starboard', StarboardSchema);
}

module.exports = {
    name: 'starboard',
    description: 'Configure the starboard feature to highlight popular messages',
    usage: 'starboard <action> [options]',
    category: 'config',
    aliases: ['star'],
    cooldown: 10,
    permissions: [PermissionFlagsBits.ManageGuild],
    examples: [
        'starboard setup #starboard',
        'starboard threshold 5',
        'starboard ignore #general',
        'starboard unignore #general',
        'starboard enable',
        'starboard disable',
        'starboard status'
    ],
    async execute(client, message, args) {
        if (!args.length) {
            return message.reply('Please specify an action. Use `starboard help` for more information.');
        }
        
        const action = args[0].toLowerCase();
        
        if (action === 'help') {
            return showHelp(message);
        }
        
        // All other actions require proper permissions
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply('You need the Manage Server permission to configure the starboard.');
        }
        
        switch (action) {
            case 'setup':
                return setupStarboard(message, args);
            case 'threshold':
                return setThreshold(message, args);
            case 'ignore':
                return ignoreChannel(message, args);
            case 'unignore':
                return unignoreChannel(message, args);
            case 'enable':
                return toggleStarboard(message, true);
            case 'disable':
                return toggleStarboard(message, false);
            case 'status':
                return showStatus(message);
            default:
                return message.reply(`Unknown action \`${action}\`. Use \`starboard help\` for more information.`);
        }
    }
};

// Show help information
function showHelp(message) {
    const embed = new EmbedBuilder()
        .setTitle('Starboard Help')
        .setDescription('The starboard feature highlights popular messages by reposting them to a dedicated channel when they receive a certain number of ⭐ reactions.')
        .addFields(
            { name: 'Setup', value: '`starboard setup #channel` - Set the channel for starboard posts' },
            { name: 'Threshold', value: '`starboard threshold <number>` - Set how many ⭐ reactions are needed (default: 3)' },
            { name: 'Ignore Channels', value: '`starboard ignore #channel` - Prevent messages from a channel being starred\n`starboard unignore #channel` - Allow messages from a channel to be starred again' },
            { name: 'Toggle', value: '`starboard enable` - Turn on the starboard\n`starboard disable` - Turn off the starboard' },
            { name: 'Status', value: '`starboard status` - Show current starboard configuration' }
        )
        .setColor('#FFD700')
        .setFooter({ text: `Requested by ${message.author.tag}` })
        .setTimestamp();
    
    return message.reply({ embeds: [embed] });
}

// Set up the starboard channel
async function setupStarboard(message, args) {
    if (args.length < 2) {
        return message.reply('Please specify a channel. Example: `starboard setup #starboard`');
    }
    
    // Get the channel from mention, ID, or name
    const channelMention = message.mentions.channels.first();
    const channelId = channelMention ? channelMention.id : args[1].replace(/[<#>]/g, '');
    const channel = message.guild.channels.cache.get(channelId);
    
    if (!channel) {
        return message.reply('Invalid channel. Please mention a valid channel or provide its ID.');
    }
    
    // Check if the bot has permission to send messages in the channel
    if (!channel.permissionsFor(message.guild.members.me).has(PermissionFlagsBits.SendMessages)) {
        return message.reply(`I don't have permission to send messages in ${channel}. Please give me the required permissions.`);
    }
    
    try {
        // Update or create starboard config
        const starboard = await Starboard.findOneAndUpdate(
            { guildId: message.guild.id },
            { 
                channelId: channel.id,
                updatedAt: new Date(),
                enabled: true
            },
            { new: true, upsert: true }
        );
        
        const embed = new EmbedBuilder()
            .setTitle('Starboard Setup')
            .setDescription(`Starboard channel has been set to ${channel}`)
            .addFields(
                { name: 'Threshold', value: `${starboard.threshold} ⭐ reactions`, inline: true },
                { name: 'Status', value: starboard.enabled ? 'Enabled' : 'Disabled', inline: true }
            )
            .setColor('#FFD700')
            .setFooter({ text: `Configured by ${message.author.tag}` })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error setting up starboard:', error);
        return message.reply('There was an error setting up the starboard. Please try again later.');
    }
}

// Set the threshold for star reactions
async function setThreshold(message, args) {
    if (args.length < 2) {
        return message.reply('Please specify a threshold number. Example: `starboard threshold 5`');
    }
    
    const threshold = parseInt(args[1]);
    
    if (isNaN(threshold) || threshold < 1 || threshold > 100) {
        return message.reply('Please provide a valid threshold between 1 and 100.');
    }
    
    try {
        // Check if starboard exists
        const starboard = await Starboard.findOne({ guildId: message.guild.id });
        
        if (!starboard) {
            return message.reply('Starboard has not been set up yet. Use `starboard setup #channel` first.');
        }
        
        // Update threshold
        starboard.threshold = threshold;
        starboard.updatedAt = new Date();
        await starboard.save();
        
        const embed = new EmbedBuilder()
            .setTitle('Starboard Threshold Updated')
            .setDescription(`Messages now need ${threshold} ⭐ reactions to be posted to the starboard.`)
            .setColor('#FFD700')
            .setFooter({ text: `Updated by ${message.author.tag}` })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error setting starboard threshold:', error);
        return message.reply('There was an error updating the threshold. Please try again later.');
    }
}

// Ignore a channel for starboard
async function ignoreChannel(message, args) {
    if (args.length < 2) {
        return message.reply('Please specify a channel. Example: `starboard ignore #general`');
    }
    
    // Get the channel from mention, ID, or name
    const channelMention = message.mentions.channels.first();
    const channelId = channelMention ? channelMention.id : args[1].replace(/[<#>]/g, '');
    const channel = message.guild.channels.cache.get(channelId);
    
    if (!channel) {
        return message.reply('Invalid channel. Please mention a valid channel or provide its ID.');
    }
    
    try {
        // Check if starboard exists
        const starboard = await Starboard.findOne({ guildId: message.guild.id });
        
        if (!starboard) {
            return message.reply('Starboard has not been set up yet. Use `starboard setup #channel` first.');
        }
        
        // Check if channel is already ignored
        if (starboard.ignoredChannels.includes(channel.id)) {
            return message.reply(`${channel} is already ignored for starboard.`);
        }
        
        // Add channel to ignored list
        starboard.ignoredChannels.push(channel.id);
        starboard.updatedAt = new Date();
        await starboard.save();
        
        const embed = new EmbedBuilder()
            .setTitle('Starboard Channel Ignored')
            .setDescription(`Messages from ${channel} will no longer be posted to the starboard.`)
            .setColor('#FFD700')
            .setFooter({ text: `Updated by ${message.author.tag}` })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error ignoring channel for starboard:', error);
        return message.reply('There was an error updating the ignored channels. Please try again later.');
    }
}

// Unignore a channel for starboard
async function unignoreChannel(message, args) {
    if (args.length < 2) {
        return message.reply('Please specify a channel. Example: `starboard unignore #general`');
    }
    
    // Get the channel from mention, ID, or name
    const channelMention = message.mentions.channels.first();
    const channelId = channelMention ? channelMention.id : args[1].replace(/[<#>]/g, '');
    const channel = message.guild.channels.cache.get(channelId);
    
    if (!channel) {
        return message.reply('Invalid channel. Please mention a valid channel or provide its ID.');
    }
    
    try {
        // Check if starboard exists
        const starboard = await Starboard.findOne({ guildId: message.guild.id });
        
        if (!starboard) {
            return message.reply('Starboard has not been set up yet. Use `starboard setup #channel` first.');
        }
        
        // Check if channel is not ignored
        if (!starboard.ignoredChannels.includes(channel.id)) {
            return message.reply(`${channel} is not ignored for starboard.`);
        }
        
        // Remove channel from ignored list
        starboard.ignoredChannels = starboard.ignoredChannels.filter(id => id !== channel.id);
        starboard.updatedAt = new Date();
        await starboard.save();
        
        const embed = new EmbedBuilder()
            .setTitle('Starboard Channel Unignored')
            .setDescription(`Messages from ${channel} can now be posted to the starboard again.`)
            .setColor('#FFD700')
            .setFooter({ text: `Updated by ${message.author.tag}` })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error unignoring channel for starboard:', error);
        return message.reply('There was an error updating the ignored channels. Please try again later.');
    }
}

// Enable or disable the starboard
async function toggleStarboard(message, enable) {
    try {
        // Check if starboard exists
        const starboard = await Starboard.findOne({ guildId: message.guild.id });
        
        if (!starboard) {
            return message.reply('Starboard has not been set up yet. Use `starboard setup #channel` first.');
        }
        
        // Update enabled status
        starboard.enabled = enable;
        starboard.updatedAt = new Date();
        await starboard.save();
        
        const embed = new EmbedBuilder()
            .setTitle(`Starboard ${enable ? 'Enabled' : 'Disabled'}`)
            .setDescription(`The starboard has been ${enable ? 'enabled' : 'disabled'}.`)
            .setColor('#FFD700')
            .setFooter({ text: `Updated by ${message.author.tag}` })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error toggling starboard:', error);
        return message.reply('There was an error updating the starboard status. Please try again later.');
    }
}

// Show current starboard status
async function showStatus(message) {
    try {
        // Check if starboard exists
        const starboard = await Starboard.findOne({ guildId: message.guild.id });
        
        if (!starboard) {
            return message.reply('Starboard has not been set up yet. Use `starboard setup #channel` first.');
        }
        
        const starboardChannel = message.guild.channels.cache.get(starboard.channelId);
        const channelStatus = starboardChannel ? `${starboardChannel}` : 'Channel not found or deleted';
        
        const ignoredChannelsText = starboard.ignoredChannels.length > 0
            ? starboard.ignoredChannels.map(id => {
                const channel = message.guild.channels.cache.get(id);
                return channel ? `${channel}` : `Unknown (${id})`;
            }).join('\n')
            : 'None';
        
        const embed = new EmbedBuilder()
            .setTitle('Starboard Status')
            .addFields(
                { name: 'Channel', value: channelStatus, inline: true },
                { name: 'Threshold', value: `${starboard.threshold} ⭐ reactions`, inline: true },
                { name: 'Status', value: starboard.enabled ? 'Enabled' : 'Disabled', inline: true },
                { name: 'Ignored Channels', value: ignoredChannelsText }
            )
            .setColor('#FFD700')
            .setFooter({ text: `Requested by ${message.author.tag}` })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error showing starboard status:', error);
        return message.reply('There was an error retrieving the starboard status. Please try again later.');
    }
} 