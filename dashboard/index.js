const express = require('express');
const path = require('path');
const fs = require('fs');
const { Client, GatewayIntentBits, Partials, ActivityType, EmbedBuilder } = require('discord.js');
require('dotenv').config();
const mongoose = require('mongoose');

// Create Express app
const app = express();
const PORT = process.env.DASHBOARD_PORT || 3000;

// Set up middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Create a Discord client for the dashboard
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember]
});

// Load bot info
function loadBotInfo() {
    try {
        const botInfoPath = path.join(__dirname, 'data', 'botInfo.json');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(path.join(__dirname, 'data'))) {
            fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
        }
        
        // Create default bot info if file doesn't exist
        if (!fs.existsSync(botInfoPath)) {
            const defaultBotInfo = {
                name: 'Yupi',
                description: 'A powerful Discord bot with moderation, fun, utility features and a beautiful dashboard.',
                statusType: 'PLAYING',
                statusText: 'your commands'
            };
            
            fs.writeFileSync(botInfoPath, JSON.stringify(defaultBotInfo, null, 2));
            return defaultBotInfo;
        }
        
        // Read bot info from file
        const botInfo = JSON.parse(fs.readFileSync(botInfoPath, 'utf8'));
        return botInfo;
    } catch (error) {
        console.error('Error loading bot info:', error);
        return {
            name: 'Yupi',
            description: 'A powerful Discord bot with moderation, fun, utility features and a beautiful dashboard.',
            statusType: 'PLAYING',
            statusText: 'your commands'
        };
    }
}

// Routes
app.get('/', (req, res) => {
    const guilds = client.guilds.cache.map(guild => ({
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL({ dynamic: true }) || 'https://cdn.discordapp.com/embed/avatars/0.png',
        memberCount: guild.memberCount
    }));
    
    res.render('index', { 
        guilds,
        botInfo: loadBotInfo(),
        botAvatar: client.user.displayAvatarURL({ dynamic: true })
    });
});

app.get('/server/:id', async (req, res) => {
    const { id } = req.params;
    const guild = client.guilds.cache.get(id);
    
    if (!guild) {
        return res.redirect('/');
    }
    
    try {
        // Get guild settings
        const settings = await getGuildSettings(id);
        
        // Get guild channels
        const channels = guild.channels.cache
            .filter(channel => channel.type === 0) // Text channels only
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(channel => ({
                id: channel.id,
                name: channel.name,
                type: channel.type
            }));
        
        // Get guild roles
        const roles = guild.roles.cache
            .filter(role => !role.managed && role.name !== '@everyone')
            .sort((a, b) => b.position - a.position)
            .map(role => ({
                id: role.id,
                name: role.name,
                color: role.hexColor
            }));
        
        // Get guild stats
        const stats = {
            memberCount: guild.memberCount,
            channelCount: guild.channels.cache.size,
            roleCount: guild.roles.cache.size,
            owner: guild.members.cache.get(guild.ownerId)?.user.tag || 'Unknown',
            serverCount: client.guilds.cache.size,
            userCount: client.users.cache.size,
            commandCount: 50 // Placeholder, replace with actual command count
        };
        
        // Load bot info
        const botInfo = loadBotInfo();
        
        // Render server page
        res.render('server', {
            guild: {
                id: guild.id,
                name: guild.name,
                icon: guild.iconURL({ dynamic: true }) || 'https://cdn.discordapp.com/embed/avatars/0.png'
            },
            channels,
            roles,
            settings,
            stats,
            bot: {
                ...botInfo,
                avatar: client.user.displayAvatarURL({ dynamic: true })
            }
        });
    } catch (error) {
        console.error('Error rendering server page:', error);
        res.redirect('/');
    }
});

// API routes for updating settings
app.post('/api/server/:id/settings', async (req, res) => {
    try {
        const { id } = req.params;
        const guild = client.guilds.cache.get(id);
        
        if (!guild) {
            return res.status(404).json({ success: false, message: 'Server not found' });
        }
        
        // Check if settings collection exists
        if (!client.settings) {
            console.warn('Settings collection not initialized. Creating it now.');
            client.settings = new Map();
        }
        
        // Get current settings
        const guildSettings = client.settings.get(id) || {};
        
        // Update settings with request body
        const updatedSettings = { ...guildSettings, ...req.body };
        
        // Save updated settings
        client.settings.set(id, updatedSettings);
        
        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ success: false, message: 'An error occurred while updating settings' });
    }
});

// Bot status management
app.get('/bot-status', (req, res) => {
    try {
        // Get current status
        const activity = client.user.presence.activities[0] || {};
        const status = client.user.presence.status;
        
        res.render('bot-status', {
            botInfo: {
                username: client.user.username,
                avatar: client.user.displayAvatarURL({ dynamic: true }),
                status,
                activity: activity.name || 'None',
                activityType: activity.type || 0
            }
        });
    } catch (error) {
        console.error('Error rendering bot status page:', error);
        res.status(500).send('An error occurred while loading the bot status page');
    }
});

// Update bot status
app.post('/api/bot-status', (req, res) => {
    try {
        const { status, activityType, activityText } = req.body;
        
        // Update bot status
        client.user.setPresence({
            status: status || 'online',
            activities: activityText ? [{
                name: activityText,
                type: parseInt(activityType) || 0
            }] : []
        });
        
        // Save status to file for persistence
        saveStatus(status, activityType, activityText);
        
        res.json({ success: true, message: 'Bot status updated successfully' });
    } catch (error) {
        console.error('Error updating bot status:', error);
        res.status(500).json({ success: false, message: 'An error occurred while updating bot status' });
    }
});

// Global announcements
app.get('/announcements', (req, res) => {
    res.render('announcements', {
        botInfo: {
            username: client.user.username,
            avatar: client.user.displayAvatarURL({ dynamic: true })
        },
        guildCount: client.guilds.cache.size
    });
});

// Send announcement
app.post('/api/announcements', async (req, res) => {
    try {
        const { message, color } = req.body;
        
        if (!message) {
            return res.status(400).json({ success: false, message: 'Announcement message is required' });
        }
        
        // Track success and failures
        const results = {
            success: 0,
            failed: 0,
            servers: []
        };
        
        // Send announcement to all servers
        for (const guild of client.guilds.cache.values()) {
            try {
                // Find a suitable channel
                const channel = findAnnouncementChannel(guild);
                
                if (!channel) {
                    results.failed++;
                    results.servers.push({ name: guild.name, id: guild.id, status: 'Failed (No suitable channel)' });
                    continue;
                }
                
                // Send announcement
                await channel.send({
                    embeds: [{
                        title: '📢 Announcement',
                        description: message,
                        color: parseInt(color?.replace('#', '') || 'FF9900', 16),
                        timestamp: new Date()
                    }]
                });
                
                results.success++;
                results.servers.push({ name: guild.name, id: guild.id, status: 'Success', channel: channel.name });
            } catch (error) {
                results.failed++;
                results.servers.push({ name: guild.name, id: guild.id, status: `Failed (${error.message})` });
            }
        }
        
        res.json({ success: true, results });
    } catch (error) {
        console.error('Error sending announcement:', error);
        res.status(500).json({ success: false, message: 'An error occurred while sending announcement' });
    }
});

// API routes for reaction roles
app.post('/api/server/:id/reaction-roles', async (req, res) => {
    try {
        const { id } = req.params;
        const guild = client.guilds.cache.get(id);
        
        if (!guild) {
            return res.status(404).json({ success: false, message: 'Server not found' });
        }
        
        // Get guild settings
        if (!client.settings) {
            client.settings = new Map();
        }
        
        const guildSettings = client.settings.get(id) || {};
        
        // Initialize reaction roles if they don't exist
        if (!guildSettings.reactionRoles) {
            guildSettings.reactionRoles = [];
        }
        
        const { index, channelId, message, messageId, roles } = req.body;
        
        // Validate data
        if (!channelId) {
            return res.status(400).json({ success: false, message: 'Channel ID is required' });
        }
        
        if (!messageId && !message) {
            return res.status(400).json({ success: false, message: 'Either message content or message ID is required' });
        }
        
        if (!roles || !roles.length) {
            return res.status(400).json({ success: false, message: 'At least one role is required' });
        }
        
        // Get channel
        const channel = guild.channels.cache.get(channelId);
        
        if (!channel) {
            return res.status(404).json({ success: false, message: 'Channel not found' });
        }
        
        // Create or update reaction role
        const reactionRole = {
            channelId,
            messageId,
            message,
            roles
        };
        
        // If editing an existing reaction role
        if (index !== '-1' && guildSettings.reactionRoles[index]) {
            guildSettings.reactionRoles[index] = reactionRole;
        } else {
            // If creating a new reaction role
            guildSettings.reactionRoles.push(reactionRole);
        }
        
        // Save settings
        client.settings.set(id, guildSettings);
        
        // If using an existing message, add reactions
        if (messageId) {
            try {
                const msg = await channel.messages.fetch(messageId);
                
                // Add reactions
                for (const role of roles) {
                    await msg.react(role.emoji);
                }
            } catch (error) {
                console.error('Error adding reactions:', error);
                return res.status(400).json({ success: false, message: 'Failed to add reactions to the message. Make sure the message ID is valid.' });
            }
        } else {
            // Create a new message
            try {
                const msg = await channel.send(message);
                
                // Update message ID
                if (index !== '-1' && guildSettings.reactionRoles[index]) {
                    guildSettings.reactionRoles[index].messageId = msg.id;
                } else {
                    guildSettings.reactionRoles[guildSettings.reactionRoles.length - 1].messageId = msg.id;
                }
                
                // Save settings
                client.settings.set(id, guildSettings);
                
                // Add reactions
                for (const role of roles) {
                    await msg.react(role.emoji);
                }
            } catch (error) {
                console.error('Error creating message:', error);
                return res.status(500).json({ success: false, message: 'Failed to create message' });
            }
        }
        
        res.json({ success: true, message: 'Reaction role saved successfully' });
    } catch (error) {
        console.error('Error saving reaction role:', error);
        res.status(500).json({ success: false, message: 'An error occurred while saving reaction role' });
    }
});

// Delete reaction role
app.delete('/api/server/:id/reaction-roles/:index', async (req, res) => {
    try {
        const { id, index } = req.params;
        const guild = client.guilds.cache.get(id);
        
        if (!guild) {
            return res.status(404).json({ success: false, message: 'Server not found' });
        }
        
        // Get guild settings
        if (!client.settings) {
            client.settings = new Map();
        }
        
        const guildSettings = client.settings.get(id) || {};
        
        // Check if reaction roles exist
        if (!guildSettings.reactionRoles || !guildSettings.reactionRoles[index]) {
            return res.status(404).json({ success: false, message: 'Reaction role not found' });
        }
        
        // Remove reaction role
        guildSettings.reactionRoles.splice(index, 1);
        
        // Save settings
        client.settings.set(id, guildSettings);
        
        res.json({ success: true, message: 'Reaction role deleted successfully' });
    } catch (error) {
        console.error('Error deleting reaction role:', error);
        res.status(500).json({ success: false, message: 'An error occurred while deleting reaction role' });
    }
});

// Function to find a suitable channel for announcements
function findAnnouncementChannel(guild) {
    // Priority channels to check
    const priorityChannels = [
        'announcements',
        'announcement',
        'general',
        'chat',
        'main',
        'bot-commands',
        'bot-command',
        'commands',
        'command',
        'bot',
        'bots'
    ];
    
    // Try to find a channel by name
    for (const channelName of priorityChannels) {
        const channel = guild.channels.cache.find(ch => 
            ch.name.includes(channelName) && 
            ch.type === 0 && // Text channel
            ch.permissionsFor(guild.members.me).has(['ViewChannel', 'SendMessages'])
        );
        
        if (channel) return channel;
    }
    
    // If no priority channel found, find any text channel where the bot can send messages
    return guild.channels.cache.find(ch => 
        ch.type === 0 && // Text channel
        ch.permissionsFor(guild.members.me).has(['ViewChannel', 'SendMessages'])
    );
}

// Function to save status to file
function saveStatus(status, activityType, activityText) {
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }
    
    // Create status object
    const statusData = {
        status: status || 'online',
        activityType: activityType || '0',
        activityText: activityText || '',
        updatedAt: Date.now()
    };
    
    // Save status to file
    const statusPath = path.join(dataDir, 'status.json');
    fs.writeFileSync(statusPath, JSON.stringify(statusData, null, 2));
}

// Function to load status from file
function loadStatus() {
    try {
        const statusPath = path.join(__dirname, 'data', 'status.json');
        
        if (fs.existsSync(statusPath)) {
            const statusData = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
            
            client.user.setPresence({
                status: statusData.status,
                activities: statusData.activityText ? [{
                    name: statusData.activityText,
                    type: parseInt(statusData.activityType) || 0
                }] : []
            });
            
            console.log(`[DASHBOARD] Loaded saved status: ${statusData.status} ${ActivityType[parseInt(statusData.activityType) || 0]} ${statusData.activityText}`);
        } else {
            // Set default status
            client.user.setPresence({
                status: 'online',
                activities: [{
                    name: `${client.guilds.cache.size} servers | Dashboard on port ${PORT}`,
                    type: ActivityType.Watching
                }]
            });
        }
    } catch (error) {
        console.error('[DASHBOARD] Error loading status:', error);
    }
}

// API Routes for Modules
app.post('/api/server/:id/modules', async (req, res) => {
    try {
        const { id } = req.params;
        const { modules } = req.body;
        
        // Check if guild exists
        const guild = client.guilds.cache.get(id);
        if (!guild) {
            return res.status(404).json({ success: false, message: 'Server not found' });
        }
        
        // Get guild settings
        const guildSettings = await getGuildSettings(id);
        
        // Update modules
        guildSettings.modules = modules;
        
        // Save settings
        await saveGuildSettings(id, guildSettings);
        
        // Return success
        res.json({ success: true, message: 'Module settings saved' });
    } catch (error) {
        console.error('Error saving module settings:', error);
        res.status(500).json({ success: false, message: 'An error occurred while saving module settings' });
    }
});

// API Route for getting a specific reaction role
app.get('/api/server/:id/reaction-roles/:index', async (req, res) => {
    try {
        const { id, index } = req.params;
        
        // Check if guild exists
        const guild = client.guilds.cache.get(id);
        if (!guild) {
            return res.status(404).json({ success: false, message: 'Server not found' });
        }
        
        // Get guild settings
        const guildSettings = await getGuildSettings(id);
        
        // Check if reaction role exists
        if (!guildSettings.reactionRoles || !guildSettings.reactionRoles[index]) {
            return res.status(404).json({ success: false, message: 'Reaction role not found' });
        }
        
        // Return reaction role
        res.json({ success: true, reactionRole: guildSettings.reactionRoles[index] });
    } catch (error) {
        console.error('Error getting reaction role:', error);
        res.status(500).json({ success: false, message: 'An error occurred while getting reaction role' });
    }
});

// API Route for sending embeds
app.post('/api/server/:id/send-embed', async (req, res) => {
    try {
        const { id } = req.params;
        const { channelId, embed } = req.body;
        
        // Check if guild exists
        const guild = client.guilds.cache.get(id);
        if (!guild) {
            return res.status(404).json({ success: false, message: 'Server not found' });
        }
        
        // Check if channel exists
        const channel = guild.channels.cache.get(channelId);
        if (!channel) {
            return res.status(404).json({ success: false, message: 'Channel not found' });
        }
        
        // Process variables in embed
        const processedEmbed = processEmbedVariables(embed, guild);
        
        // Create Discord.js embed
        const discordEmbed = new EmbedBuilder()
            .setColor(processedEmbed.color ? `#${processedEmbed.color}` : '#ff3333');
        
        if (processedEmbed.title) discordEmbed.setTitle(processedEmbed.title);
        if (processedEmbed.description) discordEmbed.setDescription(processedEmbed.description);
        if (processedEmbed.thumbnail) discordEmbed.setThumbnail(processedEmbed.thumbnail.url);
        if (processedEmbed.image) discordEmbed.setImage(processedEmbed.image.url);
        if (processedEmbed.footer) discordEmbed.setFooter({ 
            text: processedEmbed.footer.text,
            iconURL: processedEmbed.footer.icon_url
        });
        if (processedEmbed.author) discordEmbed.setAuthor({
            name: processedEmbed.author.name,
            iconURL: processedEmbed.author.icon_url
        });
        if (processedEmbed.timestamp) discordEmbed.setTimestamp(new Date(processedEmbed.timestamp));
        
        // Send embed
        await channel.send({ embeds: [discordEmbed] });
        
        // Return success
        res.json({ success: true, message: 'Embed sent successfully' });
    } catch (error) {
        console.error('Error sending embed:', error);
        res.status(500).json({ success: false, message: 'An error occurred while sending embed' });
    }
});

// API endpoint for updating bot info
app.post('/api/bot/info', async (req, res) => {
    try {
        const { name, description, statusType, statusText, avatarURL, public } = req.body;
        
        // Update bot status
        if (statusType && statusText) {
            try {
                await saveStatus(statusType, statusText);
                client.user.setPresence({
                    activities: [{
                        name: statusText,
                        type: getActivityType(statusType)
                    }],
                    status: 'online'
                });
                console.log(`Updated bot status to ${statusType} ${statusText}`);
            } catch (statusError) {
                console.error('Error updating bot status:', statusError);
            }
        }
        
        // Update bot description in memory
        if (description) {
            global.botDescription = description;
            console.log(`Updated bot description to: ${description}`);
        }
        
        // Update bot username if provided and different
        if (name && name !== client.user.username) {
            try {
                await client.user.setUsername(name);
                console.log(`Updated bot username to: ${name}`);
            } catch (nameError) {
                console.error('Error updating bot username:', nameError);
                // Don't fail the whole request if just the name update fails
            }
        }
        
        // Update bot avatar if provided
        if (avatarURL) {
            try {
                await client.user.setAvatar(avatarURL);
                console.log('Updated bot avatar');
            } catch (avatarError) {
                console.error('Error updating bot avatar:', avatarError);
                // Don't fail the whole request if just the avatar update fails
            }
        }
        
        // Store the updated bot info for the dashboard
        const botInfo = {
            name: client.user.username,
            description: global.botDescription || 'A powerful Discord bot with moderation, fun, utility features and a beautiful dashboard.',
            statusType: statusType || 'PLAYING',
            statusText: statusText || 'your commands',
            avatar: client.user.displayAvatarURL({ dynamic: true }),
            public: !!public
        };
        
        // Save to a file for persistence
        try {
            const fs = require('fs');
            const path = require('path');
            
            // Create data directory if it doesn't exist
            const dataDir = path.join(__dirname, 'data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir);
            }
            
            fs.writeFileSync(
                path.join(dataDir, 'botInfo.json'), 
                JSON.stringify(botInfo, null, 2)
            );
            console.log('Saved bot info to file');
        } catch (fileError) {
            console.error('Error saving bot info to file:', fileError);
        }
        
        return res.json({ 
            success: true,
            message: 'Bot information updated successfully',
            botInfo
        });
    } catch (error) {
        console.error('Error updating bot info:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Failed to update bot information',
            details: error.message
        });
    }
});

// Process variables in embed
function processEmbedVariables(embed, guild) {
    const processedEmbed = { ...embed };
    
    // Get current date and time
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();
    
    // Process variables in title
    if (processedEmbed.title) {
        processedEmbed.title = processedEmbed.title
            .replace(/{server}/g, guild.name)
            .replace(/{server\.id}/g, guild.id)
            .replace(/{server\.memberCount}/g, guild.memberCount)
            .replace(/{server\.owner}/g, guild.members.cache.get(guild.ownerId)?.user.tag || 'Unknown')
            .replace(/{server\.region}/g, guild.preferredLocale || 'Unknown')
            .replace(/{server\.createdAt}/g, guild.createdAt.toLocaleDateString())
            .replace(/{date}/g, date)
            .replace(/{time}/g, time);
    }
    
    // Process variables in description
    if (processedEmbed.description) {
        processedEmbed.description = processedEmbed.description
            .replace(/{server}/g, guild.name)
            .replace(/{server\.id}/g, guild.id)
            .replace(/{server\.memberCount}/g, guild.memberCount)
            .replace(/{server\.owner}/g, guild.members.cache.get(guild.ownerId)?.user.tag || 'Unknown')
            .replace(/{server\.region}/g, guild.preferredLocale || 'Unknown')
            .replace(/{server\.createdAt}/g, guild.createdAt.toLocaleDateString())
            .replace(/{date}/g, date)
            .replace(/{time}/g, time);
    }
    
    // Process variables in footer
    if (processedEmbed.footer && processedEmbed.footer.text) {
        processedEmbed.footer.text = processedEmbed.footer.text
            .replace(/{server}/g, guild.name)
            .replace(/{server\.id}/g, guild.id)
            .replace(/{server\.memberCount}/g, guild.memberCount)
            .replace(/{date}/g, date)
            .replace(/{time}/g, time);
    }
    
    // Process variables in author
    if (processedEmbed.author && processedEmbed.author.name) {
        processedEmbed.author.name = processedEmbed.author.name
            .replace(/{server}/g, guild.name)
            .replace(/{server\.id}/g, guild.id)
            .replace(/{server\.memberCount}/g, guild.memberCount)
            .replace(/{date}/g, date)
            .replace(/{time}/g, time);
    }
    
    return processedEmbed;
}

// Function to convert status type string to ActivityType
function getActivityType(statusType) {
    const { ActivityType } = require('discord.js');
    
    const activityTypes = {
        'PLAYING': ActivityType.Playing,
        'WATCHING': ActivityType.Watching,
        'LISTENING': ActivityType.Listening,
        'STREAMING': ActivityType.Streaming,
        'COMPETING': ActivityType.Competing
    };
    
    return activityTypes[statusType] || ActivityType.Playing;
}

// Function to get guild settings from database
async function getGuildSettings(guildId) {
    try {
        const Guild = require('../models/guild');
        
        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            console.log('MongoDB not connected. Using default settings.');
            return getDefaultSettings(guildId);
        }
        
        let guildData = await Guild.findOne({ guildId: guildId }).exec();
        
        if (!guildData) {
            console.log(`Settings for guild ${guildId} not found. Creating with defaults.`);
            guildData = new Guild({ guildId: guildId });
            try {
                await guildData.save();
                console.log(`Created settings for guild ${guildId}`);
            } catch (saveError) {
                console.error('Error saving new guild settings:', saveError);
                return getDefaultSettings(guildId);
            }
        }
        
        return guildData;
    } catch (error) {
        console.error('Error fetching guild settings:', error);
        return getDefaultSettings(guildId);
    }
}

// Function to get default settings
function getDefaultSettings(guildId) {
    console.log(`Using default settings for guild ${guildId}`);
    return {
        guildId: guildId,
        prefix: '-',
        welcomeChannel: null,
        welcomeMessage: 'Welcome {user} to {server}!',
        logChannel: null,
        muteRole: null,
        automod: {
            enabled: false,
            antiSpam: {
                enabled: false,
                threshold: 5,
                interval: 5000,
                action: 'warn'
            },
            antiLink: {
                enabled: false,
                whitelist: [],
                action: 'warn'
            }
        },
        botRole: null,
        humanRole: null,
        reactionRoles: []
    };
}

// API endpoint for sending announcements
app.post('/api/server/:id/announcement', async (req, res) => {
    const { id } = req.params;
    const { 
        announcementType, 
        channelId, 
        message, 
        webhookName, 
        webhookAvatar, 
        color, 
        useEmbed, 
        targetChannels,
        mentionEveryone,
        mentionHere,
        tts,
        pinMessage
    } = req.body;
    
    // Check if guild exists
    const guild = client.guilds.cache.get(id);
    if (!guild) {
        return res.status(404).json({ error: 'Server not found' });
    }
    
    try {
        // Get the channel
        const channel = guild.channels.cache.get(channelId);
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }
        
        // Check if the bot has permission to send messages in this channel
        const permissions = channel.permissionsFor(guild.members.me);
        if (!permissions.has('SendMessages')) {
            return res.status(403).json({ error: 'Bot does not have permission to send messages in this channel' });
        }
        
        // Process the announcement
        const results = {
            success: [],
            failed: []
        };
        
        // Function to send the announcement to a channel
        const sendAnnouncement = async (targetChannel) => {
            try {
                const channel = guild.channels.cache.get(targetChannel);
                if (!channel) {
                    results.failed.push({ id: targetChannel, reason: 'Channel not found' });
                    return;
                }
                
                // Check permissions
                const perms = channel.permissionsFor(guild.members.me);
                if (!perms.has('SendMessages')) {
                    results.failed.push({ id: targetChannel, reason: 'Missing permissions' });
                    return;
                }
                
                // Prepare message options
                const messageOptions = {
                    content: useEmbed === 'on' ? null : message,
                    allowedMentions: {
                        parse: []
                    },
                    tts: tts === 'on'
                };
                
                // Add mentions if requested
                if (mentionEveryone === 'on') {
                    messageOptions.allowedMentions.parse.push('everyone');
                }
                
                if (mentionHere === 'on') {
                    messageOptions.allowedMentions.parse.push('here');
                }
                
                // Add embed if requested
                if (useEmbed === 'on') {
                    messageOptions.embeds = [{
                        description: message,
                        color: parseInt(color.replace('#', ''), 16),
                        timestamp: new Date()
                    }];
                }
                
                if (announcementType === 'webhook') {
                    // Check if bot has permission to manage webhooks
                    if (!perms.has('ManageWebhooks')) {
                        results.failed.push({ id: targetChannel, reason: 'Missing webhook permissions' });
                        return;
                    }
                    
                    // Create or use existing webhook
                    const webhooks = await channel.fetchWebhooks();
                    let webhook = webhooks.find(wh => wh.owner.id === client.user.id);
                    
                    if (!webhook) {
                        webhook = await channel.createWebhook({
                            name: 'Dash Bot Announcements',
                            avatar: client.user.displayAvatarURL()
                        });
                    }
                    
                    // Send the message through webhook
                    const webhookOptions = {
                        username: webhookName || 'Announcement',
                        avatarURL: webhookAvatar || client.user.displayAvatarURL(),
                        allowedMentions: messageOptions.allowedMentions,
                        tts: messageOptions.tts
                    };
                    
                    if (useEmbed === 'on') {
                        webhookOptions.embeds = messageOptions.embeds;
                    } else {
                        webhookOptions.content = message;
                    }
                    
                    const sentMessage = await webhook.send(webhookOptions);
                    
                    // Pin message if requested
                    if (pinMessage === 'on' && sentMessage) {
                        await sentMessage.pin().catch(err => console.error('Error pinning message:', err));
                    }
                } else {
                    // Regular message
                    const sentMessage = await channel.send(messageOptions);
                    
                    // Pin message if requested
                    if (pinMessage === 'on' && sentMessage) {
                        await sentMessage.pin().catch(err => console.error('Error pinning message:', err));
                    }
                }
                
                results.success.push(targetChannel);
            } catch (error) {
                console.error(`Error sending announcement to channel ${targetChannel}:`, error);
                results.failed.push({ id: targetChannel, reason: error.message });
            }
        };
        
        // If targetChannels is provided, send to multiple channels
        if (targetChannels && targetChannels.length) {
            // Add primary channel if not already in the list
            if (!targetChannels.includes(channelId)) {
                await sendAnnouncement(channelId);
            }
            
            // Process channels in sequence to avoid rate limits
            for (const targetChannel of targetChannels) {
                await sendAnnouncement(targetChannel);
            }
        } else {
            // Just send to the selected channel
            await sendAnnouncement(channelId);
        }
        
        return res.json({ 
            success: true, 
            message: 'Announcement sent successfully', 
            results 
        });
    } catch (error) {
        console.error('Error sending announcement:', error);
        return res.status(500).json({ error: 'Failed to send announcement', details: error.message });
    }
});

// Start the server and Discord client
client.login(process.env.TOKEN)
    .then(() => {
        console.log(`[DASHBOARD] Logged in as ${client.user.tag}`);
        
        // Load saved status
        loadStatus();
        
        // Start Express server
        app.listen(PORT, () => {
            console.log(`[DASHBOARD] Dashboard running on http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        console.error('[DASHBOARD] Error logging in:', error);
        process.exit(1);
    });

// Handle errors
client.on('error', console.error);
process.on('unhandledRejection', console.error); 