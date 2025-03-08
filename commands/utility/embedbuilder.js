const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'embedbuilder',
    description: 'Create and preview custom embeds using JSON',
    usage: 'embedbuilder <create/preview/send> [channel] [json]',
    category: 'utility',
    aliases: ['embed', 'createembed'],
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageMessages],
    examples: [
        'embedbuilder create {"title":"My Embed","description":"This is a test embed","color":"#00FFFF"}',
        'embedbuilder preview {"title":"Welcome","description":"Welcome to our server!","color":"#00FF00"}',
        'embedbuilder send #general {"title":"Announcement","description":"Important announcement!","color":"#FF0000"}'
    ],
    execute(client, message, args) {
        if (!args[0]) {
            return showHelp(client, message);
        }

        const option = args[0].toLowerCase();

        if (option === 'create' || option === 'preview') {
            // Get JSON data
            const jsonString = args.slice(1).join(' ');
            if (!jsonString) {
                return message.reply('Please provide valid JSON data for the embed.');
            }

            try {
                // Parse JSON
                const embedData = JSON.parse(jsonString);
                
                // Create embed
                const embed = createEmbedFromJson(embedData, message.author);
                
                // Send preview
                return message.reply({ 
                    content: `Here's a preview of your embed:`, 
                    embeds: [embed] 
                });
            } catch (error) {
                return message.reply(`Error parsing JSON: ${error.message}`);
            }
        } else if (option === 'send') {
            // Check if channel is provided
            if (!args[1]) {
                return message.reply('Please specify a channel to send the embed to.');
            }

            // Get channel
            const channelMention = args[1];
            const channelId = channelMention.replace(/[<#>]/g, '');
            const channel = message.guild.channels.cache.get(channelId);

            if (!channel) {
                return message.reply('Invalid channel. Please mention a valid channel.');
            }

            // Get JSON data
            const jsonString = args.slice(2).join(' ');
            if (!jsonString) {
                return message.reply('Please provide valid JSON data for the embed.');
            }

            try {
                // Parse JSON
                const embedData = JSON.parse(jsonString);
                
                // Create embed
                const embed = createEmbedFromJson(embedData, message.author);
                
                // Send to channel
                channel.send({ embeds: [embed] })
                    .then(() => {
                        message.reply(`Embed sent to ${channel}.`);
                    })
                    .catch(error => {
                        message.reply(`Error sending embed: ${error.message}`);
                    });
            } catch (error) {
                return message.reply(`Error parsing JSON: ${error.message}`);
            }
        } else {
            return showHelp(client, message);
        }
    }
};

// Function to show help
function showHelp(client, message) {
    const prefix = client.prefix;
    
    const embed = new EmbedBuilder()
        .setTitle('Embed Builder Help')
        .setDescription('Create and preview custom embeds using JSON')
        .setColor('#00FFFF')
        .addFields(
            { name: 'Create/Preview an Embed', value: `\`${prefix}embedbuilder preview {"title":"My Embed","description":"This is a test embed","color":"#00FFFF"}\`` },
            { name: 'Send an Embed to a Channel', value: `\`${prefix}embedbuilder send #channel {"title":"Announcement","description":"Important announcement!","color":"#FF0000"}\`` },
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
            }
        )
        .setFooter({ text: `Requested by ${message.author.tag}` })
        .setTimestamp();
    
    return message.reply({ embeds: [embed] });
}

// Function to create embed from JSON
function createEmbedFromJson(data, author) {
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
            name: data.author.name || author.tag
        };
        
        if (data.author.icon_url) authorData.iconURL = data.author.icon_url;
        if (data.author.url) authorData.url = data.author.url;
        
        embed.setAuthor(authorData);
    }
    
    // Set footer
    if (data.footer) {
        const footerData = {
            text: data.footer.text || `Created by ${author.tag}`
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