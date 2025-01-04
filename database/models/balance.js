const mongoose = require('mongoose');

const balanceSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    wallet: {
        type: Number,
        default: 0
    },
    lastDaily: {
        type: Date,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Balance', balanceSchema);
