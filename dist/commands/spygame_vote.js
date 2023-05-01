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
    name: "spygame_vote",
    description: "vote",
    options: [
        {
            name: "player",
            description: "the spy",
            type: discord_js_1.ApplicationCommandOptionType.User,
            required: true
        }
    ]
};
module.exports = {
    data: cmdBody,
    async execute(interaction) {
        const server = await (0, DiscordServers_1.getServerByGuildId)(interaction.guildId);
        const game = await spygame_1.default.findGameByUserId(server.games, interaction.user.id);
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
        const user = interaction.options.getUser("player");
        let isIn = false;
        game.players.map((e) => {
            if (user.id === e.id) {
                isIn = true;
            }
        });
        if (!isIn) {
            await interaction.reply({
                content: `<@${user.id}> is not in the game :x:`,
                ephemeral: true
            });
            return;
        }
        let gameIndex = server.games.indexOf(game);
        game.players.map((e, i) => {
            if (e.id === interaction.user.id) {
                game.players[i].vote = user.id;
            }
        });
        server.games[gameIndex] = game;
        await server.save();
        await interaction.reply({
            content: "Vote has been sent :white_check_mark:",
            ephemeral: true
        });
        let playersStr = "";
        game.players.map((e, i) => {
            if (e.vote) {
                playersStr += spygame_1.numberEmojisStyled[i] + `${e.username}\t voted\n`;
            }
            else {
                playersStr += spygame_1.numberEmojisStyled[i] + `${e.username}\n`;
            }
        });
        const announcement = interaction.channel.messages.cache.get(game.announcementId);
        if (announcement) {
            const embed = new discord_js_1.EmbedBuilder()
                .setAuthor({ name: "Spy Game" })
                .setTitle("Who you think is the imposter ? \n vote for the spy")
                .setFields({ name: "Players", value: playersStr })
                .setTimestamp(Date.now());
            let voteCount = 0;
            game.players.map(e => {
                if (e.vote) {
                    voteCount++;
                }
            });
            if (voteCount === game.maxPlayers) {
                game.players.map((e) => {
                    if (e.vote) {
                        game.players.map((ele, i) => {
                            if (e.vote === ele.id) {
                                game.players[i].votedCount++;
                            }
                        });
                    }
                });
                let votedPlayer = game.players.reduce((pe, ce) => {
                    return ce.votedCount > pe.votedCount ? ce : pe;
                });
                let draw = [];
                if (votedPlayer.votedCount === 0) {
                    embed.addFields({ name: `Nobody voted 🟡`, value: "--" });
                }
                else {
                    game.players.map((e) => {
                        if (votedPlayer.votedCount === e.votedCount) {
                            draw.push(e);
                        }
                    });
                    if (draw.length > 0) {
                        embed.addFields({ name: `Draw 🟡`, value: "--" });
                    }
                    else {
                        embed.addFields({ name: `${votedPlayer.username}`, value: "Is" });
                    }
                }
                await announcement.edit({
                    embeds: [embed],
                    components: []
                });
                game.end = true;
                server.games[server.games.indexOf(game)] = game;
                await server.save();
                const embed1 = new discord_js_1.EmbedBuilder()
                    .setAuthor({ name: "Spy Game" })
                    .addFields({ name: "Players", value: playersStr })
                    .setTimestamp(Date.now());
                if (votedPlayer.votedCount === 0) {
                    embed1.addFields({ name: `Nobody voted 🟡`, value: "--" });
                    embed1.addFields({ name: `${game.spy.username}`, value: `Is The Spy \n Spy wins 🔴` });
                }
                else if (draw.length > 0) {
                    embed1.addFields({ name: `Draw 🟡`, value: "--" });
                    embed1.addFields({ name: `${game.spy.username}`, value: `Is The Spy \n Spy wins 🔴` });
                }
                else {
                    if (votedPlayer.id === game.spy.id) {
                        embed1.addFields({ name: `${votedPlayer.username}`, value: `Is The Spy ✅ \n Agents win 🔵` });
                    }
                    else {
                        embed1.addFields({ name: `${votedPlayer.username}`, value: `Is Not The Spy ❌ \n Spy wins 🔴` });
                    }
                }
                setTimeout(async () => {
                    await announcement.edit({
                        embeds: [embed1],
                        components: [],
                        content: ""
                    });
                }, 5000);
                setTimeout(async () => {
                    await spygame_1.default.delete(interaction.guildId, game.hostId);
                }, 1000 * 10);
                return;
            }
            await announcement.edit({
                embeds: [embed],
                components: []
            });
        }
    }
};
