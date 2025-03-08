const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shayari')
        .setDescription('Get a random Hinglish shayari')
        .addStringOption(option => 
            option.setName('category')
                .setDescription('The category of shayari to get')
                .setRequired(false)
                .addChoices(
                    { name: 'Love', value: 'love' },
                    { name: 'Sad', value: 'sad' },
                    { name: 'Friendship', value: 'friendship' },
                    { name: 'Motivational', value: 'motivational' },
                    { name: 'Life', value: 'life' },
                    { name: 'Funny', value: 'funny' },
                    { name: 'Random', value: 'random' }
                )),
    
    async execute(interaction, client) {
        // Get category from options
        const category = interaction.options.getString('category') || 'random';
        
        try {
            // Defer reply to give time to fetch the shayari
            await interaction.deferReply();
            
            // Get a shayari
            const shayari = await getShayari(category);
            
            if (!shayari) {
                return interaction.editReply('Maaf kijiye, koi shayari nahi mili. Baad mein try karein.');
            }
            
            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('✨ Shayari ✨')
                .setDescription(`*${shayari.text}*`)
                .setColor('#FF9933') // Saffron color from Indian flag
                .setFooter({ text: `Category: ${shayari.category} | Try different categories with /shayari category:` })
                .setTimestamp();
            
            // If the shayari has an author, add it
            if (shayari.author) {
                embed.addFields({ name: 'Author', value: shayari.author });
            }
            
            // Send the shayari embed
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching shayari:', error);
            
            // If the interaction has already been deferred, edit the reply
            if (interaction.deferred) {
                await interaction.editReply('Shayari laane mein kuch gadbad ho gayi. Baad mein try karein.');
            } else {
                await interaction.reply({ 
                    content: 'Shayari laane mein kuch gadbad ho gayi. Baad mein try karein.',
                    ephemeral: true 
                });
            }
        }
    }
};

// Function to get a shayari
async function getShayari(category) {
    // Collection of Hinglish shayari
    const shayaris = {
        'love': [
            { text: 'Tere pyaar mein hum kho gaye,\nTere ishq mein hum doob gaye,\nTu hi meri duniya ban gaya,\nTere bina hum toot gaye.', category: 'Love Shayari', author: 'Unknown' },
            { text: 'Tumse milne ko dil karta hai,\nTumse baatein karne ko mann karta hai,\nPata nahi kya jadoo kar diya tumne,\nHar pal tumhe dekhne ko dil karta hai.', category: 'Love Shayari', author: 'Unknown' },
            { text: 'Tere naam se hi mera din shuru hota hai,\nTere khayal se hi mera din poora hota hai,\nKaise kahoon main tujhse ki,\nTere bina mera jeena adhura hota hai.', category: 'Love Shayari', author: 'Unknown' },
            { text: 'Mohabbat ka junoon sar pe chadh gaya,\nTere bina jeena mushkil ho gaya,\nKaise kahoon tujhse mere saath kya hua,\nTere jaane ke baad mera dil tera ho gaya.', category: 'Love Shayari', author: 'Unknown' },
            { text: 'Tere ishq mein hum kya se kya ho gaye,\nJo kabhi khud ke the wo tere ho gaye,\nPehle hum tanhai se darte the,\nAb tere bina hum tanhai ho gaye.', category: 'Love Shayari', author: 'Unknown' }
        ],
        'sad': [
            { text: 'Dil toota hai mera aaj phir se,\nAankhon se aansoo beh rahe hain,\nKisi ne pucha bhi nahi haal mera,\nLog kitne badal gaye hain.', category: 'Sad Shayari', author: 'Unknown' },
            { text: 'Dard itna hai ke dawa kuch kar nahi paati,\nZindagi hai magar jeene ka mann nahi karta.', category: 'Sad Shayari', author: 'Unknown' },
            { text: 'Kuch log dil mein utar jaate hain,\nKuch log dil mein utar kar yaad ban jaate hain,\nKuch log dil mein utar kar yaad ban kar,\nPhir dil tod kar chale jaate hain.', category: 'Sad Shayari', author: 'Unknown' },
            { text: 'Hum to mit jayenge kisi din is duniya se,\nMagar hamari kami mehsoos hogi tumhe,\nJab koi aur tumhe hamari tarah pyaar nahi karega.', category: 'Sad Shayari', author: 'Unknown' },
            { text: 'Dil tootne ki awaaz nahi aati,\nWarna duniya kaan pakad ke baith jaati.', category: 'Sad Shayari', author: 'Unknown' }
        ],
        'friendship': [
            { text: 'Dosti nibhana hamara kaam hai,\nDosti todna duniya ka kaam hai,\nLekin hum duniya se alag hain,\nKyunki dosti nibhana hamara imaan hai.', category: 'Friendship Shayari', author: 'Unknown' },
            { text: 'Dosti wo nahi jo roz milkar nibhai jaye,\nDosti wo hai jo dil se nibhai jaye.', category: 'Friendship Shayari', author: 'Unknown' },
            { text: 'Dosti itni gehri ho ki,\nKhuda bhi dekhkar kahe,\nKaash main bhi inka dost hota.', category: 'Friendship Shayari', author: 'Unknown' },
            { text: 'Hum dosti ko samajhte hain khuda ki den,\nIsliye har dost ko rakhte hain aankhon mein.', category: 'Friendship Shayari', author: 'Unknown' },
            { text: 'Dosti mein no sorry, no thank you,\nBas ek pure dil aur saccha pyaar chahiye.', category: 'Friendship Shayari', author: 'Unknown' }
        ],
        'motivational': [
            { text: 'Haar ke jeetne wale ko bazigar kehte hain,\nHimmat haarne wale ko aadmi nahi kehte.', category: 'Motivational Shayari', author: 'Unknown' },
            { text: 'Zindagi mein kuch paana hai to haar mat maano,\nKoshish karne walon ki kabhi haar nahi hoti.', category: 'Motivational Shayari', author: 'Unknown' },
            { text: 'Manzil unhi ko milti hai,\nJinke sapnon mein jaan hoti hai,\nPankhon se kuch nahi hota,\nHauslon se udaan hoti hai.', category: 'Motivational Shayari', author: 'Unknown' },
            { text: 'Sapne wo nahi jo aap neend mein dekhte hain,\nSapne wo hote hain jo aapko sone nahi dete.', category: 'Motivational Shayari', author: 'Unknown' },
            { text: 'Mushkilein jitni badi ho,\nHausla usse bada hona chahiye,\nTabhi jeet milti hai zindagi mein,\nWarna haar ka maza bhi lena chahiye.', category: 'Motivational Shayari', author: 'Unknown' }
        ],
        'life': [
            { text: 'Zindagi ek safar hai suhana,\nYahan kal kya ho kisne jaana.', category: 'Life Shayari', author: 'Unknown' },
            { text: 'Zindagi mein kuch pal aise hote hain,\nJo hamesha yaad rehte hain,\nChahe wo khushi ke hon ya gham ke,\nPar wo hamare apne hote hain.', category: 'Life Shayari', author: 'Unknown' },
            { text: 'Zindagi mein sabse zyada khush wahi rehta hai,\nJo doosron ki khushi mein apni khushi dhoondta hai.', category: 'Life Shayari', author: 'Unknown' },
            { text: 'Zindagi mein kabhi kisi se ummeed mat rakhna,\nKyunki log aksar wahi todte hain,\nJisse aap jude hote hain.', category: 'Life Shayari', author: 'Unknown' },
            { text: 'Zindagi bahut chhoti hai,\nIsliye khush rahiye, muskuraiye,\nAur zindagi ko ji bhar ke jiye.', category: 'Life Shayari', author: 'Unknown' }
        ],
        'funny': [
            { text: 'Hum to fakir aadmi hain, jhola uthake chal denge,\nLekin teri yaad aayegi to lautke wapas aa jayenge.', category: 'Funny Shayari', author: 'Unknown' },
            { text: 'Mohabbat aur dosti mein fark yahi hai,\nMohabbat mein ladki roothti hai to manana padta hai,\nDosti mein ladka roothta hai to ladki mana leti hai.', category: 'Funny Shayari', author: 'Unknown' },
            { text: 'Padhai karne baitha tha, neend aa gayi,\nSone gaya tha, yaad aa gayi,\nYaad mein baitha tha, tu aa gayi,\nTu aayi to phir se neend aa gayi.', category: 'Funny Shayari', author: 'Unknown' },
            { text: 'Dil se nikli aah ban gayi shayari,\nTumhari yaad aayi aur barbadi ho gayi.', category: 'Funny Shayari', author: 'Unknown' },
            { text: 'Meri kismat itni kharab hai ki,\nJab main samundar mein doobne gaya,\nTo samundar mein paani hi nahi tha.', category: 'Funny Shayari', author: 'Unknown' }
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