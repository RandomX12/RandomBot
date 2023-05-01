"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const DiscordServers_1 = require("../lib/DiscordServers");
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
            await announcement.edit({
                content: announcement.content + "\nquestion :\n ```" + `${question}` + "```" + "\n" + `<@${player.id}> answer :\n`
            });
            return;
        }
    }
};
