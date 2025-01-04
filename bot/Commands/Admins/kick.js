const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'kick',
    description: 'Kicks a member from the server',
    usage: '!kick <user> [reason]',
    permissions: [PermissionsBitField.Flags.KickMembers],
    run: async (Client, Message, Args) => {
        if (!Args[0]) {
            return Message.reply('Please mention a user to kick.');
        }

        const member = Message.mentions.members.first() || Message.guild.members.cache.get(Args[0]);

        if (!member) {
            return Message.reply('Unable to find the specified user.');
        }

        if (member.id === Message.author.id) {
            return Message.reply('You cannot kick yourself.');
        }

        if (member.roles.highest.position >= Message.member.roles.highest.position) {
            return Message.reply('You cannot kick this user due to role hierarchy.');
        }

        if (!member.kickable) {
            return Message.reply('I cannot kick this user. Do I have the necessary permissions?');
        }

        const reason = Args.slice(1).join(' ') || 'No reason provided';

        try {
            await member.kick(reason);
            Message.channel.send(`Successfully kicked ${member.user.tag} for reason: ${reason}`);
        } catch (error) {
            console.error('Error kicking member:', error);
            Message.reply('An error occurred while trying to kick the member.');
        }
    }
};
