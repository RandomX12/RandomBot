"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const DiscordServers_1 = require("../lib/DiscordServers");
const QuizGame_1 = require("../lib/QuizGame");
const permissions = ["Administrator"];
module.exports = {
    data: {
        name: "delete_all",
        description: "Delete all the games"
    },
    async execute(interaction) {
        if (!interaction.isChatInputCommand())
            return;
        const server = await (0, DiscordServers_1.getServerByGuildId)(interaction.guildId);
        if (!server.games || server.games.length === 0) {
            await interaction.reply({
                content: "There is no game in this server",
                ephemeral: true
            });
            return;
        }
        const modal = new discord_js_1.ModalBuilder()
            .setTitle("Do you really want to delete all games ?")
            .setCustomId("deleteall");
        const inp = new discord_js_1.TextInputBuilder()
            .setCustomId("yes_deleteall")
            .setLabel("write yes if you want to delete all the games")
            .setStyle(1)
            .setValue("");
        const row = new discord_js_1.ActionRowBuilder().addComponents(inp);
        modal.addComponents(row);
        await interaction.showModal(modal);
        try {
            const listen = await interaction.awaitModalSubmit({ filter: (id) => id.customId === "deleteall", time: 15 * 1000 });
            const res = listen.fields.getTextInputValue("yes_deleteall");
            if (res === "yes") {
                server.games?.map(async (e) => {
                    try {
                        if (!(0, QuizGame_1.isQuizGame)(e))
                            return;
                        if (e.mainChannel)
                            return;
                        const channel = interaction.guild.channels.cache.get(e.channelId);
                        if (!channel)
                            return;
                        await channel.delete();
                    }
                    catch (err) {
                        return;
                    }
                });
                server.games = [];
                await server.save();
                await listen.reply({
                    content: "All games are deleted :white_check_mark:",
                    ephemeral: true
                });
                return;
            }
            await listen.reply({
                content: "The deletion is cancelled",
                ephemeral: true
            });
            return;
        }
        catch (err) {
            return;
        }
    },
    permissions: permissions
};
