module.exports = {
    name: 'messageDelete',
    async execute(message, client) {
        // Ignore messages from bots
        if (message.author?.bot) return;
        
        // Initialize snipe collections if they don't exist
        if (!client.snipes) {
            client.snipes = {
                deleted: new Map(),
                edited: new Map()
            };
        }
        
        // Get the current deleted messages for this channel
        const snipes = client.snipes.deleted.get(message.channel.id) || [];
        
        // Add the deleted message to the beginning of the array
        snipes.unshift({
            content: message.content,
            author: {
                id: message.author?.id,
                tag: message.author?.tag,
                displayAvatarURL: () => message.author?.displayAvatarURL() || null
            },
            timestamp: Date.now(),
            image: message.attachments.size > 0 ? 
                message.attachments.first().proxyURL : null
        });
        
        // Limit to 10 messages per channel
        if (snipes.length > 10) {
            snipes.pop();
        }
        
        // Update the snipes collection
        client.snipes.deleted.set(message.channel.id, snipes);
        
        console.log(`[Snipe] Stored deleted message from ${message.author?.tag || 'Unknown'} in #${message.channel.name}`);
    }
}; 