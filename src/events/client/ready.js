const { ActivityType } = require('discord.js');
module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Ready! ${client.user.tag} is logged in and online`);
        await client.user.setPresence({
            activities: [{
                name: "To your commands",
                type: ActivityType.Listening
            }],
            status: "online"
        }).catch(console.log);
    }
}