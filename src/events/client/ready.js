const { ActivityType } = require('discord.js');
module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Ready! ${client.user.tag} is logged in and online`);
        await client.user.setPresence({
            activities: [{
                name: "your commands",
                type: ActivityType.Listening
            }],
            status: "online"
        });
    }
}