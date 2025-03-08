const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    name: 'shayari',
    description: 'Get a random Hinglish shayari',
    usage: 'shayari [category]',
    category: 'fun',
    aliases: ['poetry', 'poem', 'kavita'],
    cooldown: 5,
    examples: [
        'shayari',
        'shayari love',
        'shayari sad',
        'shayari friendship',
        'shayari motivational',
        'shayari life',
        'shayari funny'
    ],
    async execute(client, message, args) {
        // Categories of shayari
        const categories = {
            'love': 'Love Shayari',
            'sad': 'Sad Shayari',
            'friendship': 'Friendship Shayari',
            'motivational': 'Motivational Shayari',
            'life': 'Life Shayari',
            'funny': 'Funny Shayari'
        };
        
        // If first argument is "list", show available categories
        if (args[0] && args[0].toLowerCase() === 'list') {
            const categoryList = Object.keys(categories).map(cat => `• ${cat} - ${categories[cat]}`).join('\n');
            const embed = new EmbedBuilder()
                .setTitle('Available Shayari Categories')
                .setDescription(categoryList)
                .setColor('#FF9933')
                .setFooter({ text: `Use "${client.prefix}shayari <category>" to get a specific type of shayari` });
            
            return message.channel.send({ embeds: [embed] });
        }
        
        // Default category is random
        let category = args[0] ? args[0].toLowerCase() : 'random';
        
        try {
            // Send a loading message
            const loadingMessage = await message.channel.send('Finding a beautiful shayari for you...');
            
            // Get a shayari
            const shayari = await getShayari(category);
            
            if (!shayari) {
                return loadingMessage.edit('Sorry, I couldn\'t find any shayari. Please try again later.');
            }
            
            // Create embed
            const embed = new EmbedBuilder()
                .setTitle(`✨ ${shayari.category || 'Shayari'} ✨`)
                .setDescription(`*${shayari.text}*`)
                .setColor('#FF9933') // Saffron color from Indian flag
                .setFooter({ text: `Type "${client.prefix}shayari list" to see all categories` })
                .setTimestamp();
            
            // If the shayari has an author, add it
            if (shayari.author && shayari.author !== 'Unknown') {
                embed.addFields({ name: 'Author', value: shayari.author });
            }
            
            // Edit the loading message with the embed
            await loadingMessage.edit({ content: null, embeds: [embed] });
        } catch (error) {
            console.error('Error fetching shayari:', error);
            message.channel.send('There was an error fetching the shayari. Please try again later.');
        }
    }
};

// Function to get a shayari from the internet
async function getShayari(category) {
    try {
        // API endpoints for different categories
        const apiEndpoints = {
            'love': 'https://hindi-shayari-api.vercel.app/love',
            'sad': 'https://hindi-shayari-api.vercel.app/sad',
            'friendship': 'https://hindi-shayari-api.vercel.app/friendship',
            'motivational': 'https://hindi-shayari-api.vercel.app/motivational',
            'life': 'https://hindi-shayari-api.vercel.app/life',
            'funny': 'https://hindi-shayari-api.vercel.app/funny',
            'random': 'https://hindi-shayari-api.vercel.app/random'
        };
        
        // If category is not valid, use random
        const endpoint = apiEndpoints[category] || apiEndpoints['random'];
        
        // Fetch shayari from API
        const response = await axios.get(endpoint, { timeout: 5000 });
        
        // If API call was successful
        if (response.status === 200 && response.data) {
            // Format the response
            return {
                text: response.data.content || response.data.shayari || response.data.text || "Dil se nikli hai ye shayari, umeed hai aapko pasand aayegi.",
                category: response.data.category || categories[category] || 'Shayari',
                author: response.data.author || 'Yupi Management Team'
            };
        }
        
        // If API call failed, use backup shayaris
        return getBackupShayari(category);
    } catch (error) {
        console.error('Error fetching shayari from API:', error);
        // If there's an error, use backup shayaris
        return getBackupShayari(category);
    }
}

// Backup function to get a shayari if API fails
function getBackupShayari(category) {
    // Collection of Hinglish shayari
    const shayaris = {
        'love': [
            { text: 'Tere pyaar mein hum kho gaye,\nTere ishq mein hum doob gaye,\nTu hi meri duniya ban gaya,\nTere bina hum toot gaye.', category: 'Love Shayari', author: 'Yupi Management Team' },
            { text: 'Tumse milne ko dil karta hai,\nTumse baatein karne ko mann karta hai,\nPata nahi kya jadoo kar diya tumne,\nHar pal tumhe dekhne ko dil karta hai.', category: 'Love Shayari', author: 'Yupi Management Team' }
        ],
        'sad': [
            { text: 'Dil toota hai mera aaj phir se,\nAankhon se aansoo beh rahe hain,\nKisi ne pucha bhi nahi haal mera,\nLog kitne badal gaye hain.', category: 'Sad Shayari', author: 'Yupi Management Team' },
            { text: 'Dard itna hai ke dawa kuch kar nahi paati,\nZindagi hai magar jeene ka mann nahi karta.', category: 'Sad Shayari', author: 'Yupi Management Team' }
        ],
        'friendship': [
            { text: 'Dosti nibhana hamara kaam hai,\nDosti todna duniya ka kaam hai,\nLekin hum duniya se alag hain,\nKyunki dosti nibhana hamara imaan hai.', category: 'Friendship Shayari', author: 'Yupi Management Team' },
            { text: 'Dosti wo nahi jo roz milkar nibhai jaye,\nDosti wo hai jo dil se nibhai jaye.', category: 'Friendship Shayari', author: 'Yupi Management Team' }
        ],
        'motivational': [
            { text: 'Haar ke jeetne wale ko bazigar kehte hain,\nHimmat haarne wale ko aadmi nahi kehte.', category: 'Motivational Shayari', author: 'Yupi Management Team' },
            { text: 'Zindagi mein kuch paana hai to haar mat maano,\nKoshish karne walon ki kabhi haar nahi hoti.', category: 'Motivational Shayari', author: 'Yupi Management Team' }
        ],
        'life': [
            { text: 'Zindagi ek safar hai suhana,\nYahan kal kya ho kisne jaana.', category: 'Life Shayari', author: 'Yupi Management Team' },
            { text: 'Zindagi mein kuch pal aise hote hain,\nJo hamesha yaad rehte hain,\nChahe wo khushi ke hon ya gham ke,\nPar wo hamare apne hote hain.', category: 'Life Shayari', author: 'Yupi Management Team' }
        ],
        'funny': [
            { text: 'Hum to fakir aadmi hain, jhola uthake chal denge,\nLekin teri yaad aayegi to lautke wapas aa jayenge.', category: 'Funny Shayari', author: 'Yupi Management Team' },
            { text: 'Mohabbat aur dosti mein fark yahi hai,\nMohabbat mein ladki roothti hai to manana padta hai,\nDosti mein ladka roothta hai to ladki mana leti hai.', category: 'Funny Shayari', author: 'Yupi Management Team' }
        ]
    };
    
    // If category is random, pick a random category
    if (category === 'random') {
        const categories = Object.keys(shayaris);
        category = categories[Math.floor(Math.random() * categories.length)];
    }
    
    // Get shayaris for the selected category
    const categoryShayaris = shayaris[category] || shayaris['love'];
    
    // Return a random shayari from the category
    return categoryShayaris[Math.floor(Math.random() * categoryShayaris.length)];
} 