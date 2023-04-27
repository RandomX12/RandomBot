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
const spygame_1 = __importDefault(require("../lib/spygame"));
const DiscordServers_1 = __importStar(require("../lib/DiscordServers"));
module.exports = {
    data: {
        name: "leave_spygame",
        description: "leave a Spy Game"
    },
    async execute(interaction) {
        const server = await (0, DiscordServers_1.getServerByGuildId)(interaction.guildId);
        let stop = false;
        for (let i = 0; i < server.games.length; i++) {
            if (interaction.user.id === server.games[i].hostId) {
                await DiscordServers_1.default.deleteGame(interaction.guildId, interaction.user.id);
                const announcement = interaction.channel.messages.cache.get(server.games[i].announcementId);
                const embed = new discord_js_1.EmbedBuilder()
                    .setTitle("Spy Game deleted :x:")
                    .setAuthor({ name: "The host left the game" });
                await announcement.edit({
                    embeds: [embed],
                    components: [],
                    content: ""
                });
                await interaction.reply({
                    content: "You left the game",
                    ephemeral: true
                });
                break;
            }
            for (let j = 0; j < server.games[i].players.length; j++) {
                if (server.games[i].players[j].id === interaction.user.id) {
                    await spygame_1.default.leave(interaction.guildId, server.games[i].hostId, interaction.user.id);
                    stop = true;
                    const announcement = interaction.channel.messages.cache.get(server.games[i].announcementId);
                    const embed = new discord_js_1.EmbedBuilder()
                        .setTitle("Spy Game")
                        .setAuthor({ name: `Waiting for players ${server.games[i].players.length} / ${server.games[i].maxPlayers}` });
                    await announcement.edit({
                        embeds: [embed]
                    });
                    await interaction.reply({
                        content: "You left the game",
                        ephemeral: true
                    });
                    break;
                }
            }
            if (stop)
                break;
        }
    }
};
