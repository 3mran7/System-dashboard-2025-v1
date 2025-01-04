const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ShortcutSchema = new Schema({
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
    shortcut: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Shortcut = mongoose.model('Shortcut', ShortcutSchema);

module.exports = Shortcut;
