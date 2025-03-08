const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'setprefix',
    description: 'Change the command prefix for this server',
    usage: 'setprefix <new_prefix>',
    category: 'config',
    aliases: ['prefix'],
    cooldown: 10,
    permissions: [PermissionFlagsBits.ManageGuild],
    execute(client, message, args) {
        // Check if a prefix was provided
        if (!args[0]) {
            return message.reply(`The current prefix is \`${client.prefix}\`. Please provide a new prefix to change it.`);
        }
        
        // Get the new prefix
        const newPrefix = args[0];
        
        // Validate prefix length
        if (newPrefix.length > 3) {
            return message.reply('Prefix cannot be longer than 3 characters!');
        }
        
        // Initialize settings for guild if they don't exist
        if (!client.settings) client.settings = new Map();
        if (!client.settings.has(message.guild.id)) {
            client.settings.set(message.guild.id, {});
        }
        
        // Get guild settings
        const guildSettings = client.settings.get(message.guild.id);
        
        // Update prefix setting
        guildSettings.prefix = newPrefix;
        
        // Save settings
        client.settings.set(message.guild.id, guildSettings);
        
        // Update client prefix for this guild
        client.prefix = newPrefix;
        
        // Create response embed
        const embed = new EmbedBuilder()
            .setTitle('Prefix Updated')
            .setDescription(`The command prefix has been updated to \`${newPrefix}\``)
            .setColor('#00FF00')
            .setFooter({ text: `Modified by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
        
        // Log the change
        console.log(`[Prefix] ${message.author.tag} changed the prefix to '${newPrefix}' in ${message.guild.name}`);
    }
}; 