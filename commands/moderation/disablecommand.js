const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const DisabledCommand = require('../../models/DisabledCommand');
const { getCommandCategory, getAllCategories, getCommandsInCategory } = require('../../utils/commandUtils');

module.exports = {
    name: 'disablecommand',
    description: 'Disable a command or category in a channel or server-wide',
    usage: 'disablecommand <command/category> [channel]',
    category: 'moderation',
    aliases: ['dcmd', 'disablecmd'],
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 5,
    examples: [
        'disablecommand ban',
        'disablecommand fun #general',
        'disablecommand moderation'
    ],
    async execute(message, args, client) {
        // Check if user has permission
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('You need Administrator permission to use this command.');
        }

        // Check if args are provided
        if (!args.length) {
            return message.reply('Please specify a command or category to disable.');
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
            if (isCategory) {
                // Disable the entire category
                await DisabledCommand.create({
                    guildId: message.guild.id,
                    channelId: channelId,
                    command: null,
                    category: targetName,
                    disabledBy: message.author.id
                });

                const embed = new EmbedBuilder()
                    .setTitle('Category Disabled')
                    .setDescription(`The \`${targetName}\` category has been disabled ${channel ? `in ${channel}` : 'server-wide'}.`)
                    .setColor('#FF5555')
                    .setFooter({ text: `Disabled by ${message.author.tag}` })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            } else {
                // Disable the specific command
                await DisabledCommand.create({
                    guildId: message.guild.id,
                    channelId: channelId,
                    command: targetName,
                    category: null,
                    disabledBy: message.author.id
                });

                const embed = new EmbedBuilder()
                    .setTitle('Command Disabled')
                    .setDescription(`The \`${targetName}\` command has been disabled ${channel ? `in ${channel}` : 'server-wide'}.`)
                    .setColor('#FF5555')
                    .setFooter({ text: `Disabled by ${message.author.tag}` })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error disabling command:', error);
            
            // Check if it's a duplicate key error (command already disabled)
            if (error.code === 11000) {
                return message.reply(`The ${isCategory ? 'category' : 'command'} \`${targetName}\` is already disabled ${channel ? `in ${channel}` : 'server-wide'}.`);
            }
            
            return message.reply('An error occurred while trying to disable the command.');
        }
    }
}; 