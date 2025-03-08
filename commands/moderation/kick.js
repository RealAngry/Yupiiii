const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationCase = require('../../models/ModerationCase');

module.exports = {
    name: 'kick',
    description: 'Kick a member from the server',
    usage: 'kick @user [reason]',
    category: 'moderation',
    aliases: ['kickuser'],
    cooldown: 3,
    permissions: [PermissionFlagsBits.KickMembers],
    async execute(client, message, args) {
        // Check if a user was mentioned
        if (!args[0]) {
            return message.reply('Please specify a user to kick!');
        }
        
        // Get target user
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        // Check if user exists
        if (!target) {
            return message.reply('Could not find that user!');
        }
        
        // Check if user is kickable
        if (!target.kickable) {
            return message.reply('I cannot kick this user! Do they have a higher role?');
        }
        
        // Check if trying to kick self
        if (target.id === message.author.id) {
            return message.reply('You cannot kick yourself!');
        }
        
        // Get reason
        let reason = args.slice(1).join(' ');
        if (!reason) reason = 'No reason provided';
        
        // Kick user
        await target.kick(reason)
            .then(async () => {
                // Create success embed
                const embed = new EmbedBuilder()
                    .setTitle('Member Kicked')
                    .setDescription(`**${target.user.tag}** has been kicked from the server.`)
                    .addFields(
                        { name: 'Reason', value: reason },
                        { name: 'Moderator', value: message.author.tag }
                    )
                    .setColor('#FF0000')
                    .setThumbnail(target.user.displayAvatarURL())
                    .setTimestamp();
                
                message.reply({ embeds: [embed] });
                
                // Try to DM the kicked user
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setTitle(`You were kicked from ${message.guild.name}`)
                        .addFields(
                            { name: 'Reason', value: reason },
                            { name: 'Moderator', value: message.author.tag }
                        )
                        .setColor('#FF0000')
                        .setTimestamp();
                    
                    await target.user.send({ embeds: [dmEmbed] }).catch(() => {});
                } catch (error) {
                    console.error(`Could not send DM to ${target.user.tag}`, error);
                }

                // Save the moderation action to MongoDB
                const moderationCase = new ModerationCase({
                    userId: target.id,
                    moderatorId: message.author.id,
                    action: 'kick',
                    reason: reason,
                });

                await moderationCase.save();
                console.log(`Saved moderation action: kick for user ${target.id}`);
            })
            .catch(error => {
                console.error(`Error kicking user: ${error}`);
                message.reply(`Failed to kick ${target.user.tag}: ${error.message}`);
            });
    }
}; 