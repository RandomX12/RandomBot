import {
  ApplicationCommandDataResolvable,
  ButtonInteraction,
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  Interaction,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  MessagePayload,
  PermissionResolvable,
} from "discord.js";
import discordServers, { Member } from "../model/discordServers";
import { Bot } from "./Bot";
import DiscordServersError from "./errors/DiscordServers";
/**
 * Reply to a message dynamically
 * If the interaction is replied or deferred it will edit the message
 * If not it will reply to the interaction
 * @param interaction discord interaction
 * @param options message options and data
 */
export async function reply(
  interaction: ChatInputCommandInteraction | ButtonInteraction<CacheType>,
  options?:
    | string
    | MessagePayload
    | InteractionEditReplyOptions
    | InteractionReplyOptions
) {
  if (interaction.deferred || interaction.replied) {
    if (!options) {
      await interaction.deleteReply();
      return;
    }
    await interaction.editReply(options);
  } else {
    if (!options) {
      await interaction.deferReply({ ephemeral: true });
      await interaction.deleteReply();
    }
    await interaction.reply(options);
  }
}
/**
 * Reply with embedded message error
 * @param interaction the request
 * @param content error message
 */
export async function replyError(
  interaction: ChatInputCommandInteraction | ButtonInteraction<CacheType>,
  content: string,
  components?: any[]
) {
  const embed = new EmbedBuilder().setDescription(content).setColor("Red");
  await reply(interaction, {
    embeds: [embed],
    content: "",
    components: components || [],
    ephemeral: true,
  });
}

export async function verify(
  interaction: ChatInputCommandInteraction<CacheType>
): Promise<boolean> {
  let server: any = await discordServers.findOne({
    serverId: interaction.guildId,
  });
  if (!server)
    throw new DiscordServersError(
      "404",
      `server not found with id="${interaction.guildId}"`
    );
  if (!server.config)
    throw new DiscordServersError("402", "no config in this server");
  let command = Bot.client.commands.get(interaction.commandName);
  for (let permissions of command.access) {
    if (!interaction.guild.members.me.permissions.has(permissions)) {
      const msg = `🟡 warning : ${interaction.client.user.username} needs "**${
        command.access?.join(" , ") || ""
      }**" permission${
        command.access.length > 1 ? "s" : ""
      } to execute this command '**/${interaction.commandName}**'.
    please can any one give me ${
      command.access.length > 1 ? "these" : "this"
    } permission${command.access.length > 1 ? "s" : ""}`;
      await interaction.channel.send({
        content: msg,
      });
      return false;
    }
  }
  for (let i = 0; i < server.config?.commands?.length; i++) {
    if (server.config.commands[i].name === interaction.commandName) {
      if (!server.config.commands[i].enable) {
        await replyError(
          interaction,
          "This command is disabled in this server"
        );
        return false;
      }
      if (interaction.guild.ownerId === interaction.user.id) {
        return true;
      }
      if (
        server.config.commands[i].bannedUsers.indexOf(interaction.user.id) > -1
      ) {
        await replyError(interaction, "You are banned from using this command");
        return false;
      }
      if (server.config.commands[i].permissions.length === 0) {
        server.config.commands[i].permissions = null;
      }
      if (server.config.commands[i].rolesId.length === 0) {
        server.config.commands[i].rolesId = null;
      }
      if (
        !server.config.commands[i].permissions &&
        !server.config.commands[i].rolesId
      ) {
        return true;
      }
      const member = interaction.member as GuildMember;
      if (server.config.commands[i].permissions) {
        for (let j = 0; j < server.config.commands[i].permissions.length; j++) {
          if (
            !member.permissions.has(server.config.commands[i].permissions[j])
          ) {
            await replyError(
              interaction,
              "You don't have the permission to this command "
            );
            return false;
          }
        }
        return true;
      }
      if (server.config.commands[i].rolesId) {
        for (let j = 0; j < server.config.commands[i].rolesId.length; j++) {
          if (member.roles.cache.has(server.config.commands[i].rolesId[j])) {
            return true;
          }
        }
      }

      await replyError(
        interaction,
        "You don't have the permission to this command "
      );
      return false;
    }
  }
  throw new DiscordServersError(
    "401",
    `Command '/${interaction.commandName}' has no config in '${interaction.guild.name}'<${interaction.guildId}>`
  );
}

export interface CommandOptions {
  data: ApplicationCommandDataResolvable;
  execute: (
    interaction: ChatInputCommandInteraction<CacheType>
  ) => Promise<void>;
  permissions?: PermissionResolvable[];
  ephemeral?: boolean;
  deferReply?: boolean;
  access?: PermissionResolvable[];
}

/**
 * New way to create a slash command
 * @note still beta
 */
export default class Command implements CommandOptions {
  public data: ApplicationCommandDataResolvable;
  public execute: (
    interaction: ChatInputCommandInteraction<CacheType>
  ) => Promise<void>;
  public permissions?: PermissionResolvable[];
  public ephemeral?: boolean;
  public deferReply?: boolean;
  public access?: PermissionResolvable[];
  constructor(command: CommandOptions) {
    this.data = command.data;
    this.execute = command.execute;
    this.permissions = command.permissions;
    this.ephemeral = command.ephemeral;
    this.deferReply =
      command.deferReply === undefined ? true : command.deferReply;
    this.access = command.access ? command.access : [];
  }
  async save(save?: boolean) {
    if (save) {
      await Bot.client.application.commands.create(this.data);
    }
    //@ts-ignore
    Bot.client.commands.set(this.data.name, this);
    //@ts-ignore
    Bot.cmds.set(this.data.name, new Map<string, Member>());
  }
}
type ButtonData = {
  name: string;
  description: string;
};

interface ButtonCommandOptions {
  data: ButtonData;
  execute: (interaction: ButtonInteraction<CacheType>) => Promise<void>;
  permissions?: PermissionResolvable[];
  ephemeral?: boolean;
  deferReply?: boolean;
  access?: PermissionResolvable[];
}

/**
 * Create a button command
 */
export class ButtonCommand implements ButtonCommandOptions {
  data: ButtonData;
  execute: (interaction: ButtonInteraction<CacheType>) => Promise<void>;
  permissions?: PermissionResolvable[];
  ephemeral?: boolean;
  deferReply?: boolean;
  access?: PermissionResolvable[];
  constructor(command: ButtonCommandOptions) {
    this.data = command.data;
    this.execute = command.execute;
    this.permissions = command.permissions;
    this.ephemeral = command.ephemeral || false;
    this.deferReply =
      command.deferReply === undefined ? true : command.deferReply;
    this.access = command.access ? command.access : [];
  }
}
