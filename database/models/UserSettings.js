const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  profileIcon: {
    type: String,
    default: null
  },
  profileTitle: {
    type: String,
    default: null
  },
  canChangeProfileInBot: {
    type: Boolean,
    default: false
  },
  canChangeNameInBot: {
    type: Boolean,
    default: false
  },
  profileInBot: {
    type: String,
  },
  nameInBot: {
    type: String,
  }
});

const UserSettings = mongoose.model('UserSettings', userSettingsSchema);

module.exports = UserSettings;
