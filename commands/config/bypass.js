const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'bypass',
    description: 'Manage users who can bypass automod features',
    usage: 'bypass [add/remove/list] [user]',
    category: 'config',
    aliases: ['byp'],
    permissions: PermissionFlagsBits.Administrator,
    cooldown: 5,
    examples: [
        'bypass add @user',
        'bypass remove @user',
        'bypass list'
    ],
    execute(client, message, args) {
        // Initialize bypass collection if it doesn't exist
        if (!client.bypass) {
            client.bypass = new Map();
        }
        
        // Get guild bypass list
        if (!client.bypass.has(message.guild.id)) {
            client.bypass.set(message.guild.id, new Set());
        }
        
        const bypassList = client.bypass.get(message.guild.id);
        const subCommand = args[0]?.toLowerCase();
        
        if (!subCommand || !['add', 'remove', 'list'].includes(subCommand)) {
            const embed = new EmbedBuilder()
                .setTitle('Bypass Command Help')
                .setDescription('Manage users who can bypass automod features')
                .addFields(
                    { name: 'Add a user to bypass list', value: `\`${client.prefix}bypass add @user\`` },
                    { name: 'Remove a user from bypass list', value: `\`${client.prefix}bypass remove @user\`` },
                    { name: 'List all bypass users', value: `\`${client.prefix}bypass list\`` }
                )
                .setColor('#00FFFF')
                .setFooter({ text: 'Bypass System' });
            
            return message.reply({ embeds: [embed] });
        }
        
        switch (subCommand) {
            case 'add': {
                // Check for required arguments
                if (!args[1]) {
                    return message.reply('Please mention a user to add to the bypass list.');
                }
                
                // Get user from mention
                const user = message.mentions.users.first();
                if (!user) {
                    return message.reply('Please mention a valid user.');
                }
                
                // Check if user is already in bypass list
                if (bypassList.has(user.id)) {
                    return message.reply(`${user.tag} is already in the bypass list.`);
                }
                
                // Add user to bypass list
                bypassList.add(user.id);
                client.bypass.set(message.guild.id, bypassList);
                
                // Create embed
                const embed = new EmbedBuilder()
                    .setTitle('Bypass User Added')
                    .setDescription(`${user.tag} has been added to the bypass list.`)
                    .setColor('#00FF00')
                    .setFooter({ text: `Added by ${message.author.tag}` })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            case 'remove': {
                // Check for required arguments
                if (!args[1]) {
                    return message.reply('Please mention a user to remove from the bypass list.');
                }
                
                // Get user from mention
                const user = message.mentions.users.first();
                if (!user) {
                    return message.reply('Please mention a valid user.');
                }
                
                // Check if user is in bypass list
                if (!bypassList.has(user.id)) {
                    return message.reply(`${user.tag} is not in the bypass list.`);
                }
                
                // Remove user from bypass list
                bypassList.delete(user.id);
                client.bypass.set(message.guild.id, bypassList);
                
                // Create embed
                const embed = new EmbedBuilder()
                    .setTitle('Bypass User Removed')
                    .setDescription(`${user.tag} has been removed from the bypass list.`)
                    .setColor('#FF0000')
                    .setFooter({ text: `Removed by ${message.author.tag}` })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            case 'list': {
                // Check if bypass list is empty
                if (bypassList.size === 0) {
                    return message.reply('The bypass list is empty.');
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
                
                return message.reply({ embeds: [embed] });
            }
        }
    }
}; 