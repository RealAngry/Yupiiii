const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'afk',
    description: 'Set your AFK status to let others know you are away',
    usage: 'afk [reason]',
    category: 'utility',
    aliases: ['away'],
    cooldown: 10,
    execute(client, message, args) {
        // Check if user is already AFK
        if (client.afkUsers.has(message.author.id)) {
            return message.reply('You are already AFK!');
        }
        
        // Get reason
        const reason = args.join(' ') || 'No reason provided';
        
        // Set user as AFK
        client.afkUsers.set(message.author.id, {
            timestamp: Date.now(),
            reason: reason,
            pings: [], // Track pings while AFK
            pingCount: 0 // Count of pings
        });
        
        // Create embed
        const embed = new EmbedBuilder()
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setTitle('AFK Status Set')
            .setDescription(`I've set your AFK status: ${reason}`)
            .setColor('#FFA500')
            .setFooter({ text: 'You\'ll be marked as returned once you send a message' })
            .setTimestamp();
        
        // Try to set nickname with [AFK] prefix if in a guild
        if (message.guild && message.member.manageable) {
            const originalNick = message.member.displayName;
            const newNick = originalNick.length > 26 ? 
                `[AFK] ${originalNick.substring(0, 23)}...` : 
                `[AFK] ${originalNick}`;
            
            message.member.setNickname(newNick)
                .catch(err => console.error(`Failed to set AFK nickname: ${err}`));
            
            // Store original nickname
            client.afkUsers.get(message.author.id).originalNick = originalNick;
        }
        
        // Send response
        message.reply({ embeds: [embed] }).catch(console.error);
    }
}; 