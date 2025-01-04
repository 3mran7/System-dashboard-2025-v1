const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'avatar',
    description: 'Displays the avatar of a user',
    usage: '!avatar [user]',
    run: async (Client, Message, Args) => {
        const user = Message.mentions.users.first() || Client.users.cache.get(Args[0]) || Message.author;

        const embed = new EmbedBuilder()
            .setTitle(`${user.username}'s Avatar`)
            .setImage(user.displayAvatarURL({ dynamic: true, size: 4096 }))
            .setColor('#0099ff')
            .setTimestamp();

        Message.channel.send({ embeds: [embed] });
    }
};
