const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lockchannel')
        .setDescription('Lock a channel to prevent members from sending messages')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to lock (defaults to current channel)')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildAnnouncement, ChannelType.GuildForum)
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for locking the channel')
                .setRequired(false)),
    
    async execute(interaction, client) {
        // Get target channel (option or current)
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        // Check if bot has permission to manage the channel
        if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ 
                content: `I don't have permission to manage ${channel}.`,
                ephemeral: true 
            });
        }
        
        try {
            // Lock channel for @everyone role
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: false,
                AddReactions: false
            });
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('Channel Locked')
                .setDescription(`${channel} has been locked. Members can no longer send messages.`)
                .addFields({ name: 'Reason', value: reason })
                .setColor('#FF0000')
                .setFooter({ text: `Locked by ${interaction.user.tag}` })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
            // Send notification in the locked channel
            if (channel.id !== interaction.channel.id) {
                const lockNotification = new EmbedBuilder()
                    .setTitle('🔒 Channel Locked')
                    .setDescription(`This channel has been locked by a moderator.`)
                    .addFields({ name: 'Reason', value: reason })
                    .setColor('#FF0000')
                    .setFooter({ text: `Locked by ${interaction.user.tag}` })
                    .setTimestamp();
                
                await channel.send({ embeds: [lockNotification] }).catch(() => {
                    // If we can't send a message, just ignore
                });
            }
        } catch (error) {
            console.error(`Error locking channel: ${error}`);
            await interaction.reply({ 
                content: `Failed to lock ${channel}. Please check my permissions and try again.`,
                ephemeral: true 
            });
        }
    }
}; 