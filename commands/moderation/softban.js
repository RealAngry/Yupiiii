const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'softban',
    description: 'Ban and immediately unban a user to delete their messages',
    usage: 'softban @user [days] [reason]',
    category: 'moderation',
    aliases: ['sban'],
    cooldown: 5,
    permissions: [PermissionFlagsBits.BanMembers],
    async execute(client, message, args) {
        // Check if a user was mentioned
        if (!args[0]) {
            return message.reply('Please specify a user to softban!');
        }
        
        // Get target user
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        // Check if user exists
        if (!target) {
            return message.reply('Could not find that user!');
        }
        
        // Check if user is bannable
        if (!target.bannable) {
            return message.reply('I cannot ban this user! Do they have a higher role?');
        }
        
        // Check if trying to ban self
        if (target.id === message.author.id) {
            return message.reply('You cannot softban yourself!');
        }
        
        // Parse delete message days (0-7)
        let days = 1; // Default to 1 day of message deletion
        if (args[1] && !isNaN(args[1]) && args[1] >= 0 && args[1] <= 7) {
            days = parseInt(args[1]);
            args.splice(1, 1);
        }
        
        // Get reason
        let reason = args.slice(1).join(' ');
        if (!reason) reason = 'No reason provided';
        
        try {
            // Ban the user
            await target.ban({
                deleteMessageDays: days,
                reason: `Softban by ${message.author.tag}: ${reason}`
            });
            
            // Immediately unban the user
            await message.guild.members.unban(target.id, 'Softban: automatic unban');
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('Member Softbanned')
                .setDescription(`**${target.user.tag}** has been softbanned.`)
                .addFields(
                    { name: 'User', value: `${target.user.tag} (${target.id})` },
                    { name: 'Moderator', value: message.author.tag },
                    { name: 'Reason', value: reason },
                    { name: 'Messages Deleted', value: `${days} day(s)` }
                )
                .setColor('#FFA500')
                .setThumbnail(target.user.displayAvatarURL())
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
            
            // Try to DM the softbanned user
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle(`You were softbanned from ${message.guild.name}`)
                    .setDescription('A softban is a ban and immediate unban used to remove your messages. You can rejoin the server.')
                    .addFields(
                        { name: 'Reason', value: reason },
                        { name: 'Moderator', value: message.author.tag }
                    )
                    .setColor('#FFA500')
                    .setTimestamp();
                
                target.user.send({ embeds: [dmEmbed] }).catch(() => {});
            } catch (error) {
                console.error(`Could not send DM to ${target.user.tag}`, error);
            }
            
            // Get guild settings
            const guildSettings = client.settings?.get(message.guild.id) || {};
            
            // Log to channel if set
            const logChannelId = guildSettings.logChannel;
            if (logChannelId) {
                const logChannel = message.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('Member Softbanned')
                        .setDescription(`**${target.user.tag}** has been softbanned.`)
                        .addFields(
                            { name: 'User ID', value: target.id },
                            { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },
                            { name: 'Reason', value: reason },
                            { name: 'Messages Deleted', value: `${days} day(s)` }
                        )
                        .setColor('#FFA500')
                        .setThumbnail(target.user.displayAvatarURL())
                        .setTimestamp();
                    
                    logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }
        } catch (error) {
            console.error(`Error softbanning user: ${error}`);
            message.reply(`Failed to softban ${target.user.tag}: ${error.message}`);
        }
    }
}; 