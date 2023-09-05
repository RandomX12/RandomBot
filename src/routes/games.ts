import axios, { isAxiosError } from "axios";
import express from "express";
import { games } from "..";
import { QzGame } from "../lib/QuizGame";
import { Bot } from "../lib/Bot";
import { ChannelType, EmbedBuilder } from "discord.js";
import { warning } from "../lib/cmd";
const router = express.Router();

router.get("/:id", async (req, res) => {
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
    const guild = (
      await axios.get(`https://discord.com/api/guilds/${req.params.id}`, {
        headers: {
          Authorization: `Bot ${process.env.TOKEN}`,
        },
      })
    ).data;
    const user = (
      await axios.get(`https://discord.com/api/users/@me`, {
        headers: {
          Authorization: authorization,
        },
      })
    ).data;
    if (guild.owner_id === user.id) {
      res.status(200).json(
        games.select({ guildId: req.params.id }).map((e) => {
          return { ...e, quiz: undefined };
        })
      );

      return;
    }
    res.status(401).json({ message: `401 : Unauthorized` });
    return;
  } catch (err: any) {
    if (isAxiosError(err)) {
      res.status(err.response?.status || 500).json({
        message: `${err.response?.status} : ${err.response?.statusText}`,
      });
      return;
    }
    res.status(500).json({ message: "server : error" });
  }
});

// Delete all the games in the guild
router.delete("/:id", async (req, res) => {
  try {
    if (
      !req.headers.authorization.startsWith("Bearer") &&
      req.headers.authorization.split(" ").length !== 2
    ) {
      res.status(401).json({ message: `401 : Unauthorized` });
      return;
    }
    const accessToken = req.headers.authorization.split(" ")[1];
    const userGuilds: any[] = (
      await axios.get("https://discord.com/api/users/@me/guilds", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    ).data;
    const guildId = req.params.id;
    for (let i = 0; i < userGuilds.length; i++) {
      if (guildId === userGuilds[i].id) {
        const qzGames = QzGame.select({ guildId: guildId });
        const g = Bot.client.guilds.cache.get(guildId);
        if (!g) {
          res.status(404).json({ message: "guild not found" });
          return;
        }
        const channels = await g.channels.fetch();
        for (let j = 0; j < qzGames.length; j++) {
          qzGames[j].delete();
          const channel = channels.get(qzGames[j].channelId);
          if (!channel) continue;
          if (channel.type !== ChannelType.GuildText) continue;
          const message = channel.messages.cache.get(qzGames[j].announcementId);
          const embed = new EmbedBuilder()
            .setTitle(`Game deleted by the owner`)
            .setFooter({ text: "game deleted" })
            .setTimestamp();
          setTimeout(async () => {
            try {
              await message.edit({
                content: "",
                components: [],
                embeds: [embed],
              });
            } catch (err: any) {
              warning("an error occurred while editing the msg");
            }
          }, 0);
          if (!qzGames[j].mainChannel) {
            setTimeout(async () => {
              try {
                await channel.edit({ name: "game deleted 🔴" });
              } catch (err: any) {
                warning("an error occurred while editing the channel name");
              }
            }, 0);
            setTimeout(async () => {
              try {
                await channel.delete();
              } catch (err: any) {
                warning(
                  `ExpressServer : an error occurred while deleting the channel ${req.url}`
                );
              }
            }, 20000);
          }
        }
        res.status(200).json();
        return;
      }
    }
    res.status(400).json({ message: "Bad Request" });
  } catch (err: any) {
    if (isAxiosError(err)) {
      res.status(err.response.status || 500).json({
        message: `${err.response.status || 500} : ${
          err.response.statusText || "server error"
        }`,
      });
      return;
    }
    console.log(err.message);
    res.status(500).json({ message: "server error" });
  }
});

module.exports = router;
