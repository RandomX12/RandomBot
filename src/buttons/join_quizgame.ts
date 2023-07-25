import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  CacheType,
  EmbedBuilder,
} from "discord.js";
import DiscordServers from "../lib/DiscordServers";
import { QzGame } from "../lib/QuizGame";
import { error, warning } from "../lib/cmd";
import { gameStartType } from "../lib/DiscordServersConfig";
import { ButtonCommand, reply, replyError } from "../lib/Commands";

module.exports = new ButtonCommand({
  data: {
    name: "join",
    description: "Join a Quiz Game",
  },
  async execute(interaction: ButtonInteraction<CacheType>) {
    if (!interaction.customId || !interaction.customId.startsWith("join")) {
      await replyError(interaction, "Invalid request");
      return;
    }
    const isIn = DiscordServers.isInGame(
      interaction.guildId,
      interaction.user.id
    );
    if (isIn) {
      const game = await QzGame.getGameWithUserId(
        interaction.guildId,
        interaction.user.id
      );
      const row: any = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`leave_quizgame_${game.hostId}`)
          .setLabel("leave")
          .setStyle(4)
      );
      await replyError(interaction, "You are already in a game", [row]);
      return;
    }
    const hostId = interaction.customId.split("_")[2];
    const isFull = await DiscordServers.isGameFull(hostId);

    if (isFull) {
      await replyError(interaction, "This Game is full");
      return;
    }
    const game = await QzGame.getGame(hostId);
    game.players.push({
      id: interaction.user.id,
      username: interaction.user.username,
    });
    await game.update();
    const embed = game.generateEmbed();
    const announcement = interaction.channel.messages.cache.get(
      game.announcementId
    );
    if (announcement) {
      await announcement.edit({
        embeds: [embed],
      });
      await reply(interaction);
    } else {
      const channel = await QzGame.getChannel(interaction, hostId);
      DiscordServers.deleteGame(hostId);
      const embed = new EmbedBuilder()
        .setAuthor({ name: "Quiz Game" })
        .setTitle("It looks like someone deleted the game announcement ❌")
        .setFooter({ text: "Game deleted" });
      await interaction.channel.send({
        embeds: [embed],
      });
      if (!game.mainChannel || channel) {
        setTimeout(async () => {
          try {
            await channel?.delete();
          } catch (err) {
            warning(err.message);
          }
        }, 10 * 1000);
      }
      return;
    }
    // Game start
    let allReady = true;
    if (
      game.gameStart === gameStartType.READY ||
      game.gameStart === gameStartType.FULL_READY
    ) {
      for (let i = 0; i < game.players.length; i++) {
        if (!game.players[i].ready) {
          allReady = false;
          break;
        }
      }
    }
    if (
      (game.players.length === game.maxPlayers &&
        game.gameStart === gameStartType.AUTO) ||
      (game.gameStart === gameStartType.READY && allReady) ||
      (game.gameStart === gameStartType.FULL_READY &&
        game.players.length === game.maxPlayers &&
        allReady)
    ) {
      try {
        await game.executeGame(interaction, announcement);
      } catch (err: any) {
        try {
          const announcement = await QzGame.getAnnouncement(
            interaction,
            hostId
          );
          DiscordServers.deleteGame(hostId);
          error(err);
          await announcement.edit({
            content:
              "an error occured while starting the game :x:\nThe game is deleted",
          });
          if (!game.mainChannel) {
            if (announcement) {
              setTimeout(async () => {
                try {
                  await announcement.channel.delete();
                } catch (err: any) {
                  warning(`An error occured while deleting the game channel`);
                }
              }, 1000 * 10);
            }
          }
        } catch (err: any) {
          warning(err?.message);
        }
      }
    }
  },
  ephemeral: true,
  deferReply: true,
});
