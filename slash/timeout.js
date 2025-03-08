const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationCase = require('../models/ModerationCase');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user for a specified duration')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('duration')
                .setDescription('Duration of the timeout (e.g. 1h, 30m, 2d)')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for the timeout')
                .setRequired(false)),
    
    async execute(interaction, client) {
        // Check if bot has permission
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ 
                content: 'I do not have permission to timeout members.',
                ephemeral: true 
            });
        }
        
        // Get user
        const user = interaction.options.getUser('user');
        
        // Get member from user
        const member = interaction.guild.members.cache.get(user.id);
        if (!member) {
            return interaction.reply({ 
                content: 'That user is not in this server.',
                ephemeral: true 
            });
        }
        
        // Check if user is moderator or has higher role
        if (member.roles.highest.position >= interaction.member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ 
                content: 'You cannot timeout someone with a higher or equal role.',
                ephemeral: true 
            });
        }
        
        // Check if user is owner
        if (member.id === interaction.guild.ownerId) {
            return interaction.reply({ 
                content: 'You cannot timeout the server owner.',
                ephemeral: true 
            });
        }
        
        // Parse duration
        const durationArg = interaction.options.getString('duration').toLowerCase();
        const duration = parseDuration(durationArg);
        
        if (!duration) {
            return interaction.reply({ 
                content: 'Invalid duration format. Please use a format like `1h`, `30m`, `2d`, etc.',
                ephemeral: true 
            });
        }
        
        // Check if duration is too long (max 28 days)
        if (duration > 28 * 24 * 60 * 60 * 1000) {
            return interaction.reply({ 
                content: 'Timeout duration cannot be longer than 28 days.',
                ephemeral: true 
            });
        }
        
        // Get reason
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
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
                moderatorId: interaction.user.id,
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
                    { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                    { name: 'Duration', value: formatDuration(duration), inline: true },
                    { name: 'Reason', value: reason },
                    { name: 'Case ID', value: `#${caseNumber}` }
                )
                .setColor('#FF9900')
                .setFooter({ text: `Timeout expires: ${new Date(Date.now() + duration).toLocaleString()}` })
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error timing out user:', error);
            return interaction.reply({ 
                content: 'There was an error timing out the user. Please check my permissions and try again.',
                ephemeral: true 
            });
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