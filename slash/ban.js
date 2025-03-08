const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const ModerationCase = require('../models/ModerationCase');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member from the server')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false))
        .addIntegerOption(option => 
            option.setName('days')
                .setDescription('Number of days of messages to delete (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction, client) {
        // Defer reply to give time for the ban to process
        await interaction.deferReply();
        
        try {
            // Get options
            const user = interaction.options.getUser('user');
            const member = interaction.options.getMember('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            const days = interaction.options.getInteger('days') || 0;
            
            // Check if trying to ban self
            if (user.id === interaction.user.id) {
                return interaction.editReply('You cannot ban yourself!');
            }
            
            // Check if user is bannable (if they're in the server)
            if (member && !member.bannable) {
                return interaction.editReply('I cannot ban this user! Do they have a higher role?');
            }
            
            // Check if user is already banned
            try {
                const bannedUsers = await interaction.guild.bans.fetch();
                if (bannedUsers.has(user.id)) {
                    return interaction.editReply(`${user.tag} is already banned from this server.`);
                }
            } catch (error) {
                console.error(`Error checking ban status: ${error}`);
                // Continue with the ban attempt even if we can't check current bans
            }
            
            // Get the next case number
            const caseNumber = await ModerationCase.getNextCaseNumber(interaction.guild.id);
            
            // Ban options
            const banOptions = {
                deleteMessageDays: days,
                reason: reason
            };
            
            // Ban the user
            await interaction.guild.members.ban(user.id, banOptions);
            
            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('Member Banned')
                .setDescription(`**${user.tag}** has been banned from the server.`)
                .addFields(
                    { name: 'Reason', value: reason },
                    { name: 'Moderator', value: interaction.user.tag },
                    { name: 'Message History Deleted', value: `${days} days` },
                    { name: 'Case ID', value: `#${caseNumber}` }
                )
                .setColor('#FF0000')
                .setThumbnail(user.displayAvatarURL())
                .setTimestamp();
            
            // Send response
            await interaction.editReply({ embeds: [embed] });
            
            // Try to DM the banned user
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle(`You were banned from ${interaction.guild.name}`)
                    .addFields(
                        { name: 'Reason', value: reason },
                        { name: 'Moderator', value: interaction.user.tag },
                        { name: 'Case ID', value: `#${caseNumber}` }
                    )
                    .setColor('#FF0000')
                    .setTimestamp();
                
                await user.send({ embeds: [dmEmbed] }).catch(() => {});
            } catch (error) {
                console.error(`Could not send DM to ${user.tag}`, error);
            }
            
            // Save the moderation action to MongoDB
            const moderationCase = new ModerationCase({
                caseNumber: caseNumber,
                userId: user.id,
                moderatorId: interaction.user.id,
                action: 'ban',
                reason: reason,
                guildId: interaction.guild.id
            });
            
            await moderationCase.save();
            console.log(`Saved moderation action: ban for user ${user.id} (Case #${caseNumber})`);
            
        } catch (error) {
            console.error('Error executing ban command:', error);
            
            if (interaction.deferred) {
                await interaction.editReply({ 
                    content: `There was an error executing this command: ${error.message}`,
                    ephemeral: true 
                });
            } else {
                await interaction.reply({ 
                    content: `There was an error executing this command: ${error.message}`,
                    ephemeral: true 
                });
            }
        }
    }
};