import axios, { isAxiosError } from "axios";
import { Router } from "express";
import { Bot } from "../lib/Bot";
import { ChannelType, EmbedBuilder, User } from "discord.js";
import { QzGame } from "../lib/QuizGame";
import { warning } from "../lib/cmd";
import QzGameError from "../lib/errors/QuizGame";

const router = Router();

router.get("/:id/:gameId/players/:playerId/kick", async (req, res) => {
  try {
    if (!req.headers.authorization) {
      res.status(401).json({ message: "401 : Unauthorized" });
      return;
    }
    const authorization = req.headers.authorization.split(" ");
    if (authorization.length !== 2) {
      res.status(401).json({ message: "401 : Unauthorized" });
      return;
    }

    if (authorization[0] !== "Bearer" || !authorization[1]) {
      res.status(401).json({ message: "401 : Unauthorized" });
      return;
    }
    const accessToken = authorization[1];
    const user = (
      await axios.get("https://discord.com/api/users/@me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    ).data as User;
    const guildId = req.params.id;
    const guild = Bot.client.guilds.cache.get(guildId);
    if (!guild)
      return res.status(404).json({ message: "404 : guild not found" });
    if (guild.ownerId !== user.id)
      return res.status(401).json({ message: "401 : Unauthorized" });
    const gameId = req.params.gameId;
    const game = await QzGame.getGame(gameId);
    const channel = Bot.client.channels.cache.get(game.channelId);
    if (!channel)
      return res
        .status(500)
        .json({ message: "500 : unable to find game channel" });
    if (channel.type !== ChannelType.GuildText)
      return res.status(500).json({ message: "500 : invalid game channel" });
    const announcement = channel.messages.cache.get(game.announcementId);
    if (!announcement)
      return res
        .status(500)
        .json({ message: "500 : unable to find game announcement" });
    const playerId = req.params.playerId;
    const player = game.players.get(playerId);
    if (!player)
      return res.status(400).json({ message: "400 : player is not in game" });
    game.players.delete(playerId);
    await game.update();
    if (!game.started) {
      await game.updateAnnouncement();
    }
    if (game.started && game.players.size === 0) {
      game.deleteGame("The Game Is Empty");
    }
    res.status(200).json(player);
    try {
      await Bot.client.users.send(player.id, {
        content: `You are kicked from a game in https://discord.com/channels/${guildId}/${channel.id}/${game.announcementId}`,
      });
    } catch (err: any) {
      warning(err.message);
    }
  } catch (err: any) {
    if (err instanceof QzGameError) {
      if (err.code === "404") {
        res.status(404).json({ message: "404 : game not found" });
        return;
      }
      res.status(500).json({ message: "500 : server error" });
    } else if (isAxiosError(err)) {
      res.status(err.response?.status || 500).json({
        message: `${err.response?.status || 500} : ${
          err.response?.statusText || "server error"
        }`,
      });
    } else {
      res.status(500).json({ message: "500 : server error" });
    }
  }
});

module.exports = router;
