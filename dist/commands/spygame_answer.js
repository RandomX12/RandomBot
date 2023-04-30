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
const DiscordServers_1 = require("../lib/DiscordServers");
const spygame_1 = __importStar(require("../lib/spygame"));
let cmdBody = {
    name: "spygame_answer",
    description: "answer to someone question",
    options: [
        {
            name: "answer",
            description: "write the answer",
            type: discord_js_1.ApplicationCommandOptionType.String,
            required: true,
        }
    ]
};
module.exports = {
    data: cmdBody,
    async execute(interaction) {
        const server = await (0, DiscordServers_1.getServerByGuildId)(interaction.guildId);
        const game = await spygame_1.default.findGameByUserId(server.games, interaction.user.id);
        if (game.players[game.index].askId !== interaction.user.id) {
            await interaction.reply({
                content: "You are not asked",
                ephemeral: true
            });
            return;
        }
        const announcement = interaction.channel.messages.cache.get(game.announcementId);
        const answer = interaction.options.getString("answer");
        game.players[game.index].answer = answer;
        game.index++;
        let gameIndex;
        server.games.map((e, i) => {
            if (e.hostId === game.hostId) {
                gameIndex = i;
            }
        });
        if (gameIndex === undefined && gameIndex === null) {
            await interaction.reply({
                content: "Game not found :x:",
                ephemeral: true
            });
            return;
        }
        server.games[gameIndex] = game;
        server.save();
        if (announcement) {
            let nextTurn = "";
            if (game.index !== game.maxPlayers) {
                nextTurn += `<@${game.players[game.index].id}> it's your turn to ask someone`;
            }
            await announcement.edit({
                content: announcement.content + "``` " + answer + "```\n" + nextTurn
            });
            const reply = await interaction.reply({
                content: "Answer sent :white_check_mark:",
                ephemeral: true
            });
            setTimeout(async () => {
                await reply.delete();
            }, 3000);
            if (game.index === game.maxPlayers) {
                let playersStr = "";
                game.players.map((e, i) => {
                    playersStr += spygame_1.numberEmojis[i] + " " + e.username + "\n";
                });
                const embed = new discord_js_1.EmbedBuilder()
                    .setAuthor({ name: "Spy Game" })
                    .setTitle("Who you think is the imposter ? \n vote for the spy")
                    .setFields({ name: "Players", value: playersStr })
                    .setTimestamp(Date.now());
                await announcement.edit({
                    embeds: [embed],
                    components: [],
                });
                setTimeout(async () => {
                    await announcement.edit({
                        content: "still",
                    });
                }, 1000 * 30);
            }
        }
    }
};
