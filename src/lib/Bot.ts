import {
  ActivityOptions,
  CacheType,
  ChatInputCommandInteraction,
  Collection,
  GatewayIntentBits,
} from "discord.js";
import Discord from "discord.js";
import { Member } from "../model/discordServers";
import path from "path";
import fs from "fs";
import Command, { ButtonCommand, CommandOptions } from "./Commands";

type ScanCommandsOptions = {
  sync?: boolean;
  files?: string[];
};

export abstract class Bot {
  /**
   * Create a new slash Command
   */
  static createCommand(command: CommandOptions) {
    this.client.application?.commands?.create(command.data);
    // @ts-ignore
    this.cmds.set(command.data.name, new Map<string, Member>());

    //@ts-ignore
    this.client.commands.set(command.data.name, command);
  }
  static cmds = new Map<string, Map<string, Member>>();
  /**
   * The bot :)
   */
  static client = new Discord.Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
    ],
  });
  /**
   * Lunch the bot.
   *
   * @note set the productionMode in config.json to false if you are testing the bot.
   */
  static async lunch() {
    await this.client.login(process.env.TOKEN);
  }
  /**
   * Scan command folder and save the commands
   * @note also create / command for the new commands
   */
  static async scanCommands(save?: boolean) {
    this.client.commands = new Collection();
    const commandPath = path.join(__dirname + "/..", "commands");
    const commandFiles = fs
      .readdirSync(commandPath)
      .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));
    for (const file of commandFiles) {
      const filePath = path.join(commandPath, file);
      const command = require(filePath);
      if ("data" in command && "execute" in command) {
        await (command as Command).save(save);
      } else {
        console.log(
          "\x1b[33m",
          "[warning] : ",
          "\x1b[37m",
          `The command at ${filePath} has a missing property.`
        );
      }
    }
  }
  /**
   * Scan button folder and save the commands
   */
  static scanButtons() {
    this.client.buttons = new Collection();
    const buttonsPath = path.join(__dirname + "/..", "buttons");
    const buttonFolder = fs
      .readdirSync(buttonsPath)
      .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));
    for (let file of buttonFolder) {
      const filePath = path.join(buttonsPath, file);
      const button = require(filePath) as ButtonCommand;
      if ("data" in button || "execute" in button) {
        this.client.buttons.set(button.data.name, button);
      } else {
        console.log(
          "\x1b[33m",
          "[warning] : ",
          "\x1b[37m",
          `The command at ${filePath} has a missing property.`
        );
      }
    }
  }
  static async addCommand(...files: string[]) {
    for (const fileName of files) {
      const filePath = path.join(__dirname + "/..", "commands", fileName);
      const command = require(filePath) as Command;
      if ("data" in command && "execute" in command) {
        await command.save();
      } else {
        console.log(
          "\x1b[33m",
          "[warning] : ",
          "\x1b[37m",
          `The command at ${filePath} has a missing property.`
        );
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
  static checkRequest(
    interaction: ChatInputCommandInteraction<CacheType>
  ): boolean {
    const userCMD = this.cmds
      .get(interaction.commandName)
      ?.get(interaction.user.id);
    if (userCMD) return false;
    if (!userCMD) {
      this.cmds.get(interaction.commandName)?.set(interaction.user.id, {
        username: interaction.user.tag,
        id: interaction.user.id,
      });
      setTimeout(() => {
        this.cmds.get(interaction.commandName)?.delete(interaction.user.id);
      }, 3000);
      return true;
    }
  }
  static get uptime() {
    let uptime = this.client.uptime;
    let days = toInt(uptime / (1000 * 60 * 60 * 24));
    let hours = toInt(uptime / (1000 * 60 * 60) - days * 24);
    let min = toInt(uptime / (1000 * 60) - (hours * 60 + days * 24 * 60));
    let sec = +(
      uptime / 1000 -
      (days * 24 * 60 * 60 + hours * 60 * 60 + min * 60)
    ).toFixed(0);
    return `${days}d ${hours}h ${min}m ${sec}s`;
  }
  static get stats() {
    const guildsSize = this.client.guilds.cache.size;
    const members = this.client.users.cache.size;
    return {
      guildsSize,
      members,
    };
  }
  /**
   * Set the activity of the bot
   */
  static setActivity({ type, name }: ActivityOptions) {
    this.client.user.setActivity({ type: type, name: name });
  }
  /**
   * set if the bot is busy or not.
   *
   * 0 : the bot is not busy
   *
   * 1 : the bot is busy and it will not respond to any request
   *
   * default value from .env file variable BUSY
   */
  static maintenance = +process.env.BUSY;
  static createQzgame = {
    enable: require("../../config.json").quizGame?.createQzgame?.enable,
    reason: require("../../config.json").quizGame?.createQzgame?.reason,
  };
}

function toInt(num: number) {
  return +num.toString().split(".")[0];
}
