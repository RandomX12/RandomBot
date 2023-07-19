import { CacheType, ChatInputCommandInteraction } from "discord.js";
import Command, { reply } from "../lib/Commands";

interface Info {
  website: string;
  commands: string;
  server: string;
}

module.exports = new Command({
  data: {
    name: "help",
    description: "Do you need help using the bot ?",
  },
  async execute(interaction: ChatInputCommandInteraction<CacheType>) {
    const info: Info = require("../../config.json").info;
    await reply(interaction, {
      content: `Website : ${info.website}
commands : ${info.commands}
server   : ${info.server}`,
      ephemeral: true,
    });
  },
  ephemeral: true,
});
