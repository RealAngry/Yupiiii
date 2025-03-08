const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationCase = require('../../models/ModerationCase');

module.exports = {
    name: 'timeout',
    description: 'Timeout a user for a specified duration',
    usage: 'timeout <user> <duration> [reason]',
    category: 'moderation',
    aliases: ['to'],
    permissions: [PermissionFlagsBits.ModerateMembers],
    cooldown: 3,
    examples: [
        'timeout @user 1h Spamming',
        'timeout @user 30m',
        'timeout @user 2d Inappropriate behavior'
    ],
    async execute(client, message, args) {
        // Check if user has permission
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('You do not have permission to timeout members.');
        }
        
        // Check if bot has permission
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('I do not have permission to timeout members.');
        }
        
        // Check for required arguments
        if (args.length < 2) {
            return message.reply(`Please provide a user and duration. Usage: \`${client.prefix}${this.usage}\``);
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
        
        // Check if user is moderator or has higher role
        if (member.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
            return message.reply('You cannot timeout someone with a higher or equal role.');
        }
        
        // Check if user is owner
        if (member.id === message.guild.ownerId) {
            return message.reply('You cannot timeout the server owner.');
        }
        
        // Parse duration
        const durationArg = args[1].toLowerCase();
        const duration = parseDuration(durationArg);
        
        if (!duration) {
            return message.reply('Invalid duration format. Please use a format like `1h`, `30m`, `2d`, etc.');
        }
        
        // Check if duration is too long (max 28 days)
        if (duration > 28 * 24 * 60 * 60 * 1000) {
            return message.reply('Timeout duration cannot be longer than 28 days.');
        }
        
        // Get reason
        const reason = args.slice(2).join(' ') || 'No reason provided';
        
        try {
            // Apply timeout
            await member.timeout(duration, reason);
            
            // Create moderation case
            const highestCase = await ModerationCase.findOne({})
                .sort({ caseNumber: -1 })
                .limit(1);
            
            const caseNumber = highestCase ? highestCase.caseNumber + 1 : 1;
            
            const newCase = new ModerationCase({
                caseNumber: caseNumber,
                userId: user.id,
                moderatorId: message.author.id,
                action: 'timeout',
                reason: reason,
                timestamp: new Date()
            });
            
            await newCase.save();
            
            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('User Timed Out')
                .setDescription(`${user.tag} has been timed out for ${formatDuration(duration)}`)
                .addFields(
                    { name: 'User', value: `<@${user.id}> (${user.tag})`, inline: true },
                    { name: 'Moderator', value: `<@${message.author.id}>`, inline: true },
                    { name: 'Duration', value: formatDuration(duration), inline: true },
                    { name: 'Reason', value: reason },
                    { name: 'Case ID', value: `#${caseNumber}` }
                )
                .setColor('#FF9900')
                .setFooter({ text: `Timeout expires: ${new Date(Date.now() + duration).toLocaleString()}` })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error timing out user:', error);
            return message.reply('There was an error timing out the user. Please check my permissions and try again.');
        }
    }
};

// Helper function to parse duration string to milliseconds
function parseDuration(durationString) {
    const regex = /^(\d+)([dhms])$/;
    const match = durationString.match(regex);
    
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
        case 'd': return value * 24 * 60 * 60 * 1000; // days
        case 'h': return value * 60 * 60 * 1000; // hours
        case 'm': return value * 60 * 1000; // minutes
        case 's': return value * 1000; // seconds
        default: return null;
    }
}

// Helper function to format duration in milliseconds to readable string
function formatDuration(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    
    const parts = [];
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    if (seconds > 0 && parts.length === 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
    
    return parts.join(', ');
} 