const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Guild = require('../../schemas/guild');
const mongoose = require('mongoose');
const { credit_per_server } = process.env;
module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("Get guild profile"),
  async execute(interaction, client) {
    let guildProfile = await Guild.findOne({ guildId: interaction.guild.id });
    var profileData = guildProfile;
    if (!guildProfile) {
        let owner = await interaction.guild.fetchOwner();
        var whitelistAr = [];
        whitelistAr.push(owner.user.id);
        guildProfile = await Guild({
            _id: new mongoose.Types.ObjectId(),
            guildId: interaction.guild.id,
            guildName: interaction.guild.name,
            guildOwnerName: owner.user.username,
            guildOwnerDiscriminator: owner.user.discriminator,
            guildCredit: credit_per_server,
            guildWhitelist: whitelistAr
        });

        await guildProfile.save().catch(console.log);
        profileData = {
            guildId: interaction.guild.id,
            guildName: interaction.guild.name,
            guildOwnerName: owner.user.username,
            guildOwnerDiscriminator: owner.user.discriminator,
            guildCredit: credit_per_server
        };
    }

    const embed = new EmbedBuilder()
    .setTitle(`Server Profile`)
    .setColor(0x18e1ee)
    .setTimestamp(Date.now())
    .addFields([
        { name: 'Server name', value: profileData.guildName },
        { name: 'Owner', value: `${ profileData.guildOwnerName }#${ profileData.guildOwnerDiscriminator }` },
        { name: 'Server Credit', value: profileData.guildCredit.toLocaleString() },
        { name: 'Whitelisted Users', value: profileData.guildWhitelist.length.toString() }
    ]);
    await interaction.reply({
        embeds: [embed]
    });
  }
};
