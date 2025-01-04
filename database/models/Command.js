const mongoose = require('mongoose');

const CommandSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    serverId: {
        type: String,
        required: true
    },
    command: {
        type: String,
        required: true
    },
    enabled: {
        type: Boolean,
        default: true
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

const Command = mongoose.model('Command', CommandSchema);

module.exports = Command;
