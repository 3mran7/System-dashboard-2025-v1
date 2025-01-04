const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unban',
    description: 'Unbans a user from the server',
    usage: '!unban <user ID>',
    permissions: [PermissionsBitField.Flags.BanMembers],
    run: async (Client, Message, Args) => {
        if (!Args[0]) {
            return Message.reply('Please provide the ID of the user to unban.');
        }

        const userId = Args[0];

        try {
            const banList = await Message.guild.bans.fetch();
            const bannedUser = banList.find(user => user.user.id === userId);

            if (!bannedUser) {
                return Message.reply('This user is not banned from this server.');
            }

            await Message.guild.members.unban(userId);
            Message.channel.send(`Successfully unbanned user with ID: ${userId}`);
        } catch (error) {
            console.error('Error unbanning user:', error);
            Message.reply('An error occurred while trying to unban the user.');
        }
    }
};
