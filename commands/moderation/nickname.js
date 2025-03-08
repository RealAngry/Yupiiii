const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'nickname',
    description: 'Change a user\'s nickname',
    usage: 'nickname @user [new nickname/reset]',
    category: 'moderation',
    aliases: ['nick', 'setnick'],
    cooldown: 3,
    permissions: [PermissionFlagsBits.ManageNicknames],
    async execute(client, message, args) {
        // Check if a user was mentioned
        if (!args[0]) {
            return message.reply('Please specify a user to change nickname for!');
        }
        
        // Get target user
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        // Check if user exists
        if (!target) {
            return message.reply('Could not find that user!');
        }
        
        // Check if user is manageable
        if (!target.manageable) {
            return message.reply('I cannot change this user\'s nickname! They might have a higher role than me.');
        }
        
        // Get new nickname
        const newNickname = args.slice(1).join(' ');
        
        // Check if nickname is provided or if resetting
        if (!newNickname || newNickname.toLowerCase() === 'reset') {
            // Reset nickname
            try {
                const oldNickname = target.nickname || target.user.username;
                
                await target.setNickname(null, `Nickname reset by ${message.author.tag}`);
                
                // Create success embed
                const embed = new EmbedBuilder()
                    .setTitle('Nickname Reset')
                    .setDescription(`${target.user.tag}'s nickname has been reset.`)
                    .addFields(
                        { name: 'User', value: `${target.user.tag} (${target.id})` },
                        { name: 'Old Nickname', value: oldNickname },
                        { name: 'Moderator', value: message.author.tag }
                    )
                    .setColor('#00FF00')
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
                            .setTitle('Nickname Reset')
                            .setDescription(`${target.user.tag}'s nickname has been reset.`)
                            .addFields(
                                { name: 'User', value: `${target.user.tag} (${target.id})` },
                                { name: 'Old Nickname', value: oldNickname },
                                { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` }
                            )
                            .setColor('#00FF00')
                            .setTimestamp();
                        
                        logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                    }
                }
            } catch (error) {
                console.error(`Error resetting nickname: ${error}`);
                message.reply(`Failed to reset nickname: ${error.message}`);
            }
            
            return;
        }
        
        // Check nickname length
        if (newNickname.length > 32) {
            return message.reply('Nickname cannot be longer than 32 characters!');
        }
        
        try {
            // Get old nickname
            const oldNickname = target.nickname || target.user.username;
            
            // Set new nickname
            await target.setNickname(newNickname, `Nickname changed by ${message.author.tag}`);
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle('Nickname Changed')
                .setDescription(`${target.user.tag}'s nickname has been changed.`)
                .addFields(
                    { name: 'User', value: `${target.user.tag} (${target.id})` },
                    { name: 'Old Nickname', value: oldNickname },
                    { name: 'New Nickname', value: newNickname },
                    { name: 'Moderator', value: message.author.tag }
                )
                .setColor('#0099ff')
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
                        .setTitle('Nickname Changed')
                        .setDescription(`${target.user.tag}'s nickname has been changed.`)
                        .addFields(
                            { name: 'User', value: `${target.user.tag} (${target.id})` },
                            { name: 'Old Nickname', value: oldNickname },
                            { name: 'New Nickname', value: newNickname },
                            { name: 'Moderator', value: `${message.author.tag} (${message.author.id})` }
                        )
                        .setColor('#0099ff')
                        .setTimestamp();
                    
                    logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }
        } catch (error) {
            console.error(`Error changing nickname: ${error}`);
            message.reply(`Failed to change nickname: ${error.message}`);
        }
    }
}; 