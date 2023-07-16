import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import Command, { reply } from "../lib/Commands";
import { QzGame } from "../lib/QuizGame";
import { warning } from "../lib/cmd";

module.exports = new Command({
  data: {
    name: "kick",
    description: "kicks a player",
    options: [
      {
        name: "player",
        description: "player",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
    ],
  },
  async execute(interaction) {
    const user = interaction.options.getUser("player");
    if (user.id === interaction.client.user.id) {
      await reply(interaction, {
        content: "nah i don't kick myself :)",
        ephemeral: true,
      });
      return;
    }
    const game = await QzGame.getGameWithUserId(interaction.guildId, user.id);
    game.removePlayer(user.id);
    await game.update();
    if (!game.started) {
      const announcement = await QzGame.getAnnouncement(
        interaction,
        game.hostId
      );
      if (announcement) {
        const embed = game.generateEmbed();
        await announcement.edit({
          embeds: [embed],
        });
      } else {
        const channel = await QzGame.getChannel(interaction, game.hostId);
        game.delete();
        const embed = new EmbedBuilder()
          .setAuthor({ name: "Quiz Game" })
          .setTitle("It looks like someone deleted the game announcement ❌")
          .setFooter({ text: "Game deleted" });
        const msg = await channel?.send({
          embeds: [embed],
        });
        setTimeout(async () => {
          try {
            if (!game.mainChannel || channel) {
              await channel?.delete();
              return;
            }
            await msg.delete();
          } catch (err) {
            warning(err.message);
          }
        }, 5000);
        return;
      }
    } else {
      if (game.players.length === 0) {
        const announcement = await QzGame.getAnnouncement(
          interaction,
          game.hostId
        );
        const embed = new EmbedBuilder()
          .setTitle("Quiz Game")
          .setAuthor({ name: "The game is empty" })
          .setFooter({ text: "Game Deleted" });
        game.delete();
        if (announcement) {
          await announcement.edit({
            content: "",
            embeds: [embed],
            components: [],
          });
        }
        if (!game.mainChannel) {
          setTimeout(async () => {
            try {
              await announcement.channel.delete();
            } catch (err) {
              warning(err.message);
            }
          }, 10 * 1000);
        }
      }
    }
    await reply(interaction, {
      content: `<@${user.id}> kicked from the game in <#${game.channelId}>`,
      ephemeral: true,
    });
    await user.send({
      content: `You are kicked from a quiz game in <#${game.channelId}>`,
    });
  },
  ephemeral: true,
  permissions: ["Administrator"],
});
