// express server

import express from "express";
import { games } from ".";
import { log } from "./lib/cmd";
import axios, { isAxiosError } from "axios";
import { QzGame } from "./lib/QuizGame";

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
    res.send(`<h1>
        This is RandomBot express server
    </h1>
    status : ONLINE <br/>
    Games : ${games.size}<br/>
    memory : ${totalMemoryUsage.toFixed(2)} MB <br/>
    version : ${version} <br/>
    website : <a href="${website}" target="_blank">${website}<a/>`);
  } catch (err: any) {
    res.json({ message: "500 : server error" }).status(500);
  }
});

app.get("/:id", async (req, res) => {
  try {
    if (!req.headers.authorization) {
      res.json({ message: "401 : Unauthorized" }).status(401);
      return;
    }
    const authorization = req.headers.authorization;
    if (
      authorization.split(" ")[0] !== "Bearer" ||
      authorization.split(" ").length !== 2
    ) {
      res.json({ message: "401 : Unauthorized" }).status(401);
      return;
    }
    const guilds: any[] = (
      await axios.get(`https://discord.com/api/v9/users/@me/guilds`, {
        headers: {
          Authorization: authorization,
        },
      })
    ).data;
    for (let i = 0; i < guilds.length; i++) {
      if (guilds[i].id === req.params.id) {
        if (!guilds[i].owner) continue;
        res
          .json(
            games.select({ guildId: req.params.id }).map((game) => {
              return { ...game, quiz: undefined };
            })
          )
          .status(200);
        return;
      }
    }
    res.json({ message: `404 : Guild not found` }).status(404);
    return;
  } catch (err: any) {
    if (isAxiosError(err)) {
      res
        .json({
          message: `${err.response?.status} : ${err.response?.statusText}`,
        })
        .status(err.response?.status || 500);
      return;
    }
    res.json({ message: "server : error" }).status(500);
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
