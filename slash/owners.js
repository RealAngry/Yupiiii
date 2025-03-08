const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('owners')
        .setDescription('Manage extra bot owners')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a user as an extra bot owner')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to add as an extra owner')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a user from extra bot owners')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove from extra owners')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all extra bot owners')),
    
    async execute(interaction, client) {
        try {
            // Check if user is the main bot owner
            const mainOwnerId = process.env.OWNER_ID || (client.config && client.config.ownerId);
            const isMainOwner = mainOwnerId && interaction.user.id === mainOwnerId;
            
            if (!isMainOwner) {
                await interaction.reply({ 
                    content: 'Only the main bot owner can manage extra owners.',
                    ephemeral: true 
                });
                return;
            }
            
            const subCommand = interaction.options.getSubcommand();
            
            switch (subCommand) {
                case 'add': {
                    const user = interaction.options.getUser('user');
                    
                    if (client.extraOwners.has(user.id)) {
                        await interaction.reply({ 
                            content: `${user.tag} is already an extra owner.`,
                            ephemeral: true 
                        });
                        return;
                    }
                    
                    client.extraOwners.add(user.id);
                    
                    const embed = new EmbedBuilder()
                        .setTitle('Extra Owner Added')
                        .setDescription(`${user.tag} has been added as an extra bot owner.`)
                        .setColor('#00FF00')
                        .setFooter({ text: `Added by ${interaction.user.tag}` })
                        .setTimestamp();
                    
                    await interaction.reply({ embeds: [embed] });
                    break;
                }
                
                case 'remove': {
                    const user = interaction.options.getUser('user');
                    
                    if (!client.extraOwners.has(user.id)) {
                        await interaction.reply({ 
                            content: `${user.tag} is not an extra owner.`,
                            ephemeral: true 
                        });
                        return;
                    }
                    
                    client.extraOwners.delete(user.id);
                    
                    const embed = new EmbedBuilder()
                        .setTitle('Extra Owner Removed')
                        .setDescription(`${user.tag} has been removed from extra bot owners.`)
                        .setColor('#FF0000')
                        .setFooter({ text: `Removed by ${interaction.user.tag}` })
                        .setTimestamp();
                    
                    await interaction.reply({ embeds: [embed] });
                    break;
                }
                
                case 'list': {
                    const embed = new EmbedBuilder()
                        .setTitle('Extra Bot Owners')
                        .setDescription('Users who have bot owner privileges:')
                        .setColor('#800080')
                        .setFooter({ text: `Total: ${client.extraOwners.size} extra owners` })
                        .setTimestamp();
                    
                    if (mainOwnerId) {
                        const mainOwner = await client.users.fetch(mainOwnerId).catch(() => null);
                        embed.addFields({ 
                            name: 'Main Owner', 
                            value: mainOwner ? `• ${mainOwner.tag} (${mainOwnerId})` : `• Unknown User (${mainOwnerId})` 
                        });
                    }
                    
                    if (client.extraOwners.size === 0) {
                        embed.addFields({ 
                            name: 'Extra Owners', 
                            value: 'None' 
                        });
                    } else {
                        const extraOwnerPromises = Array.from(client.extraOwners).map(async userId => {
                            const user = await client.users.fetch(userId).catch(() => null);
                            return user ? `• ${user.tag} (${userId})` : `• Unknown User (${userId})`;
                        });
                        
                        const extraOwners = await Promise.all(extraOwnerPromises);
                        embed.addFields({ 
                            name: 'Extra Owners', 
                            value: extraOwners.join('\n') 
                        });
                    }
                    
                    await interaction.reply({ embeds: [embed] });
                    break;
                }
            }
        } catch (error) {
            console.error('Error in owners command:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: 'There was an error executing this command!', 
                    ephemeral: true 
                }).catch(console.error);
            }
        }
    }
}; 