"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServerByGuildId = void 0;
const discordServers_1 = __importDefault(require("../model/discordServers"));
const DiscordServersConfig_1 = __importDefault(require("./DiscordServersConfig"));
const discordServers_2 = __importDefault(require("../model/discordServers"));
const cmd_1 = require("./cmd");
const discordServers_3 = __importDefault(require("../model/discordServers"));
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
            // if(server.games[i].hostId === userId){                
            //     isIn = true
            //     break
            // }
            for (let j = 0; j < server.games[i].players.length; j++) {
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
            if (e.hostId === id) {
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
    static async isGameFull(guildId, hostId) {
        const game = await DiscordServers.getGameByHostId(guildId, hostId);
        if (!("maxPlayers" in game))
            return;
        if (game.players.length === game.maxPlayers)
            return true;
        return false;
    }
    static async scanGuilds(guilds) {
        const server = await discordServers_2.default.find();
        guilds.map(async (e) => {
            try {
                let isIn = false;
                server.map(ele => {
                    if (ele.serverId === e.id) {
                        isIn = true;
                        return;
                    }
                });
                if (isIn)
                    return;
                let members = (await (await e.fetch()).members.fetch()).map(e => {
                    return {
                        username: e.user.tag,
                        id: e.user.id
                    };
                });
                await new DiscordServers({
                    name: e.name,
                    members: members,
                    serverId: e.id,
                    games: []
                }).save();
            }
            catch (err) {
                (0, cmd_1.error)(err.message);
            }
        });
        server.map(async (e, i) => {
            try {
                let isIn = false;
                guilds.map(ele => {
                    if (e.serverId === ele.id) {
                        isIn = true;
                    }
                });
                if (!isIn) {
                    await server[i].deleteOne();
                }
            }
            catch (err) {
                (0, cmd_1.warning)(err.message);
            }
        });
    }
    static async cleanGuilds() {
        const server = await discordServers_3.default.find();
        server.map(async (e, i) => {
            try {
                if (e.games.length > 0) {
                    server[i].games = [];
                    await server[i].save();
                }
            }
            catch (err) {
                (0, cmd_1.warning)(err.message);
            }
        });
    }
    constructor(server) {
        this.server = server;
    }
    async save() {
        const check = await discordServers_1.default.findOne({ serverId: this.server.serverId });
        if (check)
            throw new Error(`This server is allready exist`);
        const config = new DiscordServersConfig_1.default();
        this.server.config = config.config;
        const server = new discordServers_1.default(this.server);
        await server.save();
    }
}
exports.default = DiscordServers;
