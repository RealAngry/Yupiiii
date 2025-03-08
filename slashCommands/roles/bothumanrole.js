const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const mongoose = require('mongoose');
const Guild = require('../../models/guild');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bothumanrole')
        .setDescription('Set roles to automatically assign to bots and humans')
        .addSubcommand(subcommand =>
            subcommand
                .setName('bot')
                .setDescription('Set a role to automatically assign to bots')
                .addRoleOption(option => 
                    option.setName('role')
                        .setDescription('The role to assign to bots')
                        .setRequired(true))
                .addBooleanOption(option =>
                    option.setName('apply')
                        .setDescription('Apply the role to all existing bots')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('human')
                .setDescription('Set a role to automatically assign to humans')
                .addRoleOption(option => 
                    option.setName('role')
                        .setDescription('The role to assign to humans')
                        .setRequired(true))
                .addBooleanOption(option =>
                    option.setName('apply')
                        .setDescription('Apply the role to all existing humans')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List the current auto roles for bots and humans'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset the auto role for bots or humans')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('The type of auto role to reset')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Bot', value: 'bot' },
                            { name: 'Human', value: 'human' }
                        )))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    category: 'roles',
    
    async execute(interaction, client) {
        await interaction.deferReply();
        
        // Get the subcommand
        const subcommand = interaction.options.getSubcommand();
        
        // Handle list subcommand
        if (subcommand === 'list') {
            return listRoles(interaction);
        }
        
        // Handle reset subcommand
        if (subcommand === 'reset') {
            const type = interaction.options.getString('type');
            return resetRole(interaction, type);
        }
        
        // Handle bot and human subcommands
        const role = interaction.options.getRole('role');
        const apply = interaction.options.getBoolean('apply') || false;
        
        // Check if the role is manageable by the bot
        if (!role.editable) {
            return interaction.editReply('I don\'t have permission to assign that role. Make sure my role is above the target role in the server settings.');
        }
        
        // Save the role to the database
        try {
            let guildData = await Guild.findOne({ guildId: interaction.guild.id });
            
            if (!guildData) {
                guildData = new Guild({
                    guildId: interaction.guild.id,
                    botRole: subcommand === 'bot' ? role.id : null,
                    humanRole: subcommand === 'human' ? role.id : null
                });
            } else {
                if (subcommand === 'bot') {
                    guildData.botRole = role.id;
                } else {
                    guildData.humanRole = role.id;
                }
            }
            
            await guildData.save();
            
            // Send success message
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Auto Role Set')
                .setDescription(`The ${subcommand} role has been set to ${role}.`)
                .setFooter({ text: 'Dash Bot' })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
            
            // Apply roles to existing members if requested
            if (apply) {
                await applyRolesToExistingMembers(interaction, subcommand, role);
            }
        } catch (error) {
            console.error('Error setting auto role:', error);
            await interaction.editReply('There was an error setting the auto role. Please try again later.');
        }
    }
};

// Function to list current roles
async function listRoles(interaction) {
    try {
        const guildData = await Guild.findOne({ guildId: interaction.guild.id });
        
        let botRoleText = 'Not set';
        let humanRoleText = 'Not set';
        
        if (guildData) {
            if (guildData.botRole) {
                const botRole = interaction.guild.roles.cache.get(guildData.botRole);
                botRoleText = botRole ? `${botRole} (${botRole.id})` : 'Role not found in server';
            }
            
            if (guildData.humanRole) {
                const humanRole = interaction.guild.roles.cache.get(guildData.humanRole);
                humanRoleText = humanRole ? `${humanRole} (${humanRole.id})` : 'Role not found in server';
            }
        }
        
        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('Auto Role Settings')
            .addFields(
                { name: 'Bot Auto Role', value: botRoleText, inline: false },
                { name: 'Human Auto Role', value: humanRoleText, inline: false }
            )
            .setFooter({ text: 'Dash Bot' })
            .setTimestamp();
        
        return interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error listing auto roles:', error);
        return interaction.editReply('There was an error retrieving the auto role settings. Please try again later.');
    }
}

// Function to reset a role
async function resetRole(interaction, type) {
    try {
        const guildData = await Guild.findOne({ guildId: interaction.guild.id });
        
        if (!guildData) {
            return interaction.editReply(`No auto roles are set for this server.`);
        }
        
        if (type === 'bot') {
            if (!guildData.botRole) {
                return interaction.editReply('No bot auto role is currently set.');
            }
            guildData.botRole = null;
        } else {
            if (!guildData.humanRole) {
                return interaction.editReply('No human auto role is currently set.');
            }
            guildData.humanRole = null;
        }
        
        await guildData.save();
        
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Auto Role Reset')
            .setDescription(`The ${type} auto role has been reset.`)
            .setFooter({ text: 'Dash Bot' })
            .setTimestamp();
        
        return interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error resetting auto role:', error);
        return interaction.editReply('There was an error resetting the auto role. Please try again later.');
    }
}

// Function to apply roles to existing members
async function applyRolesToExistingMembers(interaction, type, role) {
    await interaction.followUp(`Applying ${role} to all existing ${type}s. This may take a while...`);
    
    try {
        // Fetch all guild members
        await interaction.guild.members.fetch();
        
        let count = 0;
        const members = interaction.guild.members.cache.filter(member => {
            if (type === 'bot') {
                return member.user.bot;
            } else {
                return !member.user.bot;
            }
        });
        
        const processMember = async (member) => {
            try {
                if (!member.roles.cache.has(role.id)) {
                    await member.roles.add(role);
                    count++;
                }
            } catch (error) {
                console.error(`Error adding role to member ${member.user.tag}:`, error);
            }
        };
        
        // Process members in batches to avoid rate limits
        const batchSize = 10;
        const memberArray = Array.from(members.values());
        
        for (let i = 0; i < memberArray.length; i += batchSize) {
            const batch = memberArray.slice(i, i + batchSize);
            await Promise.all(batch.map(processMember));
            
            // Add a small delay between batches
            if (i + batchSize < memberArray.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        await interaction.followUp(`Successfully applied ${role} to ${count} ${type}s.`);
    } catch (error) {
        console.error('Error applying roles to existing members:', error);
        await interaction.followUp(`There was an error applying roles to existing members: ${error.message}`);
    }
} 