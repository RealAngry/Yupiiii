const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    name: 'setwelcomechannel',
    description: 'Set a channel and customize welcome messages',
    usage: 'setwelcomechannel <#channel/message/preview/variables/disable> [json]',
    category: 'config',
    aliases: ['welcomechannel', 'welcome'],
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageGuild],
    examples: [
        'setwelcomechannel #welcome',
        'setwelcomechannel message {"title":"Welcome!","description":"Welcome {user} to {server}!","color":"#00FF00"}',
        'setwelcomechannel preview',
        'setwelcomechannel variables',
        'setwelcomechannel disable'
    ],
    execute(client, message, args) {
        // Initialize settings for guild if they don't exist
        if (!client.settings) client.settings = new Map();
        if (!client.settings.has(message.guild.id)) {
            client.settings.set(message.guild.id, {});
        }
        
        // Get guild settings
        const guildSettings = client.settings.get(message.guild.id);
        
        if (!args[0]) {
            return showCurrentSettings(client, message, guildSettings);
        }
        
        const option = args[0].toLowerCase();
        
        // Set welcome channel
        if (option.startsWith('<#') || option.match(/^\d+$/)) {
            const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
            
            if (!channel) {
                return message.reply('Please mention a valid channel or provide a channel ID.');
            }
            
            // Check if channel is a text channel
            if (channel.type !== ChannelType.GuildText) {
                return message.reply('The welcome channel must be a text channel.');
            }
            
            // Check bot permissions in the channel
            const botPermissions = channel.permissionsFor(message.guild.members.me);
            if (!botPermissions.has(PermissionFlagsBits.SendMessages) || !botPermissions.has(PermissionFlagsBits.EmbedLinks)) {
                return message.reply(`I don't have permission to send messages or embeds in ${channel}. Please adjust my permissions.`);
            }
            
            // Update welcome channel setting
            guildSettings.welcomeChannel = channel.id;
            
            // Save settings
            client.settings.set(message.guild.id, guildSettings);
            
            // Create response embed
            const embed = new EmbedBuilder()
                .setTitle('Welcome Channel Set')
                .setDescription(`Welcome messages will now be sent in ${channel}`)
                .setColor('#00FF00')
                .setFooter({ text: `Modified by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
            
            // Send test message to welcome channel
            const testEmbed = new EmbedBuilder()
                .setTitle('Welcome Channel Set')
                .setDescription('This channel has been set as the welcome channel.')
                .setColor('#00FF00')
                .setFooter({ text: `Set by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            
            channel.send({ embeds: [testEmbed] }).catch(error => {
                console.error(`Error sending test message to welcome channel: ${error}`);
                message.reply('Failed to send a test message to the welcome channel. Please check my permissions.');
            });
            
            // Log the change
            console.log(`[WelcomeChannel] ${message.author.tag} set the welcome channel to #${channel.name} in ${message.guild.name}`);
        }
        // Set welcome message
        else if (option === 'message') {
            const jsonString = args.slice(1).join(' ');
            if (!jsonString) {
                return message.reply('Please provide valid JSON data for the welcome message.');
            }
            
            try {
                // Parse JSON
                const embedData = JSON.parse(jsonString);
                
                // Save welcome message
                guildSettings.welcomeMessage = embedData;
                
                // Save settings
                client.settings.set(message.guild.id, guildSettings);
                
                // Create response embed
                const embed = new EmbedBuilder()
                    .setTitle('Welcome Message Set')
                    .setDescription('The welcome message has been updated.')
                    .setColor('#00FF00')
                    .setFooter({ text: `Modified by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp();
                
                message.reply({ embeds: [embed] });
                
                // Log the change
                console.log(`[WelcomeChannel] ${message.author.tag} updated the welcome message in ${message.guild.name}`);
            } catch (error) {
                return message.reply(`Error parsing JSON: ${error.message}`);
            }
        }
        // Preview welcome message
        else if (option === 'preview') {
            if (!guildSettings.welcomeMessage) {
                return message.reply('No welcome message has been set. Use `setwelcomechannel message {...}` to set one.');
            }
            
            try {
                // Create welcome embed with variables replaced
                const welcomeEmbed = createWelcomeEmbed(guildSettings.welcomeMessage, message.member);
                
                // Send preview
                message.reply({ 
                    content: 'Here\'s a preview of the welcome message:',
                    embeds: [welcomeEmbed]
                });
            } catch (error) {
                return message.reply(`Error creating preview: ${error.message}`);
            }
        }
        // Show available variables
        else if (option === 'variables') {
            showVariables(message);
        }
        // Disable welcome messages
        else if (option === 'disable' || option === 'off') {
            // Remove welcome channel setting
            delete guildSettings.welcomeChannel;
            
            // Save settings
            client.settings.set(message.guild.id, guildSettings);
            
            const embed = new EmbedBuilder()
                .setTitle('Welcome Channel Disabled')
                .setDescription('Welcome messages have been disabled.')
                .setColor('#FF0000')
                .setFooter({ text: `Modified by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        else {
            return showCurrentSettings(client, message, guildSettings);
        }
    }
};

// Function to show current settings
function showCurrentSettings(client, message, guildSettings) {
    const currentChannel = guildSettings.welcomeChannel 
        ? message.guild.channels.cache.get(guildSettings.welcomeChannel) 
        : null;
    
    const hasCustomMessage = !!guildSettings.welcomeMessage;
    
    const embed = new EmbedBuilder()
        .setTitle('Welcome Channel Configuration')
        .setDescription(currentChannel 
            ? `Current welcome channel is ${currentChannel}`
            : 'No welcome channel is currently set')
        .addFields(
            { name: 'Custom Message', value: hasCustomMessage ? 'A custom welcome message is set' : 'Using default welcome message' },
            { name: 'Usage', value: 
                '`-setwelcomechannel #channel` - Set a welcome channel\n' +
                '`-setwelcomechannel message {...}` - Set a custom welcome message using JSON\n' +
                '`-setwelcomechannel preview` - Preview the welcome message\n' +
                '`-setwelcomechannel variables` - Show available variables\n' +
                '`-setwelcomechannel disable` - Disable welcome messages'
            }
        )
        .setColor('#0099ff')
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
    
    return message.reply({ embeds: [embed] });
}

// Function to show available variables
function showVariables(message) {
    const embed = new EmbedBuilder()
        .setTitle('Welcome Message Variables')
        .setDescription('You can use these variables in your welcome message:')
        .addFields(
            { name: 'User Variables', value: 
                '`{user}` - User mention\n' +
                '`{username}` - Username\n' +
                '`{tag}` - User tag (username#discriminator)\n' +
                '`{id}` - User ID\n' +
                '`{createdAt}` - Account creation date'
            },
            { name: 'Server Variables', value: 
                '`{server}` - Server name\n' +
                '`{memberCount}` - Member count\n' +
                '`{owner}` - Server owner mention'
            },
            { name: 'Example JSON', value: 
                '```json\n{\n' +
                '  "title": "Welcome to {server}!",\n' +
                '  "description": "Hey {user}, welcome to our server! You are member #{memberCount}.",\n' +
                '  "color": "#00FF00",\n' +
                '  "thumbnail": "{userAvatar}",\n' +
                '  "fields": [\n' +
                '    {\n' +
                '      "name": "Account Created",\n' +
                '      "value": "{createdAt}",\n' +
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
        .setColor('#0099ff')
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
    
    return message.reply({ embeds: [embed] });
}

// Function to create welcome embed with variables
function createWelcomeEmbed(data, member) {
    const embed = new EmbedBuilder();
    const user = member.user;
    const guild = member.guild;
    
    // Replace variables in string
    const replaceVariables = (text) => {
        if (!text) return text;
        
        return text
            .replace(/{user}/g, `<@${user.id}>`)
            .replace(/{username}/g, user.username)
            .replace(/{tag}/g, user.tag)
            .replace(/{id}/g, user.id)
            .replace(/{createdAt}/g, `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`)
            .replace(/{userAvatar}/g, user.displayAvatarURL({ dynamic: true }))
            .replace(/{server}/g, guild.name)
            .replace(/{memberCount}/g, guild.memberCount)
            .replace(/{owner}/g, guild.ownerId ? `<@${guild.ownerId}>` : 'Unknown');
    };
    
    // Set basic properties
    if (data.title) embed.setTitle(replaceVariables(data.title));
    if (data.description) embed.setDescription(replaceVariables(data.description));
    if (data.color) embed.setColor(data.color);
    if (data.url) embed.setURL(replaceVariables(data.url));
    if (data.timestamp) embed.setTimestamp();
    if (data.thumbnail) embed.setThumbnail(replaceVariables(data.thumbnail));
    if (data.image) embed.setImage(replaceVariables(data.image));
    
    // Set author
    if (data.author) {
        const authorData = {
            name: replaceVariables(data.author.name) || user.tag
        };
        
        if (data.author.icon_url) authorData.iconURL = replaceVariables(data.author.icon_url);
        if (data.author.url) authorData.url = replaceVariables(data.author.url);
        
        embed.setAuthor(authorData);
    }
    
    // Set footer
    if (data.footer) {
        const footerData = {
            text: replaceVariables(data.footer.text) || `Welcome to ${guild.name}!`
        };
        
        if (data.footer.icon_url) footerData.iconURL = replaceVariables(data.footer.icon_url);
        
        embed.setFooter(footerData);
    }
    
    // Add fields
    if (data.fields && Array.isArray(data.fields)) {
        data.fields.forEach(field => {
            if (field.name && field.value) {
                embed.addFields({
                    name: replaceVariables(field.name),
                    value: replaceVariables(field.value),
                    inline: field.inline === true
                });
            }
        });
    }
    
    return embed;
} 