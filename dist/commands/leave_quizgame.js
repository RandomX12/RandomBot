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
const DiscordServers_1 = __importStar(require("../lib/DiscordServers"));
const QuizGame_1 = require("../lib/QuizGame");
const spygame_1 = __importStar(require("../lib/spygame"));
module.exports = {
    data: {
        name: "leave_quizgame",
        description: "Leave Quiz Game"
    },
    async execute(interaction) {
        const isIn = await DiscordServers_1.default.isInGame(interaction.guildId, interaction.user.id);
        if (!isIn) {
            await interaction.reply({
                content: "You are not in game :x:",
                ephemeral: true
            });
            return;
        }
        // still under dev :)
        const server = await (0, DiscordServers_1.getServerByGuildId)(interaction.guildId);
        const game = await spygame_1.default.findGameByUserId(server.games, interaction.user.id);
        if (!(0, QuizGame_1.isQuizGame)(game)) {
            let tryTxt = "";
            if ((0, spygame_1.isSpyGame)(game)) {
                tryTxt = "Try /leave_spygame";
            }
            await interaction.reply({
                content: "You are not in Quiz Game, " + tryTxt,
                ephemeral: true
            });
            return;
        }
        await QuizGame_1.QuizGame.leave(interaction.guildId, game.hostId, interaction.user.id);
        await interaction.reply({
            content: "You left the game",
            ephemeral: true
        });
        if (game.started)
            return;
        const gameUpdate = await QuizGame_1.QuizGame.getGameWithHostId(interaction.guildId, game.hostId);
        const announcement = interaction.channel.messages.cache.get(gameUpdate.announcementId);
        if (announcement) {
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(`Quiz Game`)
                .setThumbnail("https://hips.hearstapps.com/hmg-prod/images/quiz-questions-answers-1669651278.jpg")
                .addFields({ name: `Info`, value: `Category : **${gameUpdate.category}** \nAmount : **${gameUpdate.amount}** \nMax players : **${gameUpdate.maxPlayers}**` })
                .setAuthor({ name: `Waiting for the players... ${gameUpdate.players.length} / ${gameUpdate.maxPlayers}` })
                .setTimestamp(Date.now());
            await announcement.edit({
                embeds: [embed]
            });
            return;
        }
        else {
            await DiscordServers_1.default.deleteGame(interaction.guildId, gameUpdate.hostId);
            const embed = new discord_js_1.EmbedBuilder()
                .setAuthor({ name: "Quiz Game" })
                .setTitle("It looks like someone deleted the game announcement ❌")
                .setFooter({ text: "Game deleted" });
            await interaction.channel.send({
                embeds: [embed],
            });
            return;
        }
    }
};
