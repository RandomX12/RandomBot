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
    config: {
        required: true,
        type: {
            commands: {
                required: true,
                type: [{
                        name: String,
                        enable: Boolean,
                        //@ts-ignore
                        permissions: [String],
                        rolesId: [String],
                        bannedUsers: [String]
                    }]
            },
            quiz: {
                type: {
                    multiple_channels: Boolean,
                    channels_category: {
                        required: false,
                        type: String
                    },
                    private: Boolean,
                    category_name: {
                        type: String,
                        require: false
                    },
                    roles: {
                        required: false,
                        type: [String]
                    }
                },
                required: true,
                default: {
                    multiple_channels: false,
                    private: false
                }
            }
        }
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
                hostUserId: String,
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
                },
                time: {
                    require: false,
                    type: Number
                },
                mainChannel: {
                    require: false,
                    type: Boolean,
                    default: true
                }
            }
        ],
        default: []
    }
});
exports.default = (0, mongoose_1.model)("Discord servers", discordServer);
