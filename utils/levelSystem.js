const BASE_XP = 100;
const GROWTH_FACTOR = 1.5;
const User = require('../database/models/User');
function getXpForNextLevel(level) {
    return Math.floor(BASE_XP * Math.pow(level, GROWTH_FACTOR));
}

function getLevel(xp) {
    let level = 0;
    let xpForNextLevel = getXpForNextLevel(level + 1);

    while (xp >= xpForNextLevel) {
        level++;
        xpForNextLevel = getXpForNextLevel(level + 1);
    }

    return level;
}

function getXpProgress(xp) {
    const currentLevel = getLevel(xp);
    const xpForCurrentLevel = getXpForNextLevel(currentLevel);
    const xpForNextLevel = getXpForNextLevel(currentLevel + 1);
    const xpProgress = xp - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;

    return {
        currentXp: xpProgress,
        neededXp: xpNeeded,
        percentage: Math.floor((xpProgress / xpNeeded) * 100)
    };
}

async function saveXp(userId, xp) {
    try {
        let user = await User.findOne({ userId: userId });
        if (!user) {
            user = new User({ userId: userId });
        }
        user.xp = xp;
        await user.save();
        return true;
    } catch (error) {
        console.error('Error saving XP:', error);
        return false;
    }
}

async function getXp(userId) {
    try {
        const user = await User.findOne({ userId: userId });
        return user ? user.xp : 0;
    } catch (error) {
        console.error('Error getting XP:', error);
        return 0;
    }
}

module.exports = {
    getXpForNextLevel,
    getLevel,
    getXpProgress,
    saveXp,
    getXp
};
