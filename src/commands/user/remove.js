const { SlashCommandBuilder } = require("discord.js");
const Guild = require("../../schemas/guild");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remove a user from whitelist from using this application")
    .addStringOption((option) =>
      option
        .setName("user")
        .setDescription("@USER to remove the user from whitelist")
    ),
  async execute(interaction, client) {
    try {
      var taggedUserRaw = interaction.options.get("user").value;
      if (!taggedUserRaw.includes("@")) {
        await interaction.reply({
          content: "You must tag the user, using @ symbol",
        });
        return;
      }

      var taggedUser = taggedUserRaw.split("@")[1].slice(0, -1);
      const profileData = await Guild.findOne({
        guildId: interaction.guild.id,
      });
      if (!profileData) {
        await interaction.reply({
          content: "Something went wrong, please try again",
        });
        return;
      }

      if (
        interaction.user.username !== profileData.guildOwnerName &&
        interaction.user.discriminator !== profileData.guildOwnerDiscriminator
      ) {
        await interaction.reply({
          content:
            "Only the owner of the server can remove people from whitelist",
        });
        return;
      }

      const ifExists = profileData.guildWhitelist.filter(
        (targetID) => targetID === taggedUser
      );
      if (ifExists === undefined) {
        await interaction.reply({
          content: "User is not whitelisted",
        });
        return;
      }

      if (taggedUserRaw === "@everyone") {
        const newArray = [];
        newArray.push(interaction.user.id);
        const updateEveryone = await Guild.findOneAndUpdate(
          { guildId: interaction.guild.id },
          { guildWhitelist: newArray }
        );
        await interaction.reply({
          content: `Everyone has been removed from whitelist`,
        });
      } else {
        let newList = profileData.guildWhitelist.filter(
          (targetID) => targetID !== taggedUser
        );
        const updatedList = await Guild.findOneAndUpdate(
          { guildId: interaction.guild.id },
          { guildWhitelist: newList }
        );
        const userDetails = interaction.guild.members.cache.find(
          ({ id }) => id === taggedUser
        ).user;
        await interaction.reply({
          content: `${userDetails.username}#${userDetails.discriminator} has been removed from whitelist`,
        });
      }
    } catch (err) {
      console.log(err);
      await interaction.reply({
        content: "Something went wrong, try again"
      });
    }
  },
};
