const { EmbedBuilder, PermissionFlagsBits, Collection } = require('discord.js');
const ModerationCase = require('../../models/ModerationCase');

module.exports = {
    name: 'cases',
    description: 'Manage moderation cases',
    usage: 'cases [create/view/list] [caseID] [user] [reason]',
    category: 'moderation',
    aliases: ['case'],
    permissions: PermissionFlagsBits.ModerateMembers,
    cooldown: 3,
    async execute(client, message, args) {
        // Check if user has permission
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('You do not have permission to manage cases.');
        }
        
        const subCommand = args[0]?.toLowerCase();
        
        if (!subCommand || !['create', 'view', 'list'].includes(subCommand)) {
            const embed = new EmbedBuilder()
                .setTitle('Cases Command Help')
                .setDescription('Manage moderation cases')
                .addFields(
                    { name: 'Create a case', value: `\`${client.prefix}cases create @user [reason]\`` },
                    { name: 'View a case', value: `\`${client.prefix}cases view [caseID]\`` },
                    { name: 'List cases', value: `\`${client.prefix}cases list [all/user] [@user]\`` }
                )
                .setColor('#0099ff')
                .setFooter({ text: 'Moderation Cases System' });
            
            return message.reply({ embeds: [embed] });
        }
        
        // Handle subcommands
        switch (subCommand) {
            case 'create': {
                // Check for required arguments
                if (!args[1]) {
                    return message.reply('Please mention a user to create a case for.');
                }
                
                // Get user from mention
                const user = message.mentions.users.first();
                if (!user) {
                    return message.reply('Please mention a valid user.');
                }
                
                // Get reason
                const reason = args.slice(2).join(' ') || 'No reason provided';
                
                try {
                    // Get the next case number
                    const highestCase = await ModerationCase.findOne({})
                        .sort({ caseNumber: -1 })
                        .limit(1);
                    
                    const caseNumber = highestCase ? highestCase.caseNumber + 1 : 1;
                    
                    // Create new case in database
                    const newCase = new ModerationCase({
                        caseNumber: caseNumber,
                        userId: user.id,
                        moderatorId: message.author.id,
                        action: 'case_created',
                        reason: reason,
                        timestamp: new Date()
                    });
                    
                    await newCase.save();
                    
                    // Create embed
                    const embed = new EmbedBuilder()
                        .setTitle(`Case #${caseNumber} Created`)
                        .setDescription(`A new case has been created for ${user.tag}`)
                        .addFields(
                            { name: 'User', value: `<@${user.id}> (${user.tag})`, inline: true },
                            { name: 'Created By', value: `<@${message.author.id}>`, inline: true },
                            { name: 'Reason', value: reason }
                        )
                        .setColor('#FF9900')
                        .setFooter({ text: `Case ID: ${caseNumber}` })
                        .setTimestamp();
                    
                    return message.reply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error creating case:', error);
                    return message.reply('There was an error creating the case. Please try again later.');
                }
            }
            
            case 'view': {
                // Check for required arguments
                if (!args[1] || isNaN(args[1])) {
                    return message.reply('Please provide a valid case ID.');
                }
                
                const caseNumber = parseInt(args[1]);
                
                try {
                    // Find case in database
                    const caseData = await ModerationCase.findOne({ caseNumber: caseNumber });
                    
                    if (!caseData) {
                        return message.reply(`Case #${caseNumber} not found.`);
                    }
                    
                    // Get user and moderator info
                    const user = await client.users.fetch(caseData.userId).catch(() => null);
                    const moderator = await client.users.fetch(caseData.moderatorId).catch(() => null);
                    
                    // Create embed
                    const embed = new EmbedBuilder()
                        .setTitle(`Case #${caseNumber}`)
                        .addFields(
                            { name: 'User', value: user ? `<@${user.id}> (${user.tag})` : `Unknown User (${caseData.userId})`, inline: true },
                            { name: 'Moderator', value: moderator ? `<@${moderator.id}>` : `Unknown Moderator (${caseData.moderatorId})`, inline: true },
                            { name: 'Action', value: caseData.action, inline: true },
                            { name: 'Created', value: `<t:${Math.floor(caseData.timestamp.getTime() / 1000)}:R>`, inline: true },
                            { name: 'Reason', value: caseData.reason || 'No reason provided' }
                        )
                        .setColor('#0099ff')
                        .setFooter({ text: `Case ID: ${caseNumber}` })
                        .setTimestamp();
                    
                    return message.reply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error viewing case:', error);
                    return message.reply('There was an error viewing the case. Please try again later.');
                }
            }
            
            case 'list': {
                try {
                    // Get filter
                    const filter = args[1]?.toLowerCase() || 'all';
                    if (!['all', 'user'].includes(filter)) {
                        return message.reply('Invalid filter. Use `all` or `user`.');
                    }
                    
                    let query = {};
                    
                    // Filter by user if specified
                    if (filter === 'user') {
                        const user = message.mentions.users.first();
                        if (!user) {
                            return message.reply('Please mention a valid user to filter cases.');
                        }
                        query.userId = user.id;
                    }
                    
                    // Find cases in database
                    const cases = await ModerationCase.find(query).sort({ caseNumber: -1 }).limit(10);
                    
                    if (cases.length === 0) {
                        return message.reply('No cases found matching your criteria.');
                    }
                    
                    // Create embed
                    const embed = new EmbedBuilder()
                        .setTitle('Moderation Cases')
                        .setDescription(`Showing the ${cases.length} most recent cases${filter === 'user' ? ' for the specified user' : ''}`)
                        .setColor('#0099ff')
                        .setFooter({ text: 'Use "cases view [ID]" to see details' })
                        .setTimestamp();
                    
                    // Add cases to embed
                    const casesText = await Promise.all(cases.map(async (caseData) => {
                        const user = await client.users.fetch(caseData.userId).catch(() => null);
                        return `**Case #${caseData.caseNumber}** - ${user ? user.tag : `Unknown (${caseData.userId})`} - ${caseData.action} - <t:${Math.floor(caseData.timestamp.getTime() / 1000)}:R>`;
                    }));
                    
                    // Split into chunks if needed
                    const chunks = splitIntoChunks(casesText.join('\n'), 1000);
                    chunks.forEach((chunk, index) => {
                        embed.addFields({ 
                            name: chunks.length > 1 ? `Cases (${index + 1}/${chunks.length})` : 'Cases', 
                            value: chunk 
                        });
                    });
                    
                    return message.reply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error listing cases:', error);
                    return message.reply('There was an error listing the cases. Please try again later.');
                }
            }
            
            default:
                return message.reply('Invalid subcommand. Use `create`, `view`, or `list`.');
        }
    }
};

// Helper function to split text into chunks
function splitIntoChunks(text, maxLength) {
    const chunks = [];
    const lines = text.split('\n');
    let currentChunk = '';
    
    for (const line of lines) {
        if (currentChunk.length + line.length + 1 > maxLength) {
            chunks.push(currentChunk);
            currentChunk = line;
        } else {
            currentChunk += (currentChunk ? '\n' : '') + line;
        }
    }
    
    if (currentChunk) {
        chunks.push(currentChunk);
    }
    
    return chunks;
} 