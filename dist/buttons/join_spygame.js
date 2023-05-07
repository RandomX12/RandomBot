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
const spygame_1 = __importStar(require("../lib/spygame"));
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
                let isFull;
                try {
                    isFull = await spygame_1.default.isFull(interaction.guildId, interaction.customId.split("_")[2]);
                }
                catch (err) {
                    await interaction.reply({
                        content: "Game not found :x:",
                        ephemeral: true
                    });
                    throw new Error(err.message);
                }
                if (isFull) {
                    await interaction.reply({
                        content: "This game is full",
                        ephemeral: true
                    });
                    return;
                }
                const game = await DiscordServers_1.default.getGameByHostId(interaction.guildId, interaction.customId.split("_")[2]);
                let isIn = false;
                game.players.map(e => {
                    if (e.id === interaction.user.id) {
                        isIn = true;
                    }
                });
                if (isIn) {
                    await interaction.reply({
                        content: `You are already in the game :x:`,
                        ephemeral: true
                    });
                    return;
                }
                await spygame_1.default.join(interaction.guildId, game.hostId, interaction.user.id);
                const announcement = interaction.channel.messages.cache.get(game.announcementId);
                if (announcement) {
                    const embed = new discord_js_1.EmbedBuilder()
                        .setTitle("Spy Game")
                        .setAuthor({ name: `Waiting for players ${game.players.length + 1} / ${game.maxPlayers}` })
                        .setThumbnail("https://media.istockphoto.com/id/846415384/vector/spy-icon.jpg?s=612x612&w=0&k=20&c=VJI5sbn-wprj6ikxVWxIm3p4fHYAwb2IHmr7lJBXa5g=");
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
                    const gameUpdate = await DiscordServers_1.default.getGameByHostId(interaction.guildId, interaction.customId.split("_")[2]);
                    if (game.maxPlayers === gameUpdate.players.length) {
                        try {
                            const embed = new discord_js_1.EmbedBuilder()
                                .setAuthor({ name: "Spy game is starting 🟢" })
                                .setTitle("Spy Game");
                            await announcement.edit({
                                embeds: [embed],
                                content: "",
                                components: []
                            });
                            const server = await (0, DiscordServers_1.getServerByGuildId)(interaction.guildId);
                            const randomNum = Math.floor(Math.random() * gameUpdate.players.length);
                            const spy = gameUpdate.players[randomNum];
                            gameUpdate.started = true;
                            for (let i = 0; i < gameUpdate.players.length; i++) {
                                try {
                                    if (gameUpdate.players[i].id === spy.id) {
                                        await interaction.client.users.cache.get(gameUpdate.players[i].id).send({
                                            content: `You are the spy in ${interaction.guild.name} \n ${interaction.channel.url}`
                                        });
                                    }
                                    else {
                                        const embed = new discord_js_1.EmbedBuilder()
                                            .setAuthor({ name: "The secret word is :" })
                                            .setTitle(gameUpdate.word)
                                            .setFooter({ text: "rules of the game : \n- Don't tell anyone about the secret word \n- You can ask someone about the color, shape and etc... of the secret word \n- After the game is over, vote for who you think is the spy" });
                                        await interaction.client.users.cache.get(gameUpdate.players[i].id).send({
                                            content: `You are an agent in ${interaction.guild.name} \n ${interaction.channel.url}`,
                                            embeds: [embed]
                                        });
                                    }
                                }
                                catch (err) {
                                    (0, cmd_1.error)(err.message);
                                    await DiscordServers_1.default.deleteGame(interaction.guildId, interaction.customId.split("_")[2]);
                                    const errorEmbed = new discord_js_1.EmbedBuilder()
                                        .setAuthor({ name: "Spy Game" })
                                        .setTitle(`Unable to send role to ${game.players[i].username} ❌`)
                                        .setFooter({ text: "Game deleted" });
                                    await announcement.edit({
                                        embeds: [errorEmbed],
                                        content: "",
                                        components: []
                                    });
                                    throw new Error(`Unable to send role to user id="${game.players[i].id}"`);
                                }
                            }
                            server.games.map((e, i) => {
                                if (e.hostId === interaction.customId.split("_")[2] && (0, spygame_1.isSpyGame)(server.games[i])) {
                                    //@ts-ignore
                                    server.games[i].spy = spy;
                                    //@ts-ignore
                                    server.games[i].started = true;
                                }
                            });
                            embed.setAuthor({ name: "Spy game started !" });
                            await announcement.edit({
                                embeds: [embed],
                                content: `@everyone check your direct message with <@${interaction.client.user.id}> to know your role>` + "\n ```Use /spygame_ask (player) (question)``` ```Use /spygame_answer to answer to the question```",
                                components: []
                            });
                            setTimeout(async () => {
                                try {
                                    await DiscordServers_1.default.getGameByHostId(interaction.guildId, game.hostId);
                                    await announcement.edit({
                                        content: announcement.content + `\n <@${gameUpdate.players[gameUpdate.index].id}> it's your turn to ask someone ${(0, cmd_1.TimeTampNow)()}`,
                                        embeds: []
                                    });
                                    await server.save();
                                    setTimeout(async () => {
                                        try {
                                            const gameCheck = await DiscordServers_1.default.getGameByHostId(interaction.guildId, game.hostId);
                                            if (!gameCheck.players[0].question) {
                                                console.log(gameCheck.players[0]);
                                                const embed = new discord_js_1.EmbedBuilder()
                                                    .setAuthor({ name: "Spy Game" })
                                                    .setTitle(`Timed out ${gameCheck.players[0].username} didn't ask ❌`);
                                                await announcement.edit({
                                                    embeds: [embed],
                                                    content: "",
                                                    components: []
                                                });
                                                await spygame_1.default.delete(interaction.guildId, gameCheck.hostId);
                                                return;
                                            }
                                        }
                                        catch (err) {
                                            (0, cmd_1.error)(err.message);
                                        }
                                    }, 1000 * 90);
                                }
                                catch (err) {
                                    const embed = new discord_js_1.EmbedBuilder()
                                        .setAuthor({ name: "Spy Game" })
                                        .setTitle(`an error occurred while starting the game ❌`);
                                    await spygame_1.default.delete(interaction.guildId, game.hostId);
                                    await announcement.edit({
                                        embeds: [embed],
                                        content: "",
                                        components: []
                                    });
                                }
                            }, 3000);
                        }
                        catch (err) {
                            const embed = new discord_js_1.EmbedBuilder()
                                .setAuthor({ name: "Spy Game" })
                                .setTitle(`an error occurred while starting the game ❌`);
                            await spygame_1.default.delete(interaction.guildId, game.hostId);
                            await announcement.edit({
                                embeds: [embed],
                                content: "",
                                components: []
                            });
                            throw new Error(err.message);
                        }
                    }
                }
                else {
                    await DiscordServers_1.default.deleteGame(interaction.guildId, interaction.customId.split("_")[2]);
                    await interaction.reply({
                        content: "Game announcement not found :x:",
                        ephemeral: true
                    });
                }
            }
        }
        catch (err) {
            (0, cmd_1.error)(err.message);
        }
    }
};
