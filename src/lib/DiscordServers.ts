import { Guild, OAuth2Guild } from "discord.js";
import ServersModel, {
  DiscordServer,
  Game,
  Member,
} from "../model/discordServers";
import Config, { ConfigT } from "./DiscordServersConfig";
import { Collection } from "discord.js";
import discordServers from "../model/discordServers";
import { error, warning } from "./cmd";
import DiscordSv from "../model/discordServers";
import { QzGame, deleteGameLog } from "./QuizGame";
import { Bot } from "./Bot";
import QzGameError from "./errors/QuizGame";
import DiscordServersError from "./errors/DiscordServers";
import { games } from "..";
import Ping from "./Ping";
import mongoose, { ObjectId } from "mongoose";
/**
 * Get the server document from the data base
 * @param id server id
 * @returns Server Document
 */
export async function getServerByGuildId(id: string) {
  const server = await ServersModel.findOne({ serverId: id });
  if (!server)
    throw new DiscordServersError("404", `Server not found. id=${id}`);
  return server;
}
/**
 * Get discord server from the DB
 * @param id server id
 * @returns new Server()
 */
export async function fetchServer(id: string): Promise<Server> {
  const sv = new Server(id);
  await sv.fetch();
  return sv;
}

export default class DiscordServers {
  /**
   * Delete an existing guild
   * @param id guild id
   */
  static async deleteGuild(id: string) {
    const server = await getServerByGuildId(id);
    server.deleteOne();
  }
  /**
   * Check if the user playing a game in a guild
   * @param guildId server id
   * @param userId user id
   * @returns boolean
   */
  static isInGame(guildId: string, userId: string): boolean {
    const qzGames = games.select({ guildId });
    for (let i = 0; i < qzGames.length; i++) {
      for (let j = 0; j < qzGames[i].players.length; j++) {
        if (qzGames[i].players[j].id === userId) {
          return true;
        }
      }
    }
    return false;
  }
  static async getGameByHostId(id: string) {
    return await QzGame.getGame(id);
  }
  /**
   * Delete an existing game
   * @param guildId server id
   * @param hostId id of the game in this server
   */
  @deleteGameLog()
  static deleteGame(hostId: string) {
    games.delete(hostId);
  }
  /**
   * Check if the game is full
   * @param guildId server id
   * @param hostId id of the game in this server
   * @returns boolean
   */
  static async isGameFull(hostId: string) {
    const game = await QzGame.getGame(hostId);
    if (game.players.size === game.maxPlayers) return true;
    return false;
  }
  /**
   * Deletes servers from database the bot isn't in
   */
  static async scanGuilds(guilds: Collection<string, Guild>): Promise<void> {
    const guildsIds: string[] = [];
    guilds.forEach((g) => {
      guildsIds.push(g.id);
    });
    await discordServers.deleteMany({
      serverId: {
        $nin: guildsIds,
      },
    });
  }

  constructor(public server: DiscordServer) {}
  /**
   * save in the database
   */
  async save() {
    const check = await ServersModel.findOne({
      serverId: this.server.serverId,
    });
    if (check) throw new Error(`This server is allready exist`);
    const config = new Config(this.server.serverId);
    this.server.config = config.config;
    const server = new ServersModel(this.server);
    await server.save();
  }
}

/**
 * New Constructor for discord server
 */
export class Server implements DiscordServer {
  /**
   * New Get server function
   * @param guildId server id
   * @returns new Server()
   */
  static async getServer(guildId: string) {
    const server = await getServerByGuildId(guildId);
    const guild = new Server(server.serverId);
    guild.applyData(server);
    return guild;
  }
  /**server name */
  public name: string;
  /**server config */
  public config?: ConfigT;
  /** server members */
  public members: Member[];
  /** */
  public games: Game[];
  constructor(public readonly serverId: string) {}
  /**
   * Set the server data.
   */
  applyData(data: Partial<DiscordServer>): void {
    this.config = data.config || this.config;
  }
  /**
   * fetch the server data from the database
   */
  async fetch(): Promise<void> {
    const server = await getServerByGuildId(this.serverId);
    this.applyData(server);
  }
  /**
   * delete the server
   */
  async delete(): Promise<void> {
    await DiscordServers.deleteGuild(this.serverId);
  }
  /**
   * Update the server
   */
  async update(): Promise<void> {
    const server = await getServerByGuildId(this.serverId);
    server.config = this.config;
    await server.save();
  }
  /**
   * change server config
   * @param config config of the server
   */
  async setConfig(config: ConfigT): Promise<void> {
    const server = await getServerByGuildId(this.serverId);
    const c = new Config(this.serverId, config);
    server.config = c.config;
    await server.save();
    this.config = c.config;
    return;
  }
  /**
   * Get the number of online member in this server
   * @returns number of online members
   */
  async getOnlineMembersNumber(): Promise<number> {
    let server: Guild;
    Bot.client.guilds.cache.map(async (e) => {
      if (e.id === this.serverId) {
        server = e;
      }
    });
    if (!server) throw new DiscordServersError("404", `server not found`);
    const sv = await server.fetch();
    return sv.approximatePresenceCount;
  }
}
