import { ApplicationCommandOptionType } from "discord.js";
import Command, { reply, replyError } from "../lib/Commands";
import { QzGame } from "../lib/QuizGame";

module.exports = new Command({
  data: {
    name: "invite",
    description: "Invite a friend to a game",
    options: [
      {
        name: "member",
        description: "a user",
        required: true,
        type: ApplicationCommandOptionType.User,
      },
      {
        name: "game_id",
        description: "game's id",
        required: false,
        type: ApplicationCommandOptionType.String,
      },
    ],
  },
  async execute(interaction) {
    const user = interaction.options.getUser("member");
    const id = interaction.options.getString("game_id");
    if (user.id === interaction.client.user.id) {
      await replyError(interaction, "sorry, I am busy now");
      return;
    }
    if (user.bot) {
      await replyError(
        interaction,
        `Sorry, but bots are not allowed to play quiz game`
      );
      return;
    }
    let game: QzGame;
    if (id) {
      game = await QzGame.getGame(id);
    } else {
      game = await QzGame.selectOne({
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        mainChannel: false,
      });
    }
    if (user.id === interaction.user.id) {
      await reply(
        interaction,
        `here is the game https://discord.com/channels/${game.guildId}/${game.channelId}/${game.announcementId}\nhttps://media.tenor.com/tX_T48A14BwAAAAd/khaby-really.gif`
      );
      return;
    }
    for (let i = 0; i < game.players.length; i++) {
      if (game.players[i].id === user.id) {
        await replyError(interaction, `<@${user.id}> is already in the game`);
        return;
      }
    }
    for (let i = 0; i < game.bannedPlayers.length; i++) {
      if (game.bannedPlayers[i] === user.id) {
        await replyError(
          interaction,
          `<@${user.id}> is banned from joining this game`
        );
        return;
      }
    }
    if (game.invitedPlayers.has(user.id)) {
      await replyError(
        interaction,
        `<@${user.id}> is already invited to this game`
      );
      return;
    }
    await user.send(game.createInvite());
    game.invitedPlayers.add(user.id);
    await game.update();
    await reply(interaction, "invitation sent :white_check_mark:");
  },
  ephemeral: true,
});
