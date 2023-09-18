import {
  ActionRowBuilder,
  ActivityType,
  AuditLogEvent,
  ButtonBuilder,
  ChannelType,
  type Collection,
  EmbedBuilder,
  type GuildMember,
  OverwriteResolvable,
  Message,
} from "discord.js";
import { animateRotatingSlash, error, log, warning } from "./lib/cmd";
import { connectDB } from "./lib/connectDB";
import DiscordServers, { fetchServer } from "./lib/DiscordServers";
import Command, {
  ButtonCommand,
  reply,
  replyError,
  verify,
} from "./lib/Commands";
import {
  type QuizCategory,
  categories,
  amount as amountQs,
  maxPlayers,
  maxGames,
  QzGame,
  createQzGame,
  generateId,
  type QzGameInfo,
  QuizCategoryImg,
  difficulty,
} from "./lib/QuizGame";
import { Bot } from "./lib/Bot";
import listenToCmdRunTime from "./lib/consoleCmd";
import figlet from "figlet";
import gradient from "gradient-string";
import handleError from "./lib/errors/handler";
import troubleshoot from "./lib/errors/troubleshoot";
import { Storage } from "./storage/storage";
import { QuizGame as QzGameT } from "./model/QuizGame";
import { gameStartType } from "./lib/DiscordServersConfig";
import QzGameError from "./lib/errors/QuizGame";
import lunchServer from "./server";
import Ping from "./lib/Ping";
listenToCmdRunTime();
require("dotenv").config();
declare module "discord.js" {
  export interface Client {
    commands: Collection<string, Command>;
    buttons: Collection<string, ButtonCommand>;
  }
}

const { client } = Bot;
// storage

const games = new Storage<string, QzGameT>();

export { games };

// execute commands
let msgs = new Map();
client.on("interactionCreate", async (interaction) => {
  try {
    // if(!interaction.isChatInputCommand()) return
    if (!interaction.guild) return;
    const user = msgs.get(interaction.user.id);

    if (user) {
      //@ts-ignore
      interaction.user.count = user.count + 1;
      msgs.set(interaction.user.id, interaction.user);
      if (user.count > 15) {
        log({
          text: `${interaction.user.tag} is blocked cause of spam`,
          timeColor: "Yellow",
          textColor: "Yellow",
        });
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
      let buttonName = interaction.customId.split("_")[0];
      let command = interaction.client.buttons.get(buttonName);
      if (!command) {
        console.log(
          `\x1b[33m`,
          `[warning]`,
          `Command Button ${interaction.customId} is not found`
        );
        return;
      }
      let hasPermission = false;
      if (command.permissions) {
        const member = interaction.member as GuildMember;
        for (let i = 0; i < command.permissions.length; i++) {
          if (member.permissions.has(command.permissions[i])) {
            hasPermission = true;
            return;
          }
        }
      } else {
        hasPermission = true;
      }
      if (!hasPermission) {
        await reply(interaction, {
          content: ":x: You don't have permission",
          ephemeral: true,
        });
      }
      if (command.deferReply) {
        await interaction.deferReply({
          ephemeral: command.ephemeral,
        });
      }
      try {
        const before = Date.now();
        log({
          text: `Executing ${interaction.customId} button command by ${interaction.user.tag}`,
        });
        await command.execute(interaction);
        const after = Date.now();
        const ping = after - before;
        log({
          text: `Button command executed successfully ${interaction.customId} by ${interaction.user.tag}. ${ping}ms`,
          textColor: "Green",
          timeColor: "Green",
        });
      } catch (err: any) {
        try {
          await troubleshoot(err, interaction, command);
          await command.execute(interaction);
        } catch (error) {
          await replyError(interaction, handleError(error));
        }

        error(err.message);
      }
    } else if (interaction.isCommand() && interaction.isChatInputCommand()) {
      let check = Bot.checkRequest(interaction);
      if (!check) return;
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) {
        console.log(
          `\x1b[33m`,
          `[warning]`,
          `Command /${interaction.commandName} is not found`
        );
        return;
      }
      try {
        const commandConfig =
          require("../config.json").commands[interaction.commandName];
        if (commandConfig) {
          const before = Date.now();
          log({
            text: `Executing /${interaction.commandName} by ${interaction.user.tag}`,
          });
          if (command.deferReply) {
            await interaction.deferReply({
              ephemeral: command.ephemeral || false,
            });
          }
          try {
            const pass = await verify(interaction);
            if (!pass) {
              const after = Date.now();
              const ping = after - before;
              log({
                text: `command executed successfully /${interaction.commandName} by ${interaction.user.tag} in ${interaction.guild.name}<${interaction.guildId}>. ${ping}ms`,
                textColor: "Green",
                timeColor: "Green",
              });
              return;
            }
            await command.execute(interaction);
          } catch (err) {
            try {
              await troubleshoot(err, interaction, command);
              await command.execute(interaction);
            } catch (error) {
              await replyError(interaction, handleError(error));
            }

            error(
              `error when executing command ${interaction.commandName} : ${err.message}`
            );
            return;
          }
          const after = Date.now();
          const ping = after - before;
          log({
            text: `command executed successfully /${interaction.commandName} by ${interaction.user.tag} in '${interaction.guild.name}'<${interaction.guildId}> ${ping}ms.`,
            textColor: "Green",
            timeColor: "Green",
          });
        } else {
          await interaction.reply({
            content: ":x: This command is disabled",
            ephemeral: true,
          });
        }
      } catch (err) {
        log({
          text: `There was an error while executing the command \n ${err}`,
          textColor: "Red",
          timeColor: "Red",
        });
      }
    }
  } catch (err) {
    error(err);
  }
});
// register servers
client.on("guildCreate", async (guild) => {
  if (!guild) return;
  try {
    await new DiscordServers({
      serverId: guild.id,
    }).save();
    log({
      text: `Bot joined new server ${guild.name} ; ${guild.members.cache.size} members`,
      textColor: "Cyan",
    });
  } catch (err: any) {
    error(err.message);
  }
});

client.on("guildDelete", async (guild) => {
  if (!guild) return;
  try {
    await DiscordServers.deleteGuild(guild.id);
    log({
      text: `Bot left a server ${guild.name} ; ${guild.members.cache.size} members`,
      textColor: "Yellow",
    });
  } catch (err: any) {
    error(err.message);
  }
});

client.on("messageDelete", async (msg) => {
  try {
    if (msg.author.id !== client.user.id) return;
    if (msg.channel.type !== ChannelType.GuildText) return;
    const game = games.select({
      announcementId: msg.id,
      channelId: msg.channelId,
      guildId: msg.guildId,
    })[0];
    if (!game) return;
    games.delete(game.hostId);
    const embed = new EmbedBuilder()
      .setTitle("It looks like someone deleted the game announcement ❌")
      .setAuthor({ name: "Quiz Game", iconURL: QuizCategoryImg.Random })
      .setFooter({ text: "Game deleted" });
    await msg.channel.send({
      content: "",
      components: [],
      embeds: [embed],
    });
    if (!game.mainChannel) {
      setTimeout(async () => {
        try {
          await msg.channel.delete();
        } catch (err) {
          warning(err.message);
        }
      }, 10 * 1000);
    }
  } catch (err) {
    warning(err.message);
  }
});
client.on("channelCreate", async (c) => {
  try {
    if (Bot.maintenance) return;
    if (!c.guild) return;
    if (c.type !== ChannelType.GuildText) return;
    const AuditLogFetch = await c.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.ChannelCreate,
    });
    const logChannel = client.channels.cache.get(c.id);
    if (!logChannel) return;
    if (!AuditLogFetch.entries.first()) return;
    const creator = AuditLogFetch.entries.first().executor;
    if (creator.id === client.user.id) return;
    const server = await fetchServer(c.guildId);
    if (!server.config?.quiz.customGames) return;
    const options = c.name.split("-");
    if (options.length !== 3 && options.length !== 4 && options.length !== 5)
      return;
    const cat = Object.keys(categories);
    let isValidCat = false;
    let category: QuizCategory;
    cat.map((e) => {
      if (e.toLowerCase() === options[0].toLowerCase()) {
        isValidCat = true;
        category = e as QuizCategory;
      }
    });
    if (!isValidCat) return;
    if (!+options[1]) return;
    if (!+options[2]) return;
    const amount = +options[1];
    if (amount > amountQs[1] || amount < amountQs[0]) return;
    const maxPl = +options[2];
    if (maxPl < maxPlayers[0] || maxPl > maxPlayers[1]) return;
    let time: number;
    const times = [5, 10, 15, 30, 45];
    let difficulty: difficulty;
    const diffs: difficulty[] = ["easy", "medium", "hard"];
    if (options[3]) {
      if (diffs.indexOf(options[3] as difficulty) === -1) {
        if (!+options[3]) return;
        if (times.indexOf(+options[3]) === -1) return;
        time = +options[3];
      } else {
        difficulty = options[3] as difficulty;
      }
      if (options[4]) {
        if (diffs.indexOf(options[4] as difficulty) === -1) {
          if (time) return;
          if (!+options[4]) return;
          if (times.indexOf(+options[4]) === -1) return;
          time = +options[4];
        } else {
          if (difficulty) return;
          difficulty = options[4] as difficulty;
        }
      }
    }
    if (!time) {
      time = 30;
    }
    time = time * 1000;
    const channel = c;
    const hostId = generateId();
    const guildGames = games.select({ guildId: channel.guildId });
    if (guildGames.length >= maxGames) {
      await channel.send({
        content: `Cannot create the game :x:\nThis server has reached the maximum number of games ${maxGames}.`,
      });
      return;
    }

    const jlAction: any = new ActionRowBuilder().setComponents(
      new ButtonBuilder()
        .setLabel("join")
        .setCustomId("join_quizgame_" + hostId)
        .setStyle(3),
      new ButtonBuilder()
        .setLabel("leave")
        .setCustomId("leave_quizgame_" + hostId)
        .setStyle(4)
    );
    let msg: Message;
    let btns: Message;

    try {
      btns = await c.send({
        components: [jlAction],
      });
      msg = await channel.send({
        content: "creating Quiz Game...",
      });
    } catch (err) {
      if (msg) {
        await msg.delete();
      }
      if (btns) {
        await btns.delete();
      }
      const embed = new EmbedBuilder()
        .setTitle("cannot send game's announcement :x:")
        .setColor("Red");
      await channel.send({
        embeds: [embed],
      });
      throw new QzGameError("501", "cannot send join leave buttons");
    }
    const permissions: OverwriteResolvable[] = c.permissionOverwrites.cache.map(
      (e) => {
        if (e.id === c.guild.roles.everyone.id) {
          return {
            id: e.id,
            allow: e.allow.remove("SendMessages"),
            deny: e.deny.add("SendMessages"),
          };
        }
        return e;
      }
    );
    if (permissions.length === 0) {
      permissions.push({
        id: channel.guild.roles.everyone.id,
        deny: ["SendMessages"],
      });
    }
    permissions.push({
      id: client.user.id,
      allow: ["SendMessages", "ManageChannels", "ViewChannel"],
      deny: [],
    });

    await c.edit({
      name: "waiting 🟡",
      permissionOverwrites: permissions,
    });
    const gameBody: QzGameInfo = {
      guildId: channel.guildId,
      hostName: creator.tag,
      hostUserId: creator.id,
      maxPlayers: maxPl,
      channelId: channel.id,
      announcementId: msg.id,
      category: category,
      amount: amount,
      time: time || 30 * 1000,
      mainChannel: false,
      gameStart: server.config.quiz.gameStart || 0,
      difficulty: difficulty,
    };

    try {
      await createQzGame(hostId, gameBody);
    } catch (err: any) {
      await msg.delete();
      msg = null;
      DiscordServers.deleteGame(hostId);
      throw new Error(err?.message);
    }
    const game = await QzGame.getGame(hostId);
    game.applyData(gameBody);
    const embed = game.generateEmbed();
    const row: any = game.generateRow(game.gameStart || 0);
    try {
      if (!msg) throw new Error(`Cannot create the game`);
      await msg.edit({
        embeds: [embed],
        components:
          game.gameStart && game.gameStart !== gameStartType.ADMIN ? [row] : [],
        content: game.generateContent(),
      });
    } catch (err: any) {
      DiscordServers.deleteGame(hostId);
      throw new Error(err?.message);
    }
    setTimeout(async () => {
      try {
        const game = await QzGame.getGame(hostId);
        if (game.started) return;
        DiscordServers.deleteGame(hostId);
        let ch = await channel.fetch();
        const announcement = ch.messages.cache.get(game.announcementId);
        if (announcement) {
          const embed = new EmbedBuilder()
            .setAuthor({ name: "Quiz Game" })
            .setTitle(`Time out : game deleted`);
          await announcement.edit({
            embeds: [embed],
            components: [],
            content: "",
          });
        }
        await new Promise((res, rej) => {
          setTimeout(res, 5 * 1000);
        });
        await ch.delete();
      } catch (err: any) {
        warning(err.message);
      }
    }, 1000 * 60 * 5);
  } catch (err: any) {
    const game = games.select({
      guildId: c.guildId,
      channelId: c.id,
      mainChannel: false,
    })[0];
    if (game) {
      games.delete(game.hostId);
    }
    warning(err.message);
  }
});

client.on("channelDelete", async (channel) => {
  try {
    if (channel.type !== ChannelType.GuildText) return;
    if (!channel.guild) return;
    const gms = games.select({ guildId: channel.guildId });
    if (!gms.length) return;
    for (let i = 0; i < gms.length; i++) {
      if (gms[i].channelId === channel.id) {
        DiscordServers.deleteGame(gms[i].hostId);
        return;
      }
    }
  } catch (err) {
    warning(err.message);
  }
});

client.on("ready", async (c) => {
  try {
    console.clear();
    log({
      text: `Discord bot connected as : ${c.user.username}`,
      textColor: "Blue",
      timeColor: "Blue",
    });
    const bDate = Date.now();
    let scan = require("../config.json").scanSlashCommands;
    if (scan) {
      let ws = animateRotatingSlash("Scanning commands...");
      await Bot.scanCommands();
      clearInterval(ws);
      console.log("\ncommands scanned successfully");
    } else {
      Bot.scanCommands();
    }
    Bot.scanButtons();
    scan = null;
    log({
      text: `connecting to the database...`,
      textColor: "Magenta",
      timeColor: "Magenta",
    });
    const couter = new Ping();
    couter.start();
    await connectDB();
    couter.end();
    log({
      text: `successfully connected to the database ${couter.ping}ms`,
      textColor: "Green",
      timeColor: "Green",
    });
    couter.reset();
    log({
      text: "scanning guilds...",
      textColor: "Yellow",
      timeColor: "Yellow",
    });
    couter.start();
    await DiscordServers.scanGuilds(c.guilds.cache);
    couter.end();
    log({
      text: `Guilds scanned : ${c.guilds.cache.size} guilds.  ${couter.ping}ms`,
      textColor: "Green",
      timeColor: "Green",
    });
    const aDate = Date.now();
    const ping = aDate - bDate;
    log({ text: "Bot started " + ping + "ms", textColor: "Cyan" });
    client.user.setActivity({
      type: ActivityType.Watching,
      name: "/create_quizgame",
    });
    figlet(`RANDOM \tBOT`, (err, data) => {
      console.log(gradient("#6dfe84", "#6dfe84")(data));
    });
    console.log(
      gradient.pastel.multiline(`v${require("../package.json")?.version}`)
    );
  } catch (err: any) {
    log({
      text: `an error occurred while starting the bot \n ${err.message}`,
      textColor: "Red",
      timeColor: "Red",
    });
  }
});

const { bot } = require("../config.json");
if (bot?.loginAutomatically) {
  Bot.lunch();
}

lunchServer();
