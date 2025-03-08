const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const DisabledCommand = require('../models/DisabledCommand');
const { getCommandCategory, getAllCategories } = require('../utils/commandUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('enablecommand')
        .setDescription('Enable a previously disabled command or category')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => 
            option.setName('target')
                .setDescription('The command or category to enable')
                .setRequired(true))
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('The channel to enable the command in (leave empty for server-wide)')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)),
    
    async execute(interaction, client) {
        await interaction.deferReply();
        
        const targetName = interaction.options.getString('target').toLowerCase();
        const channel = interaction.options.getChannel('channel');
        const channelId = channel ? channel.id : null;
        
        // Check if the target is a category
        const allCategories = getAllCategories();
        const isCategory = allCategories.includes(targetName);
        
        // Check if the target is a command
        const commandCategory = getCommandCategory(targetName);
        const isCommand = commandCategory !== null;
        
        if (!isCategory && !isCommand) {
            return interaction.editReply(`\`${targetName}\` is not a valid command or category.`);
        }
        
        try {
            let result;
            
            if (isCategory) {
                // Enable the entire category
                result = await DisabledCommand.deleteOne({
                    guildId: interaction.guild.id,
                    channelId: channelId,
                    category: targetName
                });
                
                if (result.deletedCount === 0) {
                    return interaction.editReply(`The \`${targetName}\` category is not disabled ${channel ? `in ${channel}` : 'server-wide'}.`);
                }
                
                const embed = new EmbedBuilder()
                    .setTitle('Category Enabled')
                    .setDescription(`The \`${targetName}\` category has been enabled ${channel ? `in ${channel}` : 'server-wide'}.`)
                    .setColor('#55FF55')
                    .setFooter({ text: `Enabled by ${interaction.user.tag}` })
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [embed] });
            } else {
                // Enable the specific command
                result = await DisabledCommand.deleteOne({
                    guildId: interaction.guild.id,
                    channelId: channelId,
                    command: targetName
                });
                
                if (result.deletedCount === 0) {
                    return interaction.editReply(`The \`${targetName}\` command is not disabled ${channel ? `in ${channel}` : 'server-wide'}.`);
                }
                
                const embed = new EmbedBuilder()
                    .setTitle('Command Enabled')
                    .setDescription(`The \`${targetName}\` command has been enabled ${channel ? `in ${channel}` : 'server-wide'}.`)
                    .setColor('#55FF55')
                    .setFooter({ text: `Enabled by ${interaction.user.tag}` })
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error enabling command:', error);
            return interaction.editReply('An error occurred while trying to enable the command.');
        }
    }
};