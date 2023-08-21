// express server

import express from "express";
import { games } from ".";
import { log } from "./lib/cmd";
import axios, { isAxiosError } from "axios";

const productionMode = require("../config.json").productionMode;
const app = express();
const PORT = 8080;

app.get("/", (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const totalMemoryUsage =
      (memoryUsage.rss +
        memoryUsage.heapTotal +
        memoryUsage.external +
        memoryUsage.arrayBuffers) /
      (1024 * 1024);
    const version = require("../package.json").version;
    const website = require("../config.json").info?.website;
    res.status(200).send(`<h1>
        This is RandomBot express server
    </h1>
    status : ONLINE <br/>
    Games : ${games.size}<br/>
    memory : ${totalMemoryUsage.toFixed(2)} MB <br/>
    version : ${version} <br/>
    website : <a href="${website}" target="_blank">${website}<a/>`);
  } catch (err: any) {
    res.status(500).json({ message: "500 : server error" });
  }
});

app.get("/:id", async (req, res) => {
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

export default function lunchServer() {
  if (productionMode) {
    log({
      textColor: "Yellow",
      text: "You are running The bot on production mode",
      timeColor: "Yellow",
    });
    app.listen(PORT, () => {
      log({ text: "Server online", textColor: "Green", timeColor: "Green" });
    });
  }
}
