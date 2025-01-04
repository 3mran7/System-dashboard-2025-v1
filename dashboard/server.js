const Shortcut = require('../database/models/Shortcut.js');
const Command = require('../database/models/Command.js');
const UserSettings = require('../database/models/UserSettings.js');
const DiscordStrategy = require('passport-discord').Strategy;
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const config = require('./config/config.js');
const crypto = require('crypto');
const ejs = require('ejs');
const multer = require('multer');

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) // Appending extension
  }
});

// Create the multer instance
const upload = multer({ storage: storage });

module.exports = (client) => {
const app = express();
const PORT = process.env.PORT || 9503;

const apiRoutes = require('../api/src/routes/api');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: crypto.randomBytes(64).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.locals.include = ejs.include;
passport.use(new DiscordStrategy({
    clientID: config.clientId,
    clientSecret: config.clientSecret,
    callbackURL: '', // هنا تحط ادريس الهوست
    scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
    done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});
app.use('/api', apiRoutes);
app.get('/', (req, res) => {
    res.render('layouts/index', { user: req.user });
});

app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback', passport.authenticate('discord', {
    failureRedirect: '/'
}), (req, res) => {
    res.redirect('/dashboard');
});


app.get('/dashboard', ensureAuthenticated, async (req, res) => {
    try {
        const { createCanvas } = require('canvas');
        const adminGuilds = req.user.guilds.filter(guild => (guild.permissions & 0x8) === 0x8);
        const balanceData = await fetchBalanceData(req.user.id);
        const xpData = await fetchXPData(req.user.id);
        const levelData = await fetchLevelData(req.user.id);

        res.render('pages/dashboard', {
            user: req.user,
            adminGuilds,
            createCanvas,
            balance: balanceData,
            xp: xpData,
            level: levelData
        });
    } catch (error) {
        console.error('Error fetching admin guilds, balance, XP, level, or creating canvases:', error);
        res.status(500).send('An error occurred while loading the dashboard');
    }
});

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Error during logout:', err);
            return res.status(500).send('An error occurred during logout');
        }
        res.redirect('/');
    });
});

app.get('/dashboard/:serverId', ensureAuthenticated, async (req, res) => {
    const serverId = req.params.serverId;
    const serverID = await client.guilds.cache.get(serverId);
    if (!serverID) {
        return res.redirect(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=8&guild=${serverId}`);
    }
    const commands = await fetchCommands();
    const server = {
        id: serverID.id,
        name: serverID.name,
        owner: serverID.ownerId,
        memberCount: serverID.memberCount
    };
        const commandsWithDetails = await Promise.all(commands.map(async cmd => {
        const shortcuts = await Shortcut.find({ serverId, command: cmd.name }).lean();
        let commandStatus = await Command.findOne({ serverId, command: cmd.name }).lean();
            if (!commandStatus) {
            commandStatus = new Command({
                userId: req.user.id,
                serverId,
                command: cmd.name,
                enabled: true,
                updatedAt: new Date()
            });
            await commandStatus.save();
        }
        return {
            ...cmd,
            shortcuts: shortcuts.map(shortcut => shortcut.shortcut),
            enabled: commandStatus.enabled
        };
    }));
    res.render('pages/server', { server: server, commands: commandsWithDetails, controlCommands: true });
});
app.get('/commands', ensureAuthenticated, async (req, res) => {
    try {
        const commands = await fetchCommands();
        res.render('pages/commands', { user: req.user, commands: commands });
    } catch (error) {
        console.error('Error fetching commands:', error);
        res.status(500).send('An error occurred while fetching commands');
    }
});

app.get('/leaderboards/coins', ensureAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const startRank = (page - 1) * limit;
        const { leaderboard, totalUsers, userRank, userBalance } = await fetchCoinLeaderboard(page, limit, req.user.userId);
        const totalPages = Math.ceil(totalUsers / limit);
        res.render('pages/coinLeaderboard', { user: req.user, leaderboard: leaderboard, currentPage: page, totalPages: totalPages, startRank: startRank, userRank: userRank, userBalance: userBalance, totalUsers: totalUsers, currentUser: req.user.userId, client: client, ejs: ejs });
    } catch (error) {
        console.error('Error fetching coin leaderboard:', error);
        res.status(500).send('An error occurred while fetching the coin leaderboard');
    }
});

app.get('/analytics', ensureAuthenticated, async (req, res) => {
    try {
        const topServers = await client.guilds.cache
            .sort((a, b) => b.memberCount - a.memberCount)
            .first(10)
            .map(guild => ({
                id: guild.id,
                name: guild.name,
                memberCount: guild.memberCount,
                icon: guild.iconURL({ dynamic: true, size: 64 }) || '/images/default-server-icon.png'
            }));

        res.render('pages/analytics', { 
            user: req.user, 
            topServers: topServers
        });
    } catch (error) {
        console.error('Error fetching top servers:', error);
        res.status(500).send('An error occurred while fetching top servers');
    }
});

app.get('/leaderboards/xp', ensureAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const userId = req.user.id;
        const { leaderboard, totalUsers, userRank, userXP } = await fetchXPLeaderboard(page, limit, userId);
        const totalPages = Math.ceil(totalUsers / limit);
        const startRank = (page - 1) * limit;
        res.render('pages/xpLeaderboard', { leaderboard, currentUser: userId, userRank, userXP, totalUsers, currentPage: page, totalPages,startRank, client: client });
    } catch (error) {
        console.error('Error fetching XP leaderboard:', error);
        res.status(500).send('An error occurred while fetching the XP leaderboard');
    }
});
app.get('/daily-reward', ensureAuthenticated, async (req, res) => {
    try {
        const balance = require('../database/models/balance.js')
        const userId = req.user.id;
        const user = await balance.findOne({ userId });

        if (!user) {
            return res.status(404).send('User not found');
        }

        const now = new Date();
        const lastRewardDate = user.lastDaily || new Date(0);
        const timeSinceLastReward = now - lastRewardDate;
        const oneDayInMilliseconds = 24 * 60 * 60 * 1000;

        let canClaimReward = timeSinceLastReward >= oneDayInMilliseconds;
        let timeUntilNextReward = oneDayInMilliseconds - timeSinceLastReward;

        if (timeUntilNextReward < 0) {
            timeUntilNextReward = 0;
        }

        const rewardAmount = 100;

        res.render('pages/dailyReward', {
            user: req.user,
            canClaim: canClaimReward,
            timeUntilNextReward,
            lastRewardDate,
            rewardAmount
        });
    } catch (error) {
        console.error('Error fetching daily reward status:', error);
        res.status(500).send('An error occurred while fetching daily reward status');
    }
});

app.post('/claim-daily-reward', ensureAuthenticated, async (req, res) => {
    try {
        const balance = require('../database/models/balance.js')    
        const userId = req.user.id;
        const user = await balance.findOne({ userId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const now = new Date();
        const lastRewardDate = user.lastDaily || new Date(0);
        const timeSinceLastReward = now - lastRewardDate;
        const oneDayInMilliseconds = 24 * 60 * 60 * 1000;

        if (timeSinceLastReward < oneDayInMilliseconds) {
            return res.status(400).json({ message: 'You can only claim the daily reward once per day' });
        }

        const rewardAmount = 100; // You can adjust this value
        user.wallet += rewardAmount;
        user.lastDaily = now;
        await user.save();

        res.json({ message: 'Daily reward claimed successfully', rewardAmount });
    } catch (error) {
        console.error('Error claiming daily reward:', error);
        res.status(500).json({ message: 'An error occurred while claiming the daily reward' });
    }
});

app.get('/shortcuts/:serverId/:commandName', ensureAuthenticated, async (req, res) => {
    const { serverId, commandName } = req.params;

    try {
        const shortcuts = await Shortcut.find({ serverId, command: commandName }).lean();
        res.status(200).json({ shortcuts: shortcuts.map(shortcut => shortcut.shortcut) });
    } catch (error) {
        console.error('Error fetching shortcuts from the database:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
app.get('/settings', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const userSettings = await UserSettings.findOne({ userId }) || new UserSettings({ userId });
        console.log(userSettings);
        res.render('pages/settings', {
            user: req.user,
            settings: userSettings
        });
    } catch (error) {
        console.error('Error fetching user settings:', error);
        res.status(500).json({ success: false, message: 'An error occurred while fetching user settings' });
    }
});

app.get('/api', async (req, res) => {
    res.render('pages/api');
});
app.post('/settings', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const { profileIcon, profileTitle, allowProfileChanges, allowNameChanges, nameInBot, profileImage } = req.body;

        let userSettings = await UserSettings.findOne({ userId });
        if (!userSettings) {
            userSettings = new UserSettings({ userId });
        }
        console.log(req.body);
        userSettings.profileIcon = profileIcon;
        userSettings.profileTitle = profileTitle;
        userSettings.canChangeProfileInBot = allowProfileChanges === 'on';
        userSettings.canChangeNameInBot = allowNameChanges === 'on';
        userSettings.nameInBot = nameInBot;
        userSettings.profileImage = profileImage;
        await userSettings.save();

        res.json({ success: true, message: 'Settings saved successfully!' });
    } catch (error) {
        console.error('Error updating user settings:', error);
        res.status(500).json({ success: false, message: 'An error occurred while updating user settings' });
    }
});

app.post('/saveShortcut/:serverId', ensureAuthenticated, async (req, res) => {
    const { shortcut, command } = req.body;
    const userId = req.user.id;
    const serverId = req.params.serverId;
    if (!shortcut || shortcut.trim() === '' || !serverId || !command) {
        return res.status(400).json({ message: 'Invalid shortcut, server ID, or command' });
    }
    try {
        const newShortcut = new Shortcut({ userId, serverId, command, shortcut, createdAt: new Date() });
        await newShortcut.save();
        res.status(200).json({ message: 'Shortcut saved successfully' });
    } catch (error) {
        console.error('Error saving shortcut to the database:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/removeShortcut/:serverId', ensureAuthenticated, async (req, res) => {
    const { shortcut } = req.body;
    const userId = req.user.id;
    const serverId = req.params.serverId;

    if (!shortcut || shortcut.trim() === '' || !serverId) {
        return res.status(400).json({ message: 'Invalid shortcut or server ID' });
    }

    try {
        const result = await Shortcut.deleteOne({ userId, serverId, shortcut });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Shortcut not found' });
        }

        res.status(200).json({ message: 'Shortcut removed successfully' });
    } catch (error) {
        console.error('Error removing shortcut from the database:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/toggleCommand/:serverId/:commandName', ensureAuthenticated, async (req, res) => {
    const { enabled } = req.body;
    console.log(enabled);
    const userId = req.user.id;
    const serverId = req.params.serverId;
    const commandName = req.params.commandName;
    if (!commandName || typeof enabled !== 'boolean' || !serverId) {
        return res.status(400).json({ message: 'Invalid command, enabled status, or server ID' });
    }
    try {
        let result = await Command.updateOne(
            { userId, serverId, command: commandName },
            { $set: { enabled, updatedAt: new Date() } }
        );

        if (result.nModified === 0) {
            await Command.updateMany(
                { userId, serverId },
                { $set: { enabled: true, updatedAt: new Date() } }
            );
            result = { nModified: 1 };
        }

        if (result.nModified === 0) {
            return res.status(404).json({ message: 'Command not found or no changes made' });
        }

        res.status(200).json({ message: 'Command status updated successfully' });
    } catch (error) {
        console.error('Error updating command status in the database:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

async function fetchBalanceData(userId) {
    const balance = require('../database/models/balance.js')
    const balanceData = await balance.findOne({ userId: userId });
    return balanceData;
}

async function fetchXPData(userId) {
    const xp = require('../database/models/User.js')
    const xpData = await xp.findOne({ userId: userId });
    return xpData;
}

async function fetchLevelData(userId) {
    const User = require('../database/models/User.js');
    const { getLevel, getXpForNextLevel } = require('../utils/levelSystem');
    
    const userData = await User.findOne({ userId: userId });
    if (!userData) {
        return null;
    }
    
    const level = getLevel(userData.xp);
    const xpForNextLevel = getXpForNextLevel(level + 1);
    const xpForCurrentLevel = getXpForNextLevel(level);
    const xpProgress = userData.xp - xpForCurrentLevel;
    
    return {
        level: level,
        xpProgress: xpProgress,
        xpNeeded: xpForNextLevel - xpForCurrentLevel,
        totalXp: userData.xp
    };
}

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

async function fetchCommands() {
    const fs = require('fs').promises;
    const path = require('path');
    const commandsDir = path.join(__dirname, '../bot/Commands');
    try {
        const categories = await fs.readdir(commandsDir);
        let commands = [];
        for (const category of categories) {
            const categoryPath = path.join(commandsDir, category);
            const commandFiles = await fs.readdir(categoryPath);
            for (const file of commandFiles) {
                if (file.endsWith('.js')) {
                    const command = require(path.join(categoryPath, file));
                    commands.push({ name: command.name, description: command.description, usage: command.usage || '', category: category });
                }
            }
        }
        return commands;
    } catch (error) {
        console.error('Error fetching commands:', error);
        return [];
    }
}

async function fetchXPLeaderboard(page, limit, userId) {
    try {
        const User = require('../database/models/User.js');
        
        const skip = (page - 1) * limit;
        
        const leaderboard = await User.find({})
            .sort({ xp: -1 })
            .skip(skip)
            .limit(limit)
            .select('userId username xp -_id')
            .lean();

        const leaderboardWithUsernames = await Promise.all(leaderboard.map(async entry => {
            let username = entry.username;
            if (!username) {
                const user = await client.users.fetch(entry.userId).catch(() => null);
                username = user ? user.username : 'Unknown User';
            }
            return {
                ...entry,
                username
            };
        }));

        const totalUsers = await User.countDocuments();
        const userXP = await User.findOne({ userId: userId }).select('xp -_id').lean();
        const userRank = userXP ? await User.countDocuments({ xp: { $gt: userXP.xp } }) + 1 : null;
        
        console.log(leaderboardWithUsernames);
        return { 
            leaderboard: leaderboardWithUsernames, 
            totalUsers, 
            userRank,
            userXP: userXP ? userXP.xp : 0
        };
    } catch (error) {
        console.error('Error fetching XP leaderboard from database:', error);
        return { leaderboard: [], totalUsers: 0, userRank: null, userXP: 0 };
    }
}
async function fetchCoinLeaderboard(page, limit, userId) {
    try {
        const Balance = require('../database/models/balance.js');
        const User = require('../database/models/User.js');
        
        const skip = (page - 1) * limit;
        
        const leaderboard = await Balance.find({})
            .sort({ wallet: -1 })
            .skip(skip)
            .limit(limit)
            .select('userId wallet -_id')
            .lean();

        const userIds = leaderboard.map(entry => entry.userId);
        const users = await User.find({ userId: { $in: userIds } }).select('userId username -_id').lean();
        const leaderboardWithUsernames = await Promise.all(leaderboard.map(async entry => {
            let username = entry.username;
            if (!username) {
                const user = await client.users.fetch(entry.userId).catch(() => null);
                username = user ? user.username : 'Unknown User';
            }
            return {
                ...entry,
                username
            };
        }));


        const totalUsers = await Balance.countDocuments();
        const userBalance = await Balance.findOne({ userId: userId }).select('wallet -_id').lean();
        const userRank = userBalance ? await Balance.countDocuments({ wallet: { $gt: userBalance.wallet } }) + 1 : null;

        return { 
            leaderboard: leaderboardWithUsernames, 
            totalUsers, 
            userRank,
            userBalance: userBalance ? userBalance.wallet : 0
        };
    } catch (error) {
        console.error('Error fetching coin leaderboard from database:', error);
        return { leaderboard: [], totalUsers: 0, userRank: null, userBalance: 0 };
    }
}
app.listen(PORT, () => {
    console.log(`Dashboard server is running on port ${PORT}`);
});
}