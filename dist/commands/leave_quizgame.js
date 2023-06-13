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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const DiscordServers_1 = __importDefault(require("../lib/DiscordServers"));
const QuizGame_1 = __importStar(require("../lib/QuizGame"));
const spygame_1 = require("../lib/spygame");
const cmd_1 = require("../lib/cmd");
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
        const game = await QuizGame_1.default.getGameWithUserId(interaction.guildId, interaction.user.id);
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
        await QuizGame_1.default.leave(interaction.guildId, game.hostId, interaction.user.id);
        await interaction.reply({
            content: "You left the game",
            ephemeral: true
        });
        const gameUpdate = await QuizGame_1.default.getGameWithHostId(interaction.guildId, game.hostId);
        const announcement = await QuizGame_1.default.getAnnouncement(interaction, interaction.guildId, gameUpdate.hostId);
        if (game.started) {
            if (gameUpdate.players.length === 0) {
                if (announcement) {
                    const deleteEmbed = new discord_js_1.EmbedBuilder()
                        .setTitle("No one else in the game ❌")
                        .setFooter({ text: "Game Deleted" })
                        .setAuthor({ name: "Quiz Game" });
                    await DiscordServers_1.default.deleteGame(interaction.guildId, gameUpdate.hostId);
                    await announcement.edit({
                        embeds: [deleteEmbed],
                        components: [],
                        content: ""
                    });
                    if (!gameUpdate.mainChannel) {
                        await announcement.channel.edit({ name: "Game end 🔴" });
                        setTimeout(async () => {
                            try {
                                await announcement.channel.delete();
                            }
                            catch (err) {
                                (0, cmd_1.warning)(err.message);
                            }
                        }, 1000 * 10);
                    }
                }
                else {
                    await DiscordServers_1.default.deleteGame(interaction.guildId, gameUpdate.hostId);
                }
            }
            return;
        }
        if (announcement) {
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(`Quiz Game`)
                .setThumbnail("https://hips.hearstapps.com/hmg-prod/images/quiz-questions-answers-1669651278.jpg")
                .addFields({ name: `Info`, value: `Category : **${gameUpdate.category}** \nAmount : **${gameUpdate.amount}**\ntime : **${game.time / 1000 + " seconds" || "30 seconds"} **  \nMax players : **${gameUpdate.maxPlayers}**` })
                .setAuthor({ name: `Waiting for the players... ${gameUpdate.players.length} / ${gameUpdate.maxPlayers}` })
                .setTimestamp(Date.now())
                .setFooter({ text: `id : ${game.hostId}` });
            await announcement.edit({
                embeds: [embed]
            });
            return;
        }
        else {
            const channel = await QuizGame_1.default.getChannel(interaction, game.hostId);
            await DiscordServers_1.default.deleteGame(interaction.guildId, gameUpdate.hostId);
            if (!game.mainChannel) {
                if (channel) {
                    await channel.delete();
                    return;
                }
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setAuthor({ name: "Quiz Game" })
                .setTitle("It looks like someone deleted the game announcement ❌")
                .setFooter({ text: "Game deleted" });
            await interaction.channel?.send({
                embeds: [embed],
            });
            return;
        }
    }
};
