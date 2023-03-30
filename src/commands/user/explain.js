const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { Configuration, OpenAIApi } = require('openai');
const { encode, decode } = require('gpt-3-encoder');
const Guild = require('../../schemas/guild');
const { OPENAI_KEY } = process.env;
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
        const _prompt = interaction.options.get("prompt");
        const _max_tokens = interaction.options.get("maxtokens");
        if (_prompt === null) {
            await interaction.editReply({
                content: "Please write something to explain"
            });
            return;
        } else {
            if (_prompt.length < 1) {
                await interaction.editReply({
                    content: "Please write something to explain"
                });
                return;
            }
        }
        
        const profileData = await Guild.findOne({ guildId: interaction.guild.id });
        if (!profileData) {
            await interaction.editReply({
                content: "Something went wrong, try again!"
            });
            return;
        }
        
        const userExists = profileData.guildWhitelist.find(id => id === interaction.user.id);
        if (!userExists) {
            await interaction.editReply({
                content: "You are not allowed by the owner to use this bot, ask the owner of the server"
            });
            return;
        }

        const tokens = encode(_prompt.value);
        let _rawMaxTokens = _max_tokens !== null ? _max_tokens.value : 100;
        let _rawParsedMaxTokens = parseInt(_rawMaxTokens);
        let _useMaxTokens = !isNaN(_rawParsedMaxTokens) ? _rawParsedMaxTokens : 100;
        let totalQueryTokens = tokens.length + _useMaxTokens;
        if (totalQueryTokens > profileData.guildCredit) {
            const embed = new EmbedBuilder()
                .setTitle(`Server credits are low to make the request.\nKindly Recharge or write command **/redeem** to redeem free credit`)
                .setColor(0x18e1ee)
                .setTimestamp(Date.now());
            
            await interaction.editReply({
                embeds: [embed]
            });
            return;
        }

        const openai = new OpenAIApi(
            new Configuration({
                apiKey: OPENAI_KEY
            })
        );
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: _prompt.value,
            temperature: 0.7,
            max_tokens: _useMaxTokens
        });
        console.info(response.data);
        console.info(response.data.usage);
        
        const tokensAfterCompletion = parseInt(response.data.usage.total_tokens);
        const newTokens = profileData.guildCredit - tokensAfterCompletion;
        await Guild.findOneAndUpdate({ guildId: interaction.guild.id }, { guildCredit: newTokens });
        const textLimit = 1024;
        const responseText = response.data.choices[0].text;
        if (responseText.length <= textLimit) {
            const embed = new EmbedBuilder()
                .setTitle(`Prompt result`)
                .setColor(0x18e1ee)
                .setTimestamp(Date.now())
                .addFields([
                    { name: `Question: `, value: _prompt.value },
                    { name: `Result:`, value: response.data.choices[0].text },
                    { name: 'Total Tokens consumed', value: `${ tokensAfterCompletion }` }
                ]);
            await interaction.editReply({
                embeds: [embed]
            });
        } else {
            let totalIterations = responseText.length / textLimit;
            let lastExists = totalIterations * textLimit < responseText.length ? true : false;
            const totalEntries = lastExists === true ? totalIterations + 1 : totalIterations;
            for (var i = 0; i < totalIterations; i++) {
                const startingPoint = i * textLimit;
                const endingPoint = startingPoint + textLimit;

                const embed = new EmbedBuilder()
                    .setTitle(`Prompt result`)
                    .setColor(0x18e1ee)
                    .setTimestamp(Date.now())
                    .addFields([
                        { name: `Question: `, value: _prompt.value },
                        { name: `Result: ${ i + 1 } out of ${ totalEntries }`, value: responseText.slice(startingPoint, endingPoint) },
                        { name: 'Total Tokens consumed', value: `${ response.data.usage.total_tokens }` }
                    ]);

                if (i > 0)
                    await interaction.followUp({
                        embeds: [embed]
                    });
                else
                    await interaction.editReply({
                        embeds: [embed]
                    });
            }

            if (lastExists === true) {
                const lastChunk = totalIterations * textLimit;
                const embed = new EmbedBuilder()
                    .setTitle(`Prompt result`)
                    .setColor(0x18e1ee)
                    .setTimestamp(Date.now())
                    .addFields([
                        { name: `Question: `, value: _prompt.value },
                        { name: `Result: ${ totalEntries } out of ${ totalEntries }`, value: responseText.slice(lastChunk, responseText.length) },
                        { name: 'Total Tokens consumed', value: `${ tokensAfterCompletion }` }
                    ]);
                await interaction.followUp({
                    embeds: [embed]
                });
            }
        }
    }
}