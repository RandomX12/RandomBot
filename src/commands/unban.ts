import { ApplicationCommandOptionType, ChannelType } from "discord.js";
import Command, { reply, replyError } from "../lib/Commands";
import { QzGame } from "../lib/QuizGame";
import QzGameError from "../lib/errors/QuizGame";

module.exports = new Command({
  data: {
    name: "unban",
    description: `unban a member from a game`,
    options: [
      {
        name: "member",
        description: "choose a member",
        required: true,
        type: ApplicationCommandOptionType.User,
      },
      {
        name: "id",
        description: "game's id",
        required: false,
        type: ApplicationCommandOptionType.String,
      },
    ],
  },
  execute: async (interaction) => {
    const user = interaction.options.getUser("member");
    const gameId = interaction.options.getString("id");
    let game: QzGame;
    if (gameId) {
      game = await QzGame.getGame(gameId);
    } else {
      game = await QzGame.selectOne({
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        mainChannel: false,
      });
    }
    let isBanned = false;
    for (let i = 0; i < game.bannedPlayers.length; i++) {
      if (game.bannedPlayers[i] === user.id) {
        isBanned = true;
        break;
      }
    }
    if (!isBanned) {
      await replyError(
        interaction,
        `<@${user.id}> is not banned in this game https://discord.com/channels/${interaction.guildId}/${game.channelId}/${game.announcementId}`
      );
      return;
    }
    if (!game.mainChannel) {
      const channel = interaction.guild.channels.cache.get(game.channelId);
      if (!channel) throw new QzGameError("408", `game channel not found`);
      if (channel.type !== ChannelType.GuildText)
        throw new QzGameError("304", `game channel is not a GuildText`);
      let per = channel.permissionOverwrites.cache.map((e) => {
        if (e.id === user.id) {
          return {
            ...e,
            deny: e.deny.remove("ViewChannel"),
          };
        }
        return e;
      });
      channel.permissionOverwrites.cache
        .get(user.id)
        ?.deny?.remove("ViewChannel");
      channel.permissionOverwrites.cache
        .get(user.id)
        ?.allow?.add("ViewChannel");
      console.log(per);
      await channel.edit({
        permissionOverwrites: per,
      });
    }
    game.bannedPlayers = game.bannedPlayers.filter((id) => id !== user.id);
    await game.update();
    await reply(interaction, {
      content: `<@${user.id}> is unbanned from the game https://discord.com/channels/${interaction.guildId}/${game.channelId}/${game.announcementId}`,
    });
  },
  ephemeral: true,
  deferReply: true,
  permissions: ["Administrator"],
});
