const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    wallet: {
        type: Number,
        default: 0
    },
    xp: {
        type: Number,
        default: 0
    },
    lastDaily: {
        type: Date,
        default: null
    },
    skills: [{
        name: String,
        level: {
            type: Number,
            default: 1
        }
    }],
    customTitle: {
        type: String,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
