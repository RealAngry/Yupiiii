const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setwelcomechannel')
        .setDescription('Set a channel and customize welcome messages')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set a channel for welcome messages')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to send welcome messages to')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('message')
                .setDescription('Set a custom welcome message using JSON')
                .addStringOption(option =>
                    option.setName('json')
                        .setDescription('The JSON data for the welcome message')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('preview')
                .setDescription('Preview the current welcome message'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('variables')
                .setDescription('Show available variables for welcome messages'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable welcome messages'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Show current welcome message settings')),
    
    async execute(interaction, client) {
        try {
            // Initialize settings for guild if they don't exist
            if (!client.settings) client.settings = new Map();
            if (!client.settings.has(interaction.guild.id)) {
                client.settings.set(interaction.guild.id, {});
            }
            
            // Get guild settings
            const guildSettings = client.settings.get(interaction.guild.id);
            
            const subCommand = interaction.options.getSubcommand();
            
            // Set welcome channel
            if (subCommand === 'set') {
                const channel = interaction.options.getChannel('channel');
                
                // Check if channel is a text channel
                if (channel.type !== ChannelType.GuildText) {
                    return interaction.reply({ 
                        content: 'The welcome channel must be a text channel.',
                        ephemeral: true 
                    });
                }
                
                // Check bot permissions in the channel
                const botPermissions = channel.permissionsFor(interaction.guild.members.me);
                if (!botPermissions.has(PermissionFlagsBits.SendMessages) || !botPermissions.has(PermissionFlagsBits.EmbedLinks)) {
                    return interaction.reply({ 
                        content: `I don't have permission to send messages or embeds in ${channel}. Please adjust my permissions.`,
                        ephemeral: true 
                    });
                }
                
                // Update welcome channel setting
                guildSettings.welcomeChannel = channel.id;
                
                // Save settings
                client.settings.set(interaction.guild.id, guildSettings);
                
                // Create response embed
                const embed = new EmbedBuilder()
                    .setTitle('Welcome Channel Set')
                    .setDescription(`Welcome messages will now be sent in ${channel}`)
                    .setColor('#00FF00')
                    .setFooter({ text: `Modified by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();
                
                await interaction.reply({ embeds: [embed], ephemeral: true });
                
                // Send test message to welcome channel
                const testEmbed = new EmbedBuilder()
                    .setTitle('Welcome Channel Set')
                    .setDescription('This channel has been set as the welcome channel.')
                    .setColor('#00FF00')
                    .setFooter({ text: `Set by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();
                
                await channel.send({ embeds: [testEmbed] }).catch(error => {
                    console.error(`Error sending test message to welcome channel: ${error}`);
                    interaction.followUp({ 
                        content: 'Failed to send a test message to the welcome channel. Please check my permissions.',
                        ephemeral: true 
                    });
                });
                
                // Log the change
                console.log(`[WelcomeChannel] ${interaction.user.tag} set the welcome channel to #${channel.name} in ${interaction.guild.name}`);
            }
            // Set welcome message
            else if (subCommand === 'message') {
                const jsonString = interaction.options.getString('json');
                
                try {
                    // Parse JSON
                    const embedData = JSON.parse(jsonString);
                    
                    // Save welcome message
                    guildSettings.welcomeMessage = embedData;
                    
                    // Save settings
                    client.settings.set(interaction.guild.id, guildSettings);
                    
                    // Create response embed
                    const embed = new EmbedBuilder()
                        .setTitle('Welcome Message Set')
                        .setDescription('The welcome message has been updated.')
                        .setColor('#00FF00')
                        .setFooter({ text: `Modified by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                        .setTimestamp();
                    
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                    
                    // Log the change
                    console.log(`[WelcomeChannel] ${interaction.user.tag} updated the welcome message in ${interaction.guild.name}`);
                } catch (error) {
                    return interaction.reply({ 
                        content: `Error parsing JSON: ${error.message}`,
                        ephemeral: true 
                    });
                }
            }
            // Preview welcome message
            else if (subCommand === 'preview') {
                if (!guildSettings.welcomeMessage) {
                    return interaction.reply({ 
                        content: 'No welcome message has been set. Use `/setwelcomechannel message` to set one.',
                        ephemeral: true 
                    });
                }
                
                try {
                    // Create welcome embed with variables replaced
                    const welcomeEmbed = createWelcomeEmbed(guildSettings.welcomeMessage, interaction.member);
                    
                    // Send preview
                    await interaction.reply({ 
                        content: 'Here\'s a preview of the welcome message:',
                        embeds: [welcomeEmbed],
                        ephemeral: true
                    });
                } catch (error) {
                    return interaction.reply({ 
                        content: `Error creating preview: ${error.message}`,
                        ephemeral: true 
                    });
                }
            }
            // Show available variables
            else if (subCommand === 'variables') {
                await showVariables(interaction);
            }
            // Disable welcome messages
            else if (subCommand === 'disable') {
                // Remove welcome channel setting
                delete guildSettings.welcomeChannel;
                
                // Save settings
                client.settings.set(interaction.guild.id, guildSettings);
                
                const embed = new EmbedBuilder()
                    .setTitle('Welcome Channel Disabled')
                    .setDescription('Welcome messages have been disabled.')
                    .setColor('#FF0000')
                    .setFooter({ text: `Modified by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();
                
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            // Show current settings
            else if (subCommand === 'status') {
                await showCurrentSettings(client, interaction, guildSettings);
            }
        } catch (error) {
            console.error(error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: 'There was an error executing this command!',
                    ephemeral: true 
                });
            }
        }
    }
};

// Function to show current settings
async function showCurrentSettings(client, interaction, guildSettings) {
    const currentChannel = guildSettings.welcomeChannel 
        ? interaction.guild.channels.cache.get(guildSettings.welcomeChannel) 
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
                '`/setwelcomechannel set` - Set a welcome channel\n' +
                '`/setwelcomechannel message` - Set a custom welcome message using JSON\n' +
                '`/setwelcomechannel preview` - Preview the welcome message\n' +
                '`/setwelcomechannel variables` - Show available variables\n' +
                '`/setwelcomechannel disable` - Disable welcome messages'
            }
        )
        .setColor('#0099ff')
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
}

// Function to show available variables
async function showVariables(interaction) {
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
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
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