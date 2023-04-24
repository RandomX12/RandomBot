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
        type: [Object],
        default: null
    }
});
exports.default = (0, mongoose_1.model)("Discord servers", discordServer);
