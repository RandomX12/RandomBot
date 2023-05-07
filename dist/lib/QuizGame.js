"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizGame = exports.categories = exports.regex = exports.getCategoryByNum = exports.isQuizGame = void 0;
const QuizGame_1 = __importDefault(require("../model/QuizGame"));
const DiscordServers_1 = require("./DiscordServers");
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
            ans.push(c);
            let t = e.type;
            return {
                question: q,
                answers: ans,
                correctIndex: 0,
                type: t
            };
        });
        console.log(new QuizGame_1.default({
            ...this.info,
            name: "Quiz Game",
            index: 0,
            players: [{ username: this.info.hostName, id: this.info.hostId }],
            quiz: quiz
        }));
        server.games.push({
            ...this.info,
            name: "Quiz Game",
            index: 0,
            players: [{ username: this.info.hostName, id: this.info.hostId }],
            quiz: quiz
        });
        await server.save();
    }
}
exports.QuizGame = QuizGame;
