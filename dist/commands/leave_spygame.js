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
        const game = await spygame_1.default.findGameByUserId(server.games, interaction.user.id);
        await spygame_1.default.leave(interaction.guildId, game.hostId, interaction.user.id);
        const isHost = await spygame_1.default.isHost(interaction.guildId, interaction.user.id);
        if (isHost) {
            const announcement = interaction.channel.messages.cache.get(game.announcementId);
            if (announcement) {
                await DiscordServers_1.default.deleteGame(interaction.guildId, game.hostId);
                const embed = new discord_js_1.EmbedBuilder()
                    .setTitle("Spy Game deleted :x:")
                    .setAuthor({ name: "The host left the game" });
                await announcement.edit({
                    content: '',
                    components: [],
                    embeds: [embed]
                });
                await interaction.reply({
                    content: "You left the game",
                    ephemeral: true
                });
            }
        }
        else {
            const announcement = interaction.channel.messages.cache.get(game.announcementId);
            if (announcement) {
                if (game.started || game.players.length === game.maxPlayers) {
                    const embed = new discord_js_1.EmbedBuilder()
                        .setTitle("Spy Game deleted :x:")
                        .setAuthor({ name: `${interaction.user.username} left the game` });
                    await DiscordServers_1.default.deleteGame(interaction.guildId, game.hostId);
                    await announcement.edit({
                        embeds: [embed],
                        content: "",
                        components: []
                    });
                    return;
                }
                const embed = new discord_js_1.EmbedBuilder()
                    .setTitle("Spy Game")
                    .setThumbnail("https://media.istockphoto.com/id/846415384/vector/spy-icon.jpg?s=612x612&w=0&k=20&c=VJI5sbn-wprj6ikxVWxIm3p4fHYAwb2IHmr7lJBXa5g=")
                    .setAuthor({ name: `Waiting for players ${game.players.length - 1} / ${game.maxPlayers}` });
                await announcement.edit({
                    embeds: [embed]
                });
                await interaction.reply({
                    content: "You left the game",
                    ephemeral: true
                });
            }
            else {
                await DiscordServers_1.default.deleteGame(interaction.guildId, game.hostId);
                const errorEmbed = new discord_js_1.EmbedBuilder()
                    .setAuthor({ name: "Spy Game" })
                    .setTitle("Looks like someone deleted the game announcement ❌")
                    .setFooter({ text: "Game deleted" });
                await interaction.channel.send({
                    embeds: [errorEmbed],
                });
            }
        }
    }
};
