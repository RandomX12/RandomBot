"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const SpyGame_1 = require("./SpyGame");
const QuizGame_1 = require("./QuizGame");
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
            SpyGame_1.SpyGameSchema,
            QuizGame_1.QuizSchema
        ],
        default: null
    }
});
exports.default = (0, mongoose_1.model)("Discord servers", discordServer);
