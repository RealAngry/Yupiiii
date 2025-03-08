const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationCase = require('../models/ModerationCase');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a member in the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to mute')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('The reason for the mute')
                .setRequired(false)),
    
    async execute(interaction, client) {
        await interaction.deferReply();
        
        const target = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        if (!target) {
            return interaction.editReply('Please specify a valid member to mute.');
        }
        
        // Check if the bot has permission to manage roles
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.editReply('I do not have permission to manage roles.');
        }
        
        // Check if the target is moderatable
        if (!target.moderatable) {
            return interaction.editReply(`I cannot mute ${target.user.tag} due to role hierarchy.`);
        }
        
        // Check if the target is already muted
        const muteRole = interaction.guild.roles.cache.find(role => role.name === 'Muted');
        if (muteRole && target.roles.cache.has(muteRole.id)) {
            return interaction.editReply(`${target.user.tag} is already muted.`);
        }
        
        try {
            // Get the mute role from settings or create one
            let muteRole = interaction.guild.roles.cache.find(role => role.name === 'Muted');
            
            if (!muteRole) {
                try {
                    // Create a new mute role
                    muteRole = await interaction.guild.roles.create({
                        name: 'Muted',
                        color: '#808080',
                        reason: 'Mute role created for moderation'
                    });
                    
                    // Set permissions for all channels
                    interaction.guild.channels.cache.forEach(async (channel) => {
                        await channel.permissionOverwrites.create(muteRole, {
                            SendMessages: false,
                            AddReactions: false,
                            Speak: false
                        });
                    });
                } catch (error) {
                    console.error('Error creating mute role:', error);
                    return interaction.editReply('Error creating mute role. Please check my permissions.');
                }
            }
            
            // Add the mute role to the target
            await target.roles.add(muteRole);
            
            // Save the moderation action to MongoDB
            const caseNumber = await ModerationCase.getNextCaseNumber(interaction.guild.id);
            const moderationCase = new ModerationCase({
                userId: target.id,
                moderatorId: interaction.user.id,
                action: 'mute',
                reason: reason,
                guildId: interaction.guild.id,
                caseNumber: caseNumber
            });
            
            await moderationCase.save();
            
            // Send success message
            await interaction.editReply(`Successfully muted ${target.user.tag} | Case #${caseNumber}\nReason: ${reason}`);
            
            // Try to DM the user
            try {
                await target.user.send(`You have been muted in **${interaction.guild.name}** | Case #${caseNumber}\nReason: ${reason}`);
            } catch (error) {
                console.error(`Could not send DM to ${target.user.tag}`, error);
            }
        } catch (error) {
            console.error(`Error muting user: ${error}`);
            await interaction.editReply(`Failed to mute ${target.user.tag}: ${error.message}`);
        }
    }
};