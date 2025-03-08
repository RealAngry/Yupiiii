const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlockchannel')
        .setDescription('Unlock a channel to allow members to send messages')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to unlock (defaults to current channel)')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildAnnouncement, ChannelType.GuildForum)
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for unlocking the channel')
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
            // Unlock channel for @everyone role
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: null, // Reset to default
                AddReactions: null  // Reset to default
            });
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('Channel Unlocked')
                .setDescription(`${channel} has been unlocked. Members can now send messages.`)
                .addFields({ name: 'Reason', value: reason })
                .setColor('#00FF00')
                .setFooter({ text: `Unlocked by ${interaction.user.tag}` })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
            // Send notification in the unlocked channel
            if (channel.id !== interaction.channel.id) {
                const unlockNotification = new EmbedBuilder()
                    .setTitle('🔓 Channel Unlocked')
                    .setDescription(`This channel has been unlocked by a moderator.`)
                    .addFields({ name: 'Reason', value: reason })
                    .setColor('#00FF00')
                    .setFooter({ text: `Unlocked by ${interaction.user.tag}` })
                    .setTimestamp();
                
                await channel.send({ embeds: [unlockNotification] }).catch(() => {
                    // If we can't send a message, just ignore
                });
            }
        } catch (error) {
            console.error(`Error unlocking channel: ${error}`);
            await interaction.reply({ 
                content: `Failed to unlock ${channel}. Please check my permissions and try again.`,
                ephemeral: true 
            });
        }
    }
}; 