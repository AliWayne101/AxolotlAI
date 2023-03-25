const { SlashCommandBuilder } = require("discord.js");
const Guild = require('../../schemas/guild');
module.exports = {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remove a user from whitelist from using this application")
    .addStringOption(option =>
      option.setName('user')
        .setDescription('@USER to remove the user from whitelist')),
  async execute(interaction, client) {
    var _reply = "";
    try {
        var taggedUser = interaction.options.get('user').value;
        if (taggedUser.includes("@")) {
            taggedUser = taggedUser.split("@")[1].slice(0, -1);
            const profileData = await Guild.findOne({ guildId: interaction.guild.id });
            if (profileData) {
                if (interaction.user.username === profileData.guildOwnerName && interaction.user.discriminator === profileData.guildOwnerDiscriminator) {
                    const ifExists = profileData.guildWhitelist.find(targetID => targetID === taggedUser);
                    if (ifExists !== undefined) {
                        let newList = profileData.guildWhitelist.filter(targetID => targetID !== taggedUser);
                        const updatedList = await Guild.findOneAndUpdate({ guildId: interaction.guild.id }, { guildWhitelist: newList });
                        const userDetails = interaction.guild.members.cache.find(({ id }) => id === taggedUser).user;
                        _reply = `${ userDetails.username }#${ userDetails.discriminator } has been removed from whitelist`;
                    } else
                        _reply = "User is not whitelisted";
                } else
                    _reply = "Only the Owner of the server can remove the user from whitelist";
            } else
                _reply = "Something went wrong, try again";
        } else
            _reply = "You must tag the user using @ symbol";
    } catch (err) {
        console.log(err);
        _reply = "Something went wrong, try again";
    }

    await interaction.reply({
        content: _reply
    });
  }
};
