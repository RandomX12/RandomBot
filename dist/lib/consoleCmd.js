"use strict";
// this file is for handling runtime console commands
// still under dev
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSpecialWord = exports.addRuntimeCMD = exports.exe = void 0;
const readline_1 = __importDefault(require("readline"));
const Bot_1 = require("./Bot");
const cmd_1 = require("./cmd");
const discordServers_1 = __importDefault(require("../model/discordServers"));
const DiscordServers_1 = __importDefault(require("./DiscordServers"));
let commands = [];
let rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
let specialWords = [];
exports.exe = false;
/**
 * Start listening to runtime line commands
 */
function listenToCmdRunTime() {
    (0, cmd_1.warning)("runtime console commands still under dev");
    rl.on('line', (input) => {
        if (specialWords.indexOf(input) !== -1)
            return;
        if (!input.replace(/ */g, ""))
            return;
        (0, cmd_1.log)({ text: "Executing runtime command " + `"${input}"` });
        let found = false;
        commands.map(async (e) => {
            if (e.input === input) {
                found = true;
                if (e.type === "SYNC") {
                    e.fn();
                }
                else {
                    e.loadingTxt != "Executing...";
                    e.finishTxt != "Command Executed";
                    let wt = (0, cmd_1.animateRotatingSlash)(e.loadingTxt);
                    await e.fn();
                    clearInterval(wt);
                    process.stdout.write('\r' + `\x1b[32m ${e.finishTxt} \x1b[37m\n`);
                }
            }
        });
        if (!found) {
            (0, cmd_1.error)(`"${input}" runtime command is not found. if you want to create a new runtime command use the addRuntimeCMD function from ${__filename}`);
        }
    });
}
exports.default = listenToCmdRunTime;
/**
 * Add a new Runtime Command
 * @param input command name structure
 * @param fn the function that will run the command is called
 */
function addRuntimeCMD(command) {
    if (!command.type) {
        command.type = "SYNC";
    }
    commands.push(command);
}
exports.addRuntimeCMD = addRuntimeCMD;
/**
 * Add a new Special Word
 * @param word string
 */
function addSpecialWord(word) {
    if (typeof word === "string") {
        specialWords.push(word);
    }
    else if (typeof word === "object") {
        specialWords.push(...word);
    }
}
exports.addSpecialWord = addSpecialWord;
// default runtime cmd
addSpecialWord(["y", "n"]);
addRuntimeCMD({
    input: "uptime",
    fn() {
        (0, cmd_1.log)({ text: `The bot has been running for : ${Bot_1.Bot.uptime}`, textColor: "Green" });
    },
});
addRuntimeCMD({
    input: "clear-slash-cmd",
    fn: () => {
        process.stdout.write("Do you really want to delete all the commands ? (y / n) : ");
        rl.once("line", async (input) => {
            let before = Date.now();
            if (input !== "y") {
                (0, cmd_1.log)({ textColor: "Red", text: "Command deletion has been canceled" });
                return;
            }
            (0, cmd_1.log)({ textColor: "Yellow", text: "deleting all the slash commands..." });
            await Bot_1.Bot.clearCommands();
            let ping = Date.now() - before;
            (0, cmd_1.log)({ textColor: "Green", text: "Commands are deleted." + ` ${ping}ms` });
        });
    },
    type: "SYNC",
});
addRuntimeCMD({
    input: "scan-slash-cmd",
    async fn() {
        await Bot_1.Bot.scanCommands();
    },
    type: "ASYNC",
    loadingTxt: "Scanning commands...",
    finishTxt: " commands scanned successfully"
});
addRuntimeCMD({
    input: "cls",
    fn() {
        console.clear();
    },
    type: "SYNC"
});
addRuntimeCMD({
    input: "table",
    type: "ASYNC",
    loadingTxt: "Fetching Info...",
    finishTxt: "table fetched",
    async fn() {
        const server = await discordServers_1.default.find();
        const tableInfo = server.map((e) => {
            return {
                name: e.name,
                membersLenght: e.members.length,
                guildId: e.serverId,
                id: e.id,
                __v: e.__v
            };
        });
        console.table(tableInfo);
    },
});
addRuntimeCMD({
    input: "shut-down",
    type: "SYNC",
    fn() {
        console.log("Do you really want to shut down the bot");
        process.stdout.write("This will make the bot offline and delete all the existing games and commands (y / n ) : ");
        rl.once("line", async (input) => {
            if (input !== "y")
                return;
            let wt = (0, cmd_1.animateRotatingSlash)("shutting down the bot...");
            await DiscordServers_1.default.cleanGuilds();
            await Bot_1.Bot.clearCommands();
            clearInterval(wt);
            (0, cmd_1.log)({ textColor: "Cyan", text: "\nserver offline" });
            process.exit(0);
        });
    },
});
