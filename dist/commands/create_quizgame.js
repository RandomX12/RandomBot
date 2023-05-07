"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const QuizGame_1 = require("../lib/QuizGame");
const DiscordServers_1 = __importStar(require("../lib/DiscordServers"));
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
        const server = await (0, DiscordServers_1.getServerByGuildId)(interaction.guildId);
        const isIn = await DiscordServers_1.default.isInGame(interaction.guildId, interaction.user.id);
        if (isIn) {
            await interaction.reply({
                content: `You are already in game :x:`,
                ephemeral: true
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
            await interaction.reply({
                content: "cannot create the game :x:",
                ephemeral: true
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
        }
        catch (err) {
            await DiscordServers_1.default.deleteGame(interaction.guildId, interaction.user.id);
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({
                    content: "Cannot create the game :x:"
                });
            }
            else {
                await interaction.reply({
                    content: "cannot create the game :x:",
                    ephemeral: true
                });
            }
            throw new Error(err?.message);
        }
    }
};
