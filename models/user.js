const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    username: { 
        type: String 
    },
    customStatus: { 
        type: String 
    },
    statusUpdatedAt: { 
        type: Date, 
        default: Date.now 
    },
    afk: {
        status: { type: Boolean, default: false },
        reason: { type: String },
        since: { type: Date }
    },
    economy: {
        balance: { type: Number, default: 0 },
        bank: { type: Number, default: 0 },
        lastDaily: { type: Date }
    },
    profile: {
        bio: { type: String },
        color: { type: String, default: '#00FFFF' },
        badges: [String],
        background: { type: String }
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('User', UserSchema); 