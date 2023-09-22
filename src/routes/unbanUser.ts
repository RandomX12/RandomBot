import { Router } from "express";
import { verifyAccessToken } from "../server";
import axios, { isAxiosError } from "axios";
import { Bot } from "../lib/Bot";
import { ChannelType, User } from "discord.js";
import { QzGame } from "../lib/QuizGame";
import QzGameError from "../lib/errors/QuizGame";

const router = Router();

router.get("/:id/:gameId/players/:playerId/unban", async (req, res) => {
  try {
    const accessToken = verifyAccessToken(req.headers.authorization);
    if (!accessToken) {
      res.status(401).json({ message: "401 : Unauthorized" });
      return;
    }
    const user: User = (
      await axios.get(process.env.DISCORD_API + `users/@me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    ).data;
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
    const playerId = req.params.playerId;
    if (!game.bannedPlayers.has(playerId)) {
      res
        .status(400)
        .json({ message: "400 : this player is not banned from the game" });
      return;
    }
    game.bannedPlayers.delete(playerId);
    await game.update();
    if (game.mainChannel) {
      res.status(200).json();
      return;
    }
    const per = channel.permissionOverwrites.cache;
    per.delete(playerId);
    await channel.edit({
      permissionOverwrites: per,
    });
    res.status(200).json();
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
