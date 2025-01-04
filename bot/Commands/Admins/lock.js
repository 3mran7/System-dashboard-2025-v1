const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'lock',
    description: 'Locks a channel, preventing members from sending messages',
    usage: '!lock [channel] [reason]',
    permissions: [PermissionsBitField.Flags.ManageChannels],
    run: async (Client, Message, Args) => {
        const channel = Message.mentions.channels.first() || Message.channel;
        const reason = Args.slice(1).join(' ') || 'No reason provided';

        try {
            await channel.permissionOverwrites.edit(Message.guild.roles.everyone, {
                SendMessages: false
            });

            Message.channel.send(`🔒 Channel ${channel} has been locked. Reason: ${reason}`);
        } catch (error) {
            console.error('Error locking channel:', error);
            Message.reply('An error occurred while trying to lock the channel.');
        }
    }
};
