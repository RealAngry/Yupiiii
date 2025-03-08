const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationCase = require('../../models/ModerationCase');

module.exports = {
    name: 'untimeout',
    description: 'Remove a timeout from a user',
    usage: 'untimeout <user> [reason]',
    category: 'moderation',
    aliases: ['removetimeout', 'uto'],
    permissions: [PermissionFlagsBits.ModerateMembers],
    cooldown: 3,
    examples: [
        'untimeout @user',
        'untimeout @user Issue resolved'
    ],
    async execute(client, message, args) {
        // Check if user has permission
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('You do not have permission to remove timeouts.');
        }
        
        // Check if bot has permission
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('I do not have permission to remove timeouts.');
        }
        
        // Check for required arguments
        if (args.length < 1) {
            return message.reply(`Please provide a user. Usage: \`${client.prefix}${this.usage}\``);
        }
        
        // Get user from mention
        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('Please mention a valid user.');
        }
        
        // Get member from user
        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.reply('That user is not in this server.');
        }
        
        // Check if user is timed out
        if (!member.communicationDisabledUntil) {
            return message.reply('That user is not timed out.');
        }
        
        // Get reason
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        try {
            // Remove timeout
            await member.timeout(null, reason);
            
            // Create moderation case
            const highestCase = await ModerationCase.findOne({})
                .sort({ caseNumber: -1 })
                .limit(1);
            
            const caseNumber = highestCase ? highestCase.caseNumber + 1 : 1;
            
            const newCase = new ModerationCase({
                caseNumber: caseNumber,
                userId: user.id,
                moderatorId: message.author.id,
                action: 'untimeout',
                reason: reason,
                timestamp: new Date()
            });
            
            await newCase.save();
            
            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('Timeout Removed')
                .setDescription(`${user.tag}'s timeout has been removed`)
                .addFields(
                    { name: 'User', value: `<@${user.id}> (${user.tag})`, inline: true },
                    { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
                    { name: 'Reason', value: reason },
                    { name: 'Case ID', value: `#${caseNumber}` }
                )
                .setColor('#00CC00')
                .setFooter({ text: `Timeout removed by ${message.author.tag}` })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error removing timeout:', error);
            return message.reply('There was an error removing the timeout. Please check my permissions and try again.');
        }
    }
}; 