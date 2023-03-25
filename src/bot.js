require("dotenv").config();
const { token, db_token, credit_per_server } = process.env;
const { connect } = require('mongoose');
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const Guild = require('./schemas/guild');
const mongoose = require('mongoose');

const client = new Client({ intents: 32767 });
client.commands = new Collection();
client.commandArray = [];

const functionFolders = fs.readdirSync("./src/functions");
for (const folder of functionFolders) {
  const functionFiles = fs.readdirSync(`./src/functions/${folder}`)
    .filter((file) => file.endsWith(".js"));

  for (const file of functionFiles)
    require(`./functions/${folder}/${file}`)(client);
}

client.handleEvents();
client.handleCommands();
client.login(token);

async function getGuildIds() {
  var GuildDetails = [];
  try {
    const guilds = await client.guilds.fetch();
    const allGuilds = guilds.toJSON();
    for (let guild of allGuilds) {
      const fetchGuild = await client.guilds.fetch(guild.id);
      const memDetails = await fetchGuild.members.fetch(fetchGuild.ownerId);
      GuildDetails.push({
        guildID: guild.id,
        guildName: guild.name,
        username: memDetails.user.username,
        discriminator: memDetails.user.discriminator,
        ownerId: fetchGuild.ownerId
      });
    }
  } catch (err) {
    console.log(err);
  }
  (async () => {
    await connect(db_token).then(() => {
      if (GuildDetails.length > 0)
        mongoDB(GuildDetails);
    }).catch(console.log);
  })();
}

async function mongoDB(guildData) {
  for (let curGuild of guildData) {
    let guildProfile = await Guild.findOne({ guildId: curGuild.guildID });
    if (!guildProfile) {
      var whitelistAr = [];
      whitelistAr.push(curGuild.ownerId);
      guildProfile = await Guild({
        _id: new mongoose.Types.ObjectId(),
        guildId: curGuild.guildID,
        guildName: curGuild.guildName,
        guildOwnerName: curGuild.username,
        guildOwnerDiscriminator: curGuild.discriminator,
        guildCredit: credit_per_server,
        guildWhitelist: whitelistAr
      });

      await guildProfile.save().catch(console.log);
      console.log(`ServerID: ${curGuild.guildID} has been added to database`);
    }
  }
}

getGuildIds();