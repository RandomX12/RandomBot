import express from "express";
import { games } from "..";

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const totalMemoryUsage =
      (memoryUsage.rss +
        memoryUsage.heapTotal +
        memoryUsage.external +
        memoryUsage.arrayBuffers) /
      (1024 * 1024);
    const version = require("../../package.json").version;
    const website = require("../../config.json").info?.website;
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

module.exports = router;
