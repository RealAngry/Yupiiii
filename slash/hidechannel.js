const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hidechannel')
        .setDescription('Hide a channel from everyone')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to hide (defaults to current channel)')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildAnnouncement, ChannelType.GuildForum)
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for hiding the channel')
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
            // Hide channel from @everyone role
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                ViewChannel: false
            });
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('Channel Hidden')
                .setDescription(`${channel} has been hidden from everyone.`)
                .addFields({ name: 'Reason', value: reason })
                .setColor('#00FF00')
                .setFooter({ text: `Hidden by ${interaction.user.tag}` })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`Error hiding channel: ${error}`);
            await interaction.reply({ 
                content: `Failed to hide ${channel}. Please check my permissions and try again.`,
                ephemeral: true 
            });
        }
    }
};