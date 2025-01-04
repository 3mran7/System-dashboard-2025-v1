module.exports = {
    name: "ban",
    aliases: ["banish", "remove"],
    description: "Bans a user from the server",
    usage: "!ban <user> [reason]",
    permissions: ["BanMembers"],
    cooldown: 5,
    run: async (Client, Message, Args) => {
        if (!Message.member.permissions.has("BanMembers")) {
            return Message.reply("You don't have permission to use this command.");
        }

        const member = Message.mentions.members.first() || Message.guild.members.cache.get(Args[0]);
        if (!member) {
            return Message.reply("Please mention a valid member or provide their ID.");
        }

        if (member.id === Message.author.id) {
            return Message.reply("You can't ban yourself!");
        }

        if (!member.bannable) {
            return Message.reply("I can't ban this user. They may have a higher role than me or I don't have ban permissions.");
        }

        let reason = Args.slice(1).join(' ');
        if (!reason) reason = "No reason provided";

        await member.ban({ reason: reason })
            .catch(error => {
                Message.reply(`Sorry, I couldn't ban the user because: ${error}`);
                return;
            });

        Message.reply(`${member.user.tag} has been banned by ${Message.author.tag} for reason: ${reason}`);
    }
}