const { EmbedBuilder } = require('discord.js');
const Balance = require('../../../database/models/balance');

module.exports = {
    name: 'coins',
    description: 'Check your coin balance or the balance of another user',
    usage: '!coins [user]',
    run: async (Client, Message, Args) => {
        const user = Message.mentions.users.first() || Client.users.cache.get(Args[0]) || Message.author;
        
        let userBalance = await Balance.findOne({ userId: user.id });

        if (!userBalance) {
            userBalance = new Balance({ userId: user.id, balance: 0 });
            await userBalance.save();
        }

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle(`${user.username}'s Coin Balance`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Balance', value: `${userBalance.balance} coins`, inline: false }
            )
            .setFooter({ text: 'Use !daily to claim your daily coins!' })
            .setTimestamp();

        Message.reply({ embeds: [embed] });
    }
};
