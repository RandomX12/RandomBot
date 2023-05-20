"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const QuizGame_1 = __importDefault(require("../lib/QuizGame"));
const DiscordServers_1 = __importDefault(require("../lib/DiscordServers"));
module.exports = {
    data: {
        name: "delete_quiz_[:id]",
        description: "Delete a quiz game"
    },
    async execute(interaction) {
        if (!interaction?.customId?.startsWith("delete_quiz")) {
            await interaction.reply({
                content: "Invalid request :x:",
                ephemeral: true
            });
            return;
        }
        const hostUserId = interaction.customId.split("_")[2];
        try {
            const msg = await interaction.deferReply({ ephemeral: true });
            const game = await QuizGame_1.default.getQuizGamewithHostUserId(interaction.guildId, hostUserId);
            if (game.started)
                throw new Error(`Game started`);
            await DiscordServers_1.default.deleteGame(interaction.guildId, game.hostId);
            const channel = await interaction.guild.channels.cache.get(game.channelId)?.fetch();
            const announcement = channel.messages.cache.get(game.announcementId);
            if (game.mainChannel) {
                await msg.delete();
                await announcement.delete();
                return;
            }
            if (announcement) {
                await announcement.delete();
            }
            await channel.delete();
            await msg.delete();
            return;
        }
        catch (err) {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    content: "You can't delete this game 🙄",
                });
            }
            else {
                await interaction.reply({
                    content: "You can't delete this game 🙄",
                    ephemeral: true
                });
            }
        }
    }
};
