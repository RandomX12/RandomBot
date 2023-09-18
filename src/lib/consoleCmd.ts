// this file is for handling runtime console commands
// still under dev

import readline from "readline";
import { Bot } from "./Bot";
import { animateRotatingSlash, error, log, warning } from "./cmd";
import { QzGame } from "./QuizGame";
import Ping from "./Ping";
import { games } from "..";
import mongoose from "mongoose";
import { connectDB } from "./connectDB";
import { ActivityType } from "discord.js";
type CommandType = "SYNC" | "ASYNC";

type ArgType = "str" | "int" | "float" | "bol" | "txt" | "arr";

type ParamsRuntimeCMD = {
  param: string;
  required: boolean;
  name: string;
  type?: ArgType;
};

type ArgRuntimeCMD = {
  param: string;
  required: boolean;
  value: unknown[] | string | number | boolean;
  name: string;
  type?: ArgType;
};

type RuntimeCMD<T extends CommandType> = {
  input: string;
  description?: string;
  fn: T extends "SYNC"
    ? (args: ArgRuntimeCMD[]) => void
    : (args: ArgRuntimeCMD[]) => Promise<void>;
  type?: T;
  loadingTxt?: T extends "ASYNC" ? string : never;
  finishTxt?: string;
  args?: ParamsRuntimeCMD[];
};
type CMDStatus = "SUCCESSFUL" | "FAILED";
type RuntimeCMDHistory<S extends CMDStatus> = S extends "FAILED"
  ? {
      command: string;
      input: string;
      time: string;
      status: S;
      error: string;
      date: string;
    }
  : {
      command: string;
      input: string;
      time: string;
      status: S;
      date: string;
    };
let history: RuntimeCMDHistory<CMDStatus>[] = [];
let commands: RuntimeCMD<CommandType>[] = [];
let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
let specialWords: string[] = [];

export const inputRegex =
  /^\s*[\w-]+((\s+("[^"\\]*"|\[(("[^"\\]*"|true|false|\d*)\s*,?\s*)*\]|\w+|\d+(\.\d+)?)?)*)?$/g;

export const arrDataRegex = /("[^"\\]*"|true|false|\d+\.\d+|\d*)/g;

export const inputSplitRegex = /(^[\w-]+|"[^"]*"|\d+(\.\d+)?|\w+|\[(.*)\])/g;

const txtRegex = /"[^"]*"|\w+/g;
const arrRegex = /^\[(.*)\]$/g;
export function checkArgType(arg: string, type: ArgType): boolean {
  if (type === "arr" && /^\[(.*)\]$/.test(arg)) return true;
  if (type === "txt" && /"[^"]*"|\w+/.test(arg)) return true;
  if (type === "str" && /^(\w+|"[^"\\\s]*")$/.test(arg)) return true;
  if (type === "int" && Number.isInteger(+arg)) return true;
  if (type === "float" && +arg) return true;
  if (type === "bol" && (arg === "true" || arg === "false")) return true;
  return false;
}

export function typeOfArg(arg: string): ArgType {
  if (Number.isInteger(+arg)) return "int";
  if (+arg) return "float";
  if (arg === "true" || arg === "false") return "bol";
  if (/^\[(.*)\]$/.test(arg)) return "arr";
  if (arg.split(" ").length === 1) return "str";
  return "txt";
}

export function addToHistory<S extends CMDStatus>(
  cmd: Omit<RuntimeCMDHistory<S>, "time" | "command" | "date">
) {
  history.push({
    command: cmd.input.split(" ")[0],
    input: cmd.input,
    status: cmd.status,
    // @ts-ignore
    error: cmd?.error,
    time: new Date().toLocaleTimeString(),
    date: new Date().toLocaleDateString(),
  });
}

type ReturnValue<T extends ArgType> = T extends "bol"
  ? boolean
  : T extends "int" | "float"
  ? number
  : T extends "str" | "txt"
  ? string
  : T extends "arr"
  ? unknown[]
  : void;

export async function convertArg<T extends ArgType>(
  arg: string,
  type?: T
): Promise<ReturnValue<T>> {
  if (!type) {
    type = typeOfArg(arg) as T;
  }
  const verify = checkArgType(arg, type);
  if (!verify) throw new Error(`arg "${arg}" is not ${type}`);
  if (type === "bol") {
    //@ts-ignore
    if (arg === "true") return true;
    //@ts-ignore

    if (arg === "false") return false;
    return;
  }
  //@ts-ignore

  if (type === "float" || type === "int") return +arg;
  //@ts-ignore
  if (type === "str" || type === "txt") return arg.replaceAll(/"/g, "");
  if (type === "arr") {
    let data = arg.match(arrDataRegex).filter((e) => e);
    let strArr = `[${data.join(" , ")}]`;
    let convert = eval(`(function(){return ${strArr}})`);
    try {
      return convert();
    } catch (err: any) {
      error(
        `error when converting arg "${arg}" to javascript array : \n${err.message}`
      );
    }
  }
}
export let exe: boolean = false;
/**
 * Start listening to runtime line commands
 */
// ^"[^".]*"$
export default function listenToCmdRunTime() {
  warning("runtime console commands still under dev");
  rl.on("line", async (input) => {
    if (specialWords.indexOf(input) !== -1) return;
    if (!input.replace(/ */g, "")) return;
    if (!inputRegex.test(input)) {
      addToHistory<"FAILED">({
        input: input,
        status: "FAILED",
        error: "syntaxError : Invalid input.",
      });
      return error(`syntaxError : Invalid input.`);
    }
    inputRegex.lastIndex = 0;
    log({ text: "Executing runtime command " + `"${input}"` });
    try {
      let found = false;
      let argsBody: ArgRuntimeCMD[] = [];
      commands.map(async (e) => {
        if (e.input === input.split(" ")[0]) {
          found = true;

          const args = input.match(inputSplitRegex);
          args.shift();
          if (e.args.length > 0) {
            for (let i = 0; i < e.args.length; i++) {
              if (!args[i]) {
                if (e.args[i].required) {
                  error(`arg ${e.args[i].name} is required.`);
                  return;
                }
                break;
              }
              if (e.args[i].type) {
                const check = checkArgType(args[i], e.args[i].type);
                if (!check) {
                  error(
                    `TypeError : Type of arg ${i} is ${
                      e.args[i].type
                    } but got ${typeOfArg(args[i])} ("${args[i]}")`
                  );
                  return;
                }
              }
              try {
                let value = await convertArg(args[i], e.args[i].type);
                const arg: ArgRuntimeCMD = {
                  ...e.args[i],
                  value: value,
                  type: typeOfArg(args[i]),
                };

                argsBody.push(arg);
              } catch (err) {
                throw new Error(
                  `ConvertingError : error when converting arg ${i} "${args[i]}" to javascript ${e.args[i].type} :\n${err.message}`
                );
              }
            }
          }
          if (args.length > 0 && e.args.length === 0) {
            error(`"${e.input}" does not accept any args`);
            return;
          }
          if (args.length > e.args.length) {
            error(`"${e.input}" has only ${e.args.length} args.`);
            return;
          }
          if (e.type === "SYNC") {
            e.fn(argsBody);
          } else {
            e.loadingTxt != "Executing...";
            e.finishTxt != "Command Executed";
            let counter = new Ping();
            counter.start();
            let wt = animateRotatingSlash(e.loadingTxt);
            try {
              await e.fn(argsBody);
              counter.end();
              process.stdout.write(
                "\r" +
                  `\x1b[32m ${
                    e.finishTxt + `\t${counter.ping}ms` ||
                    "" + `\t${counter.ping}ms`
                  } \x1b[37m\n`
              );
            } catch (err) {
              error(err.message);
            }
            clearInterval(wt);
          }
        }
      });
      if (!found) {
        throw new Error(
          `"${
            input.split(" ")[0]
          }" runtime command is not found. if you want to create a new runtime command use the addRuntimeCMD function from ${__filename}`
        );
      }
      addToHistory({
        input: input,
        status: "SUCCESSFUL",
      });
    } catch (err) {
      addToHistory<"FAILED">({
        input: input,
        status: "FAILED",
        error: err.message,
      });
      error(err.message);
    }
  });
}
/**
 * Add a new Runtime Command
 * @param input command name structure
 * @param fn the function that will run the command is called
 */
export function addRuntimeCMD<T extends CommandType>(command: RuntimeCMD<T>) {
  const args = command.input.split(" ");
  if (!command.args) {
    command.args = [];
  }
  if (!command.type) {
    command.type = "SYNC" as T;
  }
  if (args.length > 1) {
    command.input = args[0];
    args.shift();
    const regex = /^\[:\w+\]\??(:(bol|str|int|float|txt|arr))?$/g;
    args.map((e, i) => {
      if (regex.test(e)) {
        regex.test(e);
        //@ts-ignore
        const propName = e.replaceAll(
          /\[:|\]|\?|(:(bol|str|int|float|arr|txt))$/g,
          ""
        );
        const required = !/\?(:(bol|str|int|float|arr|txt))?$/g.test(e);
        const typeRegex = /(:(str|float|int|bol|txt|arr))$/g;
        let type: ArgType;
        if (typeRegex.test(e)) {
          type = e.split(":").at(-1) as ArgType;
        }
        command.args.push({
          param: e,
          required: required,
          name: propName,
          type: type,
        });
        return;
      }
      throw new Error(
        `Invalid Runtime command syntax at arg ${i} "${e}" ${command.input} command`
      );
    });
  }
  commands.push(command);
}
/**
 * Add a new Special Word
 * @param word string
 */
export function addSpecialWord(word: string | string[]) {
  if (typeof word === "string") {
    specialWords.push(word);
  } else if (typeof word === "object") {
    specialWords.push(...word);
  }
}

// default runtime cmd
addSpecialWord(["y", "n"]);

addRuntimeCMD({
  input: "uptime",
  fn() {
    log({
      text: `The bot has been running for : ${Bot.uptime}`,
      textColor: "Green",
    });
  },
  description: "get the uptime of the bot",
});

addRuntimeCMD({
  input: "clear-slash-cmd",
  fn: () => {
    process.stdout.write(
      "Do you really want to delete all the commands ? (y / n) : "
    );
    rl.once("line", async (input: string) => {
      let before = Date.now();
      if (input !== "y") {
        log({ textColor: "Red", text: "Command deletion has been canceled" });
        return;
      }
      log({ textColor: "Yellow", text: "deleting all the slash commands..." });
      await Bot.clearCommands();
      let ping = Date.now() - before;
      log({ textColor: "Green", text: "Commands are deleted." + ` ${ping}ms` });
    });
  },
  type: "SYNC",
  description: "delete all the slash commands",
});

addRuntimeCMD({
  input: "scan-slash-cmd [:files]:arr",
  async fn(args) {
    try {
      await Bot.addCommand(...(args[0].value as string[]));
    } catch (err) {
      error(err.message);
    }
  },
  type: "ASYNC",
  loadingTxt: "Scanning commands...",
  finishTxt: " commands scanned successfully",
  description: "scan all the files in commands folder or some files",
});

addRuntimeCMD({
  input: "cls",
  fn() {
    console.clear();
  },
  type: "SYNC",
});

addRuntimeCMD({
  input: "guilds [:id]?:str",
  async fn(args) {
    if (!args[0]?.value) {
      const guilds = Bot.client.guilds.cache.map((g) => {
        return {
          id: g.id,
          name: g.name.slice(0, 12),
          members: g.memberCount,
          games: games.select({ guildId: g.id }).length,
        };
      });
      console.table(guilds);
    } else {
      const guild = Bot.client.guilds.cache.get(args[0].value as string);
      if (!guild) {
        error(`Guild with id="${args[0].value}" is not found`);
        return;
      }
      console.table({
        id: guild.id,
        name: guild.name.slice(0, 12),
        members: guild.memberCount,
        games: games.select({ guildId: guild.id }).length,
      });
    }
  },
});

addRuntimeCMD({
  input: "shut-down",
  type: "SYNC",
  fn() {
    console.log("Do you really want to shut down the bot");
    process.stdout.write(
      "This will make the bot offline and delete all the existing games and commands (y / n ) : "
    );
    rl.once("line", async (input) => {
      if (input !== "y") return;
      let wt = animateRotatingSlash("shutting down the bot...");
      await Bot.clearCommands();
      clearInterval(wt);
      log({ textColor: "Cyan", text: "\nserver offline" });
      process.exit(0);
    });
  },
});

// get games

addRuntimeCMD({
  input: "game-info [:gameId]:str",
  type: "ASYNC",
  async fn(args) {
    try {
      const game = await QzGame.getGame(`${args[0].value}`);
      console.table({
        hostId: game.hostId,
        hostName: game.hostName,
        players: game.players.size,
      });
    } catch (err) {
      error(err.message);
    }
  },
  loadingTxt: "Fetching game",
});

addRuntimeCMD({
  input: "send-msg [:userId]:str [:msg]:txt",
  type: "ASYNC",
  async fn(args) {
    await Bot.client.users.send(`${args[0].value}`, `${args[1].value}`);
  },
  loadingTxt: "sending message...",
  finishTxt: "sent",
});

addRuntimeCMD({
  input: "commands [:cmdName]?:str",
  type: "SYNC",
  fn(args) {
    if (!args[0]) {
      const table = commands.map((e) => {
        let argsStr = "";
        for (let i = 0; i < e.args.length; i++) {
          argsStr += `(${e.args[i].name} ${e.args[i].type})${
            e.args[i].required ? "" : "?"
          }${i + 1 === e.args.length ? "" : " "}`;
        }
        return {
          name: e.input,
          description: e.description || "--",
          args: argsStr || "--",
          type: e.type,
        };
      });
      console.table(table);
    } else {
      for (let i = 0; i < commands.length; i++) {
        if (commands[i].input === args[0].value) {
          console.table({
            name: commands[i].input.split(" ")[0],
            description: commands[i].description,
          });
          return;
        }
      }
      error(`RCL not found`);
    }
  },
  description: "get commands definition",
});

addRuntimeCMD({
  input: "get-history",
  fn(args) {
    console.table(history.reverse());
  },
});
addRuntimeCMD({
  input: "start",
  type: "ASYNC",
  async fn(args) {
    if (Bot.client.isReady()) {
      error(`The bot is already logged in`);
      return;
    }
    await Bot.lunch();
  },
  loadingTxt: "logging in...",
  finishTxt: "logged in",
});

addRuntimeCMD({
  input: "games [:server]?:str",
  fn(args) {
    if (args[0]) {
      const qzGames = games.select({ guildId: args[0].value as string });
      if (qzGames.length === 0) {
        console.log(`no quiz games found in server id='${args[0].value}'`);
        return;
      }
      const table = qzGames.map((game) => {
        return {
          hostId: game.hostId,
          guildId: game.guildId,
          players: game.players.length,
          category: game.category,
          amount: game.amount,
        };
      });
      console.table(table);
      return;
    }
    const allGames = games.cache;
    if (allGames.length === 0) {
      console.log(`No game created`);
      return;
    }
    const table = allGames.map((game) => {
      return {
        hostId: game.hostId,
        guildId: game.guildId,
        players: game.players.length,
        category: game.category,
        amount: game.amount,
      };
    });
    console.table(table);
  },
});

addRuntimeCMD({
  input: "connectDB [:url]?:txt",
  async fn(args) {
    if (args[0]?.value) {
      await mongoose.connect(args[0].value as string);
      return;
    }
    await connectDB();
  },
  type: "ASYNC",
  loadingTxt: "connecting to the DB...",
  finishTxt: "connected to the DB",
});

addRuntimeCMD({
  input: "busy [:bool]:int",
  description: `set if the bot is busy or not.
0 : the bot is not busy
1 : the bot is busy and it will not respond to any request`,
  type: "SYNC",
  fn(args) {
    if (args[0].value !== 0 && args[0].value !== 1) {
      error(`Invalid arg : value must be 1 or 0`);
      return;
    }
    if (Bot.maintenance === args[0].value) {
      error(
        `The server is already in maintenance mode ${
          Bot.maintenance ? "ON" : "OFF"
        }`
      );
      return;
    }
    if (args[0].value) {
      console.log("Do you really want to turn ON maintenance");
      process.stdout.write(
        "The bot will not respond to any request and you need to restart the server to turn maintenance mode off (y / n ) : "
      );
      rl.once("line", async (input) => {
        if (input !== "y") {
          log({ text: `action canceled`, textColor: "Red" });
          return;
        }
        Bot.maintenance = 1;
        Bot.client.removeAllListeners();
        Bot.setActivity({ type: ActivityType.Custom, name: "I am busy now" });
        log({ textColor: "Cyan", text: "\nmaintenance mode ON" });
      });
    } else {
      Bot.maintenance = 0;
      warning(`The server need a restart to revive the discord.js events`);
      log({ textColor: "Cyan", text: "\nmaintenance mode OFF" });
    }
  },
});
addRuntimeCMD({
  input: "create-qzgame [:c]:bol [:r]?:txt",
  fn(args) {
    Bot.createQzgame.enable = args[0].value;
    if (args[1]) {
      Bot.createQzgame.reason = args[1].value;
    }
    log({
      textColor: "Green",
      text: `create quiz games is ${args[0].value ? "enabled" : "disabled"}.`,
    });
  },
});
