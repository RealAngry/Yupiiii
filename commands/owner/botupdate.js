const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'botupdate',
    description: 'Update bot features and information (Owner only)',
    usage: 'botupdate <option> <value>',
    category: 'owner',
    aliases: ['updatebot', 'setbotinfo'],
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 10,
    examples: [
        'botupdate description A versatile Discord bot with many features',
        'botupdate addfeature New weather command',
        'botupdate removefeature Old feature',
        'botupdate listfeatures',
        'botupdate setversion 1.2.0',
        'botupdate setcreated 2023-01-01',
        'botupdate setupdated'
    ],
    async execute(client, message, args) {
        // Check if user is the bot owner
        if (message.author.id !== process.env.OWNER_ID && !client.extraOwners.has(message.author.id)) {
            return message.reply('This command can only be used by the bot owner.');
        }

        // If no args, show current bot info
        if (!args.length) {
            return showBotInfo(client, message);
        }

        const option = args[0].toLowerCase();
        const value = args.slice(1).join(' ');

        switch (option) {
            case 'description':
                if (!value) return message.reply('Please provide a description.');
                client.botInfo.description = value;
                return message.reply(`Bot description updated to: ${value}`);

            case 'addfeature':
                if (!value) return message.reply('Please provide a feature to add.');
                client.botInfo.features.push(value);
                return message.reply(`Added new feature: ${value}`);

            case 'removefeature':
                if (!value) return message.reply('Please provide a feature to remove.');
                const index = client.botInfo.features.findIndex(feature => 
                    feature.toLowerCase() === value.toLowerCase());
                
                if (index === -1) return message.reply(`Feature "${value}" not found.`);
                
                const removed = client.botInfo.features.splice(index, 1)[0];
                return message.reply(`Removed feature: ${removed}`);

            case 'listfeatures':
                return listFeatures(client, message);

            case 'setversion':
                if (!value) return message.reply('Please provide a version number.');
                client.botInfo.version = value;
                return message.reply(`Bot version updated to: ${value}`);

            case 'setcreated':
                if (!value) return message.reply('Please provide a creation date (YYYY-MM-DD).');
                const createdDate = new Date(value);
                if (isNaN(createdDate.getTime())) return message.reply('Invalid date format. Use YYYY-MM-DD.');
                
                client.botInfo.createdAt = createdDate.getTime();
                return message.reply(`Bot creation date updated to: ${createdDate.toLocaleDateString()}`);

            case 'setupdated':
                client.botInfo.lastUpdated = Date.now();
                return message.reply(`Bot last updated timestamp set to: ${new Date().toLocaleString()}`);

            default:
                return message.reply('Invalid option. Use `description`, `addfeature`, `removefeature`, `listfeatures`, `setversion`, `setcreated`, or `setupdated`.');
        }
    }
};

// Function to show current bot info
async function showBotInfo(client, message) {
    const createdDate = new Date(client.botInfo.createdAt || Date.now());
    const updatedDate = new Date(client.botInfo.lastUpdated || Date.now());
    
    const embed = new EmbedBuilder()
        .setTitle(`${client.user.username} Information`)
        .setDescription(client.botInfo.description || 'No description set.')
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
        .addFields(
            { name: 'Version', value: client.botInfo.version || 'Not set', inline: true },
            { name: 'Created', value: createdDate.toLocaleDateString(), inline: true },
            { name: 'Last Updated', value: updatedDate.toLocaleDateString(), inline: true },
            { name: 'Features', value: client.botInfo.features.length > 0 
                ? client.botInfo.features.map(f => `• ${f}`).join('\n')
                : 'No features listed'
            }
        )
        .setColor('#00FFFF')
        .setFooter({ text: 'Use botupdate <option> <value> to update information' })
        .setTimestamp();
    
    return message.reply({ embeds: [embed] });
}

// Function to list features
async function listFeatures(client, message) {
    const embed = new EmbedBuilder()
        .setTitle(`${client.user.username} Features`)
        .setDescription('Current list of bot features:')
        .setColor('#00FFFF')
        .setTimestamp();
    
    if (client.botInfo.features.length > 0) {
        for (let i = 0; i < client.botInfo.features.length; i++) {
            embed.addFields({ name: `Feature #${i+1}`, value: client.botInfo.features[i] });
        }
    } else {
        embed.setDescription('No features have been added yet.');
    }
    
    return message.reply({ embeds: [embed] });
} 