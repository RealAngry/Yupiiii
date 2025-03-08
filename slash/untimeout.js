const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationCase = require('../models/ModerationCase');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('Remove a timeout from a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to remove timeout from')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for removing the timeout')
                .setRequired(false)),
    
    async execute(interaction, client) {
        // Check if bot has permission
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ 
                content: 'I do not have permission to remove timeouts.',
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
        
        // Check if user is timed out
        if (!member.communicationDisabledUntil) {
            return interaction.reply({ 
                content: 'That user is not timed out.',
                ephemeral: true 
            });
        }
        
        // Get reason
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
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
                moderatorId: interaction.user.id,
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
                    { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
                    { name: 'Reason', value: reason },
                    { name: 'Case ID', value: `#${caseNumber}` }
                )
                .setColor('#00CC00')
                .setFooter({ text: `Timeout removed by ${interaction.user.tag}` })
                .setTimestamp();
            
            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error removing timeout:', error);
            return interaction.reply({ 
                content: 'There was an error removing the timeout. Please check my permissions and try again.',
                ephemeral: true 
            });
        }
    }
}; 