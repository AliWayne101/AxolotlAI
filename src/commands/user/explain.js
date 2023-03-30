const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('explain')
        .setDescription('Ask any question')
        .addStringOption(optiona => optiona
            .setName('prompt')
            .setDescription('Input text you want to ask'))
        .addStringOption(optionb => optionb
            .setName('maxtokens')
            .setDescription('Max tokens to be consumed while generating the result')),
    async execute(interaction, client) {
        await interaction.deferReply();
        await interaction.editReply({
            content: "send"
        });
    }
}