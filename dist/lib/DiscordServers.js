"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServerByGuildId = void 0;
const discordServers_1 = __importDefault(require("../model/discordServers"));
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
