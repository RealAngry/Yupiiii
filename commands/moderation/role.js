const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'role',
    description: 'Add or remove a role from a user',
    usage: 'role <add/remove> @user @role [reason]',
    category: 'moderation',
    aliases: ['giverole', 'removerole'],
    cooldown: 3,
    permissions: [PermissionFlagsBits.ManageRoles],
    async execute(client, message, args) {
        // Check if enough arguments were provided
        if (args.length < 3) {
            return message.reply('Please provide the action (add/remove), user, and role. Example: `-role add @user @role`');
        }
        
        // Get action
        const action = args[0].toLowerCase();
        
        // Validate action
        if (!['add', 'remove', 'give', 'take'].includes(action)) {
            return message.reply('Invalid action! Please use `add` or `remove`.');
        }
        
        // Get target user
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[1]);
        
        // Check if user exists
        if (!target) {
            return message.reply('Could not find that user!');
        }
        
        // Get role
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[2]) || message.guild.roles.cache.find(r => r.name.toLowerCase() === args.slice(2).join(' ').toLowerCase());
        
        // Check if role exists
        if (!role) {
            return message.reply('Could not find that role!');
        }
        
        // Check if role is manageable
        if (!role.editable) {
            return message.reply('I cannot manage this role! It might be higher than my highest role.');
        }
        
        // Check if user already has the role (for add) or doesn't have it (for remove)
        const hasRole = target.roles.cache.has(role.id);
        
        if (['add', 'give'].includes(action) && hasRole) {
            return message.reply(`${target.user.tag} already has the ${role.name} role.`);
        }
        
        if (['remove', 'take'].includes(action) && !hasRole) {
            return message.reply(`${target.user.tag} doesn't have the ${role.name} role.`);
        }
        
        // Get reason
        const reason = args.slice(3).join(' ') || 'No reason provided';
        
        try {
            // Add or remove role
            if (['add', 'give'].includes(action)) {
                await target.roles.add(role, reason);
            } else {
                await target.roles.remove(role, reason);
            }
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('Role Updated')
                .setDescription(`${role} has been ${['add', 'give'].includes(action) ? 'added to' : 'removed from'} ${target.user.tag}.`)
                .addFields(
                    { name: 'User', value: `${target.user.tag} (${target.id})` },
                    { name: 'Role', value: `${role.name} (${role.id})` },
                    { name: 'Moderator', value: message.author.tag },
                    { name: 'Reason', value: reason }
                )
                .setColor(role.hexColor)
                .setFooter({ text: `Action: ${action}` })
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
            
            // Get guild settings
            const guildSettings = client.settings?.get(message.guild.id) || {};
            
            // Log to channel if set
            const logChannelId = guildSettings.logChannel;
            if (logChannelId) {
                const logChannel = message.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('Role Updated')
                        .setDescription(`${role} has been ${['add', 'give'].includes(action) ? 'added to' : 'removed from'} ${target.user.tag}.`)
                        .addFields(
                            { name: 'User', value: `${target.user.tag} (${target.id})` },
                            { name: 'Role', value: `${role.name} (${role.id})` },
                            { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` },
                            { name: 'Reason', value: reason }
                        )
                        .setColor(role.hexColor)
                        .setTimestamp();
                    
                    logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }
        } catch (error) {
            console.error(`Error in role command: ${error}`);
            message.reply(`Failed to ${action} role: ${error.message}`);
        }
    }
}; 