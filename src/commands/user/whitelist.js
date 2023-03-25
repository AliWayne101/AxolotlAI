const { SlashCommandBuilder, GuildDefaultMessageNotifications } = require("discord.js");
const Guild = require('../../schemas/guild');
module.exports = {
  data: new SlashCommandBuilder()
    .setName("whitelist")
    .setDescription("Add a user to whitelist to have access to application")
    .addStringOption(option =>
      option.setName('user')
        .setDescription('@USER to add the user in whitelist')),
  async execute(interaction, client) {
    var _reply = "";
    try {
        var taggedUser = interaction.options.get('user').value;
        if (taggedUser.includes("@")) {
            taggedUser = taggedUser.split("@")[1].slice(0, -1);
            const serverProfile = await Guild.findOne({ guildId: interaction.guild.id });
            if (serverProfile) {
                if (interaction.user.username === serverProfile.guildOwnerName && interaction.user.discriminator === serverProfile.guildOwnerDiscriminator) {
                    var targetUser = interaction.guild.members.cache.find(({ id }) => id === taggedUser);
                    if (targetUser.user.id !== interaction.user.id) {
                        if (targetUser !== undefined) {
                            var previousUsers = serverProfile.guildWhitelist;
                            var checkExists = false;
                            for (let userID of previousUsers) {
                                if (userID === targetUser.user.id) checkExists = true;
                            }

                            if (checkExists === false) {
                                previousUsers.push(targetUser.user.id);
                                console.log(`New userID: ${ targetUser.user.id }`);
                                console.info(previousUsers);
                                const res = await Guild.findOneAndUpdate({ guildId: interaction.guild.id }, { guildWhitelist: previousUsers }, { returnOriginal: false });
                                console.log(res);
                                _reply = `${ targetUser.user.username }#${ targetUser.user.discriminator } has been added to whitelist`;
                            } else
                                _reply = "User is already whitelisted";
                        } else 
                            _reply = "There are some technical issues, please try again";
                    } else
                        _reply = "You are already whitelisted";
                } else
                    _reply = "Only Owner of the server can whitelist users";
            } else
                _reply = "There are some technical issues, please try again";
        } else {
            _reply = "You must tag the user using @ symbol";
        }
    } catch (err) {
        console.log(err);
        _reply = "Something went wrong, please try again";
    }

    await interaction.reply({
      content: _reply
    });
  }
};
