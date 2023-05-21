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
const Commands_1 = require("./lib/Commands");
const QuizGame_1 = __importStar(require("./lib/QuizGame"));
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
        else if (interaction.customId.startsWith("leave_quizgame")) {
            command = interaction.client.buttons.get("leave_quizgame_[:id]");
        }
        else if (interaction.customId.startsWith("answer")) {
            command = interaction.client.buttons.get("answer_[:ans]_[:id]");
        }
        else if (interaction.customId.startsWith("delete_quiz")) {
            command = interaction.client.buttons.get("delete_quiz_[:id]");
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
                const pass = await (0, Commands_1.verify)(interaction);
                if (!pass) {
                    const after = Date.now();
                    const ping = after - before;
                    (0, cmd_1.log)({ text: `command executed successfully /${interaction.commandName} by ${interaction.user.tag}. ${ping}ms`, textColor: "Green", timeColor: "Green" });
                    return;
                }
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
client.on("channelDelete", async (c) => {
    try {
        if (c.type !== discord_js_1.ChannelType.GuildText)
            return;
        if (!c.guildId)
            return;
        const server = await (0, DiscordServers_1.getServerByGuildId)(c.guildId);
        if (!server.config.quiz?.multiple_channels)
            return;
        if (c.parent.id !== server.config.quiz.channels_category)
            return;
        for (let i = 0; i < server.games.length; i++) {
            if (server.games[i].channelId === c.id) {
                await DiscordServers_1.default.deleteGame(c.guildId, server.games[i].hostId);
            }
        }
    }
    catch (err) {
        (0, cmd_1.error)(err.message);
    }
});
client.on("channelCreate", async (c) => {
    try {
        if (!c.guild)
            return;
        if (c.type !== discord_js_1.ChannelType.GuildText)
            return;
        const AuditLogFetch = await c.guild.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.ChannelCreate });
        const logChannel = await client.channels.cache.get(c.id);
        if (!logChannel)
            return;
        if (!AuditLogFetch.entries.first())
            return;
        const creator = AuditLogFetch.entries.first().executor;
        if (creator.id === client.user.id)
            return;
        const options = c.name.split("-");
        if (options.length !== 3 && options.length !== 4)
            return;
        const cat = Object.keys(QuizGame_1.categories);
        let isValidCat = false;
        let category;
        cat.map((e) => {
            if (e.toLowerCase() === options[0].toLowerCase()) {
                isValidCat = true;
                category = e;
            }
        });
        if (!isValidCat)
            return;
        if (typeof +options[1] !== "number")
            return;
        const amount = +options[1];
        if (amount > QuizGame_1.amount[1] || amount < QuizGame_1.amount[0])
            return;
        const maxPl = +options[2];
        if (maxPl < QuizGame_1.maxPlayers[0] || maxPl > QuizGame_1.maxPlayers[1])
            return;
        let time;
        if (options[3]) {
            time = +options[3];
            if (time !== 5 && time !== 10 && time !== 15 && time !== 30 && time !== 45)
                return;
        }
        if (!time) {
            time = 30;
        }
        time = time * 1000;
        const channel = c;
        const hostId = `${Date.now()}`;
        let msg = await channel.send({
            content: "creating Quiz Game..."
        });
        await c.edit({
            name: hostId,
            permissionOverwrites: [{
                    id: c.guild.roles.everyone,
                    deny: ["SendMessages"]
                }]
        });
        try {
            const game = new QuizGame_1.default(channel.guildId, {
                hostName: creator.tag,
                hostId: hostId,
                hostUserId: creator.id,
                maxPlayers: maxPl,
                channelId: channel.id,
                announcementId: msg.id,
                category: category,
                amount: amount,
                time: time || 30 * 1000,
                mainChannel: false
            }, true);
            await game.save();
        }
        catch (err) {
            await msg.delete();
            msg = null;
            await DiscordServers_1.default.deleteGame(c.guildId, hostId);
            await c.delete();
            throw new Error(err?.message);
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`Quiz Game`)
            .setThumbnail("https://hips.hearstapps.com/hmg-prod/images/quiz-questions-answers-1669651278.jpg")
            .addFields({ name: `Info`, value: `Category : **${category}** \nAmount : **${amount}** \ntime : **${time / 1000 + " seconds" || "30 seconds"}** \nMax players : **${maxPl}**` })
            .setAuthor({ name: `Waiting for the players... 0 / ${maxPl}` })
            .setTimestamp(Date.now())
            .setFooter({ text: `id : ${hostId}` });
        const button = new discord_js_1.ButtonBuilder()
            .setLabel("join")
            .setStyle(3)
            .setCustomId(`join_quizgame_${hostId}`);
        const roww = new discord_js_1.ActionRowBuilder()
            .addComponents(button);
        try {
            if (!msg)
                throw new Error(`Cannot create the game`);
            await msg.edit({
                embeds: [embed],
                components: [roww],
                content: `@everyone new Quiz Game created by <@${creator.id}> ${(0, cmd_1.TimeTampNow)()}`
            });
        }
        catch (err) {
            await DiscordServers_1.default.deleteGame(c.guildId, hostId);
            await c.delete();
            throw new Error(err?.message);
        }
        setTimeout(async () => {
            try {
                const game = await QuizGame_1.default.getGameWithHostId(c.guildId, hostId);
                if (game.started)
                    return;
                await DiscordServers_1.default.deleteGame(channel.guildId, hostId);
                const announcement = channel.messages.cache.get(game.announcementId);
                if (announcement) {
                    const embed = new discord_js_1.EmbedBuilder()
                        .setAuthor({ name: "Quiz Game" })
                        .setTitle(`Time out : game deleted`);
                    await announcement.edit({
                        embeds: [embed],
                        components: [],
                        content: ""
                    });
                }
                await new Promise((res, rej) => {
                    setTimeout(res, 5 * 1000);
                });
                await channel.delete();
            }
            catch (err) {
                (0, cmd_1.warning)(err.message);
            }
        }, 1000 * 60 * 5);
    }
    catch (err) {
        (0, cmd_1.warning)(err.message);
    }
});
client.on("ready", async (c) => {
    console.clear();
    console.log(`[${new Date().toLocaleTimeString()}] Discord bot connected as : ${c.user.username}`);
    (0, cmd_1.log)({ text: `connecting to the database`, textColor: "Magenta", timeColor: "Magenta" });
    try {
        const bDate = Date.now();
        await (0, connectDB_1.connectDB)();
        (0, cmd_1.log)({ text: `successfully connected to the database`, textColor: "Green", timeColor: "Green" });
        let guilds = await c.guilds.fetch();
        await DiscordServers_1.default.scanGuilds(guilds);
        await DiscordServers_1.default.cleanGuilds();
        const aDate = Date.now();
        const ping = aDate - bDate;
        (0, cmd_1.log)({ text: "Bot started " + ping + "ms", textColor: "Cyan" });
        // log({text : `${c.guilds.cache.size} servers                  |                  ${membersCount} members                  |                  ${channelsCount} channels`})
        const DcServers = await discordServers_1.default.find();
        let svs = DcServers.map(e => {
            return {
                name: e.name,
                membersLength: e.members.length,
                "guild id": e.serverId,
                id: e.id,
                __v: e.__v
            };
        });
        console.table(svs);
        client.user.setActivity({ type: discord_js_1.ActivityType.Watching, name: "/create_quizgame" });
    }
    catch (err) {
        (0, cmd_1.log)({ text: `There was an error while connecting to the database. \n ${err.message}`, textColor: "Red", timeColor: "Red" });
    }
});
client.login(process.env.TOKEN);
