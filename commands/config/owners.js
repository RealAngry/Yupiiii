const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'owners',
    description: 'Manage extra bot owners',
    usage: 'owners [add/remove/list] [user]',
    category: 'config',
    aliases: ['extraowners', 'botowners'],
    permissions: PermissionFlagsBits.Administrator,
    cooldown: 5,
    examples: [
        'owners add @user',
        'owners remove @user',
        'owners list'
    ],
    execute(client, message, args) {
        // Check if user is the main bot owner
        const mainOwnerId = process.env.OWNER_ID || client.config?.ownerId;
        const isMainOwner = mainOwnerId && message.author.id === mainOwnerId;
        
        if (!isMainOwner) {
            return message.reply('Only the main bot owner can manage extra owners.');
        }
        
        // Initialize owners collection if it doesn't exist
        if (!client.extraOwners) {
            client.extraOwners = new Set();
        }
        
        const subCommand = args[0]?.toLowerCase();
        
        if (!subCommand || !['add', 'remove', 'list'].includes(subCommand)) {
            const embed = new EmbedBuilder()
                .setTitle('Extra Owners Command Help')
                .setDescription('Manage extra bot owners who can use owner-only commands')
                .addFields(
                    { name: 'Add an extra owner', value: `\`${client.prefix}owners add @user\`` },
                    { name: 'Remove an extra owner', value: `\`${client.prefix}owners remove @user\`` },
                    { name: 'List all extra owners', value: `\`${client.prefix}owners list\`` }
                )
                .setColor('#800080')
                .setFooter({ text: 'Extra Owners System' });
            
            return message.reply({ embeds: [embed] });
        }
        
        switch (subCommand) {
            case 'add': {
                // Check for required arguments
                if (!args[1]) {
                    return message.reply('Please mention a user to add as an extra owner.');
                }
                
                // Get user from mention
                const user = message.mentions.users.first();
                if (!user) {
                    return message.reply('Please mention a valid user.');
                }
                
                // Check if user is already an extra owner
                if (client.extraOwners.has(user.id)) {
                    return message.reply(`${user.tag} is already an extra owner.`);
                }
                
                // Add user to extra owners
                client.extraOwners.add(user.id);
                
                // Create embed
                const embed = new EmbedBuilder()
                    .setTitle('Extra Owner Added')
                    .setDescription(`${user.tag} has been added as an extra bot owner.`)
                    .setColor('#00FF00')
                    .setFooter({ text: `Added by ${message.author.tag}` })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            case 'remove': {
                // Check for required arguments
                if (!args[1]) {
                    return message.reply('Please mention a user to remove from extra owners.');
                }
                
                // Get user from mention
                const user = message.mentions.users.first();
                if (!user) {
                    return message.reply('Please mention a valid user.');
                }
                
                // Check if user is an extra owner
                if (!client.extraOwners.has(user.id)) {
                    return message.reply(`${user.tag} is not an extra owner.`);
                }
                
                // Remove user from extra owners
                client.extraOwners.delete(user.id);
                
                // Create embed
                const embed = new EmbedBuilder()
                    .setTitle('Extra Owner Removed')
                    .setDescription(`${user.tag} has been removed from extra bot owners.`)
                    .setColor('#FF0000')
                    .setFooter({ text: `Removed by ${message.author.tag}` })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            case 'list': {
                // Check if extra owners list is empty
                if (client.extraOwners.size === 0) {
                    return message.reply('There are no extra bot owners.');
                }
                
                // Create embed
                const embed = new EmbedBuilder()
                    .setTitle('Extra Bot Owners')
                    .setDescription('Users who have bot owner privileges:')
                    .setColor('#800080')
                    .setFooter({ text: `Total: ${client.extraOwners.size} extra owners` })
                    .setTimestamp();
                
                // Add main owner
                if (mainOwnerId) {
                    const mainOwner = client.users.cache.get(mainOwnerId);
                    embed.addFields({ 
                        name: 'Main Owner', 
                        value: mainOwner ? `• ${mainOwner.tag} (${mainOwnerId})` : `• Unknown User (${mainOwnerId})` 
                    });
                }
                
                // Add extra owners to embed
                const extraOwners = Array.from(client.extraOwners).map(userId => {
                    const user = client.users.cache.get(userId);
                    return user ? `• ${user.tag} (${userId})` : `• Unknown User (${userId})`;
                });
                
                embed.addFields({ 
                    name: 'Extra Owners', 
                    value: extraOwners.join('\n') || 'None' 
                });
                
                return message.reply({ embeds: [embed] });
            }
        }
    }
}; 