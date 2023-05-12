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
    // @ts-ignore
    games: {
        required: false,
        type: [
            {
                //@ts-ignore
                name: String,
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
                        askId: {
                            type: String,
                            required: false
                        },
                        question: {
                            required: false,
                            type: String
                        },
                        answer: {
                            required: false,
                            type: String
                        },
                        vote: {
                            required: false,
                            type: String
                        },
                        votedCount: {
                            type: Number,
                            default: 0,
                            required: false
                        },
                        answers: {
                            required: false,
                            type: [String],
                        },
                        score: {
                            required: false,
                            type: Number,
                            default: 0
                        }
                    }],
                word: String,
                maxPlayers: Number,
                channelId: String,
                announcementId: String,
                spy: {
                    id: String,
                    username: String,
                },
                started: {
                    required: false,
                    type: Boolean,
                    default: false
                },
                end: {
                    required: false,
                    type: Boolean,
                    default: false
                },
                quiz: {
                    required: false,
                    type: []
                },
                amount: {
                    type: Number,
                    required: false,
                },
                category: {
                    type: String,
                    required: false
                }
            }
        ],
        default: null
    }
});
exports.default = (0, mongoose_1.model)("Discord servers", discordServer);
