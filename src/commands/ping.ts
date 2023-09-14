import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  CacheType,
  EmbedBuilder,
} from "discord.js";
import Command, { reply } from "../lib/Commands";
import { Bot } from "../lib/Bot";
import { games } from "..";

module.exports = new Command({
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("test the bot"),
  async execute(interaction: ChatInputCommandInteraction<CacheType>) {
    const date = Date.now();
    const version: string = require("../../package.json").version;
    await reply(interaction, {
      content: "...",
      ephemeral: true,
    });
    const embed = new EmbedBuilder().setColor(0x6dfd7d);
    const after = Date.now();
    embed.setTitle("pong :white_check_mark:");
    embed
      .setDescription(
        `**Response Time** : ${after - date}ms \n**Uptime** : ${
          Bot.uptime
        }\n**Games** : ${games.size}`
      )
      .setFooter({
        iconURL: interaction.client.user.avatarURL(),
        text: `${interaction.client.user.username} v${version}`,
      });
    await reply(interaction, {
      embeds: [embed],
      content: "",
    });
  },
  ephemeral: true,
});
