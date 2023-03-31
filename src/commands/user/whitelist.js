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
    try {
        var taggedUserRaw = interaction.options.get('user').value;
        if (!taggedUserRaw.includes("@")) {
            await interaction.reply({
                content: "You must tag the user, using @ symbol"
            });
            return;
        }

        const serverProfile = await Guild.findOne({ guildId: interaction.guild.id });
        if (!serverProfile) {
            await interaction.reply({
                content: "Something went wrong, try again"
            });
            return;
        }

        const taggedUser = taggedUserRaw.split("@")[1].slice(0, -1);
        if (interaction.user.username !== serverProfile.guildOwnerName && interaction.user.discriminator !== serverProfile.guildOwnerDiscriminator) {
            await interaction.reply({
                content: "Only the owner of the server can add people to whitelist"
            });
            return;
        }

        if (taggedUser === interaction.user.id) {
            await interaction.reply({
                content: "You are already whitelist, by default"
            });
            return;
        }

        if (taggedUserRaw === "@everyone") {
            const guildMembersRaw = interaction.guild.members.cache;
            const _whitelist = serverProfile.guildWhitelist;
            const newList = [];
            guildMembersRaw.forEach((member) => {
                const exists = _whitelist.find( id => id === member.user.id);
                if (exists === undefined)
                    newList.push(member.user.id);
            });
            const eres = await Guild.findOneAndUpdate({ guildId: interaction.guild.id }, { guildWhitelist: newList }, { returnOriginal: false });
            await interaction.reply({
                content: `Everyone has been added to whitelist`
            });
        } else {
            var prevUsers = serverProfile.guildWhitelist;
            var userExists = prevUsers.find(id => id === taggedUser);
            if (userExists !== undefined) {
                await interaction.reply({
                    content: "User is already whitelisted"
                });
                return;
            }
            const targetUser = interaction.guild.members.cache.find(({ id }) => id === taggedUser);
            prevUsers.push(taggedUser);
            console.log(`New userID: ${ taggedUser }`);
            console.info(prevUsers);
            const res = await Guild.findOneAndUpdate({ guildId: interaction.guild.id } , { guildWhitelist: prevUsers }, { returnOriginal: false });
            console.log(res);
            await interaction.reply({
                content: `${ targetUser.user.username }#${ targetUser.user.discriminator } has been added to whitelist`
            });
        }
    } catch (err) {
        console.log(err);
        await interaction.reply({
          content: "Something went wrong, try again"
        });
    }
  }
};