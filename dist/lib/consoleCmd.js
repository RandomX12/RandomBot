"use strict";
// this file is for handling runtime console commands
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRuntimeCMD = void 0;
const readline_1 = __importDefault(require("readline"));
const Bot_1 = require("./Bot");
let commands = [];
function listenToCmdRunTime() {
    let rl = readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.on('line', (input) => {
        if (input === "uptime") {
            console.log(Bot_1.Bot.uptime);
            return;
        }
        commands.map((e) => {
            if (e.input === input) {
                e.fn();
            }
        });
    });
}
exports.default = listenToCmdRunTime;
function addRuntimeCMD(input, fn) {
    commands.push({ input, fn });
}
exports.addRuntimeCMD = addRuntimeCMD;
