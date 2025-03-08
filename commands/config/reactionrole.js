const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'reactionrole',
    description: 'Create a reaction role message for users to get roles by reacting',
    usage: 'reactionrole <create/list/remove> [channel] [messageID]',
    category: 'config',
    aliases: ['rr', 'reactrole'],
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageGuild, PermissionFlagsBits.ManageRoles],
    async execute(client, message, args) {
        // Initialize settings for guild if they don't exist
        if (!client.settings) client.settings = new Map();
        if (!client.settings.has(message.guild.id)) {
            client.settings.set(message.guild.id, {});
        }
        
        // Get guild settings
        const guildSettings = client.settings.get(message.guild.id);
        
        // Initialize reaction roles array if it doesn't exist
        if (!guildSettings.reactionRoles) {
            guildSettings.reactionRoles = [];
        }
        
        // If no args, show help
        if (!args[0]) {
            const embed = new EmbedBuilder()
                .setTitle('Reaction Role Help')
                .setDescription('Reaction roles allow users to get roles by reacting to messages.')
                .addFields(
                    { name: 'Create a Reaction Role', value: '`-reactionrole create #channel "title" "description"`' },
                    { name: 'Add a Role to a Reaction Message', value: '`-reactionrole add messageID @role :emoji:`' },
                    { name: 'List Reaction Role Messages', value: '`-reactionrole list`' },
                    { name: 'Remove a Reaction Role Message', value: '`-reactionrole remove messageID`' }
                )
                .setColor('#0099ff')
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Get action
        const action = args[0].toLowerCase();
        
        // List reaction role messages
        if (action === 'list') {
            const embed = new EmbedBuilder()
                .setTitle('Reaction Role Messages')
                .setColor('#0099ff')
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            
            if (guildSettings.reactionRoles.length === 0) {
                embed.setDescription('No reaction role messages are currently set. Use `-reactionrole create` to create one.');
            } else {
                const messageList = guildSettings.reactionRoles.map((rr, index) => {
                    const channel = message.guild.channels.cache.get(rr.channelId);
                    return `**${index + 1}.** Message ID: \`${rr.messageId}\` in ${channel ? channel : 'Unknown Channel'}\n` +
                           `Roles: ${rr.roles.length}`;
                }).join('\n\n');
                
                embed.setDescription(messageList);
            }
            
            return message.reply({ embeds: [embed] });
        }
        
        // Create a reaction role message
        if (action === 'create') {
            // Check if channel was mentioned
            if (!args[1]) {
                return message.reply('Please specify a channel. Example: `-reactionrole create #roles "Role Selection" "React to get roles"`');
            }
            
            const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
            
            if (!channel) {
                return message.reply('Please mention a valid channel or provide a channel ID.');
            }
            
            // Check bot permissions in the channel
            const botPermissions = channel.permissionsFor(message.guild.members.me);
            if (!botPermissions.has(PermissionFlagsBits.SendMessages) || !botPermissions.has(PermissionFlagsBits.EmbedLinks) || !botPermissions.has(PermissionFlagsBits.AddReactions)) {
                return message.reply(`I don't have permission to send messages, embeds, or add reactions in ${channel}. Please adjust my permissions.`);
            }
            
            // Get title and description
            let title = 'Role Selection';
            let description = 'React to get roles';
            
            // Extract title if provided (in quotes)
            const titleMatch = message.content.match(/"([^"]+)"/);
            if (titleMatch && titleMatch[1]) {
                title = titleMatch[1];
                
                // Extract description if provided (in quotes, after title)
                const descMatch = message.content.substring(message.content.indexOf(titleMatch[0]) + titleMatch[0].length).match(/"([^"]+)"/);
                if (descMatch && descMatch[1]) {
                    description = descMatch[1];
                }
            }
            
            // Create the reaction role embed
            const rrEmbed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor('#0099ff')
                .setFooter({ text: `Created by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            
            try {
                // Send the embed to the specified channel
                const rrMessage = await channel.send({ embeds: [rrEmbed] });
                
                // Add to reaction roles
                guildSettings.reactionRoles.push({
                    messageId: rrMessage.id,
                    channelId: channel.id,
                    roles: []
                });
                
                // Save settings
                client.settings.set(message.guild.id, guildSettings);
                
                const embed = new EmbedBuilder()
                    .setTitle('Reaction Role Created')
                    .setDescription(`A reaction role message has been created in ${channel}. Use \`-reactionrole add ${rrMessage.id} @role :emoji:\` to add roles.`)
                    .addFields({ name: 'Message ID', value: rrMessage.id })
                    .setColor('#00FF00')
                    .setFooter({ text: `Created by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            } catch (error) {
                console.error(`Error creating reaction role message: ${error}`);
                return message.reply(`Failed to create reaction role message: ${error.message}`);
            }
        }
        
        // Add a role to a reaction role message
        if (action === 'add') {
            // Check if message ID was provided
            if (!args[1]) {
                return message.reply('Please specify a message ID. Example: `-reactionrole add 123456789012345678 @role :emoji:`');
            }
            
            const messageId = args[1];
            
            // Find the reaction role message
            const rrIndex = guildSettings.reactionRoles.findIndex(rr => rr.messageId === messageId);
            
            if (rrIndex === -1) {
                return message.reply(`Could not find a reaction role message with ID \`${messageId}\`. Use \`-reactionrole list\` to see all reaction role messages.`);
            }
            
            // Check if role was mentioned
            if (!args[2]) {
                return message.reply('Please specify a role. Example: `-reactionrole add 123456789012345678 @role :emoji:`');
            }
            
            const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[2]);
            
            if (!role) {
                return message.reply('Please mention a valid role or provide a role ID.');
            }
            
            // Check if role is manageable
            if (!role.editable) {
                return message.reply('I cannot manage this role! It might be higher than my highest role.');
            }
            
            // Check if emoji was provided
            if (!args[3]) {
                return message.reply('Please specify an emoji. Example: `-reactionrole add 123456789012345678 @role :emoji:`');
            }
            
            // Extract emoji
            let emoji = args[3];
            
            // Handle custom emoji
            if (emoji.startsWith('<') && emoji.endsWith('>')) {
                const emojiMatch = emoji.match(/<a?:([^:]+):(\d+)>/);
                if (emojiMatch) {
                    emoji = emojiMatch[2];
                } else {
                    return message.reply('Invalid custom emoji format. Please use a valid emoji.');
                }
            }
            
            // Check if emoji is already used for this message
            const reactionRole = guildSettings.reactionRoles[rrIndex];
            if (reactionRole.roles.some(r => r.emoji === emoji)) {
                return message.reply('This emoji is already used for a role in this message.');
            }
            
            // Check if role is already used for this message
            if (reactionRole.roles.some(r => r.roleId === role.id)) {
                return message.reply('This role is already used in this message.');
            }
            
            try {
                // Get the channel and message
                const channel = message.guild.channels.cache.get(reactionRole.channelId);
                
                if (!channel) {
                    return message.reply('The channel for this reaction role message no longer exists.');
                }
                
                const rrMessage = await channel.messages.fetch(messageId);
                
                if (!rrMessage) {
                    return message.reply('The reaction role message no longer exists.');
                }
                
                // Add the reaction to the message
                await rrMessage.react(emoji);
                
                // Add the role to the reaction role message
                reactionRole.roles.push({
                    roleId: role.id,
                    emoji: emoji
                });
                
                // Update the embed to show the roles
                const embed = rrMessage.embeds[0];
                const newEmbed = EmbedBuilder.from(embed);
                
                // Add or update the roles field
                const rolesList = reactionRole.roles.map(r => {
                    const roleObj = message.guild.roles.cache.get(r.roleId);
                    const emojiDisplay = r.emoji.includes(':') ? `<:${r.emoji}>` : r.emoji;
                    return `${emojiDisplay} - ${roleObj}`;
                }).join('\n');
                
                // Find existing roles field or add a new one
                const existingFieldIndex = embed.fields?.findIndex(field => field.name === 'Roles');
                
                if (existingFieldIndex !== undefined && existingFieldIndex >= 0) {
                    newEmbed.spliceFields(existingFieldIndex, 1, { name: 'Roles', value: rolesList });
                } else {
                    newEmbed.addFields({ name: 'Roles', value: rolesList });
                }
                
                // Update the message
                await rrMessage.edit({ embeds: [newEmbed] });
                
                // Save settings
                client.settings.set(message.guild.id, guildSettings);
                
                const successEmbed = new EmbedBuilder()
                    .setTitle('Role Added to Reaction Message')
                    .setDescription(`The role ${role} has been added to the reaction role message with emoji ${args[3]}.`)
                    .setColor('#00FF00')
                    .setFooter({ text: `Modified by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp();
                
                return message.reply({ embeds: [successEmbed] });
            } catch (error) {
                console.error(`Error adding role to reaction message: ${error}`);
                return message.reply(`Failed to add role to reaction message: ${error.message}`);
            }
        }
        
        // Remove a reaction role message
        if (action === 'remove') {
            // Check if message ID was provided
            if (!args[1]) {
                return message.reply('Please specify a message ID. Example: `-reactionrole remove 123456789012345678`');
            }
            
            const messageId = args[1];
            
            // Find the reaction role message
            const rrIndex = guildSettings.reactionRoles.findIndex(rr => rr.messageId === messageId);
            
            if (rrIndex === -1) {
                return message.reply(`Could not find a reaction role message with ID \`${messageId}\`. Use \`-reactionrole list\` to see all reaction role messages.`);
            }
            
            // Remove the reaction role message
            guildSettings.reactionRoles.splice(rrIndex, 1);
            
            // Save settings
            client.settings.set(message.guild.id, guildSettings);
            
            const embed = new EmbedBuilder()
                .setTitle('Reaction Role Removed')
                .setDescription(`The reaction role message with ID \`${messageId}\` has been removed from the system.`)
                .setColor('#FF0000')
                .setFooter({ text: `Modified by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Invalid action
        return message.reply('Invalid action! Please use `create`, `add`, `list`, or `remove`.');
    }
}; 