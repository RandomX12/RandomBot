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
exports.QuizCategoryImg = exports.categories = exports.regex = exports.rank = exports.getCategoryByNum = exports.isQuizGame = void 0;
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
exports.rank = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", "1️⃣1️⃣", "1️⃣2️⃣", "1️⃣3️⃣", "1️⃣4️⃣", "1️⃣5️⃣", "1️⃣6️⃣", "1️⃣7️⃣", "1️⃣8️⃣", "1️⃣9️⃣", "2️⃣0️⃣"];
exports.regex = /&quot;|&amp;|&#039;|&eacute;|&#039;|&amp;|&quot;|&shy;|&ldquo;|&rdquo;|&#039;|;|&/g;
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
exports.QuizCategoryImg = {
    Random: "https://hips.hearstapps.com/hmg-prod/images/quiz-questions-answers-1669651278.jpg",
    GeneralKnowledge: "https://cdn-icons-png.flaticon.com/512/5248/5248763.png",
    VideoGames: "https://cdn-icons-png.flaticon.com/512/3408/3408506.png",
    Sports: "https://cdn-icons-png.flaticon.com/512/857/857455.png",
    History: "https://cdn.imgbin.com/0/14/17/ancient-scroll-icon-history-icon-scroll-icon-gHvzqatT.jpg",
    Geography: "https://upload.wikimedia.org/wikipedia/commons/1/1f/Geography_icon.png",
    Mathematics: "https://cdn-icons-png.flaticon.com/512/43/43102.png",
    Computers: "https://cdn-icons-png.flaticon.com/512/4703/4703650.png",
    Animals: "https://static.thenounproject.com/png/13643-200.png",
    Vehicles: "https://cdn2.iconfinder.com/data/icons/cars-tractors-and-trucks/117/cars-01-512.png",
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
    static async isIn(guildId, hostId, userId) {
        const server = await (0, DiscordServers_1.getServerByGuildId)(guildId);
        let game;
        let player;
        server.games.map(e => {
            if (e.hostId === hostId) {
                game = e;
                e.players.map(ele => {
                    if (ele.id === userId) {
                        player = ele;
                    }
                });
            }
        });
        if (!game)
            throw new Error(`Game not found`);
        if (!isQuizGame(game))
            throw new Error(`This is not a quiz game`);
        if (!player)
            return false;
        return true;
    }
    static async next(guildId, hostId) {
        const server = await (0, DiscordServers_1.getServerByGuildId)(guildId);
        let isGame = false;
        server.games.map((e, i) => {
            if (e.hostId === hostId) {
                if (!isQuizGame(e))
                    return;
                isGame = true;
                server.games[i].index++;
            }
        });
        if (!isGame)
            throw new Error(`Quiz Game not found`);
        await server.save();
    }
    static async start(guildId, hostId) {
        const server = await (0, DiscordServers_1.getServerByGuildId)(guildId);
        let isGame = false;
        server.games.map((e, i) => {
            if (e.hostId === e.hostId) {
                if (!isQuizGame(e))
                    return;
                isGame = true;
                server.games[i].started = true;
            }
        });
        if (!isGame)
            throw new Error(`Quiz Game not found`);
        await server.save();
    }
    static async setAns(guildId, hostId, userId, ans) {
        const server = await (0, DiscordServers_1.getServerByGuildId)(guildId);
        let isGame = false;
        let isUser = false;
        server.games.map((e, i) => {
            if (e.hostId === hostId) {
                if (!isQuizGame(e))
                    return;
                isGame = true;
                e.players.map((ele, index) => {
                    if (ele.id === userId) {
                        if (!server.games[i].players[index].answers) {
                            server.games[i].players[index].answers = [ans];
                        }
                        else {
                            server.games[i].players[index].answers[e.index] = ans;
                        }
                        isUser = true;
                    }
                });
            }
        });
        if (!isGame)
            throw new Error(`Game not found !!`);
        if (!isUser)
            throw new Error(`User not found !!`);
        await server.save();
    }
    static async scanAns(guildId, hostId) {
        const server = await (0, DiscordServers_1.getServerByGuildId)(guildId);
        let isGame = false;
        let ans = ["A", "B", "C", "D"];
        let gameIndex;
        server.games.map((e, i) => {
            if (e.hostId === hostId) {
                if (!isQuizGame(e))
                    return;
                isGame = true;
                gameIndex = i;
                e.players.map((ele, index) => {
                    if (!ele.answers[e.index]) {
                        server.games[i].players[index].answers.push("N");
                        return;
                    }
                    if (ele.answers[e.index] === ans[e.quiz[e.index].correctIndex]) {
                        if (server.games[i].players[index].score) {
                            server.games[i].players[index].score++;
                        }
                        else {
                            server.games[i].players[index].score = 1;
                        }
                    }
                });
            }
        });
        if (!isGame)
            throw new Error(`game not found`);
        server.games[gameIndex].index++;
        await server.save();
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
                type: t,
                category: e.category
            };
        });
        server.games.push({
            ...this.info,
            name: "Quiz Game",
            index: 0,
            players: [{ username: this.info.hostName, id: this.info.hostId }],
            quiz: quiz,
            category: this.info.category,
            amount: this.info.amount,
            time: this.info.time || 15 * 1000
        });
        await server.save();
    }
}
exports.default = QuizGame;
