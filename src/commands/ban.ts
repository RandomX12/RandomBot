import { ApplicationCommandOptionType, TextChannel } from "discord.js";
import Command, { reply, replyError } from "../lib/Commands";
import { QzGame } from "../lib/QuizGame";
import { games } from "..";

module.exports = new Command({
  data: {
    name: "ban",
    description: "ban a user from a game",
    options: [
      {
        name: "user",
        description: "choose a user",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "game_id",
        description: "game's id",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },
  execute: async (interaction) => {
    const user = interaction.options.getUser("user");
    if (interaction.guild.ownerId === user.id) {
      await replyError(interaction, "can't ban the server owner from a game");
      return;
    }
    if (interaction.client.user.id === user.id) {
      await replyError(interaction, `i won't let you ban me -_^`);
    }
    const id = interaction.options.getString("game_id");
    let game: QzGame;
    if (!id) {
      let data = games.select({
        channelId: interaction.channelId,
        guildId: interaction.guildId,
        mainChannel: false,
      })[0];
      if (!data) {
        await replyError(interaction, "Game not found try to specify the id");
        return;
      }
      game = new QzGame(data.hostId, data.hostUserId).applyData(data);
      for (let i = 0; i < game.bannedPlayers.length; i++) {
        if (game.bannedPlayers[i] === user.id) {
          await replyError(interaction, `<@${user.id}> is already banned`);
          return;
        }
      }
      game.bannedPlayers.push(user.id);
      game.removePlayer(user.id);
      if (game.started) {
      }
      games.set(game.hostId, game);
    } else {
      game = await QzGame.getGame(id);
      game.removePlayer(user.id);
      game.bannedPlayers.push(user.id);
      await (game as QzGame).update();
    }
    if (game) {
      if (!game.started) {
        const components = [];
        if (game.gameStart === 1 || game.gameStart === 2) {
          components.push(game.generateRow(2));
        }
        if (game.mainChannel) {
          components.push(game.generateRow(0));
        }
        await interaction.channel.messages.cache
          .get(game.announcementId)
          ?.edit({
            components,
            embeds: [game.generateEmbed()],
          });
      }
      if (!game.mainChannel) {
        const channel = interaction.guild.channels.cache.get(game.channelId);
        if (channel) {
          await channel.edit({
            permissionOverwrites: [
              ...(channel as TextChannel).permissionOverwrites.cache.map(
                (e) => e
              ),
              {
                id: user.id,
                allow: [],
                deny: ["ViewChannel", "SendMessages"],
              },
            ],
          });
        }
      }
    }
    await reply(interaction, {
      content: `<@${user.id}> is banned from the game https://discord.com/channels/${interaction.guildId}/${game.channelId}/${game.announcementId}`,
    });
  },
  deferReply: true,
  ephemeral: true,
  permissions: ["Administrator"],
});
