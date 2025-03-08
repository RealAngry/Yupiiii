const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roleinfo')
        .setDescription('Display detailed information about a role')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to get information about')
                .setRequired(true)),
    
    async execute(interaction, client) {
        const role = interaction.options.getRole('role');
        
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
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .addFields(
                { name: 'Role ID', value: role.id, inline: true },
                { name: 'Color', value: role.hexColor, inline: true },
                { name: 'Position', value: `${role.position} of ${interaction.guild.roles.cache.size}`, inline: true },
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
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .setTimestamp();
        
        // Add icon if available (Discord.js v14 feature)
        if (role.icon) {
            embed.setThumbnail(role.iconURL({ dynamic: true }));
        }
        
        await interaction.reply({ embeds: [embed] });
    }
}; 