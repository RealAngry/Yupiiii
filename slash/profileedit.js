const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profileedit')
        .setDescription('Edit your profile information')
        .addSubcommand(subcommand =>
            subcommand
                .setName('bio')
                .setDescription('Edit your profile bio')
                .addStringOption(option =>
                    option.setName('text')
                        .setDescription('Your new bio text')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('title')
                .setDescription('Edit your profile title')
                .addStringOption(option =>
                    option.setName('text')
                        .setDescription('Your new profile title')
                        .setRequired(true))),
    
    async execute(interaction, client) {
        // Initialize profiles collection if it doesn't exist
        if (!client.profiles) {
            client.profiles = new Map();
        }
        
        // Get or create user profile
        if (!client.profiles.has(interaction.user.id)) {
            client.profiles.set(interaction.user.id, {
                bio: 'No bio set.',
                badges: [],
                customTitle: '',
                xp: 0,
                level: 0,
                joinedAt: Date.now(),
                lastUpdated: Date.now()
            });
        }
        
        const profile = client.profiles.get(interaction.user.id);
        const subCommand = interaction.options.getSubcommand();
        
        if (subCommand === 'bio') {
            const bioText = interaction.options.getString('text');
            
            // Check bio length
            if (bioText.length > 300) {
                return interaction.reply({ 
                    content: 'Bio text must be 300 characters or less.',
                    ephemeral: true 
                });
            }
            
            // Update bio
            profile.bio = bioText;
            profile.lastUpdated = Date.now();
            client.profiles.set(interaction.user.id, profile);
            
            return interaction.reply({ 
                content: `Your bio has been updated! Use \`/profile\` to see your profile.`,
                ephemeral: true 
            });
        }
        
        if (subCommand === 'title') {
            const titleText = interaction.options.getString('text');
            
            // Check title length
            if (titleText.length > 50) {
                return interaction.reply({ 
                    content: 'Title must be 50 characters or less.',
                    ephemeral: true 
                });
            }
            
            // Update title
            profile.customTitle = titleText;
            profile.lastUpdated = Date.now();
            client.profiles.set(interaction.user.id, profile);
            
            return interaction.reply({ 
                content: `Your profile title has been updated! Use \`/profile\` to see your profile.`,
                ephemeral: true 
            });
        }
    }
}; 