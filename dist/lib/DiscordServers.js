"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = exports.fetchServer = exports.getServerByGuildId = void 0;
const discordServers_1 = __importDefault(require("../model/discordServers"));
const DiscordServersConfig_1 = __importDefault(require("./DiscordServersConfig"));
const discordServers_2 = __importDefault(require("../model/discordServers"));
const cmd_1 = require("./cmd");
const discordServers_3 = __importDefault(require("../model/discordServers"));
const QuizGame_1 = require("./QuizGame");
const __1 = require("..");
/**
 * Get the server document from the data base
 * @param id server id
 * @returns Server Document
 */
async function getServerByGuildId(id) {
    const server = await discordServers_1.default.findOne({ serverId: id });
    if (!server)
        throw new Error(`Server not found. id=${id}`);
    return server;
}
exports.getServerByGuildId = getServerByGuildId;
/**
 * Get discord server
 * @param id server id
 * @returns new Server()
 */
async function fetchServer(id) {
    const sv = new Server(id);
    await sv.fetch();
    return sv;
}
exports.fetchServer = fetchServer;
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
__decorate([
    (0, QuizGame_1.deleteGameLog)()
], DiscordServers, "deleteGame", null);
exports.default = DiscordServers;
/**
 * New Constructor for discord server
 */
class Server {
    /**
     * New Get server function
     * @param guildId server id
     * @returns new Server()
     */
    static async getServer(guildId) {
        const server = await getServerByGuildId(guildId);
        const guild = new Server(server.serverId);
        guild.applyData(server);
        return guild;
    }
    constructor(serverId) {
        this.serverId = serverId;
    }
    /**
     * Set the server data.
     */
    applyData(data) {
        this.name = data.name || this.name;
        this.config = data.config || this.config;
        this.members = data.members;
        this.games = data.games || this.games;
    }
    /**
     * fetch the server data from the database
     */
    async fetch() {
        const server = await getServerByGuildId(this.serverId);
        this.applyData(server);
    }
    /**
     * delete the server
     */
    async delete() {
        await DiscordServers.deleteGuild(this.serverId);
    }
    /**
     * Update the server
     */
    async update() {
        const server = await getServerByGuildId(this.serverId);
        server.name = this.name;
        server.config = this.config;
        server.members = this.members;
        server.games = this.games;
        await server.save();
    }
    /**
     * change server config
     * @param config config of the server
     */
    async setConfig(config) {
        const server = await getServerByGuildId(this.serverId);
        const c = new DiscordServersConfig_1.default(config);
        server.config = c.config;
        await server.save();
        this.config = c.config;
        return;
    }
    /**
     * delete all games in this server
     */
    async cleanGames() {
        const server = await getServerByGuildId(this.serverId);
        server.games = [];
        await server.save();
    }
    /**
     * Get the number of online member in this server
     * @returns number of online members
     */
    async getOnlineMembersNumber() {
        let server;
        __1.client.guilds.cache.map(async (e) => {
            if (e.id === this.serverId) {
                server = e;
            }
        });
        if (!server)
            throw new Error(`server not found`);
        const sv = await server.fetch();
        return sv.approximatePresenceCount;
    }
}
exports.Server = Server;
