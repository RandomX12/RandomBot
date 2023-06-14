"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
const discord_js_1 = require("discord.js");
const discord_js_2 = __importDefault(require("discord.js"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class Bot {
    /**
     * Create a new slash Command
     */
    static createCommand(command) {
        this.client.application?.commands?.create(command);
        this.cmds.set(command.name, new Map());
        this.client.commands.set(command.name, command);
    }
    /**
     * Lunch the bot.
     *
     * @note set the productionMode in config.json to false if you are testing the bot.
     */
    static lunch() {
        const productionMode = require("../../config.json").productionMode;
        if (productionMode) {
            this.client.login(process.env.TOKEN1);
        }
        else {
            this.client.login(process.env.TOKEN);
        }
    }
    /**
     * Scan command and button folder and save the commands
     * @note also create / command for the new commands
     */
    static async scanCommands() {
        this.client.commands = new discord_js_1.Collection();
        const commandPath = path_1.default.join(__dirname + "/..", "commands");
        const commandFiles = fs_1.default.readdirSync(commandPath).filter(file => file.endsWith(".ts") || file.endsWith(".js"));
        for (const file of commandFiles) {
            const filePath = path_1.default.join(commandPath, file);
            const command = require(filePath);
            if ("data" in command && "execute" in command) {
                this.client.commands.set(command.data.name, command);
                this.cmds.set(command.data.name, new Map());
                await this.client.application?.commands?.create(command.data);
            }
            else {
                console.log("\x1b[33m", "[warning] : ", "\x1b[37m", `The command at ${filePath} has a missing property.`);
            }
        }
    }
    /**
     * Delete All the commands
     */
    static async clearCommands() {
        await this.client.application?.commands?.set([]);
    }
    /**
     * You can use this function to protect the bot from the spam
     * @returns true if the user is not spamming false if the user is spamming
     */
    static checkRequest(interaction) {
        const userCMD = this.cmds.get(interaction.commandName)?.get(interaction.user.id);
        if (userCMD)
            return false;
        if (!userCMD) {
            this.cmds.get(interaction.commandName)?.set(interaction.user.id, { username: interaction.user.tag, id: interaction.user.id });
            setTimeout(() => {
                this.cmds.get(interaction.commandName)?.delete(interaction.user.id);
            }, 5000);
            return true;
        }
    }
    static get uptime() {
        let uptime = this.client.uptime;
        let days = toInt(uptime / (1000 * 60 * 60 * 24));
        let hours = toInt((uptime / (1000 * 60 * 60)) - days * 24);
        let min = toInt(uptime / (1000 * 60) - (hours * 60 + days * 24 * 60));
        let sec = +(uptime / 1000 - (days * 24 * 60 * 60 + hours * 60 * 60 + min * 60)).toFixed(0);
        return `${days}d ${hours}h ${min}m ${sec}s`;
    }
    static get stats() {
        const guildsSize = this.client.guilds.cache.size;
        const members = this.client.users.cache.size;
        return {
            guildsSize,
            members
        };
    }
}
Bot.cmds = new Map();
/**
 * The bot :)
 */
Bot.client = new discord_js_2.default.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildMembers,
        discord_js_1.GatewayIntentBits.GuildMessageReactions
    ]
});
exports.Bot = Bot;
function toInt(num) {
    return +num.toString().split(".")[0];
}
