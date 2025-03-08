const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    name: 'botinfo',
    description: 'View or update the bot\'s description and information',
    usage: 'botinfo [set/view] [description/name/avatar]',
    category: 'owner',
    aliases: ['setbotinfo', 'botdesc', 'botdescription'],
    ownerOnly: true,
    cooldown: 10,
    examples: [
        'botinfo view',
        'botinfo set description This is a cool Discord bot!',
        'botinfo set name CoolBot'
    ],
    async execute(client, message, args) {
        // Check if user is bot owner or extra owner
        const isOwner = message.author.id === (process.env.OWNER_ID || client.config?.ownerId);
        const isExtraOwner = client.extraOwners && client.extraOwners.has(message.author.id);
        
        if (!isOwner && !isExtraOwner) {
            return message.reply('Only the bot owner can use this command.');
        }
        
        // Initialize bot info if it doesn't exist
        if (!client.botInfo) {
            client.botInfo = {
                description: 'A versatile Discord bot with moderation, utility, and fun commands.',
                features: [
                    'Moderation commands',
                    'Utility tools',
                    'Custom profiles',
                    'Giveaway system',
                    'And much more!'
                ],
                createdAt: Date.now(),
                lastUpdated: Date.now()
            };
            
            // Try to save bot info to a file
            try {
                const dataDir = path.join(process.cwd(), 'data');
                await fs.mkdir(dataDir, { recursive: true });
                await fs.writeFile(
                    path.join(dataDir, 'botinfo.json'),
                    JSON.stringify(client.botInfo, null, 2)
                );
            } catch (error) {
                console.error('Error saving bot info:', error);
            }
        }
        
        // Handle view subcommand
        if (!args[0] || args[0].toLowerCase() === 'view') {
            const embed = new EmbedBuilder()
                .setTitle(`${client.user.username} Information`)
                .setDescription(client.botInfo.description)
                .setColor('#00FFFF')
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
                .addFields(
                    { name: 'Features', value: client.botInfo.features.map(f => `• ${f}`).join('\n'), inline: false },
                    { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
                    { name: 'Users', value: `${client.users.cache.size}`, inline: true },
                    { name: 'Channels', value: `${client.channels.cache.size}`, inline: true },
                    { name: 'Commands', value: `${client.commands.size}`, inline: true },
                    { name: 'Slash Commands', value: `${client.slashCommands.size}`, inline: true },
                    { name: 'Uptime', value: formatUptime(process.uptime()), inline: true },
                    { name: 'Created', value: `<t:${Math.floor(client.botInfo.createdAt / 1000)}:R>`, inline: true },
                    { name: 'Last Updated', value: `<t:${Math.floor(client.botInfo.lastUpdated / 1000)}:R>`, inline: true }
                )
                .setFooter({ text: `Requested by ${message.author.tag}` })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Handle set subcommand
        if (args[0].toLowerCase() === 'set') {
            if (!args[1]) {
                return message.reply(`Please specify what to set. Usage: \`${client.prefix}botinfo set [description/name/avatar/feature] [value]\``);
            }
            
            const option = args[1].toLowerCase();
            
            switch (option) {
                case 'description':
                case 'desc':
                    if (!args[2]) {
                        return message.reply('Please provide a description.');
                    }
                    
                    const description = args.slice(2).join(' ');
                    client.botInfo.description = description;
                    client.botInfo.lastUpdated = Date.now();
                    
                    // Save to file
                    try {
                        const dataDir = path.join(process.cwd(), 'data');
                        await fs.mkdir(dataDir, { recursive: true });
                        await fs.writeFile(
                            path.join(dataDir, 'botinfo.json'),
                            JSON.stringify(client.botInfo, null, 2)
                        );
                    } catch (error) {
                        console.error('Error saving bot info:', error);
                    }
                    
                    return message.reply(`Updated bot description to: "${description}"`);
                
                case 'name':
                    if (!args[2]) {
                        return message.reply('Please provide a name.');
                    }
                    
                    const name = args.slice(2).join(' ');
                    
                    try {
                        await client.user.setUsername(name);
                        return message.reply(`Updated bot name to: "${name}"`);
                    } catch (error) {
                        console.error('Error updating bot name:', error);
                        return message.reply(`Failed to update bot name: ${error.message}`);
                    }
                
                case 'avatar':
                    if (!args[2]) {
                        return message.reply('Please provide an avatar URL.');
                    }
                    
                    const avatarUrl = args[2];
                    
                    try {
                        await client.user.setAvatar(avatarUrl);
                        return message.reply('Updated bot avatar.');
                    } catch (error) {
                        console.error('Error updating bot avatar:', error);
                        return message.reply(`Failed to update bot avatar: ${error.message}`);
                    }
                
                case 'feature':
                case 'features':
                    if (!args[2]) {
                        return message.reply('Please specify whether to add or remove a feature.');
                    }
                    
                    const featureAction = args[2].toLowerCase();
                    
                    if (featureAction === 'add') {
                        if (!args[3]) {
                            return message.reply('Please provide a feature to add.');
                        }
                        
                        const feature = args.slice(3).join(' ');
                        client.botInfo.features.push(feature);
                        client.botInfo.lastUpdated = Date.now();
                        
                        // Save to file
                        try {
                            const dataDir = path.join(process.cwd(), 'data');
                            await fs.mkdir(dataDir, { recursive: true });
                            await fs.writeFile(
                                path.join(dataDir, 'botinfo.json'),
                                JSON.stringify(client.botInfo, null, 2)
                            );
                        } catch (error) {
                            console.error('Error saving bot info:', error);
                        }
                        
                        return message.reply(`Added feature: "${feature}"`);
                    } else if (featureAction === 'remove') {
                        if (!args[3] || isNaN(args[3])) {
                            return message.reply(`Please provide the index of the feature to remove. Use \`${client.prefix}botinfo view\` to see the list of features.`);
                        }
                        
                        const index = parseInt(args[3]) - 1;
                        
                        if (index < 0 || index >= client.botInfo.features.length) {
                            return message.reply(`Invalid feature index. Use \`${client.prefix}botinfo view\` to see the list of features.`);
                        }
                        
                        const removedFeature = client.botInfo.features.splice(index, 1)[0];
                        client.botInfo.lastUpdated = Date.now();
                        
                        // Save to file
                        try {
                            const dataDir = path.join(process.cwd(), 'data');
                            await fs.mkdir(dataDir, { recursive: true });
                            await fs.writeFile(
                                path.join(dataDir, 'botinfo.json'),
                                JSON.stringify(client.botInfo, null, 2)
                            );
                        } catch (error) {
                            console.error('Error saving bot info:', error);
                        }
                        
                        return message.reply(`Removed feature: "${removedFeature}"`);
                    } else {
                        return message.reply(`Invalid feature action. Use \`add\` or \`remove\`.`);
                    }
                
                default:
                    return message.reply(`Invalid option. You can set \`description\`, \`name\`, \`avatar\`, or \`feature\`.`);
            }
        }
        
        return message.reply(`Invalid subcommand. Use \`${client.prefix}botinfo view\` or \`${client.prefix}botinfo set [option] [value]\`.`);
    }
};

function formatUptime(uptime) {
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor(uptime / 3600) % 24;
    const minutes = Math.floor(uptime / 60) % 60;
    const seconds = Math.floor(uptime % 60);
    
    let uptimeString = '';
    if (days > 0) uptimeString += `${days}d `;
    if (hours > 0) uptimeString += `${hours}h `;
    if (minutes > 0) uptimeString += `${minutes}m `;
    uptimeString += `${seconds}s`;
    
    return uptimeString;
} 