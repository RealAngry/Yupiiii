const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embedbuilder')
        .setDescription('Create and preview custom embeds using JSON')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand(subcommand =>
            subcommand
                .setName('preview')
                .setDescription('Preview an embed from JSON')
                .addStringOption(option =>
                    option.setName('json')
                        .setDescription('The JSON data for the embed')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('send')
                .setDescription('Send an embed to a channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to send the embed to')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('json')
                        .setDescription('The JSON data for the embed')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Show help for the embed builder')),
    
    async execute(interaction, client) {
        const subCommand = interaction.options.getSubcommand();
        
        if (subCommand === 'preview') {
            const jsonString = interaction.options.getString('json');
            
            try {
                // Parse JSON
                const embedData = JSON.parse(jsonString);
                
                // Create embed
                const embed = createEmbedFromJson(embedData, interaction.user);
                
                // Send preview
                return interaction.reply({ 
                    content: `Here's a preview of your embed:`, 
                    embeds: [embed],
                    ephemeral: true
                });
            } catch (error) {
                return interaction.reply({ 
                    content: `Error parsing JSON: ${error.message}`,
                    ephemeral: true
                });
            }
        } else if (subCommand === 'send') {
            const channel = interaction.options.getChannel('channel');
            const jsonString = interaction.options.getString('json');
            
            // Check if channel is text-based
            if (!channel.isTextBased()) {
                return interaction.reply({ 
                    content: 'You can only send embeds to text channels.',
                    ephemeral: true
                });
            }
            
            try {
                // Parse JSON
                const embedData = JSON.parse(jsonString);
                
                // Create embed
                const embed = createEmbedFromJson(embedData, interaction.user);
                
                // Send to channel
                await channel.send({ embeds: [embed] });
                
                return interaction.reply({ 
                    content: `Embed sent to ${channel}.`,
                    ephemeral: true
                });
            } catch (error) {
                return interaction.reply({ 
                    content: `Error: ${error.message}`,
                    ephemeral: true
                });
            }
        } else if (subCommand === 'help') {
            return showHelp(interaction);
        }
    }
};

// Function to show help
async function showHelp(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('Embed Builder Help')
        .setDescription('Create and preview custom embeds using JSON')
        .setColor('#00FFFF')
        .addFields(
            { name: 'Preview an Embed', value: '`/embedbuilder preview json:{...}`' },
            { name: 'Send an Embed to a Channel', value: '`/embedbuilder send channel:#channel json:{...}`' },
            { name: 'Available JSON Properties', value: 
                '```json\n{\n' +
                '  "title": "Embed Title",\n' +
                '  "description": "Embed Description",\n' +
                '  "color": "#HEX or DECIMAL",\n' +
                '  "url": "https://example.com",\n' +
                '  "timestamp": true,\n' +
                '  "thumbnail": "https://example.com/image.png",\n' +
                '  "image": "https://example.com/image.png",\n' +
                '  "author": {\n' +
                '    "name": "Author Name",\n' +
                '    "icon_url": "https://example.com/icon.png",\n' +
                '    "url": "https://example.com"\n' +
                '  },\n' +
                '  "footer": {\n' +
                '    "text": "Footer Text",\n' +
                '    "icon_url": "https://example.com/icon.png"\n' +
                '  },\n' +
                '  "fields": [\n' +
                '    {\n' +
                '      "name": "Field Name",\n' +
                '      "value": "Field Value",\n' +
                '      "inline": true\n' +
                '    }\n' +
                '  ]\n' +
                '}\n```'
            },
            { name: 'Example JSON', value: 
                '```json\n{\n' +
                '  "title": "Welcome to Our Server!",\n' +
                '  "description": "We\'re glad to have you here.",\n' +
                '  "color": "#00FF00",\n' +
                '  "thumbnail": "https://i.imgur.com/example.png",\n' +
                '  "fields": [\n' +
                '    {\n' +
                '      "name": "Rules",\n' +
                '      "value": "Please read our rules in #rules",\n' +
                '      "inline": true\n' +
                '    },\n' +
                '    {\n' +
                '      "name": "Support",\n' +
                '      "value": "Need help? Ask in #support",\n' +
                '      "inline": true\n' +
                '    }\n' +
                '  ],\n' +
                '  "footer": {\n' +
                '    "text": "Thanks for joining!"\n' +
                '  },\n' +
                '  "timestamp": true\n' +
                '}\n```'
            }
        )
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();
    
    return interaction.reply({ embeds: [embed], ephemeral: true });
}

// Function to create embed from JSON
function createEmbedFromJson(data, user) {
    const embed = new EmbedBuilder();
    
    // Set basic properties
    if (data.title) embed.setTitle(data.title);
    if (data.description) embed.setDescription(data.description);
    if (data.color) embed.setColor(data.color);
    if (data.url) embed.setURL(data.url);
    if (data.timestamp) embed.setTimestamp();
    if (data.thumbnail) embed.setThumbnail(data.thumbnail);
    if (data.image) embed.setImage(data.image);
    
    // Set author
    if (data.author) {
        const authorData = {
            name: data.author.name || user.tag
        };
        
        if (data.author.icon_url) authorData.iconURL = data.author.icon_url;
        if (data.author.url) authorData.url = data.author.url;
        
        embed.setAuthor(authorData);
    }
    
    // Set footer
    if (data.footer) {
        const footerData = {
            text: data.footer.text || `Created by ${user.tag}`
        };
        
        if (data.footer.icon_url) footerData.iconURL = data.footer.icon_url;
        
        embed.setFooter(footerData);
    }
    
    // Add fields
    if (data.fields && Array.isArray(data.fields)) {
        data.fields.forEach(field => {
            if (field.name && field.value) {
                embed.addFields({
                    name: field.name,
                    value: field.value,
                    inline: field.inline === true
                });
            }
        });
    }
    
    return embed;
} 