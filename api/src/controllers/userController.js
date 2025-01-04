const User = require('../../../database/models/User');
const Balance = require('../../../database/models/balance');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log('userId:', userId);
        console.log('Fetching user with ID:', userId);
        const user = await User.findOne({ userId : userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const balance = await Balance.findOne({ userId: userId });
        if (!balance) {
            return res.status(404).json({ message: 'Balance not found' });
        }
        res.json({ user, balance });
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
};