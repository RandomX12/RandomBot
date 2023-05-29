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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.maxPlayers = exports.amount = exports.deleteGameLog = exports.QuizCategoryImg = exports.categories = exports.regex = exports.rank = exports.getCategoryByNum = exports.isQuizGame = void 0;
const DiscordServers_1 = __importStar(require("./DiscordServers"));
const cmd_1 = require("./cmd");
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
    GeneralKnowledge: "https://cdn-icons-png.flaticon.com/512/2762/2762294.png",
    VideoGames: "https://cdn-icons-png.flaticon.com/512/3408/3408506.png",
    Sports: "https://cdn-icons-png.flaticon.com/512/857/857455.png",
    History: "https://cdn.imgbin.com/0/14/17/ancient-scroll-icon-history-icon-scroll-icon-gHvzqatT.jpg",
    Geography: "https://cdn-icons-png.flaticon.com/256/1651/1651598.png",
    Mathematics: "https://cdn-icons-png.flaticon.com/512/4954/4954397.png",
    Computers: "https://cdn-icons-png.flaticon.com/512/4703/4703650.png",
    Animals: "https://cdn-icons-png.flaticon.com/512/616/616408.png",
    Vehicles: "https://cdni.iconscout.com/illustration/premium/thumb/car-2953450-2451640.png",
};
function createGameLog() {
    return function (target, key, descriptor) {
        let originalFn = descriptor.value;
        descriptor.value = async function () {
            (0, cmd_1.log)({ textColor: "Yellow", timeColor: "Yellow", text: `creating Quiz Game...` });
            await originalFn.apply(this, []);
            (0, cmd_1.log)({ textColor: "Blue", timeColor: "Blue", text: `Game created` });
        };
    };
}
function deleteGameLog() {
    return function (target, key, descriptor) {
        const originalFn = descriptor.value;
        descriptor.value = async function (...args) {
            await originalFn.apply(this, args);
            (0, cmd_1.log)({ text: "Game deleted", textColor: "Magenta", timeColor: "Magenta" });
        };
    };
}
exports.deleteGameLog = deleteGameLog;
exports.amount = [3, 10];
exports.maxPlayers = [2, 20];
class QuizGame {
    static async join(guildId, hostId, user) {
        const server = await (0, DiscordServers_1.getServerByGuildId)(guildId);
        let gameFound = false;
        for (let i = 0; i < server.games.length; i++) {
            if (server.games[i].hostId === hostId) {
                if (!isQuizGame(server.games[i]))
                    throw new Error(`This game is not Quiz Game`);
                gameFound = true;
                const isIn = await DiscordServers_1.default.isInGame(guildId, user.id);
                if (isIn)
                    throw new Error(`User id="${user.id} is already in the game"`);
                server.games[i].players.push({ username: user.tag, id: user.id });
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
                if (!isQuizGame(e))
                    return;
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
    static async removeAns(guildId, userId) {
        const server = await (0, DiscordServers_1.getServerByGuildId)(guildId);
        server.games.map((e, i) => {
            if (!isQuizGame(e))
                return;
            e.players.map((ele, j) => {
                if (ele.id === userId) {
                    server.games[i].players[j].answers[e.index] = "N";
                }
            });
        });
        await server.save();
    }
    static async getQuizGamewithHostUserId(guildId, hostUserId) {
        const server = await (0, DiscordServers_1.getServerByGuildId)(guildId);
        for (let i = 0; i < server.games.length; i++) {
            if (isQuizGame(server.games[i])) {
                if (server.games[i].hostUserId === hostUserId) {
                    return server.games[i];
                }
            }
        }
        throw new Error(`Game not found`);
    }
    static async getAnnouncement(interaction, guildId, hostId) {
        const server = await (0, DiscordServers_1.getServerByGuildId)(guildId);
        for (let i = 0; i < server.games.length; i++) {
            if (server.games[i].hostId === hostId) {
                if (!isQuizGame(server.games[i]))
                    throw new Error(`This game is not a Quiz Game`);
                const channel = await interaction.guild.channels.cache.get(server.games[i].channelId).fetch();
                const announcement = channel.messages.cache.get(server.games[i].announcementId);
                return announcement;
            }
        }
        throw new Error(`announcement not found`);
    }
    static async getChannel(interaction, hostId) {
        const server = await (0, DiscordServers_1.getServerByGuildId)(interaction.guildId);
        for (let i = 0; i < server.games.length; i++) {
            if (server.games[i].hostId === hostId) {
                if (!isQuizGame(server.games[i]))
                    throw new Error(`This game is not quiz game`);
                const channel = await interaction.guild.channels.cache.get(server.games[i].channelId).fetch();
                return channel;
            }
        }
        throw new Error(`Game with id="${hostId}" not found`);
    }
    constructor(serverId, info, empty) {
        this.serverId = serverId;
        this.info = info;
        this.empty = empty;
        if (info.amount < exports.amount[0] || info.amount > exports.amount[1])
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
        let players = [{ username: this.info.hostName, id: this.info.hostUserId }];
        if (this.empty) {
            players = [];
        }
        server.games.push({
            ...this.info,
            name: "Quiz Game",
            index: 0,
            players: players,
            quiz: quiz,
            category: this.info.category,
            amount: this.info.amount,
            time: this.info.time || 15 * 1000,
            hostId: this.info.hostId,
            hostUserId: this.info.hostUserId
        });
        await server.save();
    }
}
__decorate([
    createGameLog()
], QuizGame.prototype, "save", null);
exports.default = QuizGame;
