"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const QuizGame_1 = require("../lib/QuizGame");
const DiscordServers_1 = __importDefault(require("../lib/DiscordServers"));
const cmd_1 = require("../lib/cmd");
let choices = Object.keys(QuizGame_1.categories).map(e => {
    return {
        name: e,
        value: `${QuizGame_1.categories[e]}`
    };
});
let cmdBody = {
    name: "create_quizgame",
    description: "create a quiz game",
    options: [
        {
            name: "category",
            description: "choose a category",
            type: discord_js_1.ApplicationCommandOptionType.String,
            required: true,
            choices: choices
        },
        {
            name: "amount",
            description: "amount of questions",
            type: discord_js_1.ApplicationCommandOptionType.Number,
            minValue: 3,
            maxValue: 10,
            required: true
        },
        {
            name: "max_players",
            description: "max players",
            type: discord_js_1.ApplicationCommandOptionType.Number,
            maxValue: 20,
            minValue: 2,
            required: true
        }
    ]
};
module.exports = {
    data: cmdBody,
    async execute(interaction) {
        await interaction.deferReply({
            ephemeral: true
        });
        const isIn = await DiscordServers_1.default.isInGame(interaction.guildId, interaction.user.id);
        if (isIn) {
            await interaction.editReply({
                content: `You are already in game :x:`,
            });
            return;
        }
        const category = interaction.options.getString("category");
        const amount = interaction.options.getNumber("amount");
        const maxPlayers = interaction.options.getNumber("max_players");
        let msg = await interaction.channel.send({
            content: "creating Quiz Game..."
        });
        try {
            const game = new QuizGame_1.QuizGame(interaction.guildId, {
                hostName: interaction.user.username,
                hostId: interaction.user.id,
                maxPlayers: maxPlayers,
                channelId: interaction.channelId,
                announcementId: msg.id,
                category: (0, QuizGame_1.getCategoryByNum)(+category || category),
                amount: amount
            });
            await game.save();
        }
        catch (err) {
            await msg.delete();
            await interaction.editReply({
                content: "cannot create the game :x:",
            });
            msg = null;
            await DiscordServers_1.default.deleteGame(interaction.guildId, interaction.user.id);
            throw new Error(err?.message);
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`Quiz Game`)
            .setThumbnail("https://hips.hearstapps.com/hmg-prod/images/quiz-questions-answers-1669651278.jpg")
            .addFields({ name: `Info`, value: `Category : **${(0, QuizGame_1.getCategoryByNum)(+category || category)}** \nAmount : **${amount}** \nMax players : **${maxPlayers}**` })
            .setAuthor({ name: `Waiting for the players... 1 / ${maxPlayers}` })
            .setTimestamp(Date.now());
        const button = new discord_js_1.ButtonBuilder()
            .setLabel("join")
            .setStyle(3)
            .setCustomId(`join_quizgame_${interaction.user.id}`);
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(button);
        try {
            if (!msg)
                throw new Error(`Cannot create the game`);
            await msg.edit({
                embeds: [embed],
                components: [row],
                content: `@everyone new Quiz Game created by <@${interaction.user.id}>`
            });
            await interaction.editReply({
                content: "Game created :white_check_mark:",
            });
        }
        catch (err) {
            await DiscordServers_1.default.deleteGame(interaction.guildId, interaction.user.id);
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({
                    content: "Cannot create the game :x:"
                });
            }
            else {
                await interaction.editReply({
                    content: "cannot create the game :x:",
                });
            }
            throw new Error(err?.message);
        }
        setTimeout(async () => {
            try {
                const game = await QuizGame_1.QuizGame.getGameWithHostId(interaction.guildId, interaction.user.id);
                if (game.started)
                    return;
                await DiscordServers_1.default.deleteGame(interaction.guildId, interaction.user.id);
                const announcement = interaction.channel.messages.cache.get(game.announcementId);
                if (announcement) {
                    const embed = new discord_js_1.EmbedBuilder()
                        .setAuthor({ name: "Quiz Game" })
                        .setTitle(`Time out : game deleted`);
                    await announcement.edit({
                        embeds: [embed],
                        components: [],
                        content: ""
                    });
                }
            }
            catch (err) {
                (0, cmd_1.error)(err.message);
            }
        }, 1000 * 60 * 5);
    }
};
