import {
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import Command, { reply } from "../lib/Commands";

interface Info {
  website: string;
  commands: string;
  server: string;
  docs: string;
  dashboard: string;
}

module.exports = new Command({
  data: {
    name: "help",
    description: "Do you need help using the bot ?",
  },
  async execute(interaction: ChatInputCommandInteraction<CacheType>) {
    const info: Info = require("../../config.json").info;
    const version: string = require("../../package.json").version;
    const embed = new EmbedBuilder()
      .setTitle("Do you need help using the bot ?\nthese links can help you")
      .setDescription(
        `
**[Documentation](${info.docs})**
**[Dashboard](${info.dashboard}${interaction.guildId})**
**[Website](${info.website})**
`
      )
      .setFooter({
        iconURL: interaction.client.user.avatarURL(),
        text: `${interaction.client.user.username} v${version}`,
      })
      .setColor("#14ff00");
    await reply(interaction, {
      embeds: [embed],
      ephemeral: true,
    });
  },
  ephemeral: true,
});
