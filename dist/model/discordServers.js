"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const discordServer = new mongoose_1.Schema({
    name: {
        required: true,
        type: String
    },
    serverId: {
        required: true,
        type: String
    },
    members: {
        required: true,
        type: [Object]
    },
    games: {
        required: false,
        type: [
            {
                hostId: String,
                hostName: String,
                index: {
                    type: Number,
                    required: false,
                    default: 0
                },
                players: [{
                        username: String,
                        id: String,
                        askId: String,
                        question: String,
                        answer: String,
                        vote: String
                    }],
                word: String,
                maxPlayers: Number,
                channelId: String,
                announcementId: String,
                spy: {
                    id: String,
                    username: String
                },
                started: {
                    required: false,
                    type: Boolean,
                    default: false
                }
            }
        ],
        default: null
    }
});
exports.default = (0, mongoose_1.model)("Discord servers", discordServer);
