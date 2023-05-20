"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DiscordServers_1 = require("./DiscordServers");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class Config {
    constructor(config) {
        this.config = config;
        // written by KHLALA 
        if (!this.config) {
            this.config = {
                commands: [],
                quiz: { multiple_channels: false }
            };
        }
        if (this.config.quiz.multiple_channels) {
            if (!this.config.quiz.category_name || !this.config.quiz.channels_category) {
                throw new Error(`category props are required when "multiple_channels" is set to "true"`);
            }
        }
        let commands = [];
        const cmdPath = path_1.default.join(__dirname, "../commands");
        const files = fs_1.default.readdirSync(cmdPath).filter((e) => e.endsWith(".ts") || e.endsWith(".js"));
        for (let file of files) {
            const cmdBody = require(path_1.default.join(cmdPath, file));
            if ("data" in cmdBody) {
                commands.push({
                    name: cmdBody.data.name,
                    description: cmdBody.data.description,
                    permissions: cmdBody.permissions
                });
            }
        }
        if (this.config.commands || this.config.commands.length > 0) {
            this.config.commands.map((e) => {
                let isValid = false;
                commands.map(ele => {
                    if (ele.name === e.name) {
                        isValid = true;
                    }
                });
                if (!isValid) {
                    this.config.commands.splice(this.config.commands.indexOf(e), 1);
                }
            });
            commands.map((e) => {
                let isIn = false;
                this.config.commands.map(ele => {
                    if (e.name === ele.name) {
                        isIn = true;
                    }
                });
                if (!isIn) {
                    this.config.commands.push({
                        name: e.name,
                        permissions: e.permissions || [],
                        enable: true,
                    });
                }
            });
        }
        else {
            commands.map((e) => {
                this.config.commands.push({
                    name: e.name,
                    enable: true,
                    permissions: e.permissions || [],
                });
            });
        }
    }
    async save(guildId) {
        const server = await (0, DiscordServers_1.getServerByGuildId)(guildId);
        server.config = this.config;
        await server.save();
    }
}
exports.default = Config;
