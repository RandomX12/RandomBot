import { ButtonInteraction, CacheType } from "discord.js";
import { QzGame } from "../lib/QuizGame";
import { ButtonCommand, reply } from "../lib/Commands";
import { gameStartType } from "../lib/DiscordServersConfig";
import { error } from "../lib/cmd";
import handleError from "../lib/errors/handler";

module.exports = new ButtonCommand({
  data: {
    name: "ready",
    description: "ready",
  },
  async execute(interaction: ButtonInteraction<CacheType>) {
    const hostId = interaction.customId?.split("_")[1];
    if (!hostId) {
      await reply(interaction, {
        content: "unknown game id",
        ephemeral: true,
      });
      return;
    }
    const inGame = await QzGame.isIn(hostId, interaction.user.id);
    if (!inGame) {
      await reply(interaction, {
        content: `You are not in this game`,
        ephemeral: true,
      });
      return;
    }
    const game = await QzGame.getGame(hostId);
    if (game.isReady(interaction.user.id)) {
      await interaction.deleteReply();
      return;
    }
    game.setPlayerReady(interaction.user.id, true);
    await game.update();
    const embed = game.generateEmbed();
    const announcement = await QzGame.getAnnouncement(interaction, hostId);
    await announcement.edit({
      embeds: [embed],
    });
    await interaction.deleteReply();
    let allReady = true;
    const players = Array.from(game.players.values());
    players.map((e) => {
      if (!e.ready) {
        allReady = false;
      }
    });
    if (
      (game.gameStart === gameStartType.READY && allReady) ||
      (game.gameStart === gameStartType.FULL_READY &&
        allReady &&
        game.maxPlayers === game.players.size)
    ) {
      await game.executeGame();
    }
  },
  ephemeral: true,
});
