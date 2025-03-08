const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admins')
        .setDescription('List all administrators in the server'),
    
    async execute(interaction, client) {
        await interaction.deferReply();
        
        try {
            // Get all members with Administrator permission
            const members = await interaction.guild.members.fetch();
            const administrators = members.filter(member => 
                member.permissions.has(PermissionFlagsBits.Administrator) && !member.user.bot
            );
            
            if (administrators.size === 0) {
                return interaction.editReply('No administrators found in this server.');
            }
            
            // Create embed
            const embed = new EmbedBuilder()
                .setTitle(`Administrators in ${interaction.guild.name}`)
                .setDescription(`Total Administrators: ${administrators.size}`)
                .setColor('#FF5500')
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setFooter({ text: `Requested by ${interaction.user.tag}` })
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
                        .filter(role => role.id !== interaction.guild.id) // Filter out @everyone role
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
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching members:', error);
            await interaction.editReply('An error occurred while fetching administrators.');
        }
    }
}; 