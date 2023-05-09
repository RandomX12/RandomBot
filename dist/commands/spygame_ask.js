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
const cmd_1 = require("../lib/cmd");
const spygame_1 = require("../lib/spygame");
const cmdBody = {
    name: "spygame_ask",
    description: "ask someone about the secret word",
    options: [
        {
            name: "player",
            description: "Choose a player to ask",
            type: discord_js_1.ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: "question",
            description: "write a question",
            type: discord_js_1.ApplicationCommandOptionType.String,
            required: true
        }
    ]
};
module.exports = {
    data: cmdBody,
    async execute(interaction) {
        const server = await (0, DiscordServers_1.getServerByGuildId)(interaction.guildId);
        let gameIndex;
        let playerIndex;
        for (let i = 0; i < server.games.length; i++) {
            for (let j = 0; j < server.games[i].players.length; j++) {
                let ele = server.games[i].players[j];
                if (ele.id === interaction.user.id) {
                    gameIndex = i;
                    playerIndex = j;
                    break;
                }
            }
            if (gameIndex && playerIndex)
                break;
        }
        if (gameIndex === undefined || gameIndex === null) {
            await interaction.reply({
                content: "Could not find the game :x:",
                ephemeral: true
            });
            return;
        }
        const game = server.games[gameIndex];
        if (!(0, spygame_1.isSpyGame)(game))
            return;
        if (!game.started) {
            await interaction.reply({
                content: "game not started :x:",
                ephemeral: true
            });
            return;
        }
        if (playerIndex !== game.index) {
            await interaction.reply({
                content: "It's not your turn to ask :x:",
                ephemeral: true
            });
            return;
        }
        if (game.players[playerIndex].question) {
            await interaction.reply({
                content: `You have already asked <@${game.players[playerIndex].askId}>`,
                ephemeral: true
            });
            return;
        }
        const player = interaction.options.getUser("player");
        const question = interaction.options.getString("question");
        if (player.id === interaction.user.id) {
            await interaction.reply({
                content: "You can't ask yourself :x:",
                ephemeral: true
            });
            return;
        }
        let isIn = false;
        for (let i = 0; i < game.players.length; i++) {
            if (game.players[i].id === player.id) {
                isIn = true;
                break;
            }
        }
        if (!isIn) {
            await interaction.reply({
                content: `<@${player.id}> is not in the game. ask someone in the game`,
                ephemeral: true
            });
            return;
        }
        game.players[playerIndex].askId = player.id;
        game.players[playerIndex].question = question;
        server.games[gameIndex] = game;
        await server.save();
        const reply = await interaction.reply({
            content: "Your question is sent :white_check_mark:",
            ephemeral: true
        });
        setTimeout(async () => {
            await reply.delete();
        }, 3000);
        const announcement = interaction.channel.messages.cache.get(game.announcementId);
        if (announcement) {
            let content = announcement.content.split(/\n/);
            content.splice(content.length - 1, 1);
            await announcement.edit({
                content: content.join("\n") + `<@${interaction.user.id}>'s` + " question : ```" + `${question}` + "```" + `<@${player.id}>'s answer :`
            });
            setTimeout(async () => {
                try {
                    const gameCheck = await DiscordServers_1.default.getGameByHostId(interaction.guildId, game.hostId);
                    if (!(0, spygame_1.isSpyGame)(gameCheck))
                        return;
                    gameCheck.players.map(async (e, i) => {
                        if (e.id === gameCheck.players[playerIndex].askId) {
                            if (!e.answer) {
                                try {
                                    const embed = new discord_js_1.EmbedBuilder()
                                        .setAuthor({ name: "Spy Game" })
                                        .setTitle(`Timed out ${e.username} didn't answer ❌`)
                                        .setFooter({ text: "Game Delted" });
                                    await announcement.edit({
                                        content: "",
                                        embeds: [embed],
                                        components: []
                                    });
                                    await DiscordServers_1.default.deleteGame(interaction.guildId, gameCheck.hostId);
                                }
                                catch (err) {
                                    console.log(err.message);
                                }
                                return;
                            }
                        }
                    });
                }
                catch (err) {
                    (0, cmd_1.error)(err.message);
                }
            }, 1000 * 90);
            return;
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
};
