"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const QuizGame_1 = __importDefault(require("../lib/QuizGame"));
module.exports = {
    data: {
        name: "answer_[:ans]_[:id]",
        description: "Choose an answer"
    },
    async execute(interaction) {
        if (!interaction.customId.startsWith("answer") || !interaction.customId) {
            await interaction.reply({
                content: "Invalid request :x:",
                ephemeral: true
            });
            return;
        }
        try {
            const hostId = interaction.customId.split("_")[2];
            const ans = interaction.customId.split("_")[1];
            await QuizGame_1.default.setAns(interaction.guildId, hostId, interaction.user.id, ans);
            const inte = await interaction.deferReply({
                ephemeral: true
            });
            await inte.delete();
        }
        catch (err) {
            await interaction.reply({
                content: "Cannot answer :x:",
                ephemeral: true
            });
        }
    }
};
