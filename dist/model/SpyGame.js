"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpyGameSchema = void 0;
const mongoose_1 = require("mongoose");
exports.SpyGameSchema = new mongoose_1.Schema({
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
            askId: String,
            question: String,
            answer: String,
            vote: String,
            votedCount: {
                type: Number,
                default: 0,
                required: false
            }
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
    },
    end: {
        required: false,
        type: Boolean,
        default: false
    }
});
