const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'stealemoji',
    description: 'Add an emoji from another server to this server',
    usage: 'stealemoji [emoji] [name]',
    category: 'utility',
    aliases: ['addemoji', 'steal', 'emoji'],
    permissions: PermissionFlagsBits.ManageEmojisAndStickers,
    cooldown: 5,
    examples: [
        'stealemoji 😀 happy',
        'stealemoji :custom_emoji: cool_emoji'
    ],
    execute(client, message, args) {
        // Check if the user has permission to manage emojis
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
            return message.reply('I need the `Manage Emojis and Stickers` permission to add emojis.');
        }
        
        // Check for required arguments
        if (!args[0]) {
            return message.reply(`Please provide an emoji to add. Usage: \`${client.prefix}stealemoji [emoji] [name]\``);
        }
        
        // Extract emoji ID and type
        const emojiRegex = /<?(a)?:?(\w{2,32}):(\d{17,19})>?/;
        const emoji = args[0];
        const match = emoji.match(emojiRegex);
        
        if (!match) {
            return message.reply('Please provide a valid custom emoji.');
        }
        
        const [, isAnimated, , emojiId] = match;
        const extension = isAnimated ? 'gif' : 'png';
        const emojiURL = `https://cdn.discordapp.com/emojis/${emojiId}.${extension}`;
        
        // Get emoji name (use provided name or original name)
        const name = args[1] ? args[1].replace(/[^a-zA-Z0-9_]/g, '') : match[2];
        
        if (!name) {
            return message.reply('Please provide a valid name for the emoji.');
        }
        
        if (name.length < 2 || name.length > 32) {
            return message.reply('Emoji name must be between 2 and 32 characters.');
        }
        
        // Create the emoji
        message.guild.emojis.create({ attachment: emojiURL, name: name })
            .then(emoji => {
                const embed = new EmbedBuilder()
                    .setTitle('Emoji Added')
                    .setDescription(`Successfully added ${emoji} with the name \`:${emoji.name}:\``)
                    .setColor('#00FF00')
                    .setThumbnail(emojiURL)
                    .setFooter({ text: `Added by ${message.author.tag}` })
                    .setTimestamp();
                
                message.reply({ embeds: [embed] });
            })
            .catch(error => {
                console.error(`Error adding emoji: ${error}`);
                message.reply(`Failed to add emoji. Error: ${error.message}`);
            });
    }
}; 