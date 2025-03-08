const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const DisabledCommand = require('../../models/DisabledCommand');

module.exports = {
    name: 'disabledcommands',
    description: 'List all disabled commands and categories in the server',
    usage: 'disabledcommands [channel]',
    category: 'moderation',
    aliases: ['listdisabled', 'disabled'],
    permissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 5,
    examples: [
        'disabledcommands',
        'disabledcommands #general'
    ],
    async execute(message, args, client) {
        // Check if user has permission
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply('You need Manage Server permission to use this command.');
        }

        let channel = null;
        let filter = { guildId: message.guild.id };

        // Check if a channel is mentioned
        if (message.mentions.channels.size > 0) {
            channel = message.mentions.channels.first();
            filter.channelId = channel.id;
        }

        try {
            // Get all disabled commands for the guild or specific channel
            const disabledItems = await DisabledCommand.find(filter).sort({ disabledAt: -1 });

            if (disabledItems.length === 0) {
                return message.reply(`No commands or categories are disabled ${channel ? `in ${channel}` : 'in this server'}.`);
            }

            // Group by channel
            const groupedByChannel = {};
            
            for (const item of disabledItems) {
                const channelKey = item.channelId || 'server-wide';
                
                if (!groupedByChannel[channelKey]) {
                    groupedByChannel[channelKey] = {
                        commands: [],
                        categories: []
                    };
                }
                
                if (item.command) {
                    groupedByChannel[channelKey].commands.push(item);
                } else if (item.category) {
                    groupedByChannel[channelKey].categories.push(item);
                }
            }

            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('Disabled Commands & Categories')
                .setColor('#FF9933')
                .setFooter({ text: `Total: ${disabledItems.length} items` })
                .setTimestamp();

            // Add fields for each channel
            for (const [channelKey, items] of Object.entries(groupedByChannel)) {
                let fieldValue = '';
                
                if (items.categories.length > 0) {
                    fieldValue += '**Categories:**\n';
                    for (const category of items.categories) {
                        fieldValue += `• \`${category.category}\` (by <@${category.disabledBy}>)\n`;
                    }
                }
                
                if (items.commands.length > 0) {
                    if (fieldValue) fieldValue += '\n';
                    fieldValue += '**Commands:**\n';
                    for (const command of items.commands) {
                        fieldValue += `• \`${command.command}\` (by <@${command.disabledBy}>)\n`;
                    }
                }
                
                const channelName = channelKey === 'server-wide' 
                    ? 'Server-wide' 
                    : `<#${channelKey}>`;
                
                embed.addFields({ name: channelName, value: fieldValue });
            }

            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error listing disabled commands:', error);
            return message.reply('An error occurred while trying to list disabled commands.');
        }
    }
}; 