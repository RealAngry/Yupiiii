const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unhidechannel')
        .setDescription('Unhide a channel for everyone')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to unhide (defaults to current channel)')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildAnnouncement, ChannelType.GuildForum)
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for unhiding the channel')
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
            // Unhide channel for @everyone role
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                ViewChannel: null // Reset to default
            });
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('Channel Unhidden')
                .setDescription(`${channel} has been unhidden for everyone.`)
                .addFields({ name: 'Reason', value: reason })
                .setColor('#00FF00')
                .setFooter({ text: `Unhidden by ${interaction.user.tag}` })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`Error unhiding channel: ${error}`);
            await interaction.reply({ 
                content: `Failed to unhide ${channel}. Please check my permissions and try again.`,
                ephemeral: true 
            });
        }
    }
}; 