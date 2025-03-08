const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'admins',
    description: 'List all administrators in the server',
    usage: 'admins',
    category: 'utility',
    aliases: ['adminlist', 'administrators'],
    permissions: PermissionFlagsBits.SendMessages,
    cooldown: 10,
    execute(client, message, args) {
        // Get all members with Administrator permission
        message.guild.members.fetch().then(members => {
            const administrators = members.filter(member => 
                member.permissions.has(PermissionFlagsBits.Administrator) && !member.user.bot
            );
            
            if (administrators.size === 0) {
                return message.reply('No administrators found in this server.');
            }
            
            // Create embed
            const embed = new EmbedBuilder()
                .setTitle(`Administrators in ${message.guild.name}`)
                .setDescription(`Total Administrators: ${administrators.size}`)
                .setColor('#FF5500')
                .setThumbnail(message.guild.iconURL({ dynamic: true }))
                .setFooter({ text: `Requested by ${message.author.tag}` })
                .setTimestamp();
            
            // Sort administrators by roles (highest role first)
            const sortedAdmins = [...administrators.values()].sort((a, b) => {
                return b.roles.highest.position - a.roles.highest.position;
            });
            
            // Split into chunks if there are many administrators
            const chunkSize = 10;
            for (let i = 0; i < sortedAdmins.length; i += chunkSize) {
                const chunk = sortedAdmins.slice(i, i + chunkSize);
                
                let fieldValue = '';
                chunk.forEach(admin => {
                    const roles = admin.roles.cache
                        .filter(role => role.id !== message.guild.id) // Filter out @everyone role
                        .sort((a, b) => b.position - a.position) // Sort by position
                        .map(role => role.name)
                        .slice(0, 3) // Get top 3 roles
                        .join(', ');
                    
                    fieldValue += `• **${admin.user.tag}** (${admin.id})\n`;
                    fieldValue += `  Highest Role: ${admin.roles.highest.name}\n`;
                    if (roles) fieldValue += `  Other Roles: ${roles}${roles.split(',').length >= 3 ? '...' : ''}\n`;
                    fieldValue += '\n';
                });
                
                embed.addFields({ 
                    name: `Administrators ${i + 1}-${Math.min(i + chunkSize, sortedAdmins.length)}`, 
                    value: fieldValue || 'None' 
                });
            }
            
            message.reply({ embeds: [embed] });
        }).catch(error => {
            console.error('Error fetching members:', error);
            message.reply('An error occurred while fetching administrators.');
        });
    }
}; 