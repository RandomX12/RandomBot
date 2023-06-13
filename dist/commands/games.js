"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const DiscordServers_1 = require("../lib/DiscordServers");
const QuizGame_1 = require("../lib/QuizGame");
// still under dev
module.exports = {
    data: {
        name: "games",
        description: "Liste all the games"
    },
    async execute(interaction) {
        const server = await (0, DiscordServers_1.fetchServer)(interaction.guildId);
        let v = "";
        server.games.map((e) => {
            v += e.hostName + " | id : " + e.hostId + ` <#${e.channelId}>` + "\n";
        });
        if (!v) {
            v = "There is no game right now";
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`Quiz Games`)
            .addFields({ name: "Games", value: v })
            .setThumbnail(QuizGame_1.QuizCategoryImg.Random)
            .setFooter({ text: `${server.games.length} game` });
        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};
