const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');
const ModerationCase = require('../../models/ModerationCase');

module.exports = {
    name: 'mute',
    description: 'Mute a member in the server',
    usage: 'mute @user [time] [reason]',
    category: 'moderation',
    aliases: ['timeout'],
    cooldown: 3,
    permissions: [PermissionFlagsBits.ModerateMembers],
    async execute(client, message, args) {
        // Check if a user was mentioned
        if (!args[0]) {
            return message.reply('Please specify a user to mute!');
        }
        
        // Get target user
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        // Check if user exists
        if (!target) {
            return message.reply('Could not find that user!');
        }
        
        // Check if user is moderatable
        if (!target.moderatable) {
            return message.reply('I cannot mute this user! Do they have a higher role?');
        }
        
        // Check if trying to mute self
        if (target.id === message.author.id) {
            return message.reply('You cannot mute yourself!');
        }
        
        // Check if the target is already muted
        const muteRole = message.guild.roles.cache.find(role => role.name === 'Muted');
        if (muteRole && target.roles.cache.has(muteRole.id)) {
            return message.reply(`${target.user.tag} is already muted.`);
        }
        
        // Default mute time (1 hour)
        let muteTime = 3600000; // 1 hour in milliseconds
        let timeString = '1 hour';
        
        // Check if a time was specified
        if (args[1] && /^\d+[smhdw]$/.test(args[1])) {
            const parsedTime = ms(args[1]);
            if (parsedTime) {
                muteTime = parsedTime;
                timeString = args[1];
                args.splice(1, 1);
            }
        }
        
        // Get reason
        let reason = args.slice(1).join(' ');
        if (!reason) reason = 'No reason provided';
        
        // Calculate unmute time
        const unmuteTime = new Date(Date.now() + muteTime);
        
        // Apply timeout (Discord's built-in mute)
        try {
            await target.timeout(muteTime, reason);
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('Member Muted')
                .setDescription(`**${target.user.tag}** has been muted for ${timeString}.`)
                .addFields(
                    { name: 'Reason', value: reason },
                    { name: 'Moderator', value: message.author.tag },
                    { name: 'Duration', value: timeString },
                    { name: 'Unmuted At', value: `<t:${Math.floor(unmuteTime.getTime() / 1000)}:F>` }
                )
                .setColor('#FFA500')
                .setThumbnail(target.user.displayAvatarURL())
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
            
            // Try to DM the muted user
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle(`You were muted in ${message.guild.name}`)
                    .addFields(
                        { name: 'Reason', value: reason },
                        { name: 'Moderator', value: message.author.tag },
                        { name: 'Duration', value: timeString },
                        { name: 'Unmuted At', value: `<t:${Math.floor(unmuteTime.getTime() / 1000)}:F>` }
                    )
                    .setColor('#FFA500')
                    .setTimestamp();
                
                target.user.send({ embeds: [dmEmbed] }).catch(() => {});
            } catch (error) {
                console.error(`Could not send DM to ${target.user.tag}`, error);
            }

            // Save the moderation action to MongoDB
            const caseNumber = await ModerationCase.getNextCaseNumber(message.guild.id);
            const moderationCase = new ModerationCase({
                userId: target.id,
                moderatorId: message.author.id,
                action: 'mute',
                reason: reason,
                guildId: message.guild.id,
                caseNumber: caseNumber
            });

            await moderationCase.save();
            console.log(`Saved moderation action: mute for user ${target.id}`);
        } catch (error) {
            console.error(`Error muting user: ${error}`);
            message.reply(`Failed to mute ${target.user.tag}: ${error.message}`);
        }
    }
}; 