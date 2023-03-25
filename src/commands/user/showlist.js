const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Guild = require('../../schemas/guild');
module.exports = {
  data: new SlashCommandBuilder()
    .setName("showlist")
    .setDescription("Show list of whitelisted users"),
  async execute(interaction, client) {

    var profileData = await Guild.findOne({ guildId: interaction.guild.id });
    var _reply = "";
    if (profileData) {
        var count = 1;
        for (let userID of profileData.guildWhitelist) {
            var targetUser = interaction.guild.members.cache.find(({ id }) => id === userID);
            _reply += `${ count } - ${ targetUser.user.username }#${ targetUser.user.discriminator }\n`;
            count++;
        }
    } else
        _reply = "Something went wrong, try again";

    const embed = new EmbedBuilder()
    .setTitle(`Whitelisted Users`)
    .setColor(0x18e1ee)
    .setTimestamp(Date.now())
    .setDescription(_reply);
    await interaction.reply({
        embeds: [embed]
    });
  }
};
