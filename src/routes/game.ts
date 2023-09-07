import axios, { isAxiosError } from "axios";
import { Router } from "express";
import { games } from "..";
import { Bot } from "../lib/Bot";
import { ChannelType, EmbedBuilder } from "discord.js";
import { warning } from "../lib/cmd";

const router = Router();

router.delete("/:id/:gameId", async (req, res) => {
  try {
    if (!req.headers.authorization) {
      res.status(401).json({ message: "401 : Unauthorized" });
      return;
    }
    const authorization = req.headers.authorization;
    if (
      authorization.split(" ")[0] !== "Bearer" ||
      authorization.split(" ").length !== 2
    ) {
      res.status(401).json({ message: "401 : Unauthorized" });
      return;
    }
    const accessToken = authorization.split(" ")[1];
    const userGuilds: any[] = (
      await axios.get("https://discord.com/api/users/@me/guilds", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    ).data;
    const guildId = req.params.id;
    if (
      userGuilds.filter((g) => g.id === req.params.id && g.owner).length === 0
    ) {
      res.status(400).json({ message: "400 : Bad Request" });
      return;
    }
    const gameId = req.params.gameId;
    const game = games.select({ hostId: gameId })[0];
    if (!game) {
      res.status(400).json({ message: "400 : Bad Request" });
      return;
    }
    games.delete(gameId);
    res.status(200).json();
    const c = Bot.client.channels.cache.get(game.channelId);
    if (!c || c?.type !== ChannelType.GuildText) return;
    const message = c.messages.cache.get(game.announcementId);
    if (!message) return;
    const embed = new EmbedBuilder()
      .setTitle(`Game deleted by the owner`)
      .setFooter({ text: "game deleted" })
      .setTimestamp();
    await message.edit({
      content: "",
      components: [],
      embeds: [embed],
    });
    if (!game.mainChannel) {
      const channel = await c.fetch();
      setTimeout(async () => {
        try {
          await channel.delete();
        } catch (err: any) {
          warning(`an error occurred while deleting the channel`);
        }
      }, 20000);
      await channel.edit({ name: "game deleted 🔴" });
    }
  } catch (err: any) {
    if (isAxiosError(err)) {
      res.status(err.response?.status || 500).json({
        message: `${err.response?.status} : ${err.response?.statusText}`,
      });
      return;
    }
    res.status(500).json({ message: "500 : server error" });
  }
});

module.exports = router;
