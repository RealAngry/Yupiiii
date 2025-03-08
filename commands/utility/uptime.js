const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'uptime',
    description: 'Display how long the bot has been running',
    usage: 'uptime',
    category: 'utility',
    aliases: ['up', 'online'],
    permissions: PermissionFlagsBits.SendMessages,
    cooldown: 5,
    execute(client, message, args) {
        // Calculate uptime
        const uptime = process.uptime();
        
        // Convert to readable format
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);
        
        // Format uptime string
        let uptimeString = '';
        if (days > 0) uptimeString += `${days} day${days !== 1 ? 's' : ''}, `;
        if (hours > 0) uptimeString += `${hours} hour${hours !== 1 ? 's' : ''}, `;
        if (minutes > 0) uptimeString += `${minutes} minute${minutes !== 1 ? 's' : ''}, `;
        uptimeString += `${seconds} second${seconds !== 1 ? 's' : ''}`;
        
        // Get bot start time
        const startTime = new Date(Date.now() - (uptime * 1000));
        const formattedStartTime = `<t:${Math.floor(startTime.getTime() / 1000)}:F>`;
        const relativeStartTime = `<t:${Math.floor(startTime.getTime() / 1000)}:R>`;
        
        // Create embed
        const embed = new EmbedBuilder()
            .setTitle('Bot Uptime')
            .setDescription(`I've been online for **${uptimeString}**`)
            .setColor('#00FF00')
            .addFields(
                { name: 'Started At', value: formattedStartTime, inline: true },
                { name: 'Relative', value: relativeStartTime, inline: true }
            )
            .setFooter({ text: `Requested by ${message.author.tag}` })
            .setTimestamp();
        
        // Add system info
        embed.addFields({
            name: 'System Info',
            value: `**Node.js**: ${process.version}\n**Discord.js**: v${require('discord.js').version}\n**Platform**: ${process.platform}\n**Memory Usage**: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
            inline: false
        });
        
        message.reply({ embeds: [embed] });
    }
}; 