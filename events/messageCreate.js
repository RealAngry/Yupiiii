const { EmbedBuilder, Collection, PermissionFlagsBits } = require('discord.js');
const { PREFIX } = process.env;
const ModerationCase = require('../models/ModerationCase');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        // Initialize snipe collections if they don't exist
        if (!client.snipes) {
            client.snipes = {
                deleted: new Map(),
                edited: new Map()
            };
        }
        
        // Ignore messages from bots
        if (message.author.bot) return;
        
        // AFK System
        // Check for AFK mentions
        if (message.mentions.members?.size > 0 || message.mentions.users?.size > 0) {
            try {
                // Combine both member and user mentions
                const mentionedMembers = new Set();
                
                // Add members from mentions
                if (message.mentions.members?.size > 0) {
                    message.mentions.members.forEach(member => {
                        mentionedMembers.add(member);
                    });
                }
                
                // Add users from mentions (convert to members if possible)
                if (message.mentions.users?.size > 0) {
                    message.mentions.users.forEach(user => {
                        if (message.guild) {
                            const member = message.guild.members.cache.get(user.id);
                            if (member && !mentionedMembers.has(member)) {
                                mentionedMembers.add(member);
                            }
                        }
                    });
                }
                
                // Check each mentioned member for AFK status
                mentionedMembers.forEach(member => {
                    if (!member) return; // Skip if member is undefined
                    
                    const afkInfo = client.afkUsers.get(member.id);
                    if (afkInfo) {
                        console.log(`[AFK] ${message.author.tag} mentioned AFK user ${member.user.tag}`);
                        
                        const { timestamp, reason } = afkInfo;
                        const duration = Math.floor((Date.now() - timestamp) / 1000 / 60);
                        
                        // Initialize pings array if it doesn't exist
                        if (!afkInfo.pings) afkInfo.pings = [];
                        if (!afkInfo.pingCount) afkInfo.pingCount = 0;
                        
                        // Track this ping
                        afkInfo.pingCount += 1;
                        afkInfo.pings.push({
                            user: message.author.tag,
                            userId: message.author.id,
                            content: message.content,
                            channel: message.channel.name,
                            channelId: message.channel.id,
                            timestamp: Date.now(),
                            guild: message.guild ? message.guild.name : 'DM',
                            guildId: message.guild ? message.guild.id : 'DM'
                        });
                        
                        // Update AFK info
                        client.afkUsers.set(member.id, afkInfo);
                        
                        const embed = new EmbedBuilder()
                            .setTitle(`${member.user.username} is AFK`)
                            .setDescription(`Reason: ${reason || 'No reason provided'}`)
                            .addFields({ 
                                name: 'Message', 
                                value: message.content.length > 100 ? message.content.substring(0, 97) + '...' : message.content 
                            })
                            .setFooter({ text: `AFK for ${duration} minutes | Ping count: ${afkInfo.pingCount}` })
                            .setColor('#FFA500');
                        
                        message.reply({ embeds: [embed] }).catch(console.error);
                    }
                });
            } catch (error) {
                console.error('[AFK] Error handling mentions:', error);
            }
        }
        
        // Return user from AFK if they send a message
        if (client.afkUsers.has(message.author.id)) {
            try {
                const afkInfo = client.afkUsers.get(message.author.id);
                console.log(`[AFK] ${message.author.tag} returned from AFK`);
                
                // Initialize pings array if it doesn't exist
                if (!afkInfo.pings) afkInfo.pings = [];
                if (!afkInfo.pingCount) afkInfo.pingCount = 0;
                
                const pingCount = afkInfo.pingCount || 0;
                
                // Reset nickname if it was changed
                if (message.guild && message.member.manageable && afkInfo.originalNick) {
                    message.member.setNickname(afkInfo.originalNick)
                        .catch(err => console.error(`Failed to reset AFK nickname: ${err}`));
                }
                
                const embed = new EmbedBuilder()
                    .setTitle('AFK Status Removed')
                    .setDescription(`Welcome back ${message.author}! I've removed your AFK status.`)
                    .setColor('#00FF00');
                
                // Add ping information
                if (pingCount > 0) {
                    console.log(`[AFK] ${message.author.tag} had ${pingCount} pings while AFK`);
                    
                    // Show the last 3 pings directly in the embed
                    const recentPings = afkInfo.pings.slice(-3);
                    
                    embed.addFields({ 
                        name: 'While you were away', 
                        value: `You were pinged ${pingCount} time${pingCount === 1 ? '' : 's'}.` 
                    });
                    
                    // Add recent pings
                    recentPings.forEach((ping, index) => {
                        const timeSince = Math.floor((Date.now() - ping.timestamp) / 1000 / 60);
                        embed.addFields({
                            name: `Recent Ping #${index + 1} (${timeSince} minutes ago)`,
                            value: `From: <@${ping.userId}>\nMessage: ${ping.content.length > 50 ? ping.content.substring(0, 47) + '...' : ping.content}`
                        });
                    });
                    
                    // Add note about using the pinginfo command if there are more pings
                    if (pingCount > 3) {
                        embed.setFooter({ text: `Use ${client.prefix}pinginfo to see all ${pingCount} pings` });
                    }
                } else {
                    // No pings received
                    embed.addFields({ 
                        name: 'While you were away', 
                        value: 'You were not pinged by anyone.' 
                    });
                }
                
                message.reply({ embeds: [embed] }).catch(console.error);
                
                // Store ping data in a separate collection before deleting AFK status
                if (pingCount > 0) {
                    if (!client.afkPingHistory) client.afkPingHistory = new Map();
                    client.afkPingHistory.set(message.author.id, {
                        pings: afkInfo.pings,
                        timestamp: Date.now(),
                        count: pingCount
                    });
                    
                    console.log(`[AFK] Stored ping history for ${message.author.tag}`);
                }
                
                // Remove AFK status
                client.afkUsers.delete(message.author.id);
            } catch (error) {
                console.error('[AFK] Error handling return from AFK:', error);
                client.afkUsers.delete(message.author.id); // Remove AFK status anyway to prevent issues
            }
        }
        
        // Auto-mod: Anti-link system
        if (message.guild) {
            const guildSettings = client.settings?.get(message.guild.id) || {};
            
            // Check if anti-link is enabled
            if (guildSettings.antilink) {
                // Skip if user has permissions to bypass
                if (message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;
                
                // Check for URLs in the message
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const discordInviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+/gi;
                
                if (urlRegex.test(message.content) || discordInviteRegex.test(message.content)) {
                    // Delete the message
                    try {
                        await message.delete();
                        
                        // Send warning
                        const embed = new EmbedBuilder()
                            .setTitle('Anti-Link System')
                            .setDescription(`${message.author}, you are not allowed to send links in this server!`)
                            .setColor('#FF0000')
                            .setTimestamp();
                        
                        message.channel.send({ embeds: [embed] }).then(msg => {
                            setTimeout(() => msg.delete().catch(() => {}), 5000);
                        }).catch(() => {});
                        
                        // Log violation if needed
                        console.log(`[AntiLink] Deleted link sent by ${message.author.tag} in ${message.guild.name}`);
                    } catch (error) {
                        console.error(`Failed to delete link: ${error}`);
                    }
                    
                    return; // Stop processing command if message was deleted
                }
            }
            
            // Check for anti-spam
            await handleAntiSpam(message, client);
        }
        
        // Command handling
        const prefix = client.prefix || process.env.PREFIX || '!';
        
        // Check if message starts with prefix
        if (!message.content.startsWith(prefix)) return;
        
        // Parse command and arguments
        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        const cmd = args.shift().toLowerCase();
        
        // Skip setprefix command as it's handled in index.js
        if (cmd === 'setprefix') return;
        
        // Check for command
        const command = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd));
        
        if (!command) return;
        
        // Check permissions
        if (command.permissions && !message.member.permissions.has(command.permissions)) {
            return message.reply("You don't have permission to use this command.");
        }
        
        // Handle cooldowns
        if (!client.cooldowns.has(command.name)) {
            client.cooldowns.set(command.name, new Collection());
        }
        
        const now = Date.now();
        const timestamps = client.cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 3) * 1000;
        
        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply(
                    `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`
                );
            }
        }
        
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        
        // Execute command
        try {
            command.execute(client, message, args);
        } catch (error) {
            console.error(error);
            message.reply('There was an error executing that command!');
        }
    }
};

// Anti-spam handling
async function handleAntiSpam(message, client) {
    // Get guild settings
    const guildSettings = client.settings.get(message.guild.id);
    if (!guildSettings || !guildSettings.antispam || !guildSettings.antispam.enabled) return;

    const { threshold, interval, action } = guildSettings.antispam;
    
    // Initialize spam tracker for this guild if it doesn't exist
    if (!client.spamTracker.has(message.guild.id)) {
        client.spamTracker.set(message.guild.id, new Map());
    }
    
    const guildSpamTracker = client.spamTracker.get(message.guild.id);
    
    // Initialize user's spam data if it doesn't exist
    if (!guildSpamTracker.has(message.author.id)) {
        guildSpamTracker.set(message.author.id, {
            messageCount: 0,
            firstMessage: Date.now(),
            warned: false
        });
    }
    
    const userData = guildSpamTracker.get(message.author.id);
    
    // Increment message count
    userData.messageCount++;
    
    // Check if the user has exceeded the threshold within the interval
    if (userData.messageCount >= threshold && 
        Date.now() - userData.firstMessage <= interval) {
        
        // User is spamming, take action
        if (!userData.warned) {
            userData.warned = true;
            
            // Take action based on settings
            switch (action) {
                case 'warn':
                    await warnUser(message, client);
                    break;
                case 'mute':
                    await muteUser(message, client);
                    break;
                case 'kick':
                    await kickUser(message, client);
                    break;
                case 'ban':
                    await banUser(message, client);
                    break;
                default:
                    await warnUser(message, client);
            }
        }
    } else if (Date.now() - userData.firstMessage > interval) {
        // Reset if interval has passed
        userData.messageCount = 1;
        userData.firstMessage = Date.now();
        userData.warned = false;
    }
    
    // Update user data
    guildSpamTracker.set(message.author.id, userData);
}

// Warning function
async function warnUser(message, client) {
    try {
        // Create warning embed
        const embed = new EmbedBuilder()
            .setTitle('⚠️ Spam Warning')
            .setDescription(`${message.author}, please stop spamming in this channel.`)
            .setColor('#FFA500')
            .setTimestamp();
        
        // Send warning
        await message.channel.send({ embeds: [embed] });
        
        // Log the warning
        await logModeration(message, client, 'warn', 'Automatic warning for spamming');
    } catch (error) {
        console.error('Error warning user for spam:', error);
    }
}

// Mute function
async function muteUser(message, client) {
    try {
        const member = message.member;
        
        // Check if member exists and is moderatable
        if (!member || !member.moderatable) return;
        
        // Get or create mute role
        let muteRole = message.guild.roles.cache.find(role => role.name === 'Muted');
        
        if (!muteRole) {
            try {
                // Create a new mute role
                muteRole = await message.guild.roles.create({
                    name: 'Muted',
                    color: '#808080',
                    reason: 'Mute role created for anti-spam'
                });
                
                // Set permissions for all channels
                message.guild.channels.cache.forEach(async (channel) => {
                    await channel.permissionOverwrites.create(muteRole, {
                        SendMessages: false,
                        AddReactions: false,
                        Speak: false
                    });
                });
            } catch (error) {
                console.error('Error creating mute role:', error);
                return;
            }
        }
        
        // Add the mute role to the member
        await member.roles.add(muteRole, 'Automatic mute for spamming');
        
        // Create mute embed
        const embed = new EmbedBuilder()
            .setTitle('🔇 User Muted')
            .setDescription(`${message.author} has been muted for spamming.`)
            .setColor('#FF0000')
            .setTimestamp();
        
        // Send mute notification
        await message.channel.send({ embeds: [embed] });
        
        // Log the mute
        await logModeration(message, client, 'mute', 'Automatic mute for spamming');
    } catch (error) {
        console.error('Error muting user for spam:', error);
    }
}

// Kick function
async function kickUser(message, client) {
    try {
        const member = message.member;
        
        // Check if member exists and is kickable
        if (!member || !member.kickable) return;
        
        // Create kick embed
        const embed = new EmbedBuilder()
            .setTitle('👢 User Kicked')
            .setDescription(`${message.author} has been kicked for spamming.`)
            .setColor('#FF0000')
            .setTimestamp();
        
        // Send kick notification
        await message.channel.send({ embeds: [embed] });
        
        // Log the kick
        await logModeration(message, client, 'kick', 'Automatic kick for spamming');
        
        // Kick the member
        await member.kick('Automatic kick for spamming');
    } catch (error) {
        console.error('Error kicking user for spam:', error);
    }
}

// Ban function
async function banUser(message, client) {
    try {
        const member = message.member;
        
        // Check if member exists and is bannable
        if (!member || !member.bannable) return;
        
        // Create ban embed
        const embed = new EmbedBuilder()
            .setTitle('🔨 User Banned')
            .setDescription(`${message.author} has been banned for spamming.`)
            .setColor('#FF0000')
            .setTimestamp();
        
        // Send ban notification
        await message.channel.send({ embeds: [embed] });
        
        // Log the ban
        await logModeration(message, client, 'ban', 'Automatic ban for spamming');
        
        // Ban the member
        await member.ban({ reason: 'Automatic ban for spamming', deleteMessageDays: 1 });
    } catch (error) {
        console.error('Error banning user for spam:', error);
    }
}

// Log moderation action
async function logModeration(message, client, action, reason) {
    try {
        // Get next case number
        const caseNumber = await ModerationCase.getNextCaseNumber(message.guild.id);
        
        // Create moderation case
        const moderationCase = new ModerationCase({
            guildId: message.guild.id,
            caseNumber: caseNumber,
            userId: message.author.id,
            moderatorId: client.user.id,
            action: action,
            reason: reason
        });
        
        // Save to database
        await moderationCase.save();
        
        // Log to moderation channel if configured
        const guildSettings = client.settings.get(message.guild.id);
        if (guildSettings && guildSettings.logChannelId) {
            const logChannel = message.guild.channels.cache.get(guildSettings.logChannelId);
            
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle(`Moderation Case #${caseNumber}`)
                    .setDescription(`**Action:** ${action}\n**User:** ${message.author.tag} (${message.author.id})\n**Reason:** ${reason}\n**Channel:** ${message.channel}`)
                    .setColor('#FF5555')
                    .setFooter({ text: `Moderator: ${client.user.tag} (Anti-Spam System)` })
                    .setTimestamp();
                
                await logChannel.send({ embeds: [logEmbed] });
            }
        }
    } catch (error) {
        console.error('Error logging moderation action:', error);
    }
} 