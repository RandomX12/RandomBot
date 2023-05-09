"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const DiscordServers_1 = __importDefault(require("../lib/DiscordServers"));
const QuizGame_1 = require("../lib/QuizGame");
module.exports = {
    data: {
        name: "join_quizgame_[:id]",
        description: "Join a Quiz Game"
    },
    async execute(interaction) {
        if (!interaction.customId || !interaction.customId.startsWith("join_quizgame")) {
            await interaction.reply({
                content: "Invalid request :x:",
                ephemeral: true
            });
            return;
        }
        const isIn = await DiscordServers_1.default.isInGame(interaction.guildId, interaction.user.id);
        if (isIn) {
            await interaction.reply({
                content: "You are already in this game :x:",
                ephemeral: true
            });
            return;
        }
        const hostId = interaction.customId.split("_")[2];
        const isFull = await DiscordServers_1.default.isGameFull(interaction.guildId, hostId);
        if (isFull) {
            await interaction.reply({
                content: "This Game is full :x:",
                ephemeral: true
            });
            return;
        }
        try {
            await QuizGame_1.QuizGame.join(interaction.guildId, hostId, interaction.user.id);
        }
        catch (err) {
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({
                    content: "an error occurred while trying to join the game",
                });
            }
            else {
                await interaction.reply({
                    content: "an error occurred while trying to join the game",
                    ephemeral: true
                });
            }
            return;
        }
        const game = await DiscordServers_1.default.getGameByHostId(interaction.guildId, hostId);
        if (!(0, QuizGame_1.isQuizGame)(game))
            return;
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`Quiz Game`)
            .setThumbnail("https://hips.hearstapps.com/hmg-prod/images/quiz-questions-answers-1669651278.jpg")
            .addFields({ name: `Info`, value: `Category : **${game?.category}** \nAmount : **${game.amount}** \nMax players : **${game.maxPlayers}**` })
            .setAuthor({ name: `Waiting for the players... ${game.players.length} / ${game.maxPlayers}` })
            .setTimestamp(Date.now());
        const announcement = interaction.channel.messages.cache.get(game.announcementId);
        if (announcement) {
            await announcement.edit({
                embeds: [embed]
            });
            const button = new discord_js_1.ButtonBuilder()
                .setLabel("Leave")
                .setCustomId("leave_quizgame_" + game.hostId)
                .setStyle(4);
            const row = new discord_js_1.ActionRowBuilder()
                .setComponents(button);
            await interaction.reply({
                content: "You joined the game :white_check_mark:",
                components: [row],
                ephemeral: true
            });
        }
        else {
            await DiscordServers_1.default.deleteGame(interaction.guildId, hostId);
            const embed = new discord_js_1.EmbedBuilder()
                .setAuthor({ name: "Quiz Game" })
                .setTitle("It looks like someone deleted the game announcement ❌")
                .setFooter({ text: "Game deleted" });
            await interaction.channel.send({
                embeds: [embed],
            });
            return;
        }
        // Game start
        if (game.players.length === game.maxPlayers) {
            await announcement.edit({
                content: "Starting the game..."
            });
        }
    }
};
