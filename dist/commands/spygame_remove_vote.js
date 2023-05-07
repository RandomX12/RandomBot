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
    name: "spygame_remove_vote",
    description: "remove vote",
};
module.exports = {
    data: cmdBody,
    async execute(interaction) {
        let server = await (0, DiscordServers_1.getServerByGuildId)(interaction.guildId);
        let game = await spygame_1.default.findGameByUserId(server.games, interaction.user.id);
        let index = server.games.indexOf(game);
        if (!game.started) {
            await interaction.reply({
                content: `Game not started :x:`,
                ephemeral: true
            });
            return;
        }
        if (game.maxPlayers !== game.index) {
            await interaction.reply({
                content: `Game still running :x:`,
                ephemeral: true
            });
            return;
        }
        game.players.map((e, i) => {
            if (e.id === interaction.user.id) {
                game.players[i].vote = "";
            }
        });
        server.games[index] = game;
        await server.save();
        let playersStr = "";
        game.players.map((e, i) => {
            if (e.vote) {
                playersStr += spygame_1.numberEmojisStyled[i] + `${e.username}\t voted\n`;
            }
            else {
                playersStr += spygame_1.numberEmojisStyled[i] + `${e.username}\n`;
            }
        });
        const embed = new discord_js_1.EmbedBuilder()
            .setAuthor({ name: "Spy Game" })
            .setTitle("Who you think is the imposter ? \n vote for the spy")
            .setFields({ name: "Players", value: playersStr })
            .setTimestamp(Date.now());
        const announcement = interaction.channel.messages.cache.get(game.announcementId);
        if (announcement) {
            await announcement.edit({
                embeds: [embed],
                components: [],
            });
            await interaction.reply({
                content: "Vote removed :white_check_mark:",
                ephemeral: true,
            });
        }
        else {
            await spygame_1.default.delete(interaction.guildId, game.hostId);
            const errorEmbed = new discord_js_1.EmbedBuilder()
                .setAuthor({ name: "Spy Game" })
                .setTitle("Looks like someone deleted the game announcement ❌")
                .setFooter({ text: "Game deleted" });
            await interaction.channel.send({
                embeds: [errorEmbed],
            });
        }
    }
};
