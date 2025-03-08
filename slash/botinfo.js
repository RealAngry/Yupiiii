const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('View or update the bot\'s description and information')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View the bot\'s information'))
        .addSubcommandGroup(group =>
            group
                .setName('set')
                .setDescription('Update the bot\'s information (owner only)')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('description')
                        .setDescription('Set the bot\'s description')
                        .addStringOption(option =>
                            option.setName('description')
                                .setDescription('The new description for the bot')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('name')
                        .setDescription('Set the bot\'s username')
                        .addStringOption(option =>
                            option.setName('name')
                                .setDescription('The new name for the bot')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('avatar')
                        .setDescription('Set the bot\'s avatar')
                        .addStringOption(option =>
                            option.setName('url')
                                .setDescription('The URL of the new avatar')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('add_feature')
                        .setDescription('Add a feature to the bot\'s feature list')
                        .addStringOption(option =>
                            option.setName('feature')
                                .setDescription('The feature to add')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('remove_feature')
                        .setDescription('Remove a feature from the bot\'s feature list')
                        .addIntegerOption(option =>
                            option.setName('index')
                                .setDescription('The index of the feature to remove (starting from 1)')
                                .setRequired(true)
                                .setMinValue(1)))),
    
    async execute(interaction, client) {
        // No need to initialize here as it's already done in index.js
        
        const subCommand = interaction.options.getSubcommand();
        const group = interaction.options.getSubcommandGroup(false);
        
        // Handle view subcommand
        if (subCommand === 'view') {
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
                .setFooter({ text: `Requested by ${interaction.user.tag}` })
                .setTimestamp();
            
            return await interaction.reply({ embeds: [embed] });
        }
        
        // All other commands are for owners only
        // Check if user is bot owner or extra owner
        const isOwner = interaction.user.id === (process.env.OWNER_ID || client.config?.ownerId);
        const isExtraOwner = client.extraOwners && client.extraOwners.has(interaction.user.id);
        
        if (!isOwner && !isExtraOwner) {
            return interaction.reply({ 
                content: 'Only the bot owner can use this command.',
                ephemeral: true 
            });
        }
        
        // Handle set subcommands
        if (group === 'set') {
            switch (subCommand) {
                case 'description':
                    const description = interaction.options.getString('description');
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
                    
                    return interaction.reply({ 
                        content: `Updated bot description to: "${description}"`,
                        ephemeral: true 
                    });
                
                case 'name':
                    const name = interaction.options.getString('name');
                    
                    try {
                        await client.user.setUsername(name);
                        return interaction.reply({ 
                            content: `Updated bot name to: "${name}"`,
                            ephemeral: true 
                        });
                    } catch (error) {
                        console.error('Error updating bot name:', error);
                        return interaction.reply({ 
                            content: `Failed to update bot name: ${error.message}`,
                            ephemeral: true 
                        });
                    }
                
                case 'avatar':
                    const avatarUrl = interaction.options.getString('url');
                    
                    try {
                        await client.user.setAvatar(avatarUrl);
                        return interaction.reply({ 
                            content: 'Updated bot avatar.',
                            ephemeral: true 
                        });
                    } catch (error) {
                        console.error('Error updating bot avatar:', error);
                        return interaction.reply({ 
                            content: `Failed to update bot avatar: ${error.message}`,
                            ephemeral: true 
                        });
                    }
                
                case 'add_feature':
                    const feature = interaction.options.getString('feature');
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
                    
                    return interaction.reply({ 
                        content: `Added feature: "${feature}"`,
                        ephemeral: true 
                    });
                
                case 'remove_feature':
                    const index = interaction.options.getInteger('index') - 1;
                    
                    if (index < 0 || index >= client.botInfo.features.length) {
                        return interaction.reply({ 
                            content: `Invalid feature index. Use \`/botinfo view\` to see the list of features.`,
                            ephemeral: true 
                        });
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
                    
                    return interaction.reply({ 
                        content: `Removed feature: "${removedFeature}"`,
                        ephemeral: true 
                    });
            }
        }
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