const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Guild = require('../../schemas/guild');
const AdToken = require('../../schemas/adtoken');
const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName("redeem")
    .setDescription("Redeem server credits for free"),
  async execute(interaction, client) {
    console.log(Math.floor(100000000000 + Math.random() * 900000000000));
    const randNum = Math.floor(100000000000 + Math.random() * 900000000000);
    let _Token = AdToken({
        _id: new mongoose.Types.ObjectId(),
        guildId: interaction.guild.id,
        Token: randNum.toString()
    });
    
    await _Token.save().catch(console.log);
    var url = `http://waynecrypt.ml/?guildid=${interaction.guild.id}&token=${randNum.toString()}`;

    const embed = new EmbedBuilder()
    .setTitle(`Redeem Link`)
    .setColor(0x18e1ee)
    .setTimestamp(Date.now())
    .addFields([
        { name: 'Redeem Credits', value: 'Redeem free credits using this link' }
    ])
    .setURL(url);
    await interaction.reply({
        embeds: [embed]
    });
  }
};
