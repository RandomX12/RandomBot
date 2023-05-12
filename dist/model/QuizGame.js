"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizSchema = void 0;
const mongoose_1 = require("mongoose");
exports.QuizSchema = new mongoose_1.Schema({
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
            answers: {
                required: false,
                type: [String],
            },
            score: {
                required: false,
                type: Number
            }
        }],
    maxPlayers: Number,
    channelId: String,
    announcementId: String,
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
        required: true,
        type: [{
                question: String,
                answers: [String],
                correctIndex: Number,
                type: String,
            }]
    },
    amount: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        required: true
    }
});
exports.default = (0, mongoose_1.model)('Quiz Game', exports.QuizSchema);
