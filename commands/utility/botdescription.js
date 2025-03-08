const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'botdescription',
    description: 'Change the bot\'s description',
    usage: 'botdescription <description>',
    category: 'utility',
    aliases: ['setdescription', 'botdesc', 'setdesc'],
    permissions: [PermissionFlagsBits.Administrator],
    cooldown: 10,
    examples: [
        'botdescription A multipurpose Discord bot with moderation, utility, and fun commands',
        'botdescription Your friendly neighborhood Discord bot'
    ],
    async execute(client, message, args) {
        // Check if user has permission
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('You need Administrator permission to change the bot\'s description.');
        }
        
        // Check if user is bot owner
        const ownerId = process.env.OWNER_ID;
        if (ownerId && message.author.id !== ownerId) {
            return message.reply('Only the bot owner can change the bot\'s description.');
        }
        
        // Check for required arguments
        if (args.length < 1) {
            return message.reply(`Please provide a description. Usage: \`${client.prefix}${this.usage}\``);
        }
        
        // Get the description
        const description = args.join(' ');
        
        try {
            // Store the description in the client for future use
            client.description = description;
            
            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('Bot Description Updated')
                .setDescription('The bot\'s description has been updated.')
                .addFields(
                    { name: 'New Description', value: description }
                )
                .setColor('#00FFFF')
                .setFooter({ text: `Updated by ${message.author.tag}` })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error setting bot description:', error);
            return message.reply('There was an error setting the bot\'s description. Please try again later.');
        }
    }
}; 