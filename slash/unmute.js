const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const ModerationCase = require('../models/ModerationCase');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Unmute a member in the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to unmute')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('The reason for the unmute')
                .setRequired(false)),
    
    async execute(interaction, client) {
        await interaction.deferReply();
        
        const target = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        if (!target) {
            return interaction.editReply('Please specify a valid member to unmute.');
        }
        
        // Check if the bot has permission to manage roles
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.editReply('I do not have permission to manage roles.');
        }
        
        // Check if the target is moderatable
        if (!target.moderatable) {
            return interaction.editReply(`I cannot unmute ${target.user.tag} due to role hierarchy.`);
        }
        
        let unmuteMethod = 'timeout';
        
        // Get guild settings
        const guildSettings = client.settings?.get(interaction.guild.id) || {};
        const muteRoleId = guildSettings.muteRole;
        
        // Check if user has a timeout
        if (target.communicationDisabledUntil) {
            try {
                // Remove timeout
                await target.timeout(null, reason);
                unmuteMethod = 'timeout';
            } catch (error) {
                console.error(`Error removing timeout: ${error}`);
                return interaction.editReply(`Failed to remove timeout from ${target.user.tag}: ${error.message}`);
            }
        } 
        // Check if user has mute role
        else if (muteRoleId) {
            const muteRole = interaction.guild.roles.cache.get(muteRoleId);
            if (muteRole && target.roles.cache.has(muteRoleId)) {
                try {
                    // Remove mute role
                    await target.roles.remove(muteRoleId, reason);
                    unmuteMethod = 'role';
                } catch (error) {
                    console.error(`Error removing mute role: ${error}`);
                    return interaction.editReply(`Failed to remove mute role from ${target.user.tag}: ${error.message}`);
                }
            } else {
                // Check for default mute role
                const defaultMuteRole = interaction.guild.roles.cache.find(role => role.name === 'Muted');
                if (defaultMuteRole && target.roles.cache.has(defaultMuteRole.id)) {
                    try {
                        // Remove default mute role
                        await target.roles.remove(defaultMuteRole.id, reason);
                        unmuteMethod = 'role';
                    } catch (error) {
                        console.error(`Error removing default mute role: ${error}`);
                        return interaction.editReply(`Failed to remove mute role from ${target.user.tag}: ${error.message}`);
                    }
                } else {
                    return interaction.editReply(`${target.user.tag} is not muted.`);
                }
            }
        } else {
            // Check for default mute role
            const defaultMuteRole = interaction.guild.roles.cache.find(role => role.name === 'Muted');
            if (defaultMuteRole && target.roles.cache.has(defaultMuteRole.id)) {
                try {
                    // Remove default mute role
                    await target.roles.remove(defaultMuteRole.id, reason);
                    unmuteMethod = 'role';
                } catch (error) {
                    console.error(`Error removing default mute role: ${error}`);
                    return interaction.editReply(`Failed to remove mute role from ${target.user.tag}: ${error.message}`);
                }
            } else {
                return interaction.editReply(`${target.user.tag} is not muted.`);
            }
        }
        
        try {
            // Save the moderation action to MongoDB
            const caseNumber = await ModerationCase.getNextCaseNumber(interaction.guild.id);
            const moderationCase = new ModerationCase({
                userId: target.id,
                moderatorId: interaction.user.id,
                action: 'unmute',
                reason: reason,
                guildId: interaction.guild.id,
                caseNumber: caseNumber
            });
            
            await moderationCase.save();
            
            // Send success message
            await interaction.editReply(`Successfully unmuted ${target.user.tag} (${unmuteMethod}) | Case #${caseNumber}\nReason: ${reason}`);
            
            // Try to DM the user
            try {
                await target.user.send(`You have been unmuted in **${interaction.guild.name}** | Case #${caseNumber}\nReason: ${reason}`);
            } catch (error) {
                console.error(`Could not send DM to ${target.user.tag}`, error);
            }
        } catch (error) {
            console.error(`Error unmuting user: ${error}`);
            await interaction.editReply(`Failed to log unmute for ${target.user.tag}: ${error.message}`);
        }
    }
};