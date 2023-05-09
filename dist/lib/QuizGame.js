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
exports.QuizGame = exports.categories = exports.regex = exports.getCategoryByNum = exports.isQuizGame = void 0;
const DiscordServers_1 = __importStar(require("./DiscordServers"));
function isQuizGame(game) {
    if (game.name === "Quiz Game") {
        return true;
    }
}
exports.isQuizGame = isQuizGame;
function getCategoryByNum(num) {
    if (num === "any")
        return "Random";
    let names = Object.keys(exports.categories);
    let category;
    names.map(e => {
        if (exports.categories[e] === num) {
            category = e;
        }
    });
    return category;
}
exports.getCategoryByNum = getCategoryByNum;
exports.regex = /&quot;|&amp;|&#039;|&eacute;|&#039;|&amp;|&quot;|&shy;|&ldquo;|&rdquo;|&#039;/g;
exports.categories = {
    Random: "any",
    GeneralKnowledge: 9,
    VideoGames: 15,
    Sports: 21,
    History: 23,
    Geography: 22,
    Mathematics: 19,
    Computers: 18,
    Animals: 27,
    Vehicles: 28,
};
class QuizGame {
    static async join(guildId, hostId, userId) {
        const server = await (0, DiscordServers_1.getServerByGuildId)(guildId);
        let gameFound = false;
        for (let i = 0; i < server.games.length; i++) {
            if (server.games[i].hostId === hostId) {
                if (!isQuizGame(server.games[i]))
                    throw new Error(`This game is not Quiz Game`);
                gameFound = true;
                const isIn = await DiscordServers_1.default.isInGame(guildId, userId);
                if (isIn)
                    throw new Error(`User id="${userId} is already in the game"`);
                const user = await DiscordServers_1.default.getUser(guildId, userId);
                server.games[i].players.push(user);
                await server.save();
                break;
            }
        }
        if (!gameFound)
            throw new Error(`Cannot join the game : Game not found`);
    }
    static async leave(guildId, hostId, userId) {
        const server = await (0, DiscordServers_1.getServerByGuildId)(guildId);
        let isGame = false;
        let isIn = false;
        server.games.map((e, i) => {
            if (e.hostId === hostId) {
                isGame = true;
                e.players.map((ele, j) => {
                    if (ele.id === userId) {
                        isIn = true;
                        server.games[i].players.splice(j, 1);
                    }
                });
            }
        });
        if (!isGame)
            throw new Error(`Game not found`);
        if (!isIn)
            throw new Error(`This user is not in game`);
        await server.save();
    }
    static async getGameWithHostId(guildId, hostId) {
        const game = await DiscordServers_1.default.getGameByHostId(guildId, hostId);
        if (!isQuizGame(game))
            throw new Error(`Game With hostId="${hostId}" is not a Quiz Game`);
        return game;
    }
    constructor(serverId, info) {
        this.serverId = serverId;
        this.info = info;
        if (info.amount < 3 || info.amount > 10)
            throw new Error(`Amount must be between 3 and 10`);
    }
    async save() {
        const server = await (0, DiscordServers_1.getServerByGuildId)(this.serverId);
        let hasGame = false;
        server.games.map(e => {
            if (e.hostId === this.info.hostId) {
                hasGame = true;
            }
        });
        if (hasGame)
            throw new Error(`This user already has a game`);
        const QuizCatNum = exports.categories[this.info.category];
        let catUrl = `&category=${QuizCatNum}`;
        if (QuizCatNum === "any") {
            catUrl = "";
        }
        let amount = this.info.amount;
        const req = await fetch(`https://opentdb.com/api.php?amount=${amount}&difficulty=easy${catUrl}`);
        const res = await req.json();
        let quiz = res.results.map((e) => {
            let q = e.question.replace(exports.regex, ' ');
            let c = e.correct_answer.replace(exports.regex, ' ');
            let ans = e.incorrect_answers.map(ele => {
                return ele.replace(exports.regex, ' ');
            });
            let num = Math.floor(Math.random() * ans.length);
            let an = ans[num];
            ans[num] = c;
            ans.push(an);
            let t = e.type;
            return {
                question: q,
                answers: ans,
                correctIndex: num,
                type: t
            };
        });
        server.games.push({
            ...this.info,
            name: "Quiz Game",
            index: 0,
            players: [{ username: this.info.hostName, id: this.info.hostId }],
            quiz: quiz,
            category: this.info.category,
            amount: this.info.amount
        });
        await server.save();
    }
}
exports.QuizGame = QuizGame;
