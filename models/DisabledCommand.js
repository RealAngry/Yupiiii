const mongoose = require('mongoose');
const { getCommandCategory } = require('../utils/commandUtils');

const DisabledCommandSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true
    },
    channelId: {
        type: String,
        default: null
    },
    command: {
        type: String,
        required: true
    },
    category: {
        type: String,
        default: null
    },
    disabledBy: {
        type: String,
        required: true
    },
    disabledAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure uniqueness of command/category in a guild/channel
DisabledCommandSchema.index({ guildId: 1, channelId: 1, command: 1, category: 1 }, { unique: true });

// Static method to check if a command is disabled
DisabledCommandSchema.statics.isCommandDisabled = async function(guildId, channelId, commandName) {
    // Check if the specific command is disabled in the specific channel
    const channelSpecificCommand = await this.findOne({
        guildId: guildId,
        channelId: channelId,
        command: commandName
    });
    
    if (channelSpecificCommand) return true;
    
    // Check if the specific command is disabled guild-wide
    const guildWideCommand = await this.findOne({
        guildId: guildId,
        channelId: null,
        command: commandName
    });
    
    if (guildWideCommand) return true;
    
    // Get the command's category
    const category = getCommandCategory(commandName);
    
    if (category) {
        // Check if the category is disabled in the specific channel
        const channelSpecificCategory = await this.findOne({
            guildId: guildId,
            channelId: channelId,
            category: category
        });
        
        if (channelSpecificCategory) return true;
        
        // Check if the category is disabled guild-wide
        const guildWideCategory = await this.findOne({
            guildId: guildId,
            channelId: null,
            category: category
        });
        
        if (guildWideCategory) return true;
    }
    
    return false;
};

module.exports = mongoose.model('DisabledCommand', DisabledCommandSchema); 