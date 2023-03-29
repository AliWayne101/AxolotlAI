const { Schema, model } = require('mongoose');
const adTokenSchema = new Schema({
    _id: Schema.Types.ObjectId,
    guildId: String,
    Token: String
});

module.exports = model("Adtokens", adTokenSchema, "adtokens");