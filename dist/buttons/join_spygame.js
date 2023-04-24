"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DiscordServers_1 = require("../lib/DiscordServers");
async function execute(interaction) {
    const server = await (0, DiscordServers_1.getServerByGuildId)(interaction.guildId);
}
exports.default = execute;
