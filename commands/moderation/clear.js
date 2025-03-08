const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'clear',
    description: 'Delete a specified number of messages from a channel',
    usage: 'clear [amount] [@user]',
    category: 'moderation',
    aliases: ['purge', 'prune', 'clean'],
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
        
        // Check if user was mentioned (for filtering)
        const user = message.mentions.users.first();
        
        try {
            // Fetch messages
            const messages = await message.channel.messages.fetch({ limit: 100 });
            
            // Filter messages
            let filteredMessages;
            if (user) {
                // Filter by user
                filteredMessages = messages.filter(m => m.author.id === user.id).first(amount);
            } else {
                // No filter
                filteredMessages = messages.first(amount);
            }
            
            // Delete messages
            await message.channel.bulkDelete(filteredMessages, true)
                .then(deleted => {
                    // Create success embed
                    const embed = new EmbedBuilder()
                        .setTitle('Messages Deleted')
                        .setDescription(`Successfully deleted ${deleted.size} messages.`)
                        .setColor('#00FF00')
                        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                        .setTimestamp();
                    
                    if (user) {
                        embed.setDescription(`Successfully deleted ${deleted.size} messages from ${user.tag}.`);
                    }
                    
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
                            
                            if (user) {
                                logEmbed.addFields({ name: 'Target User', value: `${user.tag} (${user.id})` });
                            }
                            
                            logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                        }
                    }
                });
        } catch (error) {
            console.error(`Error deleting messages: ${error}`);
            
            if (error.code === 10008) {
                return message.reply('Some of these messages are too old to be deleted (older than 14 days).');
            }
            
            message.reply(`Failed to delete messages: ${error.message}`);
        }
    }
}; 