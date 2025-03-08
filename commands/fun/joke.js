const { EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    name: 'joke',
    description: 'Get a random Hindi/Hinglish joke',
    usage: 'joke [category]',
    category: 'fun',
    aliases: ['jokes', 'chutkula', 'mazak'],
    cooldown: 5,
    examples: [
        'joke',
        'joke santa-banta',
        'joke student',
        'joke pati-patni'
    ],
    async execute(client, message, args) {
        // Categories of jokes
        const categories = {
            'santa-banta': 'Santa Banta jokes',
            'student': 'Student Teacher jokes',
            'pati-patni': 'Husband Wife jokes',
            'general': 'General jokes',
            'bollywood': 'Bollywood jokes',
            'cricket': 'Cricket jokes',
            'political': 'Political jokes'
        };
        
        // Default category is random
        let category = args[0] ? args[0].toLowerCase() : 'random';
        
        // If category is not valid, use random
        if (!Object.keys(categories).includes(category)) {
            category = 'random';
        }
        
        try {
            // Send a loading message
            const loadingMessage = await message.channel.send('Ek minute, joke dhund raha hoon...');
            
            // Get a joke
            const joke = await getJoke(category);
            
            if (!joke) {
                return loadingMessage.edit('Sorry, koi joke nahi mila. Baad mein try karo.');
            }
            
            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('😂 Hindi Joke 😂')
                .setDescription(joke.text)
                .setColor('#FF9933') // Saffron color from Indian flag
                .setFooter({ text: `Category: ${joke.category} | Type "${client.prefix}joke help" for categories` })
                .setTimestamp();
            
            // If the joke has a punchline, add it
            if (joke.punchline) {
                embed.addFields({ name: 'Punchline', value: joke.punchline });
            }
            
            // Edit the loading message with the embed
            await loadingMessage.edit({ content: null, embeds: [embed] });
        } catch (error) {
            console.error('Error fetching joke:', error);
            message.reply('Joke laane mein kuch gadbad ho gayi. Baad mein try karo.');
        }
    }
};

// Function to get a joke
async function getJoke(category) {
    // Collection of Hindi/Hinglish jokes
    const jokes = {
        'santa-banta': [
            { text: 'Santa: Banta, tu itna mota kyun hai?\nBanta: Kyunki mere andar ek bahut bada insaan hai.', category: 'Santa Banta' },
            { text: 'Santa ne Banta ko phone kiya.\nSanta: Hello, main bol raha hoon?\nBanta: Haan, tu bol raha hai.\nSanta: Achcha, phir main baad mein phone karta hoon, jab tu free ho.', category: 'Santa Banta' },
            { text: 'Santa: Doctor, meri yaaddaasht bahut kamzor ho gayi hai.\nDoctor: Kab se?\nSanta: Kab se kya?', category: 'Santa Banta' },
            { text: 'Santa apne naye ghar mein shift hua. Pehle din usne doorbell bajaayi.\nBanta: Kaun hai?\nSanta: Main hoon, Santa.\nBanta: Toh phir doorbell kyun bajayi?', category: 'Santa Banta' },
            { text: 'Santa: Yaar Banta, kal main swimming pool mein gir gaya tha.\nBanta: Paani tha kya usme?\nSanta: Pata nahi, main tairna nahi jaanta.', category: 'Santa Banta' }
        ],
        'student': [
            { text: 'Teacher: Tumne homework kyun nahi kiya?\nStudent: Kal bijli nahi thi.\nTeacher: Toh din mein kar lete.\nStudent: Homework raat ka tha na, ma\'am.', category: 'Student Teacher' },
            { text: 'Teacher: Batao, Bharat ki rajdhani kya hai?\nStudent: B\nTeacher: Kya bakwaas hai ye?\nStudent: Aapne kaha tha Bharat ki rajdhani, toh maine bola B.', category: 'Student Teacher' },
            { text: 'Teacher: Agar main tumhe 4 seb doon, aur 2 aur doon, toh tumhare paas kitne seb honge?\nStudent: 4 seb.\nTeacher: Tumhe addition nahi aata?\nStudent: Addition aata hai, lekin mujhe seb pasand nahi.', category: 'Student Teacher' },
            { text: 'Teacher: Tumhara homework kaha hai?\nStudent: Mere kutte ne kha liya.\nTeacher: Sach bolo!\nStudent: Sach me, phir usne ulti kar di, toh maine use saaf kar diya.', category: 'Student Teacher' },
            { text: 'Teacher: Tumne exam mein itne galat jawab kyun likhe?\nStudent: Aapne kaha tha ki cheating mat karo, toh maine apne aap se likha.', category: 'Student Teacher' }
        ],
        'pati-patni': [
            { text: 'Patni: Suniye, aaj main ghar pe nahi hoon toh khana khud bana lena.\nPati: Kya banaun?\nPatni: Kuch bhi bana lo, insurance papers drawer mein hain.', category: 'Husband Wife' },
            { text: 'Patni: Aapko yaad hai, kal humari shaadi ki saalgirah thi?\nPati: Haan, yaad hai. Isliye toh kal maine tumse kuch nahi maanga.', category: 'Husband Wife' },
            { text: 'Patni: Aaj main bahut khush hoon.\nPati: Kyun?\nPatni: Maine aaj sapne mein dekha ki tum mujhe heere ka haar la kar de rahe ho.\nPati: Kal raat ko sapne mein hi pehen lena tha.', category: 'Husband Wife' },
            { text: 'Patni: Aapko pata hai, padosi ki biwi ko roz diamond milte hain.\nPati: Haan, isliye toh padosi raat ko chori karne jaata hai.', category: 'Husband Wife' },
            { text: 'Patni: Aapne mujhe kabhi bataya nahi ki aap itne handsome kyun ho?\nPati: Kyunki tum kabhi poochti nahi ho, bas order deti ho.', category: 'Husband Wife' }
        ],
        'general': [
            { text: 'Ek aadmi ne dukaan pe jakar poocha: "Bhaiya, machhar maarne ki dawai hai?"\nDukaandar: "Haan hai."\nAadmi: "Toh phir machhar ko pakad kar yahan laana padega kya?"', category: 'General' },
            { text: 'Pappu: Doctor, mujhe neend nahi aati.\nDoctor: Koi baat nahi, main tumhe ek dawai deta hoon.\nPappu: Kitne baje leni hai?\nDoctor: Sone se pehle.\nPappu: Problem toh yahi hai doctor, mujhe pata kaise chalega ki main kab sone wala hoon?', category: 'General' },
            { text: 'Ek aadmi: Yaar, meri biwi mujhse bahut gussa hai.\nDost: Kyun?\nAadmi: Usne mujhse kaha tha ki uske liye ek surprise gift laao, toh main kuch nahi laya.', category: 'General' },
            { text: 'Customer: Waiter, is soup mein machhar hai.\nWaiter: Koi baat nahi sir, machhar ko zyada soup nahi milega.', category: 'General' },
            { text: 'Interviewer: Aapki sabse badi kamzori kya hai?\nCandidate: Main sach bolne ki aadat se pareshaan hoon.\nInterviewer: Mujhe nahi lagta ki yeh kamzori hai.\nCandidate: Mujhe tumhari parwah nahi hai ki tumhe kya lagta hai.', category: 'General' }
        ],
        'bollywood': [
            { text: 'Director: Is scene mein tumhe sirf "I love you" bolna hai.\nActor: Ok sir.\n*Camera rolls*\nActor: "I love you sir."', category: 'Bollywood' },
            { text: 'Ek actor ne doosre actor se pucha: "Tumhari film kitne din chali?"\nDoosra actor: "Jab tak police nahi aayi."', category: 'Bollywood' },
            { text: 'Producer: Tumhari film ka budget kitna hai?\nDirector: 100 crore.\nProducer: Aur hero kaun hai?\nDirector: Aapka beta.\nProducer: Budget 200 crore kar do.', category: 'Bollywood' },
            { text: 'Director: Is scene mein tumhe sirf rona hai.\nActor: Sir, main method actor hoon. Mujhe motivation chahiye.\nDirector: Tumhari acting dekh li hai maine.', category: 'Bollywood' },
            { text: 'Fan: Sir, aapki agli film kab aa rahi hai?\nActor: Jab pichli film ka loan chukta ho jayega.', category: 'Bollywood' }
        ],
        'cricket': [
            { text: 'Commentator: Aaj match mein baarish hone ki 90% sambhavna hai.\nIndian Fan: Aur India ke jeetne ki?', category: 'Cricket' },
            { text: 'Coach: Tumne itni bekar batting kyun ki?\nBatsman: Sir, wicket bahut slow thi.\nCoach: Toh tumhe out hone mein itni jaldi kya thi?', category: 'Cricket' },
            { text: 'Umpire: Howzzat?\nBatsman: Nahi, main out nahi hoon.\nUmpire: Maine tumse nahi, fielding team se pucha tha.', category: 'Cricket' },
            { text: 'Wife: Aap cricket match dekhna band karo aur kuch kaam karo.\nHusband: Main multi-tasking kar raha hoon.\nWife: Kaise?\nHusband: Match dekh raha hoon aur tumhari baatein bhi sun raha hoon.', category: 'Cricket' },
            { text: 'Fan 1: Yaar, humari team ne toss jeet liya!\nFan 2: Great! Ab kya karenge?\nFan 1: Batting.\nFan 2: Aur agar toss haarte toh?\nFan 1: Tab bowling karte.', category: 'Cricket' }
        ],
        'political': [
            { text: 'Reporter: Aapki party ka manifesto kya hai?\nNeta: Hum garibi mitayenge.\nReporter: Kaise?\nNeta: Garib log party join kar lenge.', category: 'Political' },
            { text: 'Neta ji rally mein: "Main aapke liye kaam karunga, din-raat mehnat karunga!"\nAadmi crowd mein: "Pehle toh aap attendance lagwa lijiye."', category: 'Political' },
            { text: 'Ek neta dusre neta se: "Tumne election mein kitne vote paaye?"\nDusra neta: "Sirf ek."\nPehla neta: "Tumhari biwi ne bhi tumhe vote nahi diya?"\nDusra neta: "Nahi, sirf maine khud ko vote diya."', category: 'Political' },
            { text: 'Reporter: Aapki party ka symbol kya hai?\nNeta: Jhadu.\nReporter: Kyun?\nNeta: Kyunki hum sabko saaf kar denge.', category: 'Political' },
            { text: 'Neta: Mere paas vision hai.\nPublic: Aur chashma bhi.', category: 'Political' }
        ]
    };
    
    // If category is random, pick a random category
    if (category === 'random') {
        const categories = Object.keys(jokes);
        category = categories[Math.floor(Math.random() * categories.length)];
    }
    
    // Get jokes for the selected category
    const categoryJokes = jokes[category] || jokes['general'];
    
    // Return a random joke from the category
    return categoryJokes[Math.floor(Math.random() * categoryJokes.length)];
} 