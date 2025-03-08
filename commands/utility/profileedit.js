const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'profileedit',
    description: 'Edit your profile information',
    usage: 'profileedit <bio/title> <new text>',
    category: 'utility',
    aliases: ['pedit', 'editprofile'],
    cooldown: 10,
    execute(client, message, args) {
        // Initialize profiles collection if it doesn't exist
        if (!client.profiles) {
            client.profiles = new Map();
        }
        
        // Check if user provided any arguments
        if (!args[0]) {
            const embed = new EmbedBuilder()
                .setTitle('Profile Edit Help')
                .setDescription('Edit your profile information')
                .addFields(
                    { name: 'Edit Bio', value: `\`${client.prefix}profileedit bio Your new bio text here\`` },
                    { name: 'Edit Title', value: `\`${client.prefix}profileedit title Your new profile title\`` }
                )
                .setColor('#00FFFF')
                .setFooter({ text: `Requested by ${message.author.tag}` })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Get or create user profile
        if (!client.profiles.has(message.author.id)) {
            client.profiles.set(message.author.id, {
                bio: 'No bio set.',
                badges: [],
                customTitle: '',
                xp: 0,
                level: 0,
                joinedAt: Date.now(),
                lastUpdated: Date.now()
            });
        }
        
        const profile = client.profiles.get(message.author.id);
        const option = args[0].toLowerCase();
        
        if (option === 'bio') {
            // Check if bio text was provided
            if (args.length < 2) {
                return message.reply('Please provide a bio text to set.');
            }
            
            const bioText = args.slice(1).join(' ');
            
            // Check bio length
            if (bioText.length > 300) {
                return message.reply('Bio text must be 300 characters or less.');
            }
            
            // Update bio
            profile.bio = bioText;
            profile.lastUpdated = Date.now();
            client.profiles.set(message.author.id, profile);
            
            return message.reply(`Your bio has been updated! Use \`${client.prefix}profile\` to see your profile.`);
        }
        
        if (option === 'title') {
            // Check if title text was provided
            if (args.length < 2) {
                return message.reply('Please provide a title to set.');
            }
            
            const titleText = args.slice(1).join(' ');
            
            // Check title length
            if (titleText.length > 50) {
                return message.reply('Title must be 50 characters or less.');
            }
            
            // Update title
            profile.customTitle = titleText;
            profile.lastUpdated = Date.now();
            client.profiles.set(message.author.id, profile);
            
            return message.reply(`Your profile title has been updated! Use \`${client.prefix}profile\` to see your profile.`);
        }
        
        // If option is not recognized
        return message.reply(`Invalid option. Use \`${client.prefix}profileedit bio\` or \`${client.prefix}profileedit title\`.`);
    }
}; 