// express server

import express from "express";
import { log } from "./lib/cmd";
import fs from "fs";
import path from "path";
import { Bot } from "./lib/Bot";

const productionMode = require("../config.json").productionMode;
const app = express();
const PORT = 8080;

app.use((req, res, next) => {
  if (Bot.maintenance) {
    res.status(503).json({ message: "503 : the server is busy" });
    return;
  }
  next();
});

const routesPath = path.join(__dirname, "routes");
const routesNames = fs
  .readdirSync(routesPath)
  .filter((fileName) => fileName.endsWith(".js") || fileName.endsWith(".ts"));

for (let fileName of routesNames) {
  const filePath = path.join(routesPath, fileName);
  const route = require(filePath);
  app.use(route);
}

app.use((req, res) => {
  res.status(404).json({ message: "404 : Not Found" });
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
