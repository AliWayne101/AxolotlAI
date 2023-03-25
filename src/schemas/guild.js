const { Schema, model } = require("mongoose");
const guildSchema = new Schema({
  _id: Schema.Types.ObjectId,
  guildId: String,
  guildName: String,
  guildOwnerName: String,
  guildOwnerDiscriminator: String,
  guildCredit: Number,
  guildWhitelist: [{
    type: String
  }]
});

module.exports = model("Guilds", guildSchema, "guilds");