"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DiscordServers_1 = require("../lib/DiscordServers");
const spygame_1 = __importDefault(require("../lib/spygame"));
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
        game.players.map((e, i) => {
            if (e.id === interaction.user.id) {
                game.players[i].vote = "";
            }
        });
        server.games[index] = game;
        await server.save();
        await interaction.reply({
            content: "Vote removed :white_check_mark:",
            ephemeral: true
        });
    }
};
