const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationCase = require('../models/ModerationCase');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('masswarn')
        .setDescription('Warn multiple users at once')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(true))
        .addUserOption(option => 
            option.setName('user1')
                .setDescription('First user to warn')
                .setRequired(true))
        .addUserOption(option => 
            option.setName('user2')
                .setDescription('Second user to warn')
                .setRequired(false))
        .addUserOption(option => 
            option.setName('user3')
                .setDescription('Third user to warn')
                .setRequired(false))
        .addUserOption(option => 
            option.setName('user4')
                .setDescription('Fourth user to warn')
                .setRequired(false))
        .addUserOption(option => 
            option.setName('user5')
                .setDescription('Fifth user to warn')
                .setRequired(false)),
    
    async execute(interaction, client) {
        await interaction.deferReply();
        
        // Get reason
        const reason = interaction.options.getString('reason');
        
        // Get all users
        const users = [];
        for (let i = 1; i <= 5; i++) {
            const user = interaction.options.getUser(`user${i}`);
            if (user) users.push(user);
        }
        
        // Remove duplicates
        const uniqueUsers = [...new Map(users.map(user => [user.id, user])).values()];
        
        // Check if trying to warn self
        if (uniqueUsers.some(user => user.id === interaction.user.id)) {
            return interaction.editReply('You cannot warn yourself.');
        }
        
        // Check if trying to warn the bot
        if (uniqueUsers.some(user => user.id === client.user.id)) {
            return interaction.editReply('You cannot warn me.');
        }
        
        // Create loading message
        const loadingEmbed = new EmbedBuilder()
            .setTitle('Processing Mass Warning')
            .setDescription(`Warning ${uniqueUsers.length} users...`)
            .setColor('#FFA500')
            .setTimestamp();
        
        await interaction.editReply({ embeds: [loadingEmbed] });
        
        // Process each user
        const successfulWarns = [];
        const failedWarns = [];
        
        for (const user of uniqueUsers) {
            try {
                // Get member object
                const member = await interaction.guild.members.fetch(user.id).catch(() => null);
                
                // Skip if member not found or has higher role
                if (!member) {
                    failedWarns.push({ user, reason: 'User not found in server' });
                    continue;
                }
                
                if (member.roles.highest.position >= interaction.member.roles.highest.position && 
                    interaction.user.id !== interaction.guild.ownerId) {
                    failedWarns.push({ user, reason: 'User has higher or equal role' });
                    continue;
                }
                
                // Get next case number
                const caseNumber = await ModerationCase.getNextCaseNumber(interaction.guild.id);
                
                // Create moderation case
                const moderationCase = new ModerationCase({
                    guildId: interaction.guild.id,
                    caseNumber: caseNumber,
                    userId: user.id,
                    moderatorId: interaction.user.id,
                    action: 'warn',
                    reason: reason
                });
                
                // Save to database
                await moderationCase.save();
                
                // Try to DM the user
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setTitle(`Warning from ${interaction.guild.name}`)
                        .setDescription(`You have been warned by ${interaction.user.tag}`)
                        .addFields(
                            { name: 'Reason', value: reason },
                            { name: 'Case ID', value: `#${caseNumber}` }
                        )
                        .setColor('#FFA500')
                        .setTimestamp();
                    
                    await user.send({ embeds: [dmEmbed] });
                } catch (error) {
                    console.error(`Could not send DM to ${user.tag}`, error);
                }
                
                // Add to successful warns
                successfulWarns.push({ user, caseNumber });
            } catch (error) {
                console.error(`Error warning user ${user.tag}:`, error);
                failedWarns.push({ user, reason: 'Internal error' });
            }
        }
        
        // Create result embed
        const resultEmbed = new EmbedBuilder()
            .setTitle('Mass Warning Results')
            .setDescription(`Warned ${successfulWarns.length} out of ${uniqueUsers.length} users`)
            .setColor(successfulWarns.length > 0 ? '#00FF00' : '#FF0000')
            .setTimestamp();
        
        // Add successful warns
        if (successfulWarns.length > 0) {
            let successText = '';
            for (const warn of successfulWarns) {
                successText += `• ${warn.user.tag} (Case #${warn.caseNumber})\n`;
            }
            resultEmbed.addFields({ name: '✅ Successfully Warned', value: successText });
        }
        
        // Add failed warns
        if (failedWarns.length > 0) {
            let failText = '';
            for (const warn of failedWarns) {
                failText += `• ${warn.user.tag} - ${warn.reason}\n`;
            }
            resultEmbed.addFields({ name: '❌ Failed to Warn', value: failText });
        }
        
        // Add reason
        resultEmbed.addFields({ name: 'Reason', value: reason });
        
        // Edit loading message with result
        await interaction.editReply({ embeds: [resultEmbed] });
        
        // Log to moderation channel if configured
        const guildSettings = client.settings.get(interaction.guild.id);
        if (guildSettings && guildSettings.logChannelId) {
            const logChannel = interaction.guild.channels.cache.get(guildSettings.logChannelId);
            
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('Mass Warning')
                    .setDescription(`${interaction.user.tag} warned ${successfulWarns.length} users`)
                    .addFields(
                        { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})` },
                        { name: 'Reason', value: reason },
                        { name: 'Channel', value: `${interaction.channel} (${interaction.channel.id})` },
                        { name: 'Warned Users', value: successfulWarns.length > 0 
                            ? successfulWarns.map(w => `${w.user.tag} (Case #${w.caseNumber})`).join('\n')
                            : 'None'
                        }
                    )
                    .setColor('#FFA500')
                    .setTimestamp();
                
                await logChannel.send({ embeds: [logEmbed] });
            }
        }
    }
}; 