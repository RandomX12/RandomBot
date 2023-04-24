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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// importing the libs
const discord_js_1 = __importStar(require("discord.js"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const cmd_1 = require("./lib/cmd");
const connectDB_1 = require("./lib/connectDB");
const DiscordServers_1 = __importDefault(require("./lib/DiscordServers"));
require("dotenv").config();
// init the discord bot
const client = new discord_js_1.default.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildMembers,
    ]
});
// command handling
client.commands = new discord_js_1.Collection();
const commandPath = path_1.default.join(__dirname, "commands");
const commandFiles = fs_1.default.readdirSync(commandPath).filter(file => file.endsWith(".ts") || file.endsWith(".js"));
setTimeout(() => {
    for (const file of commandFiles) {
        const filePath = path_1.default.join(commandPath, file);
        const command = require(filePath);
        if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command);
            client.application?.commands?.create(command.data);
        }
        else {
            console.log("\x1b[33m", "[warning] : ", "\x1b[37m", `The command at ${filePath} has a missing property.`);
        }
    }
}, 3000);
// execute commands
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand())
        return;
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
        console.log(`\x1b[33m`, `[warning]`, `Command /${interaction.commandName} is not found`);
        return;
    }
    try {
        const commandConfig = require("../config.json").commands[interaction.commandName];
        if (commandConfig) {
            const before = Date.now();
            (0, cmd_1.log)({ text: `Executing /${interaction.commandName} by ${interaction.user.tag}` });
            await command.execute(interaction);
            const after = Date.now();
            const ping = after - before;
            (0, cmd_1.log)({ text: `command executed successfully /${interaction.commandName} by ${interaction.user.tag}. ${ping}ms`, textColor: "Green", timeColor: "Green" });
        }
        else {
            await interaction.reply({
                content: ":x: This command is disabled",
                ephemeral: true
            });
        }
    }
    catch (err) {
        (0, cmd_1.log)({ text: `There was an error while executing the command \n ${err.message}`, textColor: "Red", timeColor: "Red" });
        if (interaction.replied || interaction.deferred) {
            interaction.followUp({ content: "There was an error while executing the command", ephemeral: true });
        }
        else {
            interaction.reply({ content: "There was an error while executing the command", ephemeral: true });
        }
    }
});
// register servers
client.on("guildCreate", async (guild) => {
    if (!guild && guild.id)
        return;
    try {
        const members = [];
        guild.members.cache.map(e => {
            members.push({
                username: e.user.tag,
                id: e.user.id
            });
        });
        await new DiscordServers_1.default({
            name: guild.name,
            serverId: guild.id,
            members: members,
            games: []
        }).save();
        (0, cmd_1.log)({ text: `Bot joined new server ${guild.name} ; ${guild.members.cache.size} members`, textColor: "Cyan" });
    }
    catch (err) {
        (0, cmd_1.error)(err.message);
    }
});
client.on("guildDelete", async (guild) => {
    if (!guild && !guild.id)
        return;
    try {
        await DiscordServers_1.default.deleteGuild(guild.id);
        (0, cmd_1.log)({ text: `Bot left a server ${guild.name} ; ${guild.members.cache.size} members`, textColor: "Yellow" });
    }
    catch (err) {
        (0, cmd_1.error)(err.message);
    }
});
client.on("ready", async (c) => {
    console.log(`[${new Date().toLocaleTimeString()}] Discord bot connected as : ${c.user.username}`);
    (0, cmd_1.log)({ text: `connecting to the database`, textColor: "Magenta", timeColor: "Magenta" });
    try {
        await (0, connectDB_1.connectDB)();
        (0, cmd_1.log)({ text: `successfully connected to the database`, textColor: "Green", timeColor: "Green" });
    }
    catch (err) {
        (0, cmd_1.log)({ text: `There was an error while connecting to the database. \n ${err.message}`, textColor: "Red", timeColor: "Red" });
    }
});
client.login(process.env.TOKEN);
