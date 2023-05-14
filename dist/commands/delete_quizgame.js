"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const QuizGame_1 = __importDefault(require("../lib/QuizGame"));
const DiscordServers_1 = __importDefault(require("../lib/DiscordServers"));
const cmdBody = {
    name: "delete_quizgame",
    description: "Delete a Quiz Game",
    options: [
        {
            name: "id",
            description: "Game id",
            type: discord_js_1.ApplicationCommandOptionType.String,
            required: true,
            maxLength: 15,
            minLength: 13
        }
    ]
};
const permissions = ["Administrator"];
module.exports = {
    data: cmdBody,
    async execute(interaction) {
        const member = interaction.member;
        if (!member.permissions.has("Administrator")) {
            await interaction.reply({
                content: "You don't have the permission to delete the game :x:",
                ephemeral: true
            });
            return;
        }
        try {
            const hostId = interaction.options.getString("id");
            const game = await QuizGame_1.default.getGameWithHostId(interaction.guildId, hostId);
            await DiscordServers_1.default.deleteGame(interaction.guildId, game.hostId);
            const announcement = interaction.channel.messages.cache.get(game.announcementId);
            if (announcement) {
                const deleteEmbed = new discord_js_1.EmbedBuilder()
                    .setTitle(`${interaction.user.tag} deleted the game`)
                    .setAuthor({ name: "Quiz Game" })
                    .setFooter({ text: "Game Deleted" });
                await announcement.edit({
                    content: "",
                    components: [],
                    embeds: [deleteEmbed]
                });
                await interaction.reply({
                    content: "Game deleted :white_check_mark:",
                    ephemeral: true
                });
            }
        }
        catch (err) {
            await interaction.reply({
                content: "Cannot delete the game :x:",
                ephemeral: true
            });
        }
    },
    permissions: permissions
};
