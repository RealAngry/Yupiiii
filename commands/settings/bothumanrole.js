const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const mongoose = require('mongoose');
const Guild = require('../../models/guild');

module.exports = {
    name: 'bothumanrole',
    description: 'Set roles to automatically assign to bots and humans',
    usage: 'bothumanrole <bot/human> <role>',
    category: 'settings',
    aliases: ['autobotrole', 'autohumanrole', 'setbotrole', 'sethumanrole'],
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageGuild],
    examples: [
        'bothumanrole bot @Bots',
        'bothumanrole human @Members',
        'bothumanrole list',
        'bothumanrole reset bot',
        'bothumanrole reset human'
    ],
    async execute(message, args, client) {
        // Check if the user has the required permissions
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply('You need the **Manage Server** permission to use this command.');
        }

        // If no arguments provided, show help
        if (!args.length) {
            return showHelp(message);
        }

        // Get the subcommand (bot, human, list, reset)
        const subcommand = args[0].toLowerCase();

        // Handle list subcommand
        if (subcommand === 'list') {
            return listRoles(message, client);
        }

        // Handle reset subcommand
        if (subcommand === 'reset') {
            if (!args[1]) {
                return message.reply('Please specify what to reset: `bot` or `human`');
            }
            
            const resetType = args[1].toLowerCase();
            if (resetType !== 'bot' && resetType !== 'human') {
                return message.reply('Invalid reset type. Use `bot` or `human`.');
            }
            
            return resetRole(message, resetType, client);
        }

        // Handle bot and human subcommands
        if (subcommand !== 'bot' && subcommand !== 'human') {
            return message.reply('Invalid subcommand. Use `bot`, `human`, `list`, or `reset`.');
        }

        // Check if a role is provided
        if (!args[1]) {
            return message.reply(`Please mention a role or provide a role ID to set as the ${subcommand} role.`);
        }

        // Get the role from mention or ID
        const roleInput = args[1];
        let role;

        if (message.mentions.roles.size > 0) {
            role = message.mentions.roles.first();
        } else {
            role = message.guild.roles.cache.get(roleInput);
        }

        // Check if the role exists
        if (!role) {
            return message.reply('I couldn\'t find that role. Please mention a valid role or provide a valid role ID.');
        }

        // Check if the role is manageable by the bot
        if (!role.editable) {
            return message.reply('I don\'t have permission to assign that role. Make sure my role is above the target role in the server settings.');
        }

        // Save the role to the database
        try {
            let guildData = await Guild.findOne({ guildId: message.guild.id });
            
            if (!guildData) {
                guildData = new Guild({
                    guildId: message.guild.id,
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
                .setFooter({ text: 'Yupi Management Team' })
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
            
            // Apply roles to existing members if requested
            if (args[2] && args[2].toLowerCase() === 'apply') {
                await applyRolesToExistingMembers(message, subcommand, role);
            }
        } catch (error) {
            console.error('Error setting auto role:', error);
            message.reply('There was an error setting the auto role. Please try again later.');
        }
    }
};

// Function to show help
function showHelp(message) {
    const embed = new EmbedBuilder()
        .setColor('#3498DB')
        .setTitle('Bot/Human Auto Role Help')
        .setDescription('Automatically assign roles to bots and humans when they join the server.')
        .addFields(
            { name: 'Set Bot Role', value: '`bothumanrole bot @BotRole`', inline: false },
            { name: 'Set Human Role', value: '`bothumanrole human @HumanRole`', inline: false },
            { name: 'List Current Roles', value: '`bothumanrole list`', inline: false },
            { name: 'Reset Bot Role', value: '`bothumanrole reset bot`', inline: false },
            { name: 'Reset Human Role', value: '`bothumanrole reset human`', inline: false },
            { name: 'Apply to Existing Members', value: 'Add `apply` at the end of the command to apply the role to all existing members\nExample: `bothumanrole human @Members apply`', inline: false }
        )
        .setFooter({ text: 'Yupi Management Team' });
    
    return message.reply({ embeds: [embed] });
}

// Function to list current roles
async function listRoles(message, client) {
    try {
        const guildData = await Guild.findOne({ guildId: message.guild.id });
        
        let botRoleText = 'Not set';
        let humanRoleText = 'Not set';
        
        if (guildData) {
            if (guildData.botRole) {
                const botRole = message.guild.roles.cache.get(guildData.botRole);
                botRoleText = botRole ? `${botRole} (${botRole.id})` : 'Role not found in server';
            }
            
            if (guildData.humanRole) {
                const humanRole = message.guild.roles.cache.get(guildData.humanRole);
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
            .setFooter({ text: 'Yupi Management Team' })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error listing auto roles:', error);
        return message.reply('There was an error retrieving the auto role settings. Please try again later.');
    }
}

// Function to reset a role
async function resetRole(message, type, client) {
    try {
        const guildData = await Guild.findOne({ guildId: message.guild.id });
        
        if (!guildData) {
            return message.reply(`No auto roles are set for this server.`);
        }
        
        if (type === 'bot') {
            if (!guildData.botRole) {
                return message.reply('No bot auto role is currently set.');
            }
            guildData.botRole = null;
        } else {
            if (!guildData.humanRole) {
                return message.reply('No human auto role is currently set.');
            }
            guildData.humanRole = null;
        }
        
        await guildData.save();
        
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Auto Role Reset')
            .setDescription(`The ${type} auto role has been reset.`)
            .setFooter({ text: 'Yupi Management Team' })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error resetting auto role:', error);
        return message.reply('There was an error resetting the auto role. Please try again later.');
    }
}

// Function to apply roles to existing members
async function applyRolesToExistingMembers(message, type, role) {
    const loadingMsg = await message.channel.send(`Applying ${role} to all existing ${type}s. This may take a while...`);
    
    try {
        // Fetch all guild members
        await message.guild.members.fetch();
        
        let count = 0;
        const members = message.guild.members.cache.filter(member => {
            if (type === 'bot') {
                return member.user.bot;
            } else {
                return !member.user.bot;
            }
        });
        
        for (const [id, member] of members) {
            try {
                if (!member.roles.cache.has(role.id)) {
                    await member.roles.add(role);
                    count++;
                }
            } catch (error) {
                console.error(`Error adding role to member ${member.user.tag}:`, error);
            }
        }
        
        await loadingMsg.edit(`Successfully applied ${role} to ${count} ${type}s.`);
    } catch (error) {
        console.error('Error applying roles to existing members:', error);
        await loadingMsg.edit(`There was an error applying roles to existing members: ${error.message}`);
    }
} 