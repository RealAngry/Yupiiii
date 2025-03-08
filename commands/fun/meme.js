const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    name: 'meme',
    description: 'Get a random meme from Reddit',
    usage: 'meme [category]',
    category: 'fun',
    aliases: ['reddit', 'memes', 'hindimeme', 'indianmeme'],
    cooldown: 5,
    examples: [
        'meme',
        'meme indian',
        'meme dank',
        'meme wholesome',
        'meme programming',
        'meme anime',
        'meme list'
    ],
    async execute(client, message, args) {
        // Meme categories with their subreddits
        const memeCategories = {
            'indian': ['indiandankmemes', 'desimemes', 'indiameme', 'bollywoodmemes', 'SaimanSays', 'IndianMeyMeys', 'dankinindia'],
            'dank': ['dankmemes', 'memes', 'dankvideos', 'dank_meme', 'darkmemers'],
            'wholesome': ['wholesomememes', 'MadeMeSmile', 'wholesomeanimemes', 'wholesomegifs'],
            'programming': ['ProgrammerHumor', 'programmingmemes', 'codinghumor', 'programminghorror'],
            'anime': ['Animemes', 'goodanimemes', 'anime_irl', 'wholesomeanimemes'],
            'gaming': ['gamingmemes', 'gaming', 'pcmasterrace', 'GamePhysics'],
            'animals': ['AnimalsBeingDerps', 'rarepuppers', 'aww', 'cats', 'dogmemes']
        };
        
        // If the first argument is "list", show available categories
        if (args[0] && args[0].toLowerCase() === 'list') {
            const categoryList = Object.keys(memeCategories).map(cat => `• ${cat}`).join('\n');
            const embed = new EmbedBuilder()
                .setTitle('Available Meme Categories')
                .setDescription(categoryList)
                .setColor('#FF5700')
                .setFooter({ text: `Use "${client.prefix}meme <category>" to get a specific type of meme` });
            
            return message.channel.send({ embeds: [embed] });
        }
        
        // Get the category or subreddit from args
        let category = args[0] ? args[0].toLowerCase() : 'random';
        let subreddit;
        
        // If it's a category, pick a random subreddit from that category
        if (memeCategories[category]) {
            const subreddits = memeCategories[category];
            subreddit = subreddits[Math.floor(Math.random() * subreddits.length)];
        } 
        // If it's "random", pick a random category then a random subreddit
        else if (category === 'random') {
            const categories = Object.keys(memeCategories);
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            const subreddits = memeCategories[randomCategory];
            subreddit = subreddits[Math.floor(Math.random() * subreddits.length)];
            category = randomCategory;
        } 
        // Otherwise, assume it's a specific subreddit
        else {
            subreddit = category;
            category = 'custom';
        }
        
        // Remove 'r/' prefix if present
        subreddit = subreddit.replace(/^r\//i, '');
        
        try {
            // Send a loading message
            const loadingMessage = await message.channel.send(`Finding a ${category !== 'custom' ? category + ' ' : ''}meme for you...`);
            
            // Fetch meme from Reddit
            const meme = await fetchMeme(subreddit);
            
            if (!meme) {
                await loadingMessage.edit(`Sorry, I couldn't find any memes from r/${subreddit}. Try another category or subreddit.`);
                return;
            }
            
            // Create embed with the meme
            const embed = new EmbedBuilder()
                .setTitle(meme.title)
                .setURL(meme.postLink)
                .setColor('#FF5700') // Reddit's orange color
                .setImage(meme.url)
                .addFields(
                    { name: 'Subreddit', value: `r/${meme.subreddit}`, inline: true },
                    { name: 'Upvotes', value: `👍 ${meme.ups.toLocaleString()}`, inline: true },
                    { name: 'Comments', value: `💬 ${meme.numComments.toLocaleString()}`, inline: true }
                )
                .setFooter({ text: `Posted by u/${meme.author} | Type "${client.prefix}meme list" for categories` })
                .setTimestamp();
            
            // Edit the loading message with the meme embed
            await loadingMessage.edit({ content: null, embeds: [embed] });
        } catch (error) {
            console.error('Error fetching meme:', error);
            message.channel.send('There was an error fetching the meme. Please try again later.');
        }
    }
};

// Function to fetch a meme from Reddit
async function fetchMeme(subreddit) {
    try {
        // Try to fetch from Reddit API directly
        const response = await axios.get(`https://www.reddit.com/r/${subreddit}/hot.json?limit=100`, {
            headers: {
                'User-Agent': 'Yupi Discord Bot (by Yupi Management Team)'
            },
            timeout: 5000
        });
        
        if (response.status === 200 && response.data) {
            // Filter posts to only include image posts that aren't stickied, NSFW, or spoilers
            const posts = response.data.data.children
                .filter(post => 
                    (post.data.post_hint === 'image' || 
                    post.data.url.endsWith('.jpg') || 
                    post.data.url.endsWith('.jpeg') || 
                    post.data.url.endsWith('.png') || 
                    post.data.url.endsWith('.gif')) && 
                    !post.data.stickied && 
                    !post.data.over_18 && 
                    !post.data.spoiler
                )
                .map(post => ({
                    title: post.data.title,
                    url: post.data.url,
                    postLink: `https://reddit.com${post.data.permalink}`,
                    subreddit: post.data.subreddit,
                    ups: post.data.ups,
                    numComments: post.data.num_comments,
                    author: post.data.author
                }));
            
            // If no suitable posts were found, return null
            if (posts.length === 0) {
                return null;
            }
            
            // Return a random post from the filtered list
            return posts[Math.floor(Math.random() * posts.length)];
        }
        
        // If direct Reddit API fails, try using a meme API as backup
        return fetchMemeFromAPI();
    } catch (error) {
        console.error('Error fetching from Reddit:', error);
        // Try backup API
        return fetchMemeFromAPI();
    }
}

// Backup function to fetch meme from a meme API
async function fetchMemeFromAPI() {
    try {
        // Try different meme APIs
        const apis = [
            'https://meme-api.com/gimme',
            'https://api.imgflip.com/get_memes'
        ];
        
        // Try the first API
        const response = await axios.get(apis[0], { timeout: 5000 });
        
        if (response.status === 200 && response.data) {
            // Format for meme-api.com
            return {
                title: response.data.title,
                url: response.data.url,
                postLink: response.data.postLink,
                subreddit: response.data.subreddit,
                ups: response.data.ups || 0,
                numComments: response.data.numComments || 0,
                author: response.data.author || 'Unknown'
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error fetching from meme API:', error);
        return null;
    }
} 