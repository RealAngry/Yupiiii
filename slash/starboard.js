const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
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
    data: new SlashCommandBuilder()
        .setName('starboard')
        .setDescription('Configure the starboard feature to highlight popular messages')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Set the channel for starboard posts')
                .addChannelOption(option => 
                    option.setName('channel')
                        .setDescription('The channel to use for starboard posts')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('threshold')
                .setDescription('Set how many ⭐ reactions are needed')
                .addIntegerOption(option => 
                    option.setName('count')
                        .setDescription('Number of reactions needed (1-100)')
                        .setMinValue(1)
                        .setMaxValue(100)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('ignore')
                .setDescription('Prevent messages from a channel being starred')
                .addChannelOption(option => 
                    option.setName('channel')
                        .setDescription('The channel to ignore')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('unignore')
                .setDescription('Allow messages from a channel to be starred again')
                .addChannelOption(option => 
                    option.setName('channel')
                        .setDescription('The channel to unignore')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('enable')
                .setDescription('Turn on the starboard'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Turn off the starboard'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Show current starboard configuration')),
    
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'setup':
                return setupStarboard(interaction);
            case 'threshold':
                return setThreshold(interaction);
            case 'ignore':
                return ignoreChannel(interaction);
            case 'unignore':
                return unignoreChannel(interaction);
            case 'enable':
                return toggleStarboard(interaction, true);
            case 'disable':
                return toggleStarboard(interaction, false);
            case 'status':
                return showStatus(interaction);
        }
    }
};

// Set up the starboard channel
async function setupStarboard(interaction) {
    const channel = interaction.options.getChannel('channel');
    
    // Check if the bot has permission to send messages in the channel
    if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages)) {
        return interaction.reply({ 
            content: `I don't have permission to send messages in ${channel}. Please give me the required permissions.`,
            ephemeral: true 
        });
    }
    
    try {
        // Update or create starboard config
        const starboard = await Starboard.findOneAndUpdate(
            { guildId: interaction.guild.id },
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
            .setFooter({ text: `Configured by ${interaction.user.tag}` })
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error setting up starboard:', error);
        return interaction.reply({ 
            content: 'There was an error setting up the starboard. Please try again later.',
            ephemeral: true 
        });
    }
}

// Set the threshold for star reactions
async function setThreshold(interaction) {
    const threshold = interaction.options.getInteger('count');
    
    try {
        // Check if starboard exists
        const starboard = await Starboard.findOne({ guildId: interaction.guild.id });
        
        if (!starboard) {
            return interaction.reply({ 
                content: 'Starboard has not been set up yet. Use `/starboard setup` first.',
                ephemeral: true 
            });
        }
        
        // Update threshold
        starboard.threshold = threshold;
        starboard.updatedAt = new Date();
        await starboard.save();
        
        const embed = new EmbedBuilder()
            .setTitle('Starboard Threshold Updated')
            .setDescription(`Messages now need ${threshold} ⭐ reactions to be posted to the starboard.`)
            .setColor('#FFD700')
            .setFooter({ text: `Updated by ${interaction.user.tag}` })
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error setting starboard threshold:', error);
        return interaction.reply({ 
            content: 'There was an error updating the threshold. Please try again later.',
            ephemeral: true 
        });
    }
}

// Ignore a channel for starboard
async function ignoreChannel(interaction) {
    const channel = interaction.options.getChannel('channel');
    
    try {
        // Check if starboard exists
        const starboard = await Starboard.findOne({ guildId: interaction.guild.id });
        
        if (!starboard) {
            return interaction.reply({ 
                content: 'Starboard has not been set up yet. Use `/starboard setup` first.',
                ephemeral: true 
            });
        }
        
        // Check if channel is already ignored
        if (starboard.ignoredChannels.includes(channel.id)) {
            return interaction.reply({ 
                content: `${channel} is already ignored for starboard.`,
                ephemeral: true 
            });
        }
        
        // Add channel to ignored list
        starboard.ignoredChannels.push(channel.id);
        starboard.updatedAt = new Date();
        await starboard.save();
        
        const embed = new EmbedBuilder()
            .setTitle('Starboard Channel Ignored')
            .setDescription(`Messages from ${channel} will no longer be posted to the starboard.`)
            .setColor('#FFD700')
            .setFooter({ text: `Updated by ${interaction.user.tag}` })
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error ignoring channel for starboard:', error);
        return interaction.reply({ 
            content: 'There was an error updating the ignored channels. Please try again later.',
            ephemeral: true 
        });
    }
}

// Unignore a channel for starboard
async function unignoreChannel(interaction) {
    const channel = interaction.options.getChannel('channel');
    
    try {
        // Check if starboard exists
        const starboard = await Starboard.findOne({ guildId: interaction.guild.id });
        
        if (!starboard) {
            return interaction.reply({ 
                content: 'Starboard has not been set up yet. Use `/starboard setup` first.',
                ephemeral: true 
            });
        }
        
        // Check if channel is not ignored
        if (!starboard.ignoredChannels.includes(channel.id)) {
            return interaction.reply({ 
                content: `${channel} is not ignored for starboard.`,
                ephemeral: true 
            });
        }
        
        // Remove channel from ignored list
        starboard.ignoredChannels = starboard.ignoredChannels.filter(id => id !== channel.id);
        starboard.updatedAt = new Date();
        await starboard.save();
        
        const embed = new EmbedBuilder()
            .setTitle('Starboard Channel Unignored')
            .setDescription(`Messages from ${channel} can now be posted to the starboard again.`)
            .setColor('#FFD700')
            .setFooter({ text: `Updated by ${interaction.user.tag}` })
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error unignoring channel for starboard:', error);
        return interaction.reply({ 
            content: 'There was an error updating the ignored channels. Please try again later.',
            ephemeral: true 
        });
    }
}

// Enable or disable the starboard
async function toggleStarboard(interaction, enable) {
    try {
        // Check if starboard exists
        const starboard = await Starboard.findOne({ guildId: interaction.guild.id });
        
        if (!starboard) {
            return interaction.reply({ 
                content: 'Starboard has not been set up yet. Use `/starboard setup` first.',
                ephemeral: true 
            });
        }
        
        // Update enabled status
        starboard.enabled = enable;
        starboard.updatedAt = new Date();
        await starboard.save();
        
        const embed = new EmbedBuilder()
            .setTitle(`Starboard ${enable ? 'Enabled' : 'Disabled'}`)
            .setDescription(`The starboard has been ${enable ? 'enabled' : 'disabled'}.`)
            .setColor('#FFD700')
            .setFooter({ text: `Updated by ${interaction.user.tag}` })
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error toggling starboard:', error);
        return interaction.reply({ 
            content: 'There was an error updating the starboard status. Please try again later.',
            ephemeral: true 
        });
    }
}

// Show current starboard status
async function showStatus(interaction) {
    try {
        // Check if starboard exists
        const starboard = await Starboard.findOne({ guildId: interaction.guild.id });
        
        if (!starboard) {
            return interaction.reply({ 
                content: 'Starboard has not been set up yet. Use `/starboard setup` first.',
                ephemeral: true 
            });
        }
        
        const starboardChannel = interaction.guild.channels.cache.get(starboard.channelId);
        const channelStatus = starboardChannel ? `${starboardChannel}` : 'Channel not found or deleted';
        
        const ignoredChannelsText = starboard.ignoredChannels.length > 0
            ? starboard.ignoredChannels.map(id => {
                const channel = interaction.guild.channels.cache.get(id);
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
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error showing starboard status:', error);
        return interaction.reply({ 
            content: 'There was an error retrieving the starboard status. Please try again later.',
            ephemeral: true 
        });
    }
} 