import {
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { QuizCategoryImg, QzGame } from "../lib/QuizGame";
import Command, { reply } from "../lib/Commands";
module.exports = new Command({
  data: {
    name: "games",
    description: "Liste all the games",
  },
  async execute(interaction: ChatInputCommandInteraction<CacheType>) {
    const games = QzGame.getServerGames(interaction.guildId);
    let v = "";
    if (games.length > 8) {
      games.map((e) => {
        v += e.hostName + " | id : " + e.hostId + ` <#${e.channelId}>` + "\n";
      });
    } else {
      games.map((e) => {
        v +=
          e.hostName +
          " | id : " +
          e.hostId +
          ` https://discord.com/channels/${interaction.guildId}/${e.channelId}/${e.announcementId}` +
          "\n";
      });
    }
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
