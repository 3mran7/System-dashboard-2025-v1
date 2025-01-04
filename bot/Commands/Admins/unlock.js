const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unlock',
    description: 'Unlocks a channel, allowing members to send messages',
    usage: '!unlock [channel] [reason]',
    permissions: [PermissionsBitField.Flags.ManageChannels],
    run: async (Client, Message, Args) => {
        const channel = Message.mentions.channels.first() || Message.channel;
        const reason = Args.slice(1).join(' ') || 'No reason provided';

        try {
            await channel.permissionOverwrites.edit(Message.guild.roles.everyone, {
                SendMessages: null
            });

            Message.channel.send(`🔓 Channel ${channel} has been unlocked. Reason: ${reason}`);
        } catch (error) {
            console.error('Error unlocking channel:', error);
            Message.reply('An error occurred while trying to unlock the channel.');
        }
    }
};
