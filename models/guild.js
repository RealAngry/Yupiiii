const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    prefix: {
        type: String,
        default: '-'
    },
    welcomeChannel: {
        type: String,
        default: null
    },
    welcomeMessage: {
        type: String,
        default: 'Welcome {user} to {server}!'
    },
    logChannel: {
        type: String,
        default: null
    },
    muteRole: {
        type: String,
        default: null
    },
    automod: {
        enabled: {
            type: Boolean,
            default: false
        },
        antiSpam: {
            enabled: {
                type: Boolean,
                default: false
            },
            threshold: {
                type: Number,
                default: 5
            },
            interval: {
                type: Number,
                default: 5000
            },
            action: {
                type: String,
                default: 'warn'
            }
        },
        antiLink: {
            enabled: {
                type: Boolean,
                default: false
            },
            whitelist: {
                type: [String],
                default: []
            },
            action: {
                type: String,
                default: 'warn'
            }
        }
    },
    botRole: {
        type: String,
        default: null
    },
    humanRole: {
        type: String,
        default: null
    },
    reactionRoles: {
        type: Array,
        default: []
    },
    starboard: {
        enabled: {
            type: Boolean,
            default: false
        },
        channel: {
            type: String,
            default: null
        },
        threshold: {
            type: Number,
            default: 3
        },
        emoji: {
            type: String,
            default: '⭐'
        }
    }
});

module.exports = mongoose.model('Guild', guildSchema); 