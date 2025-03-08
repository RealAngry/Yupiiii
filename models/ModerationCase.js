const mongoose = require('mongoose');

const moderationCaseSchema = new mongoose.Schema({
    caseNumber: { 
        type: Number, 
        required: true,
        index: true 
    },
    userId: { 
        type: String, 
        required: true,
        index: true 
    },
    moderatorId: { 
        type: String, 
        required: true 
    },
    action: { 
        type: String, 
        required: true,
        enum: ['ban', 'kick', 'mute', 'timeout', 'untimeout', 'warn', 'nuke', 'other']
    },
    reason: { 
        type: String, 
        default: 'No reason provided' 
    },
    timestamp: { 
        type: Date, 
        default: Date.now,
        index: true 
    },
    guildId: {
        type: String,
        required: true,
        index: true
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
    versionKey: false // Removes __v field
});

// Create compound index for faster queries
moderationCaseSchema.index({ guildId: 1, userId: 1 });
moderationCaseSchema.index({ guildId: 1, caseNumber: 1 }, { unique: true });

// Static method to get the next case number for a guild
moderationCaseSchema.statics.getNextCaseNumber = async function(guildId) {
    const highestCase = await this.findOne({ guildId: guildId })
        .sort({ caseNumber: -1 })
        .limit(1);
    
    return highestCase ? highestCase.caseNumber + 1 : 1;
};

// Create the model
const ModerationCase = mongoose.model('ModerationCase', moderationCaseSchema);

module.exports = ModerationCase; 