"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const QuizGame_1 = __importDefault(require("../lib/QuizGame"));
module.exports = {
    data: {
        name: "remove_ans",
        description: "remove your answer"
    },
    async execute(interaction) {
        const message = await interaction.deferReply({ ephemeral: true });
        await QuizGame_1.default.removeAns(interaction.guildId, interaction.user.id);
        await message.delete();
    }
};
