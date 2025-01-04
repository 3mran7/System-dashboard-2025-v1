const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'untimeout',
    description: 'Removes timeout from a user',
    usage: '!untimeout <user> [reason]',
    permissions: [PermissionsBitField.Flags.ModerateMembers],
    run: async (Client, Message, Args) => {
        if (!Args[0]) {
            return Message.reply('Please mention a user or provide their ID to remove timeout.');
        }

        const member = Message.mentions.members.first() || Message.guild.members.cache.get(Args[0]);
        if (!member) {
            return Message.reply('Unable to find the specified user.');
        }

        if (member.id === Message.author.id) {
            return Message.reply('You cannot remove timeout from yourself.');
        }

        if (member.roles.highest.position >= Message.member.roles.highest.position) {
            return Message.reply('You cannot remove timeout from this user due to role hierarchy.');
        }

        const reason = Args.slice(1).join(' ') || 'No reason provided';

        try {
            await member.timeout(null, reason);
            Message.channel.send(`Successfully removed timeout from ${member.user.tag}. Reason: ${reason}`);
        } catch (error) {
            console.error('Error removing timeout from member:', error);
            Message.reply('An error occurred while trying to remove timeout from the member.');
        }
    }
};
