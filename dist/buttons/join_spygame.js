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
const DiscordServers_1 = __importStar(require("../lib/DiscordServers"));
const spygame_1 = __importDefault(require("../lib/spygame"));
const cmd_1 = require("../lib/cmd");
module.exports = {
    data: {
        name: "join_spygame_[:id]",
        description: "Join a Spy game"
    },
    async execute(interaction) {
        try {
            if (interaction.user.id === interaction.customId.split("_")[2]) {
                await interaction.reply({
                    content: "You are already the host of this game :x:",
                    ephemeral: true
                });
                return;
            }
            if (interaction.customId.startsWith("join_spygame")) {
                const isFull = await spygame_1.default.isFull(interaction.guildId, interaction.customId.split("_")[2]);
                if (isFull) {
                    await interaction.reply({
                        content: "This game is full",
                        ephemeral: true
                    });
                    return;
                }
                const game = await DiscordServers_1.default.getGameByHostId(interaction.guildId, interaction.customId.split("_")[2]);
                await spygame_1.default.join(interaction.guildId, game.hostId, interaction.user.id);
                const announcement = interaction.channel.messages.cache.get(game.announcementId);
                if (announcement) {
                    const embed = new discord_js_1.EmbedBuilder()
                        .setTitle("Spy Game")
                        .setAuthor({ name: `Waiting for players ${game.players.length + 1} / ${game.maxPlayers}` });
                    await announcement.edit({
                        embeds: [embed]
                    });
                    const button = new discord_js_1.ButtonBuilder()
                        .setCustomId(`leave_spygame_${interaction.customId.split("_")[2]}`)
                        .setStyle(4)
                        .setLabel("leave");
                    const row = new discord_js_1.ActionRowBuilder()
                        .addComponents(button);
                    await interaction.reply({
                        content: "you have joined the game :white_check_mark:",
                        ephemeral: true,
                        components: [row]
                    });
                }
                const gameUpdate = await DiscordServers_1.default.getGameByHostId(interaction.guildId, interaction.customId.split("_")[2]);
                if (game.maxPlayers === gameUpdate.players.length) {
                    const embed = new discord_js_1.EmbedBuilder()
                        .setAuthor({ name: "Spy game is starting 🟢" })
                        .setTitle("Spy Game");
                    await announcement.edit({
                        embeds: [embed],
                        content: ""
                    });
                    setTimeout(async () => {
                        await interaction.channel.send({
                            content: "**Spy game started !**"
                        });
                    }, 2000);
                    const randomNum = Math.floor(Math.random() * gameUpdate.players.length);
                    const server = await (0, DiscordServers_1.getServerByGuildId)(interaction.guildId);
                    const spy = game.players[randomNum];
                    server.games.map((e, i) => {
                        if (e.hostId === interaction.customId.split("_")[2]) {
                            server.games[i].spy = spy;
                        }
                    });
                    await server.save();
                    console.log(gameUpdate.players);
                    gameUpdate.players.map(async (e) => {
                        try {
                            if (e.id === spy.id) {
                                await interaction.client.users.cache.get(e.id).send({
                                    content: `You are the spy in ${interaction.guild.name} \n ${interaction.channel.url}`
                                });
                            }
                            else {
                                const embed = new discord_js_1.EmbedBuilder()
                                    .setAuthor({ name: "The Random word is :" })
                                    .setTitle(gameUpdate.word);
                                await interaction.client.users.cache.get(e.id).send({
                                    content: `You are an agent in ${interaction.guild.name} \n ${interaction.channel.url}`,
                                    embeds: [embed]
                                });
                            }
                        }
                        catch (err) {
                            (0, cmd_1.error)(err.message);
                        }
                    });
                }
            }
        }
        catch (err) {
            (0, cmd_1.error)(err.message);
        }
    }
};
