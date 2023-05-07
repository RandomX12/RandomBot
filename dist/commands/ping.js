"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("ping")
        .setDescription("test the bot"),
    async execute(interaction) {
        const date = Date.now();
        const version = require("../../package.json").version;
        await interaction.reply({
            content: "...",
            ephemeral: true
        });
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x6dfd7d);
        const after = Date.now();
        embed.setTitle("pong :white_check_mark:  \n \n " + `**${after - date}ms** \n`);
        embed.setFooter({ text: `${version}V` });
        await interaction.editReply({
            embeds: [embed],
            content: ""
        });
    }
};
