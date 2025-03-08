const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stealemoji')
        .setDescription('Add an emoji from another server to this server')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers)
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('The emoji to add (must be a custom emoji)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name for the new emoji (optional)')
                .setRequired(false)),
    
    async execute(interaction, client) {
        // Check if the bot has permission to manage emojis
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
            return interaction.reply({ 
                content: 'I need the `Manage Emojis and Stickers` permission to add emojis.',
                ephemeral: true 
            });
        }
        
        // Get emoji from options
        const emoji = interaction.options.getString('emoji');
        
        // Extract emoji ID and type
        const emojiRegex = /<?(a)?:?(\w{2,32}):(\d{17,19})>?/;
        const match = emoji.match(emojiRegex);
        
        if (!match) {
            return interaction.reply({ 
                content: 'Please provide a valid custom emoji.',
                ephemeral: true 
            });
        }
        
        const [, isAnimated, originalName, emojiId] = match;
        const extension = isAnimated ? 'gif' : 'png';
        const emojiURL = `https://cdn.discordapp.com/emojis/${emojiId}.${extension}`;
        
        // Get emoji name (use provided name or original name)
        let name = interaction.options.getString('name');
        
        if (!name) {
            name = originalName;
        } else {
            // Clean the name (only allow alphanumeric and underscore)
            name = name.replace(/[^a-zA-Z0-9_]/g, '');
        }
        
        if (!name) {
            return interaction.reply({ 
                content: 'Please provide a valid name for the emoji.',
                ephemeral: true 
            });
        }
        
        if (name.length < 2 || name.length > 32) {
            return interaction.reply({ 
                content: 'Emoji name must be between 2 and 32 characters.',
                ephemeral: true 
            });
        }
        
        // Defer reply since emoji creation might take a moment
        await interaction.deferReply();
        
        try {
            // Create the emoji
            const newEmoji = await interaction.guild.emojis.create({ 
                attachment: emojiURL, 
                name: name 
            });
            
            const embed = new EmbedBuilder()
                .setTitle('Emoji Added')
                .setDescription(`Successfully added ${newEmoji} with the name \`:${newEmoji.name}:\``)
                .setColor('#00FF00')
                .setThumbnail(emojiURL)
                .setFooter({ text: `Added by ${interaction.user.tag}` })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(`Error adding emoji: ${error}`);
            await interaction.editReply(`Failed to add emoji. Error: ${error.message}`);
        }
    }
}; 