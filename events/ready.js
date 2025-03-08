module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Bot is online as ${client.user.tag}!`);
        
        // Set bot status
        client.user.setActivity('!help', { type: 'WATCHING' });
        
        // Log server count
        console.log(`Bot is in ${client.guilds.cache.size} servers`);
    }
}; 