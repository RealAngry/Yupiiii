const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'unmute',
    description: 'Unmute a member in the server',
    usage: 'unmute @user [reason]',
    category: 'moderation',
    aliases: ['untimeout'],
    cooldown: 3,
    permissions: [PermissionFlagsBits.ModerateMembers],
    async execute(client, message, args) {
        // Check if a user was mentioned
        if (!args[0]) {
            return message.reply('Please specify a user to unmute!');
        }
        
        // Get target user
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        // Check if user exists
        if (!target) {
            return message.reply('Could not find that user!');
        }
        
        // Check if user is moderatable
        if (!target.moderatable) {
            return message.reply('I cannot unmute this user! Do they have a higher role?');
        }
        
        // Get reason
        let reason = args.slice(1).join(' ');
        if (!reason) reason = 'No reason provided';
        
        // Get guild settings
        const guildSettings = client.settings?.get(message.guild.id) || {};
        const muteRoleId = guildSettings.muteRole;
        
        let unmuteMethod = 'timeout';
        
        // Check if user has a timeout
        if (target.communicationDisabledUntil) {
            try {
                // Remove timeout
                await target.timeout(null, reason);
                unmuteMethod = 'timeout';
            } catch (error) {
                console.error(`Error removing timeout: ${error}`);
                return message.reply(`Failed to remove timeout from ${target.user.tag}: ${error.message}`);
            }
        } 
        // Check if user has mute role
        else if (muteRoleId) {
            const muteRole = message.guild.roles.cache.get(muteRoleId);
            if (muteRole && target.roles.cache.has(muteRoleId)) {
                try {
                    // Remove mute role
                    await target.roles.remove(muteRoleId, reason);
                    unmuteMethod = 'role';
                } catch (error) {
                    console.error(`Error removing mute role: ${error}`);
                    return message.reply(`Failed to remove mute role from ${target.user.tag}: ${error.message}`);
                }
            } else {
                // Check for default mute role
                const defaultMuteRole = message.guild.roles.cache.find(role => role.name === 'Muted');
                if (defaultMuteRole && target.roles.cache.has(defaultMuteRole.id)) {
                    try {
                        // Remove default mute role
                        await target.roles.remove(defaultMuteRole.id, reason);
                        unmuteMethod = 'role';
                    } catch (error) {
                        console.error(`Error removing default mute role: ${error}`);
                        return message.reply(`Failed to remove mute role from ${target.user.tag}: ${error.message}`);
                    }
                } else {
                    return message.reply(`${target.user.tag} is not muted.`);
                }
            }
        } else {
            // Check for default mute role
            const defaultMuteRole = message.guild.roles.cache.find(role => role.name === 'Muted');
            if (defaultMuteRole && target.roles.cache.has(defaultMuteRole.id)) {
                try {
                    // Remove default mute role
                    await target.roles.remove(defaultMuteRole.id, reason);
                    unmuteMethod = 'role';
                } catch (error) {
                    console.error(`Error removing default mute role: ${error}`);
                    return message.reply(`Failed to remove mute role from ${target.user.tag}: ${error.message}`);
                }
            } else {
                return message.reply(`${target.user.tag} is not muted.`);
            }
        }
        
        // Create success embed
        const embed = new EmbedBuilder()
            .setTitle('Member Unmuted')
            .setDescription(`**${target.user.tag}** has been unmuted.`)
            .addFields(
                { name: 'Reason', value: reason },
                { name: 'Moderator', value: message.author.tag },
                { name: 'Method', value: unmuteMethod === 'timeout' ? 'Removed timeout' : 'Removed mute role' }
            )
            .setColor('#00FF00')
            .setThumbnail(target.user.displayAvatarURL())
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
        
        // Try to DM the unmuted user
        try {
            const dmEmbed = new EmbedBuilder()
                .setTitle(`You were unmuted in ${message.guild.name}`)
                .addFields(
                    { name: 'Reason', value: reason },
                    { name: 'Moderator', value: message.author.tag }
                )
                .setColor('#00FF00')
                .setTimestamp();
            
            target.user.send({ embeds: [dmEmbed] }).catch(() => {});
        } catch (error) {
            console.error(`Could not send DM to ${target.user.tag}`, error);
        }
        
        // Log to channel if set
        const logChannelId = guildSettings.logChannel;
        if (logChannelId) {
            const logChannel = message.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('Member Unmuted')
                    .setDescription(`**${target.user.tag}** has been unmuted.`)
                    .addFields(
                        { name: 'User ID', value: target.id },
                        { name: 'Reason', value: reason },
                        { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },
                        { name: 'Method', value: unmuteMethod === 'timeout' ? 'Removed timeout' : 'Removed mute role' }
                    )
                    .setColor('#00FF00')
                    .setThumbnail(target.user.displayAvatarURL())
                    .setTimestamp();
                
                logChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }
        }
    }
}; 