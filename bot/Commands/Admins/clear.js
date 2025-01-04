const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'clear',
    description: 'Clears a specified number of messages from the channel',
    usage: '!clear <number>',
    permissions: [PermissionsBitField.Flags.ManageMessages],
    run: async (Client, Message, Args) => {
        if (!Args[0]) {
            return Message.reply('Please specify the number of messages to clear.');
        }

        const amount = parseInt(Args[0]);

        if (isNaN(amount)) {
            return Message.reply('Please provide a valid number.');
        }

        if (amount <= 0 || amount > 100) {
            return Message.reply('Please provide a number between 1 and 100.');
        }

        try {
            const messages = await Message.channel.messages.fetch({ limit: amount });
            await Message.channel.bulkDelete(messages, true);

            const reply = await Message.channel.send(`Successfully cleared ${amount} messages.`);
            setTimeout(() => reply.delete(), 5000);
        } catch (error) {
            console.error('Error clearing messages:', error);
            Message.reply('An error occurred while trying to clear messages.');
        }
    }
};
