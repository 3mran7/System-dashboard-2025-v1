const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'user',
    description: 'Displays information about a user',
    usage: '!user [user]',
    run: async (Client, Message, Args) => {
        const user = Message.mentions.users.first() || Client.users.cache.get(Args[0]) || Message.author;
        const member = Message.guild.members.cache.get(user.id);

        const embed = new EmbedBuilder()
            .setTitle(`User Information: ${user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setColor('#0099ff')
            .addFields(
                { name: 'User ID', value: user.id, inline: true },
                { name: 'Nickname', value: member.nickname || 'None', inline: true },
                { name: 'Account Created', value: user.createdAt.toUTCString(), inline: false },
                { name: 'Joined Server', value: member.joinedAt.toUTCString(), inline: false },
                { name: 'Roles', value: member.roles.cache.map(role => role.name).join(', ') || 'None', inline: false }
            )
            .setTimestamp();

        Message.channel.send({ embeds: [embed] });
    }
};
