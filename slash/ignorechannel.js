const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ignorechannel')
        .setDescription('Manage channels that should be ignored by moderation features')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a channel to the ignored list')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to add to the ignored list')
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildAnnouncement)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a channel from the ignored list')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to remove from the ignored list')
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildAnnouncement)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all ignored channels')),
    
    async execute(interaction, client) {
        // Initialize ignored channels collection if it doesn't exist
        if (!client.ignoredChannels) {
            client.ignoredChannels = new Map();
        }
        
        // Get guild ignored channels
        if (!client.ignoredChannels.has(interaction.guild.id)) {
            client.ignoredChannels.set(interaction.guild.id, new Set());
        }
        
        const ignoredChannels = client.ignoredChannels.get(interaction.guild.id);
        const subCommand = interaction.options.getSubcommand();
        
        switch (subCommand) {
            case 'add': {
                const channel = interaction.options.getChannel('channel');
                
                // Check if channel is already in ignored list
                if (ignoredChannels.has(channel.id)) {
                    return interaction.reply({ 
                        content: `${channel.name} is already in the ignored channels list.`,
                        ephemeral: true 
                    });
                }
                
                // Add channel to ignored list
                ignoredChannels.add(channel.id);
                client.ignoredChannels.set(interaction.guild.id, ignoredChannels);
                
                // Create embed
                const embed = new EmbedBuilder()
                    .setTitle('Ignored Channel Added')
                    .setDescription(`${channel} has been added to the ignored channels list.`)
                    .setColor('#00FF00')
                    .setFooter({ text: `Added by ${interaction.user.tag}` })
                    .setTimestamp();
                
                return interaction.reply({ embeds: [embed] });
            }
            
            case 'remove': {
                const channel = interaction.options.getChannel('channel');
                
                // Check if channel is in ignored list
                if (!ignoredChannels.has(channel.id)) {
                    return interaction.reply({ 
                        content: `${channel.name} is not in the ignored channels list.`,
                        ephemeral: true 
                    });
                }
                
                // Remove channel from ignored list
                ignoredChannels.delete(channel.id);
                client.ignoredChannels.set(interaction.guild.id, ignoredChannels);
                
                // Create embed
                const embed = new EmbedBuilder()
                    .setTitle('Ignored Channel Removed')
                    .setDescription(`${channel} has been removed from the ignored channels list.`)
                    .setColor('#FF0000')
                    .setFooter({ text: `Removed by ${interaction.user.tag}` })
                    .setTimestamp();
                
                return interaction.reply({ embeds: [embed] });
            }
            
            case 'list': {
                // Check if ignored channels list is empty
                if (ignoredChannels.size === 0) {
                    return interaction.reply({ 
                        content: 'The ignored channels list is empty.',
                        ephemeral: true 
                    });
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
                    const channel = interaction.guild.channels.cache.get(channelId);
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
                
                return interaction.reply({ embeds: [embed] });
            }
        }
    }
}; 