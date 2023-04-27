"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const DiscordServers_1 = __importStar(require("./DiscordServers"));
const cmd_1 = require("./cmd");
class Spygame {
    static async isHost(guildId, userId) {
        const discordServer = await (0, DiscordServers_1.getServerByGuildId)(guildId);
        let isHost = false;
        if (discordServer.games.length === 0)
            return false;
        discordServer.games.map(e => {
            if (e.hostId === userId) {
                isHost = true;
            }
        });
        return isHost;
    }
    static async isFull(guildId, hostId) {
        const server = await (0, DiscordServers_1.getServerByGuildId)(guildId);
        let isFull = false;
        let found = false;
        server.games.map(e => {
            if (e.hostId === hostId) {
                found = true;
                if (e.players.length === e.maxPlayers) {
                    isFull = true;
                }
            }
        });
        if (!found)
            throw new Error(`There is no such game with hostId='${hostId}'`);
        return isFull;
    }
    static async join(guildId, hostId, userId) {
        const isHost = await Spygame.isHost(guildId, hostId);
        if (!isHost)
            throw new Error(`Game Not Found`);
        const server = await (0, DiscordServers_1.getServerByGuildId)(guildId);
        for (let i = 0; i < server.games.length; i++) {
            if (server.games[i].hostId === hostId) {
                try {
                    const user = await DiscordServers_1.default.getUser(guildId, userId);
                    server.games[i].players = [...server.games[i].players, user];
                    break;
                }
                catch (err) {
                    (0, cmd_1.error)(err.message);
                }
            }
        }
        server.name = "changed";
        await server.save();
    }
    static async leave(guildId, hostId, userId) {
        const server = await (0, DiscordServers_1.getServerByGuildId)(guildId);
        for (let i = 0; i < server.games.length; i++) {
            if (server.games[i].hostId === hostId) {
                for (let j = 0; j < server.games[i].players.length; j++) {
                    if (server.games[i].players[j].id === userId) {
                        server.games[i].players.splice(j, 1);
                        break;
                    }
                }
                break;
            }
        }
        await server.save();
    }
    constructor(serverId, hostName, hostId, maxPlayers, channelId, announcementId) {
        this.serverId = serverId;
        this.hostName = hostName;
        this.hostId = hostId;
        this.maxPlayers = maxPlayers;
        this.channelId = channelId;
        this.announcementId = announcementId;
        this.inanimateThings = [
            'Chair',
            'Table',
            'Bed',
            'Lamp',
            'Book',
            'Pen',
            'Pencil',
            'Eraser',
            'Desk',
            'Computer',
            'Smartphone',
            'Tablet',
            'Television',
            'Car',
            'Bicycle',
            'Airplane',
            'Train',
            'Bus',
            'Refrigerator',
            'Microwave',
            'Toaster',
            'Coffee maker',
            'Blender',
            'Vacuum cleaner',
            'Washing machine',
            'Dryer',
            'Iron',
            'Dishwasher',
            'Oven',
            'Stove',
            'Freezer',
            'Camera',
            'Headphones',
            'Speakers',
            'Keyboard',
            'Mouse',
            'Monitor',
            'Printer',
            'Scanner',
            'Projector',
            'Clock',
            'Watch',
            'Calendar',
            'Globe',
            'Map',
            'Telescope',
            'Microscope',
            'Binoculars',
            'Compass',
            'Thermometer',
            'Barometer',
            'Scale',
            'Ruler',
            'Tape measure',
            'Scissors',
            'Knife',
            'Spoon',
            'Fork',
            'Plate',
            'Cup',
            'Glass',
            'Bowl',
            'Vase',
            'Picture frame',
            'Painting',
            'Sculpture',
            'Statue',
            'Doll',
            'Teddy bear',
            'Action figure',
            'Puzzle',
            'Board game',
            'Chess set',
            'Card deck',
            'Soccer ball',
            'Basketball',
            'Football',
            'Baseball',
            'Hockey stick',
            'Golf club',
            'Tennis racket',
            'Swimming goggles',
            'Snorkel',
            'Fishing rod',
            'Skateboard',
            'Roller skates',
            'Surfboard',
            'Snowboard',
            'Ski',
            'Tent',
            'Sleeping bag',
            'Backpack',
            'Suitcase',
            'Wallet',
            'Sunglasses',
            'Hat',
            'Scarf',
            'Gloves',
            'Umbrella',
            'Keychain'
        ];
    }
    async save() {
        const discordSv = await (0, DiscordServers_1.getServerByGuildId)(this.serverId);
        if (!discordSv)
            throw new Error(`discord server not found.`);
        discordSv.games.map(e => {
            if (e.hostId === this.hostId) {
                throw new Error(`You have already created a Spygame`);
            }
        });
        let randomNum = Math.floor(Math.random() * this.inanimateThings.length);
        discordSv.games.push({
            word: this.inanimateThings[randomNum],
            hostName: this.hostName,
            hostId: this.hostId,
            index: 0,
            maxPlayers: this.maxPlayers,
            players: [{ username: this.hostName, id: this.hostId }],
            channelId: this.channelId,
            announcementId: this.announcementId
        });
        await discordSv.save();
    }
}
exports.default = Spygame;
