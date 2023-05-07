"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServerByGuildId = void 0;
const discordServers_1 = __importDefault(require("../model/discordServers"));
const spygame_1 = require("./spygame");
async function getServerByGuildId(id) {
    const server = await discordServers_1.default.findOne({ serverId: id });
    if (!server)
        throw new Error(`Server not found. id=${id}`);
    return server;
}
exports.getServerByGuildId = getServerByGuildId;
class DiscordServers {
    static async deleteGuild(id) {
        const server = await getServerByGuildId(id);
        server.deleteOne();
    }
    static async isInGame(guildId, userId) {
        const server = await getServerByGuildId(guildId);
        let isIn = false;
        for (let i = 0; i < server.games.length; i++) {
            if (server.games[i].hostId === userId) {
                isIn = true;
                break;
            }
            for (let j = 0; j < server.games[i].players.length; i++) {
                if (server.games[i].players[j].id === userId) {
                    isIn = true;
                    break;
                }
            }
            if (isIn)
                break;
        }
        return isIn;
    }
    static async getGameByHostId(guildId, id) {
        const server = await getServerByGuildId(guildId);
        let game;
        server.games.map(e => {
            if (e.hostId === id && (0, spygame_1.isSpyGame)(e)) {
                game = e;
            }
        });
        if (!game)
            throw new Error(`Game not found`);
        return game;
    }
    static async getUser(guildId, userId) {
        const server = await getServerByGuildId(guildId);
        let user;
        server.members.map(e => {
            if (e.id === userId) {
                user = e;
            }
        });
        if (!user)
            throw new Error(`User not found`);
        return user;
    }
    static async deleteGame(guildId, hostId) {
        const server = await getServerByGuildId(guildId);
        server.games.map((e, i) => {
            if (e.hostId === hostId) {
                server.games.splice(i, 1);
            }
        });
        await server.save();
    }
    constructor(server) {
        this.server = server;
    }
    async save() {
        const check = await discordServers_1.default.findOne({ serverId: this.server.serverId });
        if (check)
            throw new Error(`This server is allready exist`);
        const server = new discordServers_1.default(this.server);
        await server.save();
    }
}
exports.default = DiscordServers;
