import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import Command, { reply, replyError } from "../lib/Commands";
import { QzGame } from "../lib/QuizGame";
import { games } from "..";

module.exports = new Command({
  data: {
    name: "start",
    description: "Start a quiz game",
    options: [
      {
        name: "id",
        description: "game id",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },
  async execute(interaction) {
    let hostId = interaction.options.getString("id");
    if (!hostId) {
      const game = games.select({
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        mainChannel: false,
      })[0];
      if (!game) {
        await replyError(interaction, "no game in this channel");
        return;
      }
      hostId = game.hostId;
    }
    const game = await QzGame.getGame(hostId);
    if (game.players.length === 0) {
      await replyError(
        interaction,
        "cannot start the game : the game is empty"
      );
      return;
    }
    if (game.started) {
      await replyError(interaction, "The game is already started");
      return;
    }
    const announcement = await QzGame.getAnnouncement(interaction, hostId);
    await reply(interaction, {
      content: "game started :white_check_mark:",
    });
    if (!announcement) {
      game.delete();
      const embed = new EmbedBuilder()
        .setAuthor({ name: "Quiz Game" })
        .setTitle("It looks like someone deleted the game announcement ❌")
        .setFooter({ text: "Game deleted" });
      await interaction.channel.send({
        embeds: [embed],
      });
    }
    try {
      await game.executeGame(interaction, announcement);
    } catch (err) {
      game.delete();
    }
  },
  permissions: ["Administrator"],
  ephemeral: true,
});
