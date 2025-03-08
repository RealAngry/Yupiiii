const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
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
    name: 'tag',
    description: 'Create, edit, delete, or show custom tags for quick information access',
    usage: 'tag <action> <name> [content]',
    category: 'utility',
    aliases: ['tags', 't'],
    cooldown: 3,
    examples: [
        'tag create rules Our server rules: 1. Be respectful 2. No spamming',
        'tag edit rules Our updated server rules: 1. Be respectful 2. No spamming 3. Have fun',
        'tag delete rules',
        'tag rules',
        'tag list',
        'tag info rules'
    ],
    async execute(client, message, args) {
        if (!args.length) {
            return message.reply('Please specify a tag name or action. Use `tag list` to see all available tags.');
        }
        
        const action = args[0].toLowerCase();
        
        // List all tags
        if (action === 'list') {
            return listTags(message);
        }
        
        // If not a special action, treat the first argument as the tag name
        if (!['create', 'add', 'edit', 'update', 'delete', 'remove', 'info'].includes(action)) {
            return showTag(message, action);
        }
        
        // All other actions require at least a tag name
        if (args.length < 2) {
            return message.reply(`Please provide a tag name for the ${action} action.`);
        }
        
        const tagName = args[1].toLowerCase();
        
        // Tag info
        if (action === 'info') {
            return tagInfo(message, tagName);
        }
        
        // Create/edit/delete actions require proper permissions
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply('You need the Manage Messages permission to create, edit, or delete tags.');
        }
        
        // Create or edit tag
        if (['create', 'add', 'edit', 'update'].includes(action)) {
            if (args.length < 3) {
                return message.reply(`Please provide content for the tag. Example: \`tag ${action} ${tagName} This is the tag content\``);
            }
            
            const tagContent = args.slice(2).join(' ');
            
            if (action === 'create' || action === 'add') {
                return createTag(message, tagName, tagContent);
            } else {
                return editTag(message, tagName, tagContent);
            }
        }
        
        // Delete tag
        if (action === 'delete' || action === 'remove') {
            return deleteTag(message, tagName);
        }
    }
};

// Function to list all tags in the server
async function listTags(message) {
    try {
        const tags = await Tag.find({ guildId: message.guild.id }).sort({ name: 1 });
        
        if (!tags.length) {
            return message.reply('There are no tags in this server. Create one with `tag create <name> <content>`.');
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`Tags in ${message.guild.name}`)
            .setDescription(`Use \`tag <name>\` to view a tag's content.`)
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
        
        return message.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error listing tags:', error);
        return message.reply('There was an error listing the tags. Please try again later.');
    }
}

// Function to show a tag's content
async function showTag(message, tagName) {
    try {
        const tag = await Tag.findOne({ 
            guildId: message.guild.id,
            name: tagName.toLowerCase()
        });
        
        if (!tag) {
            return message.reply(`Tag \`${tagName}\` not found. Use \`tag list\` to see all available tags.`);
        }
        
        // Increment the usage count
        tag.uses += 1;
        await tag.save();
        
        return message.reply(tag.content);
    } catch (error) {
        console.error('Error showing tag:', error);
        return message.reply('There was an error retrieving the tag. Please try again later.');
    }
}

// Function to show tag info
async function tagInfo(message, tagName) {
    try {
        const tag = await Tag.findOne({ 
            guildId: message.guild.id,
            name: tagName.toLowerCase()
        });
        
        if (!tag) {
            return message.reply(`Tag \`${tagName}\` not found. Use \`tag list\` to see all available tags.`);
        }
        
        const createdByUser = await message.client.users.fetch(tag.createdBy).catch(() => null);
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
        
        return message.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error showing tag info:', error);
        return message.reply('There was an error retrieving the tag info. Please try again later.');
    }
}

// Function to create a new tag
async function createTag(message, tagName, tagContent) {
    try {
        // Check if tag already exists
        const existingTag = await Tag.findOne({ 
            guildId: message.guild.id,
            name: tagName.toLowerCase()
        });
        
        if (existingTag) {
            return message.reply(`Tag \`${tagName}\` already exists. Use \`tag edit ${tagName} <new content>\` to update it.`);
        }
        
        // Create new tag
        const newTag = new Tag({
            guildId: message.guild.id,
            name: tagName.toLowerCase(),
            content: tagContent,
            createdBy: message.author.id
        });
        
        await newTag.save();
        
        const embed = new EmbedBuilder()
            .setTitle('Tag Created')
            .setDescription(`Successfully created tag \`${tagName}\`.`)
            .addFields({ name: 'Content', value: tagContent.length > 1024 ? tagContent.substring(0, 1021) + '...' : tagContent })
            .setColor('#00FFFF')
            .setFooter({ text: `Created by ${message.author.tag}` })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error creating tag:', error);
        return message.reply('There was an error creating the tag. Please try again later.');
    }
}

// Function to edit an existing tag
async function editTag(message, tagName, tagContent) {
    try {
        // Find and update the tag
        const tag = await Tag.findOneAndUpdate(
            { 
                guildId: message.guild.id,
                name: tagName.toLowerCase()
            },
            {
                content: tagContent,
                updatedAt: new Date()
            },
            { new: true }
        );
        
        if (!tag) {
            return message.reply(`Tag \`${tagName}\` not found. Use \`tag create ${tagName} <content>\` to create it.`);
        }
        
        const embed = new EmbedBuilder()
            .setTitle('Tag Updated')
            .setDescription(`Successfully updated tag \`${tagName}\`.`)
            .addFields({ name: 'New Content', value: tagContent.length > 1024 ? tagContent.substring(0, 1021) + '...' : tagContent })
            .setColor('#00FFFF')
            .setFooter({ text: `Updated by ${message.author.tag}` })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error editing tag:', error);
        return message.reply('There was an error updating the tag. Please try again later.');
    }
}

// Function to delete a tag
async function deleteTag(message, tagName) {
    try {
        // Find and delete the tag
        const tag = await Tag.findOneAndDelete({ 
            guildId: message.guild.id,
            name: tagName.toLowerCase()
        });
        
        if (!tag) {
            return message.reply(`Tag \`${tagName}\` not found.`);
        }
        
        const embed = new EmbedBuilder()
            .setTitle('Tag Deleted')
            .setDescription(`Successfully deleted tag \`${tagName}\`.`)
            .setColor('#00FFFF')
            .setFooter({ text: `Deleted by ${message.author.tag}` })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error deleting tag:', error);
        return message.reply('There was an error deleting the tag. Please try again later.');
    }
} 