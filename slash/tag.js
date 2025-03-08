const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const mongoose = require('mongoose');

// Create a Tag schema if it doesn't exist
let Tag;
try {
    Tag = mongoose.model('Tag');
} catch (error) {
    const TagSchema = new mongoose.Schema({
        guildId: { type: String, required: true },
        name: { type: String, required: true },
        content: { type: String, required: true },
        createdBy: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        uses: { type: Number, default: 0 }
    });
    
    // Compound index to ensure tag names are unique per guild
    TagSchema.index({ guildId: 1, name: 1 }, { unique: true });
    
    Tag = mongoose.model('Tag', TagSchema);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tag')
        .setDescription('Create, edit, delete, or show custom tags for quick information access')
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('Show a tag\'s content')
                .addStringOption(option => 
                    option.setName('name')
                        .setDescription('The name of the tag to show')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all tags in the server'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Show information about a tag')
                .addStringOption(option => 
                    option.setName('name')
                        .setDescription('The name of the tag to get info about')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new tag')
                .addStringOption(option => 
                    option.setName('name')
                        .setDescription('The name of the tag to create')
                        .setRequired(true))
                .addStringOption(option => 
                    option.setName('content')
                        .setDescription('The content of the tag')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit an existing tag')
                .addStringOption(option => 
                    option.setName('name')
                        .setDescription('The name of the tag to edit')
                        .setRequired(true))
                .addStringOption(option => 
                    option.setName('content')
                        .setDescription('The new content of the tag')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a tag')
                .addStringOption(option => 
                    option.setName('name')
                        .setDescription('The name of the tag to delete')
                        .setRequired(true))),
    
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'show':
                return showTag(interaction);
            case 'list':
                return listTags(interaction);
            case 'info':
                return tagInfo(interaction);
            case 'create':
                // Check permissions
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                    return interaction.reply({ 
                        content: 'You need the Manage Messages permission to create tags.',
                        ephemeral: true 
                    });
                }
                return createTag(interaction);
            case 'edit':
                // Check permissions
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                    return interaction.reply({ 
                        content: 'You need the Manage Messages permission to edit tags.',
                        ephemeral: true 
                    });
                }
                return editTag(interaction);
            case 'delete':
                // Check permissions
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                    return interaction.reply({ 
                        content: 'You need the Manage Messages permission to delete tags.',
                        ephemeral: true 
                    });
                }
                return deleteTag(interaction);
        }
    }
};

// Function to list all tags in the server
async function listTags(interaction) {
    try {
        const tags = await Tag.find({ guildId: interaction.guild.id }).sort({ name: 1 });
        
        if (!tags.length) {
            return interaction.reply('There are no tags in this server. Create one with `/tag create`.');
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`Tags in ${interaction.guild.name}`)
            .setDescription(`Use \`/tag show name:<name>\` to view a tag's content.`)
            .setColor('#00FFFF')
            .setFooter({ text: `${tags.length} tags total` })
            .setTimestamp();
        
        // Group tags by first letter
        const groupedTags = {};
        tags.forEach(tag => {
            const firstLetter = tag.name.charAt(0).toUpperCase();
            if (!groupedTags[firstLetter]) {
                groupedTags[firstLetter] = [];
            }
            groupedTags[firstLetter].push(tag.name);
        });
        
        // Add fields for each letter group
        Object.keys(groupedTags).sort().forEach(letter => {
            embed.addFields({
                name: `${letter}`,
                value: groupedTags[letter].join(', '),
                inline: true
            });
        });
        
        return interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error listing tags:', error);
        return interaction.reply({ 
            content: 'There was an error listing the tags. Please try again later.',
            ephemeral: true 
        });
    }
}

// Function to show a tag's content
async function showTag(interaction) {
    const tagName = interaction.options.getString('name').toLowerCase();
    
    try {
        const tag = await Tag.findOne({ 
            guildId: interaction.guild.id,
            name: tagName
        });
        
        if (!tag) {
            return interaction.reply({ 
                content: `Tag \`${tagName}\` not found. Use \`/tag list\` to see all available tags.`,
                ephemeral: true 
            });
        }
        
        // Increment the usage count
        tag.uses += 1;
        await tag.save();
        
        return interaction.reply(tag.content);
    } catch (error) {
        console.error('Error showing tag:', error);
        return interaction.reply({ 
            content: 'There was an error retrieving the tag. Please try again later.',
            ephemeral: true 
        });
    }
}

// Function to show tag info
async function tagInfo(interaction) {
    const tagName = interaction.options.getString('name').toLowerCase();
    
    try {
        const tag = await Tag.findOne({ 
            guildId: interaction.guild.id,
            name: tagName
        });
        
        if (!tag) {
            return interaction.reply({ 
                content: `Tag \`${tagName}\` not found. Use \`/tag list\` to see all available tags.`,
                ephemeral: true 
            });
        }
        
        const createdByUser = await interaction.client.users.fetch(tag.createdBy).catch(() => null);
        const createdByName = createdByUser ? createdByUser.tag : 'Unknown User';
        
        const embed = new EmbedBuilder()
            .setTitle(`Tag: ${tag.name}`)
            .addFields(
                { name: 'Created by', value: createdByName, inline: true },
                { name: 'Created at', value: `<t:${Math.floor(tag.createdAt.getTime() / 1000)}:R>`, inline: true },
                { name: 'Uses', value: tag.uses.toString(), inline: true },
                { name: 'Last updated', value: `<t:${Math.floor(tag.updatedAt.getTime() / 1000)}:R>`, inline: true }
            )
            .setColor('#00FFFF')
            .setFooter({ text: `Tag ID: ${tag._id}` })
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error showing tag info:', error);
        return interaction.reply({ 
            content: 'There was an error retrieving the tag info. Please try again later.',
            ephemeral: true 
        });
    }
}

// Function to create a new tag
async function createTag(interaction) {
    const tagName = interaction.options.getString('name').toLowerCase();
    const tagContent = interaction.options.getString('content');
    
    try {
        // Check if tag already exists
        const existingTag = await Tag.findOne({ 
            guildId: interaction.guild.id,
            name: tagName
        });
        
        if (existingTag) {
            return interaction.reply({ 
                content: `Tag \`${tagName}\` already exists. Use \`/tag edit\` to update it.`,
                ephemeral: true 
            });
        }
        
        // Create new tag
        const newTag = new Tag({
            guildId: interaction.guild.id,
            name: tagName,
            content: tagContent,
            createdBy: interaction.user.id
        });
        
        await newTag.save();
        
        const embed = new EmbedBuilder()
            .setTitle('Tag Created')
            .setDescription(`Successfully created tag \`${tagName}\`.`)
            .addFields({ name: 'Content', value: tagContent.length > 1024 ? tagContent.substring(0, 1021) + '...' : tagContent })
            .setColor('#00FFFF')
            .setFooter({ text: `Created by ${interaction.user.tag}` })
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error creating tag:', error);
        return interaction.reply({ 
            content: 'There was an error creating the tag. Please try again later.',
            ephemeral: true 
        });
    }
}

// Function to edit an existing tag
async function editTag(interaction) {
    const tagName = interaction.options.getString('name').toLowerCase();
    const tagContent = interaction.options.getString('content');
    
    try {
        // Find and update the tag
        const tag = await Tag.findOneAndUpdate(
            { 
                guildId: interaction.guild.id,
                name: tagName
            },
            {
                content: tagContent,
                updatedAt: new Date()
            },
            { new: true }
        );
        
        if (!tag) {
            return interaction.reply({ 
                content: `Tag \`${tagName}\` not found. Use \`/tag create\` to create it.`,
                ephemeral: true 
            });
        }
        
        const embed = new EmbedBuilder()
            .setTitle('Tag Updated')
            .setDescription(`Successfully updated tag \`${tagName}\`.`)
            .addFields({ name: 'New Content', value: tagContent.length > 1024 ? tagContent.substring(0, 1021) + '...' : tagContent })
            .setColor('#00FFFF')
            .setFooter({ text: `Updated by ${interaction.user.tag}` })
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error editing tag:', error);
        return interaction.reply({ 
            content: 'There was an error updating the tag. Please try again later.',
            ephemeral: true 
        });
    }
}

// Function to delete a tag
async function deleteTag(interaction) {
    const tagName = interaction.options.getString('name').toLowerCase();
    
    try {
        // Find and delete the tag
        const tag = await Tag.findOneAndDelete({ 
            guildId: interaction.guild.id,
            name: tagName
        });
        
        if (!tag) {
            return interaction.reply({ 
                content: `Tag \`${tagName}\` not found.`,
                ephemeral: true 
            });
        }
        
        const embed = new EmbedBuilder()
            .setTitle('Tag Deleted')
            .setDescription(`Successfully deleted tag \`${tagName}\`.`)
            .setColor('#00FFFF')
            .setFooter({ text: `Deleted by ${interaction.user.tag}` })
            .setTimestamp();
        
        return interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error deleting tag:', error);
        return interaction.reply({ 
            content: 'There was an error deleting the tag. Please try again later.',
            ephemeral: true 
        });
    }
} 