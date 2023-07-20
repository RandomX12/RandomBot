import { ButtonInteraction, CacheType, EmbedBuilder } from "discord.js";
import DiscordServers, { getServerByGuildId } from "../lib/DiscordServers";
import { QzGame } from "../lib/QuizGame";
import { warning } from "../lib/cmd";
import { ButtonCommand, reply } from "../lib/Commands";

module.exports = new ButtonCommand({
  data: {
    name: "leave",
    description: "Leave a Quiz Game",
  },
  async execute(interaction: ButtonInteraction<CacheType>) {
    if (
      !interaction.customId ||
      !interaction.customId.startsWith("leave_quizgame")
    ) {
      await reply(interaction, {
        content: "Invalid request :x:",
        ephemeral: true,
      });
      return;
    }
    const hostId = interaction.customId.split("_")[2];
    const isIn = await QzGame.isIn(hostId, interaction.user.id);
    if (!isIn) {
      await reply(interaction, {
        content: "You are not in this quiz game :x:",
        ephemeral: true,
      });
      return;
    }
    const game = await QzGame.getGame(hostId);
    game.removePlayer(interaction.user.id);
    await game.update();
    await reply(interaction, {
      content: "You left the game :white_check_mark:",
      ephemeral: true,
    });
    const announcement = await QzGame.getAnnouncement(interaction, hostId);
    if (game.started) {
      if (game.players.length === 0) {
        DiscordServers.deleteGame(game.hostId);
        if (announcement) {
          const deleteEmbed = new EmbedBuilder()
            .setTitle("No one else in the game ❌")
            .setFooter({ text: "Game Deleted" })
            .setAuthor({ name: "Quiz Game" });
          await announcement.edit({
            embeds: [deleteEmbed],
            components: [],
            content: "",
          });
        }
        setTimeout(async () => {
          try {
            await announcement?.delete();
          } catch (err) {
            warning(err.message);
          }
        }, 5000);
        if (!game.mainChannel) {
          setTimeout(async () => {
            try {
              await announcement.channel.delete();
            } catch (err: any) {
              warning(err.message);
            }
          }, 1000 * 10);
          await announcement.channel.edit({ name: "Game end 🔴" });
          return;
        }
      }
      return;
    }
    if (announcement) {
      const embed = game.generateEmbed();
      await announcement.edit({
        embeds: [embed],
      });
      return;
    } else {
      const channel = await QzGame.getChannel(interaction, hostId);
      DiscordServers.deleteGame(game.hostId);
      const embed = new EmbedBuilder()
        .setAuthor({ name: "Quiz Game" })
        .setTitle("It looks like someone deleted the game announcement ❌")
        .setFooter({ text: "Game deleted" });
      await interaction.channel.send({
        embeds: [embed],
      });
      if (!game.mainChannel) {
        if (!channel) return;
        setTimeout(async () => {
          try {
            await channel.delete();
          } catch (err: any) {
            warning(err.message);
          }
        }, 10 * 1000);
      }
      return;
    }
  },
  ephemeral: true,
});
