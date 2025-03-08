const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const DisabledCommand = require('../../models/DisabledCommand');
const { getCommandCategory, getAllCategories } = require('../../utils/commandUtils');

module.exports = {
    name: 'enablecommand',
    description: 'Enable a previously disabled command or category',
    usage: 'enablecommand <command/category> [channel]',
    category: 'moderation',
    aliases: ['ecmd', 'enablecmd'],
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 5,
    examples: [
        'enablecommand ban',
        'enablecommand fun #general',
        'enablecommand moderation'
    ],
    async execute(message, args, client) {
        // Check if user has permission
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('You need Administrator permission to use this command.');
        }

        // Check if args are provided
        if (!args.length) {
            return message.reply('Please specify a command or category to enable.');
        }

        const targetName = args[0].toLowerCase();
        let channelId = null;
        let channel = null;

        // Check if a channel is mentioned
        if (message.mentions.channels.size > 0) {
            channel = message.mentions.channels.first();
            channelId = channel.id;
        }

        // Check if the target is a category
        const allCategories = getAllCategories();
        const isCategory = allCategories.includes(targetName);
        
        // Check if the target is a command
        const commandCategory = getCommandCategory(targetName);
        const isCommand = commandCategory !== null;

        if (!isCategory && !isCommand) {
            return message.reply(`\`${targetName}\` is not a valid command or category.`);
        }

        try {
            let result;
            
            if (isCategory) {
                // Enable the entire category
                result = await DisabledCommand.deleteOne({
                    guildId: message.guild.id,
                    channelId: channelId,
                    category: targetName
                });

                if (result.deletedCount === 0) {
                    return message.reply(`The \`${targetName}\` category is not disabled ${channel ? `in ${channel}` : 'server-wide'}.`);
                }

                const embed = new EmbedBuilder()
                    .setTitle('Category Enabled')
                    .setDescription(`The \`${targetName}\` category has been enabled ${channel ? `in ${channel}` : 'server-wide'}.`)
                    .setColor('#55FF55')
                    .setFooter({ text: `Enabled by ${message.author.tag}` })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            } else {
                // Enable the specific command
                result = await DisabledCommand.deleteOne({
                    guildId: message.guild.id,
                    channelId: channelId,
                    command: targetName
                });

                if (result.deletedCount === 0) {
                    return message.reply(`The \`${targetName}\` command is not disabled ${channel ? `in ${channel}` : 'server-wide'}.`);
                }

                const embed = new EmbedBuilder()
                    .setTitle('Command Enabled')
                    .setDescription(`The \`${targetName}\` command has been enabled ${channel ? `in ${channel}` : 'server-wide'}.`)
                    .setColor('#55FF55')
                    .setFooter({ text: `Enabled by ${message.author.tag}` })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error enabling command:', error);
            return message.reply('An error occurred while trying to enable the command.');
        }
    }
}; 