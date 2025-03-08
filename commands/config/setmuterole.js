const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'setmuterole',
    description: 'Set a role to be used for muted members',
    usage: 'setmuterole @role',
    category: 'config',
    aliases: ['muterole'],
    cooldown: 5,
    permissions: [PermissionFlagsBits.ManageGuild, PermissionFlagsBits.ManageRoles],
    execute(client, message, args) {
        // Check if a role was mentioned
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        
        if (!args[0]) {
            // Check current mute role
            const currentSetting = client.settings?.get(message.guild.id)?.muteRole;
            const currentRole = currentSetting ? message.guild.roles.cache.get(currentSetting) : null;
            
            const embed = new EmbedBuilder()
                .setTitle('Mute Role Configuration')
                .setDescription(currentRole 
                    ? `Current mute role is ${currentRole}`
                    : 'No mute role is currently set')
                .addFields({ name: 'Usage', value: '`-setmuterole @role` - Set a mute role\n`-setmuterole create` - Create a new mute role\n`-setmuterole disable` - Use Discord\'s timeout feature instead' })
                .setColor('#0099ff')
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Initialize settings for guild if they don't exist
        if (!client.settings) client.settings = new Map();
        if (!client.settings.has(message.guild.id)) {
            client.settings.set(message.guild.id, {});
        }
        
        // Get guild settings
        const guildSettings = client.settings.get(message.guild.id);
        
        // Check if disabling
        if (args[0].toLowerCase() === 'disable' || args[0].toLowerCase() === 'off') {
            // Remove mute role setting
            delete guildSettings.muteRole;
            
            // Save settings
            client.settings.set(message.guild.id, guildSettings);
            
            const embed = new EmbedBuilder()
                .setTitle('Mute Role Disabled')
                .setDescription('The mute role has been disabled. The bot will use Discord\'s timeout feature instead.')
                .setColor('#FF0000')
                .setFooter({ text: `Modified by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Check if creating a new role
        if (args[0].toLowerCase() === 'create') {
            message.channel.send('Creating a new mute role... This may take a moment.');
            
            // Create a new role
            message.guild.roles.create({
                name: 'Muted',
                color: '#808080',
                reason: 'Mute role for moderation',
                permissions: []
            }).then(async newRole => {
                // Update all channels to deny permissions for this role
                message.channel.send('Setting up permissions for all channels... This may take a while.');
                
                const channels = message.guild.channels.cache;
                
                for (const [id, channel] of channels) {
                    try {
                        await channel.permissionOverwrites.create(newRole, {
                            SendMessages: false,
                            AddReactions: false,
                            Speak: false,
                            Stream: false
                        });
                    } catch (error) {
                        console.error(`Failed to set permissions for channel ${channel.name}: ${error}`);
                    }
                }
                
                // Update mute role setting
                guildSettings.muteRole = newRole.id;
                
                // Save settings
                client.settings.set(message.guild.id, guildSettings);
                
                const embed = new EmbedBuilder()
                    .setTitle('Mute Role Created')
                    .setDescription(`Created and set the mute role to ${newRole}`)
                    .setColor('#00FF00')
                    .setFooter({ text: `Created by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp();
                
                message.reply({ embeds: [embed] });
                
                // Log the change
                console.log(`[MuteRole] ${message.author.tag} created and set the mute role to ${newRole.name} in ${message.guild.name}`);
            }).catch(error => {
                console.error(`Error creating mute role: ${error}`);
                message.reply(`Failed to create mute role: ${error.message}`);
            });
            
            return;
        }
        
        // Validate role
        if (!role) {
            return message.reply('Please mention a valid role or provide a role ID.');
        }
        
        // Check if role is manageable
        if (!role.editable) {
            return message.reply('I cannot manage this role! It might be higher than my highest role.');
        }
        
        // Update mute role setting
        guildSettings.muteRole = role.id;
        
        // Save settings
        client.settings.set(message.guild.id, guildSettings);
        
        // Create response embed
        const embed = new EmbedBuilder()
            .setTitle('Mute Role Set')
            .setDescription(`The mute role has been set to ${role}`)
            .setColor('#00FF00')
            .setFooter({ text: `Modified by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
        
        // Log the change
        console.log(`[MuteRole] ${message.author.tag} set the mute role to ${role.name} in ${message.guild.name}`);
    }
}; 