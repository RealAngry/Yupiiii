const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'autorole',
    description: 'Configure roles to be automatically assigned to new members',
    usage: 'autorole <add/remove/list> [@role]',
    category: 'config',
    aliases: ['joinrole', 'defaultrole'],
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageGuild, PermissionFlagsBits.ManageRoles],
    execute(client, message, args) {
        // Initialize settings for guild if they don't exist
        if (!client.settings) client.settings = new Map();
        if (!client.settings.has(message.guild.id)) {
            client.settings.set(message.guild.id, {});
        }
        
        // Get guild settings
        const guildSettings = client.settings.get(message.guild.id);
        
        // Initialize autoroles array if it doesn't exist
        if (!guildSettings.autoroles) {
            guildSettings.autoroles = [];
        }
        
        // If no args, show current autoroles
        if (!args[0]) {
            const embed = new EmbedBuilder()
                .setTitle('Autorole Configuration')
                .setColor('#0099ff')
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            
            if (guildSettings.autoroles.length === 0) {
                embed.setDescription('No autoroles are currently set. Use `-autorole add @role` to add a role.');
            } else {
                const roleList = guildSettings.autoroles.map(roleId => {
                    const role = message.guild.roles.cache.get(roleId);
                    return role ? `${role}` : `Unknown Role (${roleId})`;
                }).join('\n');
                
                embed.setDescription('The following roles will be automatically assigned to new members:')
                    .addFields({ name: 'Autoroles', value: roleList });
            }
            
            embed.addFields({ name: 'Usage', value: '`-autorole add @role` - Add a role to autoroles\n`-autorole remove @role` - Remove a role from autoroles\n`-autorole list` - List all autoroles\n`-autorole clear` - Remove all autoroles' });
            
            return message.reply({ embeds: [embed] });
        }
        
        // Get action
        const action = args[0].toLowerCase();
        
        // List autoroles
        if (action === 'list') {
            const embed = new EmbedBuilder()
                .setTitle('Autorole List')
                .setColor('#0099ff')
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            
            if (guildSettings.autoroles.length === 0) {
                embed.setDescription('No autoroles are currently set. Use `-autorole add @role` to add a role.');
            } else {
                const roleList = guildSettings.autoroles.map(roleId => {
                    const role = message.guild.roles.cache.get(roleId);
                    return role ? `${role} (${roleId})` : `Unknown Role (${roleId})`;
                }).join('\n');
                
                embed.setDescription('The following roles will be automatically assigned to new members:')
                    .addFields({ name: 'Autoroles', value: roleList });
            }
            
            return message.reply({ embeds: [embed] });
        }
        
        // Clear all autoroles
        if (action === 'clear') {
            // Check if there are any autoroles to clear
            if (guildSettings.autoroles.length === 0) {
                return message.reply('There are no autoroles to clear.');
            }
            
            // Clear autoroles
            guildSettings.autoroles = [];
            
            // Save settings
            client.settings.set(message.guild.id, guildSettings);
            
            const embed = new EmbedBuilder()
                .setTitle('Autoroles Cleared')
                .setDescription('All autoroles have been removed.')
                .setColor('#00FF00')
                .setFooter({ text: `Modified by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Add or remove autorole
        if (action === 'add' || action === 'remove') {
            // Check if a role was mentioned
            const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
            
            if (!role) {
                return message.reply('Please mention a valid role or provide a role ID.');
            }
            
            // Check if role is manageable
            if (!role.editable) {
                return message.reply('I cannot manage this role! It might be higher than my highest role.');
            }
            
            // Check if role is @everyone
            if (role.id === message.guild.id) {
                return message.reply('You cannot use the @everyone role as an autorole.');
            }
            
            if (action === 'add') {
                // Check if role is already an autorole
                if (guildSettings.autoroles.includes(role.id)) {
                    return message.reply(`${role} is already an autorole.`);
                }
                
                // Add role to autoroles
                guildSettings.autoroles.push(role.id);
                
                // Save settings
                client.settings.set(message.guild.id, guildSettings);
                
                const embed = new EmbedBuilder()
                    .setTitle('Autorole Added')
                    .setDescription(`${role} will now be automatically assigned to new members.`)
                    .setColor('#00FF00')
                    .setFooter({ text: `Modified by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            } else if (action === 'remove') {
                // Check if role is an autorole
                if (!guildSettings.autoroles.includes(role.id)) {
                    return message.reply(`${role} is not an autorole.`);
                }
                
                // Remove role from autoroles
                guildSettings.autoroles = guildSettings.autoroles.filter(r => r !== role.id);
                
                // Save settings
                client.settings.set(message.guild.id, guildSettings);
                
                const embed = new EmbedBuilder()
                    .setTitle('Autorole Removed')
                    .setDescription(`${role} will no longer be automatically assigned to new members.`)
                    .setColor('#FF0000')
                    .setFooter({ text: `Modified by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
        }
        
        // Invalid action
        return message.reply('Invalid action! Please use `add`, `remove`, `list`, or `clear`.');
    }
}; 