const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ModerationCase = require('../models/ModerationCase');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cases')
        .setDescription('Manage moderation cases')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new moderation case')
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('The user to create a case for')
                        .setRequired(true))
                .addStringOption(option => 
                    option.setName('reason')
                        .setDescription('The reason for creating the case')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View details of a specific case')
                .addIntegerOption(option => 
                    option.setName('case_id')
                        .setDescription('The ID of the case to view')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List recent moderation cases')
                .addStringOption(option => 
                    option.setName('filter')
                        .setDescription('Filter cases by type')
                        .setRequired(false)
                        .addChoices(
                            { name: 'All Cases', value: 'all' },
                            { name: 'User Cases', value: 'user' }
                        ))
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('Filter cases for a specific user (required if filter is "user")')
                        .setRequired(false))),
    
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'create': {
                const user = interaction.options.getUser('user');
                const reason = interaction.options.getString('reason') || 'No reason provided';
                
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
                        moderatorId: interaction.user.id,
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
                            { name: 'Created By', value: `<@${interaction.user.id}>`, inline: true },
                            { name: 'Reason', value: reason }
                        )
                        .setColor('#FF9900')
                        .setFooter({ text: `Case ID: ${caseNumber}` })
                        .setTimestamp();
                    
                    return interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error creating case:', error);
                    return interaction.reply({ 
                        content: 'There was an error creating the case. Please try again later.',
                        ephemeral: true 
                    });
                }
                break;
            }
            
            case 'view': {
                const caseNumber = interaction.options.getInteger('case_id');
                
                try {
                    // Find case in database
                    const caseData = await ModerationCase.findOne({ caseNumber: caseNumber });
                    
                    if (!caseData) {
                        return interaction.reply({ 
                            content: `Case #${caseNumber} not found.`,
                            ephemeral: true 
                        });
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
                    
                    return interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error viewing case:', error);
                    return interaction.reply({ 
                        content: 'There was an error viewing the case. Please try again later.',
                        ephemeral: true 
                    });
                }
                break;
            }
            
            case 'list': {
                try {
                    // Get filter
                    const filter = interaction.options.getString('filter') || 'all';
                    
                    let query = {};
                    
                    // Filter by user if specified
                    if (filter === 'user') {
                        const user = interaction.options.getUser('user');
                        if (!user) {
                            return interaction.reply({ 
                                content: 'Please specify a user when using the "user" filter.',
                                ephemeral: true 
                            });
                        }
                        query.userId = user.id;
                    }
                    
                    // Find cases in database
                    const cases = await ModerationCase.find(query).sort({ caseNumber: -1 }).limit(10);
                    
                    if (cases.length === 0) {
                        return interaction.reply({ 
                            content: 'No cases found matching your criteria.',
                            ephemeral: true 
                        });
                    }
                    
                    // Create embed
                    const embed = new EmbedBuilder()
                        .setTitle('Moderation Cases')
                        .setDescription(`Showing the ${cases.length} most recent cases${filter === 'user' ? ' for the specified user' : ''}`)
                        .setColor('#0099ff')
                        .setFooter({ text: 'Use "/cases view" to see case details' })
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
                    
                    return interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.error('Error listing cases:', error);
                    return interaction.reply({ 
                        content: 'There was an error listing the cases. Please try again later.',
                        ephemeral: true 
                    });
                }
                break;
            }
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