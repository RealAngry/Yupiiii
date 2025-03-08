const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'roleinfo',
    description: 'Display detailed information about a role',
    usage: 'roleinfo [role]',
    category: 'utility',
    aliases: ['rinfo'],
    permissions: PermissionFlagsBits.SendMessages,
    cooldown: 5,
    examples: [
        'roleinfo @Moderator',
        'roleinfo Moderator',
        'roleinfo 123456789012345678'
    ],
    execute(client, message, args) {
        // Check for required arguments
        if (!args[0]) {
            return message.reply(`Please specify a role. Usage: \`${client.prefix}roleinfo [role]\``);
        }
        
        // Get role from mention, ID, or name
        let role = message.mentions.roles.first();
        
        if (!role) {
            // Try to find by ID
            role = message.guild.roles.cache.get(args[0]);
        }
        
        if (!role) {
            // Try to find by name
            const roleName = args.join(' ');
            role = message.guild.roles.cache.find(r => 
                r.name.toLowerCase() === roleName.toLowerCase() ||
                r.name.toLowerCase().includes(roleName.toLowerCase())
            );
        }
        
        if (!role) {
            return message.reply('Could not find that role. Please provide a valid role mention, ID, or name.');
        }
        
        // Get role members
        const members = role.members.map(m => m.user.tag);
        
        // Format permissions
        const permissions = role.permissions.toArray();
        const formattedPermissions = permissions.length > 0 
            ? permissions.map(p => `\`${p.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}\``).join(', ')
            : 'None';
        
        // Create embed
        const embed = new EmbedBuilder()
            .setTitle(`Role Information: ${role.name}`)
            .setColor(role.color || '#000000')
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .addFields(
                { name: 'Role ID', value: role.id, inline: true },
                { name: 'Color', value: role.hexColor, inline: true },
                { name: 'Position', value: `${role.position} of ${message.guild.roles.cache.size}`, inline: true },
                { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
                { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
                { name: 'Managed', value: role.managed ? 'Yes' : 'No', inline: true },
                { name: 'Created At', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:F>`, inline: false },
                { name: `Members [${role.members.size}]`, value: role.members.size > 0 
                    ? (role.members.size <= 10 
                        ? members.join(', ') 
                        : `${members.slice(0, 10).join(', ')} and ${role.members.size - 10} more...`)
                    : 'No members', inline: false },
                { name: 'Key Permissions', value: formattedPermissions.length > 1024 
                    ? `${formattedPermissions.substring(0, 1020)}...` 
                    : formattedPermissions, inline: false }
            )
            .setFooter({ text: `Requested by ${message.author.tag}` })
            .setTimestamp();
        
        // Add icon if available (Discord.js v14 feature)
        if (role.icon) {
            embed.setThumbnail(role.iconURL({ dynamic: true }));
        }
        
        message.reply({ embeds: [embed] });
    }
}; 