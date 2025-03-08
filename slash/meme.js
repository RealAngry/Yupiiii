const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Get a random meme from Reddit (default: Indian/Hinglish memes)')
        .addStringOption(option => 
            option.setName('subreddit')
                .setDescription('Specific subreddit to fetch memes from (default: Indian meme subreddits)')
                .setRequired(false)
                .addChoices(
                    { name: 'Indian Dank Memes', value: 'indiandankmemes' },
                    { name: 'Desi Memes', value: 'desimemes' },
                    { name: 'India Meme', value: 'indiameme' },
                    { name: 'Bollywood Memes', value: 'bollywoodmemes' },
                    { name: 'Saiman Says', value: 'SaimanSays' },
                    { name: 'Dank in India', value: 'dankinindia' },
                    { name: 'Bakchodi', value: 'bakchodi' },
                    { name: 'Global Memes', value: 'memes' }
                )),
    
    async execute(interaction, client) {
        // Default Indian/Hinglish subreddits to fetch memes from
        const defaultSubreddits = [
            'indiandankmemes',
            'desimemes',
            'indiameme',
            'bollywoodmemes',
            'SaimanSays',
            'IndianMeyMeys',
            'dankinindia',
            'bakchodi',
            'TheRawKnee'
        ];
        
        // If a subreddit is specified, use that instead
        let subreddit = interaction.options.getString('subreddit') || 
                       defaultSubreddits[Math.floor(Math.random() * defaultSubreddits.length)];
        
        // Remove 'r/' prefix if present
        subreddit = subreddit.replace(/^r\//i, '');
        
        try {
            // Defer the reply to give time to fetch the meme
            await interaction.deferReply();
            
            // Fetch meme from Reddit
            const meme = await fetchMeme(subreddit);
            
            if (!meme) {
                await interaction.editReply(`Arre yaar, r/${subreddit} se koi meme nahi mila. Koi aur subreddit try karo.`);
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
                .setFooter({ text: `Posted by u/${meme.author} | Try other Indian subreddits!` })
                .setTimestamp();
            
            // Send the meme embed
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching meme:', error);
            
            // If the interaction has already been deferred, edit the reply
            if (interaction.deferred) {
                await interaction.editReply('Kuch gadbad ho gayi meme laane mein. Thodi der baad try karo.');
            } else {
                await interaction.reply({ 
                    content: 'Kuch gadbad ho gayi meme laane mein. Thodi der baad try karo.',
                    ephemeral: true 
                });
            }
        }
    }
};

// Function to fetch a meme from Reddit
async function fetchMeme(subreddit) {
    try {
        // Fetch from Reddit API
        const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=100`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch from Reddit: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Filter posts to only include image posts that aren't stickied, NSFW, or spoilers
        const posts = data.data.children
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
    } catch (error) {
        console.error('Error fetching from Reddit:', error);
        return null;
    }
} 