module.exports = {
    name: 'messageUpdate',
    async execute(oldMessage, newMessage, client) {
        // Ignore messages from bots
        if (oldMessage.author?.bot) return;
        
        // Ignore if content is the same
        if (oldMessage.content === newMessage.content) return;
        
        // Initialize snipe collections if they don't exist
        if (!client.snipes) {
            client.snipes = {
                deleted: new Map(),
                edited: new Map()
            };
        }
        
        // Get the current edited messages for this channel
        const snipes = client.snipes.edited.get(oldMessage.channel.id) || [];
        
        // Add the edited message to the beginning of the array
        snipes.unshift({
            content: oldMessage.content,
            newContent: newMessage.content,
            author: {
                id: oldMessage.author?.id,
                tag: oldMessage.author?.tag,
                displayAvatarURL: () => oldMessage.author?.displayAvatarURL() || null
            },
            timestamp: Date.now(),
            image: oldMessage.attachments.size > 0 ? 
                oldMessage.attachments.first().proxyURL : null
        });
        
        // Limit to 10 messages per channel
        if (snipes.length > 10) {
            snipes.pop();
        }
        
        // Update the snipes collection
        client.snipes.edited.set(oldMessage.channel.id, snipes);
        
        console.log(`[Snipe] Stored edited message from ${oldMessage.author?.tag || 'Unknown'} in #${oldMessage.channel.name}`);
    }
}; 