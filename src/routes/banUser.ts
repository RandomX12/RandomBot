import axios from "axios";
import { Router } from "express";
import { Bot } from "../lib/Bot";
import { ChannelType, User } from "discord.js";
import { games } from "..";
import { QzGame } from "../lib/QuizGame";

const router = Router();

router.get("/:id/:gameId/players/:playerId/ban", async (req, res) => {
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
      await axios.get(`https://discord.com/api/users/@me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    ).data as User;
    const guild = Bot.client.guilds.cache.get(req.params.id);
    if (!guild) {
      res.status(404).json({ message: "404 : guild not found" });
      return;
    }
    if (guild.ownerId !== user.id) {
      res.status(401).json({ message: "401 : Unauthorized" });
      return;
    }
    const g = games.select({
      guildId: req.params.id,
      hostId: req.params.gameId,
    })[0];
    if (!g) {
      res.status(404).json({ message: "404 : game not found" });
      return;
    }
    const game = new QzGame(g.hostId, g.hostUserId).applyData(g);
    const player = (await guild.members.fetch()).get(req.params.playerId);
    if (!player) {
      res.status(404).json({ message: "404 : player not found" });
      return;
    }
    if (guild.ownerId === player.id) {
      res.status(403).json({ message: "403 : You can't ban the owner" });
      return;
    }
    game.removePlayer(player.id);
    game.bannedPlayers.add(player.id);
    const channel = Bot.client.channels.cache.get(game.channelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
      res.status(500).json({ message: "500 : unable to find game channel" });
      return;
    }
    const msg = channel.messages.cache.get(game.announcementId);
    if (!msg) {
      res
        .status(500)
        .json({ message: "500 : unable to find game announcement" });
      return;
    }
    if (!game.started) {
      const embed = game.generateEmbed();
      await msg.edit({
        embeds: [embed],
      });
    }
    if (game.mainChannel) {
      await game.update();
      res.status(200).json(player);
      return;
    }
    const permissionOverwrites = channel.permissionOverwrites.cache
      .map((e) => {
        return {
          id: e.id,
          allow: e.allow.toArray(),
          deny: e.deny.toArray(),
        };
      })
      .filter((e) => e.id !== player.id);
    permissionOverwrites.push({
      id: player.id,
      allow: [],
      deny: ["ViewChannel"],
    });
    await channel.edit({
      permissionOverwrites: permissionOverwrites,
    });
    await game.update();
    res.status(200).json(player);
  } catch (err: any) {
    res.status(500).json({ message: "500 : an unexpected error occurred" });
  }
});

module.exports = router;
