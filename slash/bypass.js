const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Manage users who can bypass automod features')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a user to the bypass list')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to add to the bypass list')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a user from the bypass list')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove from the bypass list')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all users in the bypass list')),
    
    async execute(interaction, client) {
        try {
            // Initialize bypass collection if it doesn't exist
            if (!client.bypass) {
                client.bypass = new Map();
            }
            
            // Get guild bypass list
            if (!client.bypass.has(interaction.guild.id)) {
                client.bypass.set(interaction.guild.id, new Set());
            }
            
            const bypassList = client.bypass.get(interaction.guild.id);
            const subCommand = interaction.options.getSubcommand();
            
            switch (subCommand) {
                case 'add': {
                    const user = interaction.options.getUser('user');
                    
                    // Check if user is already in bypass list
                    if (bypassList.has(user.id)) {
                        return interaction.reply({ 
                            content: `${user.tag} is already in the bypass list.`,
                            ephemeral: true 
                        });
                    }
                    
                    // Add user to bypass list
                    bypassList.add(user.id);
                    client.bypass.set(interaction.guild.id, bypassList);
                    
                    // Create embed
                    const embed = new EmbedBuilder()
                        .setTitle('Bypass User Added')
                        .setDescription(`${user.tag} has been added to the bypass list.`)
                        .setColor('#00FF00')
                        .setFooter({ text: `Added by ${interaction.user.tag}` })
                        .setTimestamp();
                    
                    return interaction.reply({ embeds: [embed] });
                }
                
                case 'remove': {
                    const user = interaction.options.getUser('user');
                    
                    // Check if user is in bypass list
                    if (!bypassList.has(user.id)) {
                        return interaction.reply({ 
                            content: `${user.tag} is not in the bypass list.`,
                            ephemeral: true 
                        });
                    }
                    
                    // Remove user from bypass list
                    bypassList.delete(user.id);
                    client.bypass.set(interaction.guild.id, bypassList);
                    
                    // Create embed
                    const embed = new EmbedBuilder()
                        .setTitle('Bypass User Removed')
                        .setDescription(`${user.tag} has been removed from the bypass list.`)
                        .setColor('#FF0000')
                        .setFooter({ text: `Removed by ${interaction.user.tag}` })
                        .setTimestamp();
                    
                    return interaction.reply({ embeds: [embed] });
                }
                
                case 'list': {
                    // Check if bypass list is empty
                    if (bypassList.size === 0) {
                        return interaction.reply({ 
                            content: 'The bypass list is empty.',
                            ephemeral: true 
                        });
                    }
                    
                    // Create embed
                    const embed = new EmbedBuilder()
                        .setTitle('Bypass List')
                        .setDescription('Users who can bypass automod features:')
                        .setColor('#00FFFF')
                        .setFooter({ text: `Total: ${bypassList.size} users` })
                        .setTimestamp();
                    
                    // Add users to embed
                    const bypassUsers = Array.from(bypassList).map(userId => {
                        const user = client.users.cache.get(userId);
                        return user ? `${user.tag} (${userId})` : `Unknown User (${userId})`;
                    });
                    
                    // Split into chunks if there are many users
                    const chunkSize = 15;
                    for (let i = 0; i < bypassUsers.length; i += chunkSize) {
                        const chunk = bypassUsers.slice(i, i + chunkSize);
                        embed.addFields({ 
                            name: `Users ${i + 1}-${Math.min(i + chunkSize, bypassUsers.length)}`, 
                            value: chunk.map(user => `• ${user}`).join('\n') 
                        });
                    }
                    
                    return interaction.reply({ embeds: [embed] });
                }
            }
        } catch (error) {
            console.error('Error in bypass command:', error);
            if (!interaction.replied && !interaction.deferred) {
                return interaction.reply({ 
                    content: 'There was an error executing this command!', 
                    ephemeral: true 
                });
            }
        }
    }
}; 