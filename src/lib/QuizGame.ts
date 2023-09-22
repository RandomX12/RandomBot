import {
  ActionRowBuilder,
  AnyComponentBuilder,
  ButtonBuilder,
  ButtonInteraction,
  CacheType,
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildChannel,
  GuildChannelEditOptions,
  GuildTextBasedChannel,
  Interaction,
  Message,
  MessageCreateOptions,
  MessageEditOptions,
  MessagePayload,
  PermissionOverwrites,
} from "discord.js";
import { Game as GameT, Member } from "../model/discordServers";
import {
  answer,
  Qs,
  QuizGamePlayer,
  QuizGame as QuizGameType,
} from "../model/QuizGame";
import { TimeTampNow, error, log, warning } from "./cmd";
import { TGameStart, gameStartType } from "./DiscordServersConfig";
import QzGameError, { QzErrors } from "./errors/QuizGame";
import { games } from "..";
import { decode } from "html-entities";
import axios from "axios";
import DiscordServers, { getServerByGuildId } from "./DiscordServers";
import { Bot } from "./Bot";

export function getCategoryByNum<T extends CategoriesNum | "any">(num: T) {
  if (num === "any") return "Random";
  let names: QuizCategory[] = Object.keys(categories) as QuizCategory[];
  let category: QuizCategory;
  names.map((e) => {
    if (categories[e] === num) {
      category = e;
    }
  });
  return category;
}
export function getCategoryNumByName<
  T extends QuizCategory,
  R extends typeof categories
>(name: T): R[T] {
  let catName: R[T];
  let cats: R = categories as R;
  Object.keys(categories).map((e) => {
    if (e === name) {
      catName = cats[name];
    }
  });
  return catName;
}
interface APIresponseOpentdb {
  results: {
    category: string;
    type: answerType;
    difficulty: "easy";
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
  }[];
}

interface TriviaQuiz {
  category: string;
  type: string;
  id: string;
  difficulty: "easy";
  question: {
    text: string;
  };
  correctAnswer: string;
  incorrectAnswers: string[];
  tags: string[];
  regions: string[];
  isNiche: boolean;
}

type APIresponseTriviaApi = TriviaQuiz[];

export const rank = [
  "🥇",
  "🥈",
  "🥉",
  "4️⃣",
  "5️⃣",
  "6️⃣",
  "7️⃣",
  "8️⃣",
  "9️⃣",
  "🔟",
  "1️⃣1️⃣",
  "1️⃣2️⃣",
  "1️⃣3️⃣",
  "1️⃣4️⃣",
  "1️⃣5️⃣",
  "1️⃣6️⃣",
  "1️⃣7️⃣",
  "1️⃣8️⃣",
  "1️⃣9️⃣",
  "2️⃣0️⃣",
];
export type CategoriesNum = (typeof categories)[keyof typeof categories];
export type answerType = "multiple" | "boolean";
// export const regex = /&quot;|&amp;|&#039;|&eacute;|&#039;|&amp;|&quot;|&shy;|&ldquo;|&rdquo;|&#039;|;|&/g
export const categories = {
  Random: "any",
  GeneralKnowledge: "general_knowledge",
  VideoGames: 15,
  Sports: "sport_and_leisure",
  History: "history",
  Geography: "geography",
  Mathematics: 19,
  Computers: 18,
  Animals: 27,
  Vehicles: 28,
  Films: "film_and_tv",
  Music: "music",
  Science: "science",
  Food: "food_and_drink",
  Culture: "society_and_culture",
} as const;
export type QuizCategory = keyof typeof categories;
export const QuizCategoryImg: Record<QuizCategory, string> = {
  Random:
    "https://hips.hearstapps.com/hmg-prod/images/quiz-questions-answers-1669651278.jpg",
  GeneralKnowledge: "https://cdn-icons-png.flaticon.com/512/2762/2762294.png",
  VideoGames: "https://cdn-icons-png.flaticon.com/512/3408/3408506.png",
  Sports: "https://cdn-icons-png.flaticon.com/512/857/857455.png",
  History:
    "https://i.pinimg.com/originals/06/d2/cf/06d2cfa5cd7f8fbe8e94ef5d75496a75.png",
  Geography: "https://cdn-icons-png.flaticon.com/256/1651/1651598.png",
  Mathematics: "https://cdn-icons-png.flaticon.com/512/4954/4954397.png",
  Computers: "https://cdn-icons-png.flaticon.com/512/4703/4703650.png",
  Animals: "https://cdn-icons-png.flaticon.com/512/616/616408.png",
  Vehicles:
    "https://cdni.iconscout.com/illustration/premium/thumb/car-2953450-2451640.png",
  Films:
    "https://banner2.cleanpng.com/20190730/shy/kisspng-photographic-film-movie-camera-cinema-website-and-mobile-application-development-service-5d3fc924ce3b33.8538265315644613488447.jpg",
  Music:
    "https://images.macrumors.com/t/vMbr05RQ60tz7V_zS5UEO9SbGR0=/1600x900/smart/article-new/2018/05/apple-music-note.jpg",
  Science:
    "https://img.freepik.com/free-vector/colorful-science-objects-icons-vector-set_1308-131708.jpg?w=2000",
  Food: "https://lh3.googleusercontent.com/u/0/drive-viewer/AITFw-wwBQ63sKoB3fQnNIaswFx6q1Tv_3lZ0bcu3eHiRdCUE6Ng1soUl8MIVLDFHypdtTECzWgqQvnKlPFSXmb9dyTPkv2Ejw=w1920-h942",
  Culture:
    "https://hips.hearstapps.com/hmg-prod/images/quiz-questions-answers-1669651278.jpg",
};
export interface QuizGameInfo {
  hostId: string;
  hostName: string;
  hostUserId: string;
  maxPlayers: number;
  channelId: string;
  announcementId: string;
  category: QuizCategory;
  amount: number;
  time?: number;
  mainChannel?: boolean;
  gameStart?: TGameStart;
}

function createGameLog() {
  return function (
    target: Object,
    key: string,
    descriptor: PropertyDescriptor
  ) {
    let originalFn = descriptor.value;
    descriptor.value = async function () {
      log({
        textColor: "Yellow",
        timeColor: "Yellow",
        text: `creating Quiz Game...`,
      });
      await originalFn.apply(this, []);
      log({ textColor: "Blue", timeColor: "Blue", text: `Game created` });
    };
  };
}
export function deleteGameLog() {
  return function (
    target: Object,
    key: string,
    descriptor: PropertyDescriptor
  ) {
    const originalFn = descriptor.value;
    descriptor.value = async function (...args: string[]) {
      await originalFn.apply(this, args);
      log({ text: "Game deleted", textColor: "Magenta", timeColor: "Magenta" });
    };
  };
}

export const amount = [3, 10];
export const maxPlayers = [2, 20];
export const maxGames = 15;

export abstract class Game implements GameT {
  abstract hostName: string;
  abstract channelId: string;
  abstract hostId: string;
  abstract guildId: string;

  abstract update(): void;
  abstract delete(reason?: string): void;
}

interface QzGameData {
  players: Map<string, QuizGamePlayer>;
  index: number;
  maxPlayers: number;
  announcementId: string;
  started?: boolean;
  end?: boolean;
  quiz: Qs[];
  category: QuizCategory;
  amount: number;
  time?: number;
  hostUserId: string;
  mainChannel?: boolean;
  gameStart?: TGameStart;
  guildId: string;
  difficulty?: difficulty;
  bannedPlayers: Set<string>;
  invitedPlayers: Set<string>;
}

/**
 * The New Constructor for Quiz Game
 */
export class QzGame extends Game implements QzGameData {
  /**
   * New Get game Function
   * @param guildId Server id
   * @param hostId game id
   * @returns new QzGame()
   */
  static async getGame(hostId: string): Promise<QzGame> {
    const game = games.get(hostId);
    if (!game)
      throw new QzGameError("404", `Game with id=${hostId} is not found`);
    return new QzGame(game.hostId, game.hostUserId).applyData(game);
  }

  static async getGameWithUserId(
    guildId: string,
    userId: string
  ): Promise<QzGame> {
    const qzGames = QzGame.getServerGames(guildId);
    for (let i = 0; i < qzGames.length; i++) {
      for (let j = 0; j < qzGames[i].players.length; j++) {
        if (qzGames[i].players[j].id === userId) {
          const game = new QzGame(
            qzGames[i].hostId,
            qzGames[i].hostUserId
          ).applyData(qzGames[i]);
          return game;
        }
      }
    }
    throw new QzGameError("201", "This user is not in game");
  }

  static select(filter: Partial<QuizGameType>) {
    const Qzgames = games.select(filter);
    const g = Qzgames.map((game) => {
      return new QzGame(game.hostId, game.hostUserId).applyData(game);
    });
    return g;
  }

  static async selectOne(filter: Partial<QuizGameType>) {
    const Qzgames = games.select(filter);
    if (!Qzgames.length)
      throw new QzGameError(
        "404",
        `game not found \n filter ${JSON.stringify(filter)}`
      );
    return new QzGame(Qzgames[0].hostId, Qzgames[0].hostUserId).applyData(
      Qzgames[0]
    );
  }

  static getServerGames(guildId: string) {
    return games.select({ guildId });
  }

  static clearServerGames(guildId: string) {
    const gms = games.select({ guildId });
    gms.map((game) => {
      games.delete(game.hostId);
    });
  }

  static async setAns(
    hostId: string,
    userId: string,
    ans: answer,
    index: number
  ) {
    const game = await QzGame.getGame(hostId);
    if (!game.canAnswer) throw new QzGameError("205", "cannot answer");
    const player = game.players.get(userId);

    if (!player.answers) {
      player.answers = [
        {
          index: index,
          answer: ans,
        },
      ];
    } else {
      for (let j = 0; j < player.answers.length; j++) {
        if (player.answers[j].index === index) {
          player.answers[j].answer = ans;
          await game.update();
          return;
        }
      }
      player.answers.push({
        index: index,
        answer: ans,
      });
    }
    game.players.set(userId, player);
    await game.update();
  }

  static async isIn(hostId: string, userId: string): Promise<boolean> {
    const game = await QzGame.getGame(hostId);
    return !!game.players.get(userId);
  }

  static async getAnnouncement(
    interaction:
      | ChatInputCommandInteraction<CacheType>
      | ButtonInteraction<CacheType>,
    hostId: string
  ) {
    const game = await QzGame.getGame(hostId);
    const channel = interaction.guild.channels.cache.get(game.channelId);
    if (channel.type !== ChannelType.GuildText)
      throw new QzGameError("304", "Invalid channel type");
    const announcement: Message<true> = channel?.messages?.cache?.get(
      game.announcementId
    );
    if (!announcement)
      throw new QzGameError("406", "game announcement not found");
    return announcement;
  }

  static async getChannel(
    interaction: Interaction<CacheType> | ButtonInteraction<CacheType>,
    hostId: string
  ) {
    const game = await QzGame.getGame(hostId);
    const channel: any = await interaction.guild.channels.cache
      .get(game?.channelId)
      ?.fetch();
    return channel as GuildTextBasedChannel;
  }

  static async removeAns(hostId: string, userId: string, index: number) {
    const game = await QzGame.getGame(hostId);
    const player = game.players.get(userId);
    if (!player) throw new QzGameError("201", "user not found");
    player.answers?.map((e, i) => {
      if (e.index === index) {
        player.answers?.splice(i, 1);
      }
    });
    game.players.set(userId, player);
    await game.update();
  }
  /**
   * server id
   */
  public guildId: string;
  public hostName: string;
  public players: Map<string, QuizGamePlayer>;
  public channelId: string;
  /**
   * Round number of the game.
   * start from 0
   */
  public index: number = 0;
  public maxPlayers: number;
  public announcementId: string;
  public started: boolean = false;
  public end: boolean = false;
  /**
   * Number of questions in the game
   */
  public amount: number;
  /**
   * All the questions and the answers
   */
  public quiz: Qs[];
  public category: QuizCategory;
  /**
   * Time for each question
   */
  public time?: number;
  public mainChannel?: boolean = false;
  /**
   * get the round body
   */
  public round: Qs | null;
  /**
   * Questions difficulty
   */
  public difficulty: difficulty;
  /**
   * Banned users ids
   */
  public bannedPlayers: Set<string>;
  /** */
  public invitedPlayers: Set<string>;
  /**
   * Game start code
   */
  public gameStart?: TGameStart;
  public canAnswer: boolean;
  constructor(
    /**
     * Game id
     */
    public readonly hostId: string,
    /**
     * id of the user who creates the game
     */
    public readonly hostUserId: string
  ) {
    super();
  }
  /**
   * Set the game data.
   */
  applyData(game: Partial<QuizGameType>) {
    this.guildId = game.guildId || this.guildId;
    this.hostName = game.hostName || this.hostName;
    this.players = new Map<string, QuizGamePlayer>() || this.players;
    if (game.players) {
      for (let i = 0; i < game.players.length; i++) {
        this.players.set(game.players[i].id, game.players[i]);
      }
    }
    this.channelId = game.channelId || this.channelId;
    this.index = game.index || this.index;
    this.maxPlayers = game.maxPlayers || this.maxPlayers;
    this.announcementId = game.announcementId || this.announcementId;
    this.started = game.started || this.started;
    this.end = game.end || this.end;
    this.amount = game.amount || this.amount;
    this.quiz = game.quiz || this.quiz;
    this.category = game.category || this.category;
    this.time = game.time || this.time;
    this.mainChannel = game.mainChannel || this.mainChannel;
    this.gameStart = game.gameStart || 0;
    this.difficulty = game.difficulty;
    this.bannedPlayers = new Set(game.bannedPlayers) || this.bannedPlayers;
    this.invitedPlayers =
      new Set<string>(game.invitedPlayers) || this.invitedPlayers;
    this.canAnswer = game.canAnswer || this.canAnswer;
    return this;
  }
  /**
   * Fetch the game data from the storage and update the local props
   */
  async fetch(): Promise<void> {
    const game = games.select({ hostId: this.hostId })[0];
    if (!game) throw new QzGameError("404", "quiz game not found");
    this.applyData(game);
  }
  /**
   * Save changes in the storage
   */
  async update(): Promise<void> {
    await QzGame.getGame(this.hostId);
    const gameData: QuizGameType = {
      ...this,
      invitedPlayers: Array.from(this.invitedPlayers),
      bannedPlayers: Array.from(this.bannedPlayers),
      players: Array.from(this.players.values()),
    };
    games.set(this.hostId, gameData);
  }
  /**
   * Delete the game from the storage
   */
  @deleteGameLog()
  delete(): void {
    games.delete(this.hostId);
  }
  /**
   * set the property started to true and save it in the storage
   */
  async start(): Promise<void> {
    const game = await getGame(this.hostId);
    game.started = true;
    games.set(this.hostId, game);
    await this.fetch();
  }
  /**
   * set the property end to true and save it in the storage
   */
  async endGame(): Promise<void> {
    const game = await getGame(this.hostId);
    game.end = true;
    games.set(this.hostId, game);
    await this.fetch();
  }
  /**
   * @returns Game Generator
   */
  *play() {
    for (let i = 0; i < this.amount; i++) {
      this.round = this.quiz[i];
      this.index = i;
      yield this.quiz[i];
    }
  }
  setPlayerReady(id: string, ready?: boolean) {
    const player = this.players.get(id);
    if (player) {
      player.ready = ready;
      this.players.set(id, player);
    }
  }
  /**
   * Generate a discord Embed For this game
   */
  generateEmbed(): EmbedBuilder {
    let commandId: string;
    Bot.client.application.commands.cache.map((e) => {
      if (e.name === "start") {
        commandId = e.id;
      }
    });
    const embed = new EmbedBuilder()
      .setTitle(`Quiz Game`)
      .setThumbnail(
        "https://hips.hearstapps.com/hmg-prod/images/quiz-questions-answers-1669651278.jpg"
      )
      .addFields({
        name: `Info`,
        value: `Category : **${this.category}** \nAmount : **${
          this.amount
        }** \ntime : **${
          this.time / 1000 + " seconds" || "30 seconds"
        }** \nMax players : **${this.maxPlayers}**\nDifficulty : **${
          this.difficulty ? this.difficulty : "Random"
        }**\n\n${
          this.gameStart === 0
            ? "Start when the game gets full"
            : this.gameStart === 1
            ? "Start when everyone is ready"
            : this.gameStart === 2
            ? "Start once everyone is ready and the game is full"
            : `Waiting until someone starts with </start:${commandId}>`
        }`,
      })
      .setAuthor({
        name: `Waiting for players... ${this.players.size} / ${this.maxPlayers}`,
      })
      .setTimestamp(Date.now())
      .setFooter({ text: `id : ${this.hostId}` });
    if (this.players.size !== 0) {
      let players = ``;
      Array.from(this.players.values()).map((e) => {
        players +=
          "```\n" +
          `${e.username} ${
            this.gameStart === gameStartType.FULL_READY ||
            this.gameStart === gameStartType.READY
              ? e.ready
                ? "✅ READY"
                : "🔴 NOT READY"
              : ""
          }` +
          "```";
      });
      embed.addFields({ name: "players", value: players });
    } else {
      embed.addFields({ name: "players", value: `**NO PLAYER IN THE GAME**` });
    }
    return embed;
  }
  generateRow(
    gameStart: (typeof gameStartType)[keyof typeof gameStartType]
  ): ActionRowBuilder<AnyComponentBuilder> {
    const row = new ActionRowBuilder();
    if (gameStart === gameStartType.AUTO || gameStart === gameStartType.ADMIN) {
      const join = new ButtonBuilder()
        .setLabel("Join")
        .setCustomId("join_quizgame_" + this.hostId)
        .setStyle(3);
      const leave = new ButtonBuilder()
        .setLabel("Leave")
        .setCustomId("leave_quizgame_" + this.hostId)
        .setStyle(4);
      row.setComponents(join, leave);
      return row;
    } else if (
      gameStart === gameStartType.READY ||
      gameStart === gameStartType.FULL_READY
    ) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`ready_${this.hostId}`)
          .setLabel("Ready")
          .setStyle(1),
        new ButtonBuilder()
          .setCustomId(`notready_${this.hostId}`)
          .setStyle(4)
          .setLabel(`Not Ready`)
      );
      return row;
    }
    return row;
  }
  generateContent() {
    return `new Quiz Game created by <@${this.hostUserId}> ${TimeTampNow(
      Date.now()
    )}`;
  }
  generateRoundEmbed() {
    if (!this.round) return;
    const embed = new EmbedBuilder()
      .setAuthor({
        name: this.round.category + ` ${this.index + 1}/${this.amount}`,
      })
      .setTitle(this.round.question)
      .setThumbnail(QuizCategoryImg[this.category])
      .setFooter({ text: `id : ${this.hostId}` });
    if (this.round.type === "multiple") {
      let answers = ``;
      let indexs: answer[] = ["A", "B", "C", "D"];
      this.round.answers.map((e, i) => {
        answers += `${indexs[i]} : ${e}\n`;
      });
      embed.addFields({ name: "answers : ", value: answers });
    }
    return embed;
  }
  generateRoundRow() {
    if (!this.round) return;
    const row: any = new ActionRowBuilder();
    if (this.round.type === "boolean") {
      let ans: answer[] = ["A", "B"];
      let trIndex = this.round.answers.indexOf("True");
      let flIndex = this.round.answers.indexOf("False");
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`answer_${ans[trIndex]}_${this.hostId}_${this.index}`)
          .setLabel("True")
          .setStyle(1),
        new ButtonBuilder()
          .setCustomId(`answer_${ans[flIndex]}_${this.hostId}_${this.index}`)
          .setLabel("False")
          .setStyle(1)
      );
    } else {
      let al: answer[] = ["A", "B", "C", "D"];
      this.round.answers.map((e, j) => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`answer_${al[j]}_${this.hostId}_${this.index}`)
            .setLabel(al[j])
            .setStyle(1)
        );
      });
    }
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`removeans_${this.hostId}_${this.index}`)
        .setLabel("remove answer")
        .setStyle(2)
    );
    return row;
  }
  createInvite(): MessageCreateOptions {
    const gameLink = `https://discord.com/channels/${this.guildId}/${this.channelId}/${this.announcementId}`;
    const embed = new EmbedBuilder()
      .setTitle(`You are invited to join a quiz game in ${gameLink}`)
      .setDescription(
        `
**Category ** : ${this.category}
**Amount ** : ${this.amount}
**Time ** : ${this.time / 1000} seconds
**Max players** : ${this.maxPlayers}
**Difficulty ** : ${this.difficulty || "random"}
    `
      )
      .setTimestamp()
      .setFooter({ text: `id : ${this.hostId}` })
      .setThumbnail(QuizCategoryImg[this.category]);
    const row: any = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setStyle(5).setLabel("go to game").setURL(gameLink)
    );
    return {
      embeds: [embed],
      components: [row],
    };
  }
  isReady(id: string): boolean {
    const player = this.players.get(id);
    return player?.ready;
  }
  removePlayer(id: string) {
    this.players.delete(id);
  }
  setPlayersScore(): void {
    let ansIndex: answer[] = ["A", "B", "C", "D"];
    if (!this.round || !this.started) return;
    const players = Array.from(this.players.values());
    for (let i = 0; i < players.length; i++) {
      if (!players[i].answers) players[i].answers = [];
      players[i].score = 0;
      for (let j = 0; j < players[i].answers.length; j++) {
        let correctIndex = this.quiz[players[i].answers[j].index].correctIndex;
        if (ansIndex[correctIndex] === players[i].answers[j].answer) {
          players[i].score++;
        }
      }
    }
    for (let i = 0; i < players.length; i++) {
      this.players.set(players[i].id, players[i]);
    }
  }
  get rankedPlayers(): QuizGamePlayer[] {
    let rankedPlayers: QuizGamePlayer[] = [];
    let players = Array.from(this.players.values());
    let playersLen = players.length;
    for (let i = 0; i < playersLen; i++) {
      let player = players.reduce((pe, ce, i) => {
        return pe.score <= ce.score ? ce : pe;
      });
      for (let j = 0; j < players.length; j++) {
        if (players[j].id === player.id) {
          players.splice(j, 1);
          break;
        }
      }
      rankedPlayers.push(player);
    }
    return rankedPlayers;
  }
  /**
   * edit the game announcement
   * @param content announcement content
   * @returns
   */
  async editAnnouncement(
    content: string | MessageEditOptions | MessagePayload
  ): Promise<Message> {
    const guild = Bot.client.guilds.cache.get(this.guildId);
    if (!guild) throw new QzGameError("409", "guild not found");
    const channel = Bot.client.channels.cache.get(this.channelId);
    if (!channel) throw new QzGameError("408", "game channel not found");
    if (channel.type !== ChannelType.GuildText)
      throw new QzGameError("304", "invalid channel type");
    const announcement = channel.messages.cache.get(this.announcementId);
    if (!announcement)
      throw new QzGameError("406", "game announcement not found");
    await announcement.edit(content);
    return announcement;
  }
  async updateAnnouncement() {
    if (this.started) throw new Error("the game is started");
    if (
      this.gameStart === gameStartType.ADMIN ||
      this.gameStart === gameStartType.AUTO
    ) {
      const joinLeaveBtns: any = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`join_quizgame_${this.hostId}`)
          .setLabel("join")
          .setStyle(3),
        new ButtonBuilder()
          .setCustomId(`leave_quizgame_${this.hostId}`)
          .setLabel("leave")
          .setStyle(4)
      );
      const embed = this.generateEmbed();
      await this.editAnnouncement({
        embeds: [embed],
        components: [this.mainChannel && joinLeaveBtns].filter((r) => r),
      });
    } else {
      const joinLeaveBtns: any = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`join_quizgame_${this.hostId}`)
          .setLabel("join")
          .setStyle(3),
        new ButtonBuilder()
          .setCustomId(`leave_quizgame_${this.hostId}`)
          .setLabel("leave")
          .setStyle(4)
      );
      const embed = this.generateEmbed();
      const row = this.generateRow(this.gameStart);
      await this.editAnnouncement({
        embeds: [embed],
        components: [row, this.mainChannel && joinLeaveBtns].filter((r) => r),
      });
    }
  }
  /**
   * edit the game channel
   *
   * mainChannel should be **false** to edit the channel
   * @param options discord.js GuildChannelEditOptions
   */
  async editGameChannel(options: GuildChannelEditOptions) {
    if (this.mainChannel)
      throw new Error(
        "cannot edit the game channel : the game is in the main channel"
      );
    const channel = Bot.client.channels.cache.get(this.channelId);
    if (!channel) throw new QzGameError("408", "game channel is not found");
    if (channel.type !== ChannelType.GuildText)
      throw new QzGameError("304", "invalid game channel");
    await channel.edit(options);
  }
  /**
   * Deletes the game channel
   *
   * mainChannel should be **false** to delete the channel
   */
  async deleteGameChannel() {
    if (this.mainChannel)
      throw new Error(
        "cannot edit the game channel : the game is in the main channel"
      );
    const channel = Bot.client.channels.cache.get(this.channelId);
    if (!channel) throw new QzGameError("408", "game channel is not found");
    if (channel.type !== ChannelType.GuildText)
      throw new QzGameError("304", "invalid game channel");
    await channel.delete();
  }
  /**
   * Deletes a game from the memory and update the game announcement.
   *
   * If mainChannel is **true** the game channel name will be edited automatically and deleted after 10 seconds
   * @param reason reason for the game deletion
   */
  async deleteGame(reason?: string) {
    this.delete();
    const r = reason || "Game Deleted";
    const embed = new EmbedBuilder()
      .setTitle(r)
      .setFooter({ text: "Game deleted" })
      .setTimestamp()
      .setColor("Red");
    await this.editAnnouncement({
      components: [],
      content: "",
      embeds: [embed],
    });
    if (this.mainChannel) return;
    await this.editGameChannel({
      name: "game deleted 🔴",
    });
    setTimeout(async () => {
      try {
        await this.deleteGameChannel();
      } catch (err: any) {
        warning("an error occurred while deleting the game channel");
      }
    }, 10 * 1000);
  }
  async getAnnouncement() {
    const channel = Bot.client.channels.cache.get(this.channelId);
    if (!channel) throw new QzGameError("408", "game channel is not found");
    if (channel.type !== ChannelType.GuildText)
      throw new QzGameError("304", "invalid game channel");
    const announcement = channel.messages.cache.get(this.announcementId);
    if (!announcement)
      throw new QzGameError("406", "game announcement not found");
    return announcement;
  }
  async executeGame() {
    try {
      const embed = this.generateEmbed();
      embed.setAuthor({ name: "Starting the game... 🟢" });
      let announcement = await this.getAnnouncement();
      await announcement.edit({
        content: "",
        embeds: [embed],
        components: [],
      });
      const channel = announcement.channel;
      await this.start();
      if (!this.mainChannel) {
        await channel.edit({ name: "started 🟢" });
      }
      const gameGenerator = this.play();
      while (gameGenerator.next().done === false) {
        try {
          const embed = this.generateRoundEmbed();
          const row = this.generateRoundRow();
          announcement = await channel.send({
            embeds: [embed],
            components: [row],
            content: `The round will end ${TimeTampNow(
              Date.now() + (this.time || 30)
            )}`,
          });
          this.announcementId = announcement.id;
          await this.update();
          await stop(this.time || 30 * 1000);
          this.canAnswer = false;
          await this.update();
          let endAns = "";
          let al: answer[] = ["A", "B", "C", "D"];
          if (this.round.type === "multiple") {
            this.round.answers.map((e, j) => {
              if (j === this.round.correctIndex) {
                endAns += "**" + al[j] + " : " + e + " ✅" + "**\n";
              } else {
                endAns += al[j] + " : " + e + "\n";
              }
            });
          } else {
            endAns = `**${this.round.answers[this.round.correctIndex]} ✅**`;
          }
          embed.setFields({ name: "answers :", value: endAns });
          let playersAns = "";
          this.players.forEach((p) => {
            if (!p.answers) {
              playersAns += `${p.username} : no answer ❌\n`;
              return;
            }
            for (let i = 0; i < p.answers.length; i++) {
              if (p.answers[i].index === this.index) {
                if (p.answers[i].answer === al[this.round.correctIndex]) {
                  playersAns += `${p.username} : ${p.answers[i].answer} ✅\n`;
                } else {
                  playersAns += `${p.username} : ${p.answers[i].answer} ❌\n`;
                }
                return;
              }
            }
            playersAns += `${p.username} : no answer ❌\n`;
          });
          embed.addFields([{ name: "players answers", value: playersAns }]);
          await announcement.edit({
            embeds: [embed],
            components: [],
            content: "",
          });
          await stop(5 * 1000);
          this.canAnswer = true;
          await this.update();
        } catch (err: any) {
          console.log(err);
          gameGenerator.return();
        }
      }
      await this.fetch();
      this.delete();
      this.setPlayersScore();
      const endEmbed = new EmbedBuilder()
        .setTitle(`Quiz Game`)
        .setAuthor({ name: "Game end 🔴" });
      let playersScore = "";
      let rankedPlayers = this.rankedPlayers;
      rankedPlayers.map((e, i) => {
        playersScore +=
          rank[i] + " - " + e.username + "    **" + e.score + "**\n";
      });
      endEmbed.addFields({ name: "players score ", value: playersScore });
      endEmbed.setTimestamp(Date.now());
      announcement = await channel.send({
        content: "",
        components: [],
        embeds: [endEmbed],
      });

      if (this.mainChannel) return;
      if (channel) {
        setTimeout(async () => {
          try {
            await channel.delete();
          } catch (err: any) {
            warning(err.message);
          }
        }, 20 * 1000);
      }
      let permissions: PermissionOverwrites[] = [];
      (channel as GuildChannel).permissionOverwrites?.cache?.map((e) => {
        if (e.deny.has("SendMessages")) {
          e.deny.remove("SendMessages");
          e.allow.add("SendMessages");
        }
        permissions.push(e);
      });
      await channel.edit({
        name: "game end 🔴",
        permissionOverwrites: [...permissions],
      });
    } catch (err: any) {
      this.delete();
      error(`error when executing quiz game : ${err.message}`);
    }
  }
}

export async function getGame(hostId: string): Promise<QuizGameType> {
  const game = games.select({ hostId })[0];
  if (!game) throw new QzGameError("404", "game not found");
  return game;
}

export function generateId() {
  return Math.random().toString(16).slice(2);
}

export type difficulty = "easy" | "medium" | "hard";
export interface QzGameInfo {
  guildId: string;
  hostName: string;
  hostUserId: string;
  maxPlayers: number;
  channelId: string;
  announcementId: string;
  category: QuizCategory;
  amount: number;
  time?: number;
  mainChannel?: boolean;
  gameStart?: TGameStart;
  difficulty?: difficulty;
}
/**
 * fetch the quiz and save the game in the storage
 * @param guildId discord server id
 * @param qz the quiz game info
 * @returns QzGame
 */
export async function createQzGame(
  id: string,
  qz: QzGameInfo
): Promise<QzGame> {
  const check = games.get(id);
  if (check) throw new QzGameError("204", "exist game");
  const quiz = (await new Quiz(qz.category, qz.amount, qz.difficulty).fetch())
    .quiz;
  const qzGame: QuizGameType = {
    ...qz,
    players: [],
    index: 0,
    quiz,
    guildId: qz.guildId,
    hostId: id,
    bannedPlayers: [],
    invitedPlayers: [],
    canAnswer: true,
  };
  games.set(id, qzGame);
  return new QzGame(id, qz.hostUserId).applyData(qzGame);
}

/**
 * Stop the execution of the code
 * @param time timer ms
 */
export async function stop(time: number) {
  await new Promise((res) => setTimeout(res, time));
}

interface QuizT {
  category: QuizCategory;
  amount: number;
  quiz: Qs[];
  fetch: () => void;
  categoryNum: CategoriesNum | "any";
}

/**
 * New Constructor of Quiz.
 */
export class Quiz<CategoryT extends QuizCategory> implements QuizT {
  /**
   * Quiz body
   */
  public quiz: Qs[];
  /**
   * Number of the category in the API
   */
  public categoryNum = getCategoryNumByName(this.category);
  constructor(
    /**
     * Name of the category
     */
    public category: CategoryT,
    /**
     * Number of questions
     */
    public amount: number,
    /**
     * Questions difficulty
     */
    public difficulty?: difficulty
  ) {}
  /**
   * Fetch the quiz from the API
   */
  async fetch(): Promise<this> {
    try {
      if (typeof this.categoryNum === "string") {
        let catUrl = `&categories=${this.categoryNum}`;
        if (this.categoryNum === "any") {
          catUrl = "";
        }
        let difficulty: string = "";
        if (this.difficulty) {
          difficulty = `&difficulties=${this.difficulty}`;
        }
        const req = await axios.get(
          `https://the-trivia-api.com/v2/questions?limit=${this.amount}&${catUrl}${difficulty}`
        );
        const res: APIresponseTriviaApi = req.data;
        this.quiz = res.map((e) => {
          let answers = e.incorrectAnswers;
          let correct_answer = e.correctAnswer;
          let randomNum = Math.floor(Math.random() * answers.length + 1);
          if (randomNum === answers.length) {
            answers.push(correct_answer);
          } else {
            let ans = answers[randomNum];
            answers[randomNum] = correct_answer;
            answers.push(ans);
          }
          return {
            //@ts-ignore
            category: e.category.replaceAll("_", " ") as QuizCategory,
            question: e.question.text,
            correctIndex: randomNum,
            answers,
            type: "multiple",
          };
        });
        return this;
      } else {
        let catUrl = `&category=${this.categoryNum}`;
        if (this.categoryNum === "any") {
          catUrl = "";
        }
        let difficulty: string = "";
        if (this.difficulty) {
          difficulty = `&difficulty=${this.difficulty}`;
        }
        const req = await axios.get(
          `https://opentdb.com/api.php?amount=${this.amount}${difficulty}${catUrl}`
        );
        const res: APIresponseOpentdb = req.data;
        this.quiz = res.results.map((e) => {
          // let q = e.question.replace(regex,' ')
          let q = decode(e.question);
          // let c = e.correct_answer.replace(regex,' ')
          let c = decode(e.correct_answer);
          let ans = e.incorrect_answers.map((ele) => {
            return decode(ele);
          });
          let num = Math.floor(Math.random() * ans.length + 1);
          if (num === ans.length) {
            ans.push(c);
          } else {
            let an = ans[num];
            ans[num] = c;
            ans.push(an);
          }
          let t = e.type;
          return {
            question: q,
            answers: ans,
            correctIndex: num,
            type: t,
            category: e.category as QuizCategory,
          };
        });
        return this;
      }
    } catch (err) {
      throw new QzGameError("505", err.message);
    }
  }
}
