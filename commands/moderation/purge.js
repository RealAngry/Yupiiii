const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'purge',
    description: 'Delete messages with advanced filtering options',
    usage: 'purge [amount] [filter] [value]',
    category: 'moderation',
    aliases: ['prune', 'bulkdelete'],
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageMessages],
    async execute(client, message, args) {
        // Check if amount was specified
        if (!args[0]) {
            return message.reply('Please specify the number of messages to delete!');
        }
        
        // Parse amount
        const amount = parseInt(args[0]);
        
        // Validate amount
        if (isNaN(amount)) {
            return message.reply('Please provide a valid number!');
        }
        
        // Check if amount is within limits (1-100)
        if (amount < 1 || amount > 100) {
            return message.reply('Please provide a number between 1 and 100!');
        }
        
        // Get filter type (if specified)
        const filterType = args[1]?.toLowerCase();
        
        // Initialize filter function
        let filterFunction;
        let filterDescription = '';
        
        // Apply filter based on type
        if (filterType) {
            switch (filterType) {
                case 'user':
                    // Filter by user
                    const userId = args[2]?.replace(/[<@!>]/g, '');
                    if (!userId) {
                        return message.reply('Please provide a user ID or mention!');
                    }
                    filterFunction = msg => msg.author.id === userId;
                    filterDescription = `from user ID ${userId}`;
                    break;
                    
                case 'bot':
                    // Filter bot messages
                    filterFunction = msg => msg.author.bot;
                    filterDescription = 'from bots';
                    break;
                    
                case 'human':
                    // Filter human messages
                    filterFunction = msg => !msg.author.bot;
                    filterDescription = 'from humans';
                    break;
                    
                case 'contains':
                    // Filter messages containing text
                    const text = args.slice(2).join(' ');
                    if (!text) {
                        return message.reply('Please provide text to search for!');
                    }
                    filterFunction = msg => msg.content.toLowerCase().includes(text.toLowerCase());
                    filterDescription = `containing "${text}"`;
                    break;
                    
                case 'links':
                    // Filter messages with links
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    filterFunction = msg => urlRegex.test(msg.content);
                    filterDescription = 'containing links';
                    break;
                    
                case 'images':
                    // Filter messages with images
                    filterFunction = msg => msg.attachments.size > 0 || msg.embeds.length > 0;
                    filterDescription = 'containing images or embeds';
                    break;
                    
                case 'mentions':
                    // Filter messages with mentions
                    filterFunction = msg => msg.mentions.users.size > 0 || msg.mentions.roles.size > 0 || msg.mentions.everyone;
                    filterDescription = 'containing mentions';
                    break;
                    
                case 'pins':
                    // Filter pinned messages
                    filterFunction = msg => !msg.pinned;
                    filterDescription = 'excluding pinned messages';
                    break;
                    
                default:
                    return message.reply('Invalid filter type! Available filters: `user`, `bot`, `human`, `contains`, `links`, `images`, `mentions`, `pins`');
            }
        }
        
        try {
            // Fetch messages
            const messages = await message.channel.messages.fetch({ limit: 100 });
            
            // Filter messages
            let filteredMessages;
            if (filterFunction) {
                filteredMessages = Array.from(messages.values())
                    .filter(msg => filterFunction(msg))
                    .slice(0, amount);
            } else {
                filteredMessages = Array.from(messages.values()).slice(0, amount);
            }
            
            // Check if there are messages to delete
            if (filteredMessages.length === 0) {
                return message.reply(`No messages found ${filterDescription ? filterDescription : 'to delete'}.`);
            }
            
            // Delete messages
            await message.channel.bulkDelete(filteredMessages, true)
                .then(deleted => {
                    // Create success embed
                    const embed = new EmbedBuilder()
                        .setTitle('Messages Purged')
                        .setDescription(`Successfully deleted ${deleted.size} messages ${filterDescription}.`)
                        .setColor('#00FF00')
                        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                        .setTimestamp();
                    
                    // Send response and delete after 5 seconds
                    message.channel.send({ embeds: [embed] })
                        .then(msg => {
                            setTimeout(() => msg.delete().catch(() => {}), 5000);
                        });
                    
                    // Get guild settings
                    const guildSettings = client.settings?.get(message.guild.id) || {};
                    
                    // Log to channel if set
                    const logChannelId = guildSettings.logChannel;
                    if (logChannelId) {
                        const logChannel = message.guild.channels.cache.get(logChannelId);
                        if (logChannel) {
                            const logEmbed = new EmbedBuilder()
                                .setTitle('Messages Purged')
                                .setDescription(`${message.author.tag} purged ${deleted.size} messages in ${message.channel}.`)
                                .addFields(
                                    { name: 'Channel', value: `${message.channel} (${message.channel.id})` },
                                    { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },
                                    { name: 'Messages Deleted', value: deleted.size.toString() }
                                )
                                .setColor('#FFA500')
                                .setTimestamp();
                            
                            if (filterDescription) {
                                logEmbed.addFields({ name: 'Filter', value: filterDescription });
                            }
                            
                            logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                        }
                    }
                });
        } catch (error) {
            console.error(`Error purging messages: ${error}`);
            
            if (error.code === 10008) {
                return message.reply('Some of these messages are too old to be deleted (older than 14 days).');
            }
            
            message.reply(`Failed to delete messages: ${error.message}`);
        }
    }
}; 