import {
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { QuizCategoryImg, QzGame } from "../lib/QuizGame";
import Command, { reply } from "../lib/Commands";
// still under dev
module.exports = new Command({
  data: {
    name: "games",
    description: "Liste all the games",
  },
  async execute(interaction: ChatInputCommandInteraction<CacheType>) {
    const games = QzGame.getServerGames(interaction.guildId);
    let v = "";
    games.map((e) => {
      v += e.hostName + " | id : " + e.hostId + ` <#${e.channelId}>` + "\n";
    });
    if (!v) {
      v = "There is no game right now";
    }
    const embed = new EmbedBuilder()
      .setTitle(`Quiz Games`)
      .addFields({ name: "Games", value: v })
      .setThumbnail(QuizCategoryImg.Random)
      .setFooter({ text: `${games.length} game` });
    await reply(interaction, {
      embeds: [embed],
      ephemeral: true,
    });
  },
  ephemeral: true,
});
