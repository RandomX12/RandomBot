import axios, { isAxiosError } from "axios";
import { Router } from "express";
import { QzGame } from "../lib/QuizGame";
import { games } from "..";
import { Bot } from "../lib/Bot";
import { ChannelType } from "discord.js";
import { warning } from "../lib/cmd";
import { EmbedBuilder } from "@discordjs/builders";

const router = Router();

router.post("/:id/delete", async (req, res) => {
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

    if (!req.body.games || !(req.body.games instanceof Array)) {
      res.status(400).json({ message: "400 : Bad Request" });
      return;
    }
    for (let i = 0; i < req.body.games.length; i++) {
      if (!req.body.games[i] || typeof req.body.games[i] !== "string") {
        res.status(400).json({ message: "400 : Bad Request" });
        return;
      }
    }
    const accessToken = authorization.split(" ")[1];
    const userGuilds: any[] = (
      await axios.get("https://discord.com/api/users/@me/guilds", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    ).data;
    const g = userGuilds.filter((g) => g.id === req.params.id && g.owner)[0];
    if (!g) {
      res.status(400).json({ message: "400 : Bad Request" });
      return;
    }
    const guild = Bot.client.guilds.cache.get(g.id);
    if (!guild) {
      res.status(400).json({ message: "400 : Bad Request" });
      return;
    }
    for (let i = 0; i < req.body.games.length; i++) {
      const game = games.select({ hostId: req.body.games[i] })[0];
      if (!game) continue;
      games.delete(game.hostId);
      const channel = guild.channels.cache.get(game.channelId);
      if (!channel || channel.type !== ChannelType.GuildText) continue;
      const announcement = channel.messages.cache.get(game.announcementId);
      if (!announcement) continue;

      setTimeout(async () => {
        const embed = new EmbedBuilder()
          .setTitle(`Game deleted by the owner`)
          .setFooter({ text: "game deleted" });
        try {
          await announcement.edit({
            content: "",
            components: [],
            embeds: [embed],
          });
        } catch (err: any) {
          warning(err.message);
        }
      }, 0);
      if (!game.mainChannel) {
        setTimeout(async () => {
          try {
            await channel.delete();
          } catch (err: any) {
            warning(err.message);
          }
        }, 20000);
        setTimeout(async () => {
          try {
            await channel.edit({ name: "game deleted 🔴" });
          } catch (err: any) {
            warning(err.message);
          }
        }, 0);
      }
    }
    res.status(200).json();
  } catch (err: any) {
    if (isAxiosError(err)) {
      res.status(err.response.status || 500).json({
        message: `${err.response.status || 500} : ${
          err.response.statusText || "server error"
        }`,
      });
      return;
    }
    res.status(500).json({ message: "500 : server error" });
  }
});

module.exports = router;
