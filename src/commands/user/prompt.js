const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { Configuration, OpenAIApi } = require('openai');
const { encode, decode } = require('gpt-3-encoder');
const Guild = require('../../schemas/guild');
const { OPENAI_KEY } = process.env;
const configuration = new Configuration({
    apiKey: OPENAI_KEY
});
module.exports = {
  data: new SlashCommandBuilder()
    .setName("prompt")
    .setDescription("Ask any question")
    .addStringOption(option =>
      option.setName('text')
        .setDescription('Input text you want to query'))
    .addStringOption(option => 
        option.setName('maxtokens')
        .setDescription('Max tokens to be consumed while generating the result')),
  async execute(interaction, client) {
    const message = await interaction.deferReply({
      fetchReply: true,
    });

    const _prompt = interaction.options.get("text");
    const _max_tokens = interaction.options.get('maxtokens');
    if (_prompt !== null) {
        const tokens = encode(_prompt.value);

        let profileData = await Guild.findOne({ guildId: interaction.guild.id });
        if (profileData) {
            const userExists = profileData.guildWhitelist.find(id => id === interaction.user.id);
            let _rawMaxTokens = _max_tokens !== null ? _max_tokens.value : 100;
            let _rawParsedMaxTokens = parseInt(_rawMaxTokens);
            let _useMaxTokens = !isNaN(_rawParsedMaxTokens) ? _rawParsedMaxTokens : 100;

            let totalQueryTokens = tokens.length + _useMaxTokens;
            
            if (userExists !== undefined) {
                if (totalQueryTokens <= profileData.guildCredit) {
                    const newTokens = profileData.guildCredit - tokens.length;
                    const update = await Guild.findOneAndUpdate({ guildId: interaction.guild.id }, { guildCredit: newTokens }, { returnNewDocument: true });

                    try {
                        const openai = new OpenAIApi(configuration);
                        const response = await openai.createCompletion({
                            model: "text-davinci-003",
                            prompt: _prompt.value,
                            temperature: 0.7,
                            max_tokens: _useMaxTokens
                        });

                        const tokensAfterCompletion = update.guildCredit - response.data.usage.completion_tokens;
                        const reupdate = await Guild.findOneAndUpdate({ guildId: interaction.guild.id }, { guildCredit: tokensAfterCompletion });
                        
                        var textLimit = 1024;
                        if (response.data.choices[0].text.length > textLimit) {
                            var totalIterations = parseInt(response.data.choices[0].text.length / textLimit);
                            var remainingEntry = response.data.choices[0].text.length % textLimit;
                            var totalEntries = remainingEntry > 0 ? totalIterations += 1: totalIterations;
                            for (var i = 0; i < totalIterations; i++) {
                                var startingPoint = i * textLimit;
                                var endPoint = startingPoint + textLimit;
                                const embed = new EmbedBuilder()
                                    .setTitle(`Prompt result`)
                                    .setColor(0x18e1ee)
                                    .setTimestamp(Date.now())
                                    .addFields([
                                        { name: `Question: `, value: _prompt.value },
                                        { name: `Result: ${ i + 1 } out of ${ totalEntries }`, value: response.data.choices[0].text.slice(startingPoint, endPoint) },
                                        { name: 'Total Tokens consumed', value: `${ response.data.usage.total_tokens }` }
                                    ]);
                               
                                if (i === 0) {
                                    await interaction.editReply({
                                        embeds: [embed]
                                    });
                                } else {
                                    await interaction.followUp({
                                        embeds: [embed]
                                    });
                                }
                            }

                            if (remainingEntry > 0) {
                                const embed = new EmbedBuilder()
                                    .setTitle(`Prompt result`)
                                    .setColor(0x18e1ee)
                                    .setTimestamp(Date.now())
                                    .addFields([
                                        { name: `Result: ${ totalEntries } out of ${ totalEntries }`, value: response.data.choices[0].text.slice(totalIterations * textLimit, response.data.choices[0].text.length) },
                                        { name: 'Total Tokens consumed', value: `${ response.data.usage.total_tokens }` }
                                    ]);
                                
                                await interaction.followUp({
                                    embeds: [embed]
                                })
                            }
                        } else {
                            const embed = new EmbedBuilder()
                                .setTitle(`Prompt result`)
                                .setColor(0x18e1ee)
                                .setTimestamp(Date.now())
                                .addFields([
                                    { name: `Question: `, value: _prompt.value },
                                    { name: `Result:`, value: response.data.choices[0].text },
                                    { name: 'Total Tokens consumed', value: `${ response.data.usage.total_tokens }` }
                                ]);
                            await interaction.editReply({
                                embeds: [embed]
                            });
                        }
                        
                        
                    } catch (err) {
                        console.log(err);
                        await interaction.editReply({
                            content: "Something went wrong, please try again"
                        });
                    }
                } else {
                    await interaction.editReply({
                        content: "Guild credit is too low to make the request"
                    });
                }
            } else {
                await interaction.editReply({
                    content: "You are not allowed to use this bot"
                });
            }
        } else {
            await interaction.editReply({
                content: "Something went wrong, try again"
            });
        }
    } else {
        await interaction.editReply({
            content: "Prompt must not be empty",
        });
    }
  }
};
