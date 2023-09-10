import {
  ActionRowBuilder,
  ApplicationCommandDataResolvable,
  ApplicationCommandOptionType,
  ButtonBuilder,
  CacheType,
  ChannelType,
  ChatInputCommandInteraction,
  DiscordAPIError,
  EmbedBuilder,
  GuildTextBasedChannel,
  OverwriteResolvable,
  TextChannel,
} from "discord.js";
import {
  categories,
  getCategoryByNum,
  CategoriesNum,
  maxGames,
  QzGame,
  createQzGame,
  QzGameInfo,
  generateId,
  difficulty,
} from "../lib/QuizGame";
import DiscordServers, { fetchServer } from "../lib/DiscordServers";
import { TimeTampNow, error, warning } from "../lib/cmd";
import Command, { reply, replyError } from "../lib/Commands";
import { gameStartType } from "../lib/DiscordServersConfig";
import { games } from "..";
import QzGameError from "../lib/errors/QuizGame";

let choices = Object.keys(categories).map((e) => {
  return {
    name: e,
    value: `${categories[e]}`,
  };
});

let cmdBody: ApplicationCommandDataResolvable = {
  name: "create_quizgame",
  description: "create a quiz game",
  options: [
    {
      name: "category",
      description: "choose a category",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: choices,
    },
    {
      name: "amount",
      description: "amount of questions",
      type: ApplicationCommandOptionType.Number,
      minValue: 3,
      maxValue: 10,
      required: true,
    },
    {
      name: "max_players",
      description: "max players",
      type: ApplicationCommandOptionType.Number,
      maxValue: 20,
      minValue: 2,
      required: true,
    },
    {
      name: "time",
      description: "Time for each question",
      type: ApplicationCommandOptionType.Number,
      required: false,
      choices: [
        {
          name: "5 seconds",
          value: 5 * 1000,
        },
        {
          name: "10 seconds",
          value: 10 * 1000,
        },
        {
          name: "15 seconds",
          value: 15 * 1000,
        },
        {
          name: "30 seconds",
          value: 30 * 1000,
        },
        {
          name: "45 seconds",
          value: 45 * 1000,
        },
      ],
    },
    {
      name: "difficulty",
      description: "Select Difficulty",
      required: false,
      type: ApplicationCommandOptionType.String,
      choices: [
        {
          name: "Easy",
          value: "easy",
        },
        {
          name: "Medium",
          value: "medium",
        },
        {
          name: "Hard",
          value: "hard",
        },
      ],
    },
  ],
};
module.exports = new Command({
  data: cmdBody,
  async execute(interaction: ChatInputCommandInteraction<CacheType>) {
    const isIn = DiscordServers.isInGame(
      interaction.guildId,
      interaction.user.id
    );
    if (isIn) {
      await replyError(interaction, `You are already in game`);
      return;
    }
    let mainChannel = true;
    const category = interaction.options.getString("category");
    const amount = interaction.options.getNumber("amount");
    const maxPlayers = interaction.options.getNumber("max_players");
    let time = interaction.options.getNumber("time");
    let difficulty: difficulty = interaction.options.getString(
      "difficulty"
    ) as difficulty;
    const server = await fetchServer(interaction.guildId);
    if (server.config.quiz.multiple_channels.enable) {
      if (!interaction.guild.members.me.permissions.has("ManageChannels")) {
        await replyError(
          interaction,
          `I need **Manage Channels** permission to create a new channel for the game`
        );
        return;
      }
    }
    const guidGames = games.select({ guildId: interaction.guildId });
    if (guidGames.length >= maxGames) {
      await replyError(
        interaction,
        `Cannot create the game, \nThis server has reached the maximum number of games ${maxGames}.`
      );
      return;
    }
    if (
      server.config?.quiz?.roles?.length > 0 &&
      interaction.user.id !== interaction.guild.ownerId
    ) {
      const member = interaction.guild.members.cache.get(interaction.user.id);
      let maxGames: number;
      server.config.quiz.roles.map((e) => {
        if (member.roles.cache.has(e.id)) {
          if (!maxGames) {
            maxGames = e.gamesPerUser;
            return;
          }
          if (maxGames < e.gamesPerUser) {
            maxGames = e.gamesPerUser;
            return;
          }
        }
      });
      if (maxGames === 0) {
        await replyError(
          interaction,
          `Sorry but you are not allowed to create quiz game in this server.\ncontact server administrators for permission to create quiz games`
        );
        return;
      }
      if (maxPlayers) {
        const Qzgames = games.select({
          guildId: interaction.guildId,
          hostUserId: interaction.user.id,
        });
        if (Qzgames.length >= maxGames) {
          await replyError(
            interaction,
            `Sorry, you can't create a quiz game. You have only the right to create ${maxGames} game${
              maxGames >= 2 ? "s" : ""
            } in this server`
          );
          return;
        }
      }
    }

    const hostId = generateId();
    let channel: TextChannel | GuildTextBasedChannel;
    if (server.config.quiz?.multiple_channels.enable) {
      try {
        const category = interaction.guild.channels.cache.get(
          server.config.quiz?.multiple_channels.category_id
        );
        let permissions: OverwriteResolvable[] = [
          {
            id: interaction.guild.roles.everyone.id,
            deny: server.config.quiz.multiple_channels.private.enable
              ? ["SendMessages", "ViewChannel"]
              : ["SendMessages"],
          },
          {
            id: interaction.client.user.id,
            allow: [
              "ManageMessages",
              "SendMessages",
              "ManageChannels",
              "ViewChannel",
            ],
            deny: [],
          },
        ];
        if (
          server.config.quiz.multiple_channels.private?.viewChannel.length !==
            0 &&
          server.config.quiz.multiple_channels.private?.enable
        ) {
          server.config.quiz.multiple_channels.private.viewChannel.map((e) => {
            permissions.push({
              id: e,
              deny: ["SendMessages"],
              allow: ["ViewChannel"],
            });
          });
        }
        if (category) {
          channel = await interaction.guild.channels.create({
            name: `waiting 🟡`,
            type: ChannelType.GuildText,
            //@ts-ignore
            parent: category,
            permissionOverwrites: permissions,
          });
          mainChannel = false;
        } else {
          const cat =
            await interaction.guild.channels.create<ChannelType.GuildCategory>({
              name:
                server.config.quiz.multiple_channels.category_name ||
                "Quiz Games",
              type: ChannelType.GuildCategory,
              permissionOverwrites: permissions,
            });
          server.config.quiz.multiple_channels.category_id = cat.id;
          server.config.quiz.multiple_channels.category_name =
            server.config.quiz.multiple_channels.category_name || "Quiz Games";
          await server.update();
          if (cat) {
            channel = await interaction.guild.channels.create({
              name: "waiting 🟡",
              parent: cat,
              type: ChannelType.GuildText,
              permissionOverwrites: permissions,
            });
          } else {
            await replyError(interaction, "Cannot create category");
            return;
          }
          mainChannel = false;
        }
      } catch (err: any) {
        if (interaction.replied || interaction.deferred) {
          let errorCode = "";
          let msg = "";
          if (err instanceof TypeError) {
            errorCode = err.name;
            msg = err.message;
          }
          if (err instanceof DiscordAPIError) {
            errorCode = `DiscordAPIError_${err.code}`;
            msg = err.message;
          }
          await replyError(
            interaction,
            "An error occurred while creating the channel,\n This may be from bad configurations, please check your configuration and make sure everything is OK.\n" +
              (errorCode ? `error code :${errorCode}\nmessage : ${msg}` : "")
          );
        }
        warning(err.message);
        return;
      }
    } else {
      channel = interaction.channel;
      const game = games.select({
        guildId: interaction.guildId,
        channelId: channel.id,
      })[0];
      if (game?.mainChannel === false) {
        await reply(interaction, {
          content: `i can't create a game here 😔 :\nThis channel is reserved for another game`,
          ephemeral: true,
        });
        return;
      }
    }
    if (!time) {
      time = 30 * 1000;
    }
    const joinLeaveBtns: any = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`join_quizgame_${hostId}`)
        .setLabel("join")
        .setStyle(3),
      new ButtonBuilder()
        .setCustomId(`leave_quizgame_${hostId}`)
        .setLabel("leave")
        .setStyle(4)
    );
    if (!mainChannel) {
      await channel.send({
        components: [joinLeaveBtns],
      });
    }
    let msg = await channel.send({
      content: "creating Quiz Game...",
    });
    const empty = require("../../config.json").quizGame.emptyWhenCreateNewGame;
    let gameBody: QzGameInfo = {
      guildId: interaction.guildId,
      hostName: interaction.user.tag,
      hostUserId: interaction.user.id,
      maxPlayers: maxPlayers,
      channelId: channel.id,
      announcementId: msg.id,
      category: getCategoryByNum(
        (+category as CategoriesNum) || (category as "any")
      ),
      amount: amount,
      time: time || 30 * 1000,
      mainChannel: mainChannel,
      gameStart: server.config.quiz.gameStart || 0,
      difficulty: difficulty,
    };
    const game = await createQzGame(hostId, gameBody);
    if (!empty) {
      game.players.push({
        id: hostId,
        username: interaction.user.username,
      });
    }
    const embed = game.generateEmbed();
    const content = game.generateContent();
    const row: any = game.generateRow(server.config.quiz.gameStart);
    try {
      if (!msg) throw new Error(`Cannot create the game`);
      await msg.edit({
        embeds: [embed],
        components:
          game.gameStart && game.gameStart !== gameStartType.ADMIN
            ? [row, game.mainChannel && joinLeaveBtns].filter((e) => e)
            : [game.mainChannel && joinLeaveBtns].filter((e) => e),
        content: content,
      });
      await reply(interaction, {
        content: `Game created ${
          !game.mainChannel ? `in <#${game.channelId}>` : ""
        } :white_check_mark:`,
      });
    } catch (err: any) {
      DiscordServers.deleteGame(hostId);
      if (server.config.quiz.multiple_channels.enable) {
        await channel.delete();
      } else {
        if (msg) {
          await msg.delete();
        }
      }
      await replyError(interaction, "Cannot create the game");
      throw new QzGameError("501", err?.message);
    }
    setTimeout(async () => {
      try {
        const game = await QzGame.getGame(hostId);
        if (game.started) return;
        DiscordServers.deleteGame(hostId);
        const announcement = channel.messages.cache.get(game.announcementId);
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
        if (server.config.quiz.multiple_channels.enable) {
          await channel.delete();
        }
      } catch (err: any) {
        return;
      }
    }, 1000 * 60 * 5);
  },
  ephemeral: true,
});
