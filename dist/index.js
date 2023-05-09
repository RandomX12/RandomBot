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
const DiscordServers_1 = __importStar(require("./lib/DiscordServers"));
const discordServers_1 = __importDefault(require("./model/discordServers"));
require("dotenv").config();
// init the discord bot
const client = new discord_js_1.default.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildMembers,
        discord_js_1.GatewayIntentBits.GuildMessageReactions
    ]
});
// command handling
client.commands = new discord_js_1.Collection();
const commandPath = path_1.default.join(__dirname, "commands");
const commandFiles = fs_1.default.readdirSync(commandPath).filter(file => file.endsWith(".ts") || file.endsWith(".js"));
let cmds = new Map();
setTimeout(() => {
    for (const file of commandFiles) {
        const filePath = path_1.default.join(commandPath, file);
        const command = require(filePath);
        if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command);
            cmds.set(command.data.name, new Map());
            client.application?.commands?.create(command.data);
        }
        else {
            console.log("\x1b[33m", "[warning] : ", "\x1b[37m", `The command at ${filePath} has a missing property.`);
        }
    }
}, 3000);
client.buttons = new discord_js_1.Collection();
const buttonsPath = path_1.default.join(__dirname, "./buttons");
const buttonFolder = fs_1.default.readdirSync(buttonsPath).filter((file) => file.endsWith(".ts") || file.endsWith(".js"));
for (let file of buttonFolder) {
    const filePath = path_1.default.join(buttonsPath, file);
    const button = require(filePath);
    if ("data" in button || "execute" in button) {
        client.buttons.set(button.data.name, button);
    }
    else {
        console.log("\x1b[33m", "[warning] : ", "\x1b[37m", `The command at ${filePath} has a missing property.`);
    }
}
// execute commands
let msgs = new Map();
client.on("interactionCreate", async (interaction) => {
    // if(!interaction.isChatInputCommand()) return
    if (!interaction.guild)
        return;
    const user = msgs.get(interaction.user.id);
    if (user) {
        //@ts-ignore
        interaction.user.count = user.count + 1;
        msgs.set(interaction.user.id, interaction.user);
        if (user.count > 7) {
            (0, cmd_1.log)({ text: `${interaction.user.tag} is blocked cause of spam`, timeColor: "Yellow", textColor: "Yellow" });
            return;
        }
    }
    //@ts-ignore
    if (!interaction.user.count) {
        //@ts-ignore
        interaction.user.count = 1;
    }
    msgs.set(interaction.user.id, interaction.user);
    setTimeout(() => {
        //@ts-ignore
        interaction.user.count = undefined;
        msgs.delete(interaction.user.id);
    }, 1000 * 30);
    if (interaction.isButton()) {
        let command = interaction.client.buttons.get(interaction.customId);
        if (interaction.customId.startsWith("join_spygame")) {
            command = interaction.client.buttons.get("join_spygame_[:id]");
        }
        else if (interaction.customId.startsWith("leave_spygame")) {
            command = interaction.client.buttons.get("leave_spygame_[:id]");
        }
        else if (interaction.customId.startsWith("join_quizgame")) {
            command = interaction.client.buttons.get("join_quizgame_[:id]");
        }
        if (!command) {
            console.log(`\x1b[33m`, `[warning]`, `Command Button ${interaction.customId} is not found`);
            return;
        }
        try {
            const before = Date.now();
            (0, cmd_1.log)({ text: `Executing ${interaction.customId} button command by ${interaction.user.tag}` });
            await command.execute(interaction);
            const after = Date.now();
            const ping = after - before;
            (0, cmd_1.log)({ text: `Button command executed successfully ${interaction.customId} by ${interaction.user.tag}. ${ping}ms`, textColor: "Green", timeColor: "Green" });
        }
        catch (err) {
            (0, cmd_1.error)(err.message);
        }
    }
    else if (interaction.isCommand() && interaction.isChatInputCommand()) {
        const userCMD = cmds.get(interaction.commandName).get(interaction.user.id);
        if (userCMD)
            return;
        if (!userCMD) {
            cmds.get(interaction.commandName).set(interaction.user.id, { username: interaction.user.tag, id: interaction.user.id });
            setTimeout(() => {
                cmds.get(interaction.commandName).delete(interaction.user.id);
            }, 5000);
        }
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
            (0, cmd_1.log)({ text: `There was an error while executing the command \n ${err}`, textColor: "Red", timeColor: "Red" });
            if (interaction.replied || interaction.deferred) {
                interaction.followUp({ content: "There was an error while executing the command", ephemeral: true });
            }
            else {
                interaction.reply({ content: "There was an error while executing the command", ephemeral: true });
            }
        }
    }
});
// register servers
client.on("guildCreate", async (guild) => {
    if (!guild && guild.id)
        return;
    try {
        const members = [];
        let res = await guild.members.fetch();
        res.map(e => {
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
client.on("guildMemberAdd", async (m) => {
    try {
        const dcServer = await (0, DiscordServers_1.getServerByGuildId)(m.guild.id);
        let isIn = false;
        dcServer.members.map(e => {
            if (e.id === m.id) {
                isIn = true;
            }
        });
        if (isIn)
            return;
        dcServer.members.push({
            username: m.user.tag,
            id: m.id
        });
        await dcServer.save();
    }
    catch (err) {
        (0, cmd_1.error)(err.message);
    }
});
client.on("guildMemberRemove", async (m) => {
    try {
        const dcServer = await (0, DiscordServers_1.getServerByGuildId)(m.guild.id);
        let isIn = false;
        dcServer.members.map((e, i) => {
            if (e.id === m.id) {
                isIn = true;
                dcServer.members.splice(i, 1);
            }
        });
        if (!isIn)
            return;
        await dcServer.save();
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
        let membersCount = c.users.cache.size;
        let channelsCount = c.channels.cache.size;
        let guilds = await c.guilds.fetch();
        const server = await discordServers_1.default.find();
        guilds.map(async (e) => {
            try {
                let isIn = false;
                server.map(ele => {
                    if (ele.serverId === e.id) {
                        isIn = true;
                        return;
                    }
                });
                if (isIn)
                    return;
                let members = (await (await e.fetch()).members.fetch()).map(e => {
                    return {
                        username: e.user.tag,
                        id: e.user.id
                    };
                });
                await new DiscordServers_1.default({
                    name: e.name,
                    members: members,
                    serverId: e.id,
                    games: []
                }).save();
            }
            catch (err) {
                (0, cmd_1.error)(err.message);
            }
        });
        c.guilds.cache.map(async (e) => {
            try {
                const server = await (0, DiscordServers_1.getServerByGuildId)(e.id);
                if (server.games.length === 0)
                    return;
                server.games = [];
                await server.save();
            }
            catch (err) {
                (0, cmd_1.error)("an error occurred while cleaning the servers. \n " + err.message);
            }
        });
        (0, cmd_1.log)({ text: `${c.guilds.cache.size} servers                  |                  ${membersCount} members                  |                  ${channelsCount} channels` });
    }
    catch (err) {
        (0, cmd_1.log)({ text: `There was an error while connecting to the database. \n ${err.message}`, textColor: "Red", timeColor: "Red" });
    }
});
client.login(process.env.TOKEN);
