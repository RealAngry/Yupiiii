const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'massban',
    description: 'Ban multiple users at once',
    usage: 'massban [reason] userID1 userID2 userID3...',
    category: 'moderation',
    aliases: ['multiban', 'banall'],
    cooldown: 10,
    permissions: [PermissionFlagsBits.BanMembers, PermissionFlagsBits.Administrator],
    async execute(client, message, args) {
        // Check if any arguments were provided
        if (!args.length) {
            return message.reply('Please provide a reason and at least one user ID to ban!');
        }
        
        // Get reason (first argument)
        const reason = args[0];
        
        // Get user IDs (remaining arguments)
        const userIds = args.slice(1);
        
        // Check if any user IDs were provided
        if (!userIds.length) {
            return message.reply('Please provide at least one user ID to ban!');
        }
        
        // Confirm the action
        const confirmEmbed = new EmbedBuilder()
            .setTitle('Mass Ban Confirmation')
            .setDescription(`Are you sure you want to ban ${userIds.length} users?\nThis action cannot be undone.`)
            .addFields(
                { name: 'Reason', value: reason },
                { name: 'Users to Ban', value: userIds.join('\n') }
            )
            .setColor('#FF0000')
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
        
        const confirmMessage = await message.reply({ embeds: [confirmEmbed] });
        
        // Add reactions for confirmation
        await confirmMessage.react('✅');
        await confirmMessage.react('❌');
        
        // Create reaction collector
        const filter = (reaction, user) => {
            return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
        };
        
        const collector = confirmMessage.createReactionCollector({ filter, time: 30000 });
        
        collector.on('collect', async (reaction, user) => {
            if (reaction.emoji.name === '✅') {
                // User confirmed, proceed with mass ban
                collector.stop();
                
                // Send processing message
                const processingEmbed = new EmbedBuilder()
                    .setTitle('Mass Ban Processing')
                    .setDescription(`Processing ban for ${userIds.length} users...`)
                    .setColor('#FFA500')
                    .setTimestamp();
                
                await confirmMessage.edit({ embeds: [processingEmbed] });
                
                // Ban each user
                const results = {
                    success: [],
                    failed: []
                };
                
                for (const userId of userIds) {
                    try {
                        await message.guild.members.ban(userId, { reason: `Mass ban by ${message.author.tag}: ${reason}` });
                        results.success.push(userId);
                    } catch (error) {
                        console.error(`Error banning user ${userId}: ${error}`);
                        results.failed.push({ id: userId, error: error.message });
                    }
                }
                
                // Create results embed
                const resultsEmbed = new EmbedBuilder()
                    .setTitle('Mass Ban Results')
                    .setDescription(`Successfully banned ${results.success.length} out of ${userIds.length} users.`)
                    .addFields(
                        { name: 'Reason', value: reason },
                        { name: 'Successful Bans', value: results.success.length > 0 ? results.success.join('\n') : 'None' }
                    )
                    .setColor('#00FF00')
                    .setFooter({ text: `Executed by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp();
                
                // Add failed bans if any
                if (results.failed.length > 0) {
                    const failedList = results.failed.map(f => `${f.id} - ${f.error}`).join('\n');
                    resultsEmbed.addFields({ name: 'Failed Bans', value: failedList.length > 1024 ? `${failedList.substring(0, 1020)}...` : failedList });
                }
                
                // Edit the message with results
                await confirmMessage.edit({ embeds: [resultsEmbed] });
                
                // Get guild settings
                const guildSettings = client.settings?.get(message.guild.id) || {};
                
                // Log to channel if set
                const logChannelId = guildSettings.logChannel;
                if (logChannelId) {
                    const logChannel = message.guild.channels.cache.get(logChannelId);
                    if (logChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setTitle('Mass Ban Executed')
                            .setDescription(`${message.author.tag} executed a mass ban.`)
                            .addFields(
                                { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },
                                { name: 'Reason', value: reason },
                                { name: 'Successful Bans', value: `${results.success.length} users` },
                                { name: 'Failed Bans', value: `${results.failed.length} users` }
                            )
                            .setColor('#FF0000')
                            .setTimestamp();
                        
                        logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                    }
                }
            } else if (reaction.emoji.name === '❌') {
                // User cancelled
                collector.stop();
                
                const cancelEmbed = new EmbedBuilder()
                    .setTitle('Mass Ban Cancelled')
                    .setDescription('The mass ban operation has been cancelled.')
                    .setColor('#00FF00')
                    .setTimestamp();
                
                await confirmMessage.edit({ embeds: [cancelEmbed] });
            }
        });
        
        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                // Timed out
                const timeoutEmbed = new EmbedBuilder()
                    .setTitle('Mass Ban Cancelled')
                    .setDescription('The mass ban operation has timed out.')
                    .setColor('#00FF00')
                    .setTimestamp();
                
                confirmMessage.edit({ embeds: [timeoutEmbed] }).catch(() => {});
            }
        });
    }
}; 