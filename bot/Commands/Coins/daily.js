const { EmbedBuilder } = require('discord.js');
const Balance = require('../../../database/models/balance');

module.exports = {
    name: 'daily',
    description: 'Claim your daily coins reward',
    usage: '!daily',
    run: async (Client, Message, Args) => {
        const userId = Message.author.id;
        let userBalance = await Balance.findOne({ userId });

        if (!userBalance) {
            userBalance = new Balance({ userId });
        }

        const now = new Date();
        const lastRewardDate = userBalance.lastDaily || new Date(0);
        const timeSinceLastReward = now - lastRewardDate;
        const oneDayInMilliseconds = 24 * 60 * 60 * 1000;

        if (timeSinceLastReward < oneDayInMilliseconds) {
            let timeUntilNextReward = oneDayInMilliseconds - timeSinceLastReward;
            const hours = Math.floor(timeUntilNextReward / (60 * 60 * 1000));
            const minutes = Math.floor((timeUntilNextReward % (60 * 60 * 1000)) / (60 * 1000));

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Daily Reward')
                .setDescription(`You've already claimed your daily reward. Please wait ${hours}h ${minutes}m before claiming again.`);

            return Message.reply({ embeds: [embed] });
        }

        const rewardAmount = 100; // Amount of daily coins
        userBalance.wallet += rewardAmount;
        userBalance.lastDaily = now;

        await userBalance.save();

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Daily Reward')
            .setDescription(`You've claimed your daily reward of ${rewardAmount} coins! Your new balance is ${userBalance.wallet} coins.`);

        Message.reply({ embeds: [embed] });
    }
};
