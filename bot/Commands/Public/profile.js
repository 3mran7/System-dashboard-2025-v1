const { createCanvas, loadImage } = require('canvas');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'profile',
    description: 'Displays an advanced profile of a user with level, XP, and more',
    usage: '!profile [user]',
    run: async (Client, Message, Args) => {
        const user = Message.mentions.users.first() || Client.users.cache.get(Args[0]) || Message.author;
        const member = Message.guild.members.cache.get(user.id);

        // Placeholder for level and XP (you should replace this with actual data from your database)
        const level = 5; // Example level
        const xp = 2500; // Example XP
        const totalXP = 5000; // Example total XP needed for next level

        const canvas = createCanvas(800, 400);
        const ctx = canvas.getContext('2d');

        // Background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#36393f');
        gradient.addColorStop(1, '#2f3136');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // User avatar
        const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
        ctx.save();
        ctx.beginPath();
        ctx.arc(150, 150, 100, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 50, 50, 200, 200);
        ctx.restore();

        // Username
        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(user.username, 280, 100);

        // Level and XP
        ctx.font = '30px Arial';
        ctx.fillStyle = '#7289da';
        ctx.fillText(`Level: ${level}`, 280, 160);
        
        // XP Bar
        ctx.fillStyle = '#4e5d94';
        ctx.fillRect(280, 180, 400, 30);
        ctx.fillStyle = '#7289da';
        ctx.fillRect(280, 180, (xp / totalXP) * 400, 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText(`${xp} / ${totalXP} XP`, 450, 203);

        // Joined date
        ctx.font = '25px Arial';
        ctx.fillStyle = '#99aab5';
        ctx.fillText(`Joined: ${member.joinedAt.toDateString()}`, 280, 250);

        // Roles
        ctx.fillText('Roles:', 280, 290);
        let xPos = 280;
        let yPos = 330;
        member.roles.cache.forEach((role, index) => {
            if (role.name !== '@everyone') {
                ctx.fillStyle = role.color.toString(16);
                ctx.fillText(role.name, xPos, yPos);
                xPos += ctx.measureText(role.name).width + 20;
                if (xPos > 750) {
                    xPos = 280;
                    yPos += 40;
                }
            }
        });

        // Create attachment
        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'profile.png' });

        // Create embed
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${user.username}'s Profile`)
            .setImage('attachment://profile.png')
            .setTimestamp();

        // Send the embed with the image
        Message.channel.send({ embeds: [embed], files: [attachment] });
    }
};
