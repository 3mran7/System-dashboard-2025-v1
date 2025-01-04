const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'timeout',
    description: 'Timeout a user for a specified duration',
    usage: '!timeout <user> <duration> [reason]',
    permissions: [PermissionsBitField.Flags.ModerateMembers],
    run: async (Client, Message, Args) => {
        if (!Args[0] || !Args[1]) {
            return Message.reply('Please provide a user and duration for the timeout.');
        }

        const member = Message.mentions.members.first() || Message.guild.members.cache.get(Args[0]);
        if (!member) {
            return Message.reply('Unable to find the specified user.');
        }

        if (member.id === Message.author.id) {
            return Message.reply('You cannot timeout yourself.');
        }

        if (member.roles.highest.position >= Message.member.roles.highest.position) {
            return Message.reply('You cannot timeout this user due to role hierarchy.');
        }

        const duration = ms(Args[1]);
        if (!duration || isNaN(duration)) {
            return Message.reply('Please provide a valid duration (e.g., 1h, 30m, 1d).');
        }

        const reason = Args.slice(2).join(' ') || 'No reason provided';

        try {
            await member.timeout(duration, reason);
            Message.channel.send(`Successfully timed out ${member.user.tag} for ${ms(duration, { long: true })}. Reason: ${reason}`);
        } catch (error) {
            console.error('Error timing out member:', error);
            Message.reply('An error occurred while trying to timeout the member.');
        }
    }
};
