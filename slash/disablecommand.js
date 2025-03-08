const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const DisabledCommand = require('../models/DisabledCommand');
const { getCommandCategory, getAllCategories, getCommandsInCategory } = require('../utils/commandUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('disablecommand')
        .setDescription('Disable a command or category in a channel or server-wide')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => 
            option.setName('target')
                .setDescription('The command or category to disable')
                .setRequired(true))
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('The channel to disable the command in (leave empty for server-wide)')
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
            if (isCategory) {
                // Disable the entire category
                await DisabledCommand.create({
                    guildId: interaction.guild.id,
                    channelId: channelId,
                    command: null,
                    category: targetName,
                    disabledBy: interaction.user.id
                });
                
                const embed = new EmbedBuilder()
                    .setTitle('Category Disabled')
                    .setDescription(`The \`${targetName}\` category has been disabled ${channel ? `in ${channel}` : 'server-wide'}.`)
                    .setColor('#FF5555')
                    .setFooter({ text: `Disabled by ${interaction.user.tag}` })
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [embed] });
            } else {
                // Disable the specific command
                await DisabledCommand.create({
                    guildId: interaction.guild.id,
                    channelId: channelId,
                    command: targetName,
                    category: null,
                    disabledBy: interaction.user.id
                });
                
                const embed = new EmbedBuilder()
                    .setTitle('Command Disabled')
                    .setDescription(`The \`${targetName}\` command has been disabled ${channel ? `in ${channel}` : 'server-wide'}.`)
                    .setColor('#FF5555')
                    .setFooter({ text: `Disabled by ${interaction.user.tag}` })
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error disabling command:', error);
            
            // Check if it's a duplicate key error (command already disabled)
            if (error.code === 11000) {
                return interaction.editReply(`The ${isCategory ? 'category' : 'command'} \`${targetName}\` is already disabled ${channel ? `in ${channel}` : 'server-wide'}.`);
            }
            
            return interaction.editReply('An error occurred while trying to disable the command.');
        }
    }
}; 