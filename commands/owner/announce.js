const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'announce',
    description: 'Send a global announcement to all servers',
    usage: 'announce <message>',
    category: 'owner',
    aliases: ['announcement', 'broadcast'],
    ownerOnly: true,
    cooldown: 60,
    examples: [
        'announce The bot will be down for maintenance in 1 hour.',
        'announce New features have been added! Check them out with the help command.'
    ],
    
    async execute(client, message, args) {
        // Check if user is the bot owner or an extra owner
        if (message.author.id !== process.env.OWNER_ID && !client.extraOwners?.includes(message.author.id)) {
            return message.reply('Only the bot owner can use this command.');
        }
        
        // Check if announcement message is provided
        if (!args.length) {
            return message.reply('Please provide an announcement message.');
        }
        
        // Get announcement message
        const announcementMessage = args.join(' ');
        
        // Create embed
        const embed = new EmbedBuilder()
            .setTitle('📢 Global Announcement')
            .setDescription(announcementMessage)
            .setColor('#FF9900')
            .setTimestamp()
            .setFooter({ text: `Announcement by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
        
        // Send loading message
        const loadingMsg = await message.channel.send('Sending announcement to all servers, please wait...');
        
        // Track success and failures
        const results = {
            success: 0,
            failed: 0,
            servers: []
        };
        
        // Loop through all guilds
        for (const guild of client.guilds.cache.values()) {
            try {
                // Find a suitable channel to send the announcement
                const channel = findAnnouncementChannel(guild);
                
                // If no suitable channel found
                if (!channel) {
                    results.failed++;
                    results.servers.push({ name: guild.name, id: guild.id, status: 'Failed (No suitable channel)' });
                    continue;
                }
                
                // Send announcement
                await channel.send({ embeds: [embed] });
                
                // Increment success count
                results.success++;
                results.servers.push({ name: guild.name, id: guild.id, status: 'Success', channel: channel.name });
            } catch (error) {
                // Increment failed count
                results.failed++;
                results.servers.push({ name: guild.name, id: guild.id, status: `Failed (${error.message})` });
            }
        }
        
        // Create results embed
        const resultsEmbed = new EmbedBuilder()
            .setTitle('Announcement Results')
            .setDescription(`Announcement sent to ${results.success} servers. Failed in ${results.failed} servers.`)
            .setColor(results.failed > 0 ? '#FFFF00' : '#00FF00')
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
        
        // Add server details if there are failures
        if (results.failed > 0) {
            // Get failed servers
            const failedServers = results.servers.filter(server => server.status.startsWith('Failed'));
            
            // Add failed servers to embed
            if (failedServers.length > 0) {
                let failedText = '';
                
                // Loop through failed servers
                for (const server of failedServers.slice(0, 10)) {
                    failedText += `• ${server.name} (${server.id}): ${server.status}\n`;
                }
                
                // Add ellipsis if there are more than 10 failed servers
                if (failedServers.length > 10) {
                    failedText += `... and ${failedServers.length - 10} more`;
                }
                
                // Add failed servers to embed
                resultsEmbed.addFields({ name: 'Failed Servers', value: failedText });
            }
        }
        
        // Edit loading message
        loadingMsg.edit({ content: null, embeds: [resultsEmbed] });
    }
};

// Function to find a suitable channel for announcements
function findAnnouncementChannel(guild) {
    // Check if bot has permission to view channels
    if (!guild.members.me.permissions.has(PermissionFlagsBits.ViewChannel)) {
        return null;
    }
    
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
            ch.permissionsFor(guild.members.me).has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])
        );
        
        if (channel) return channel;
    }
    
    // If no priority channel found, find any text channel where the bot can send messages
    return guild.channels.cache.find(ch => 
        ch.type === 0 && // Text channel
        ch.permissionsFor(guild.members.me).has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])
    );
} 