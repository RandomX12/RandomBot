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
  QuizGameInfo,
  createQzGame,
  QzGameInfo,
  generateId,
} from "../lib/QuizGame";
import DiscordServers, {
  fetchServer,
  getServerByGuildId,
} from "../lib/DiscordServers";
import { TimeTampNow, error, warning } from "../lib/cmd";
import Command, { reply } from "../lib/Commands";
import { RolesConfig, gameStartType } from "../lib/DiscordServersConfig";
import { games } from "..";

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
      await reply(interaction, {
        content: `You are already in game :x:`,
      });
      return;
    }
    let mainChannel = true;
    const category = interaction.options.getString("category");
    const amount = interaction.options.getNumber("amount");
    const maxPlayers = interaction.options.getNumber("max_players");
    let time = interaction.options.getNumber("time");
    const server = await fetchServer(interaction.guildId);
    const guidGames = games.select({ guildId: interaction.guildId });
    if (guidGames.length >= maxGames) {
      await reply(interaction, {
        content: `Cannot create the game :x:\nThis server has reached the maximum number of games ${maxGames}.`,
      });
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
        await reply(interaction, {
          content: `Sorry but you are not allowed to create quiz game in this server.\ncontact server administrators for permission to create quiz games`,
        });
        return;
      }
      if (maxPlayers) {
        const Qzgames = games.select({
          guildId: interaction.guildId,
          hostUserId: interaction.user.id,
        });
        if (Qzgames.length >= maxGames) {
          await reply(interaction, {
            content: `Sorry, you can't create a quiz game. You have only the right to create ${maxGames} game${
              maxGames >= 2 ? "s" : ""
            } in this server`,
            ephemeral: true,
          });
          return;
        }
      }
    }

    const hostId = generateId();
    let channel: TextChannel | GuildTextBasedChannel;
    if (server.config.quiz?.multiple_channels) {
      try {
        const category = interaction.guild.channels.cache.get(
          server.config.quiz?.channels_category
        );
        let permissions: OverwriteResolvable[] = [
          {
            id: interaction.guild.roles.everyone.id,
            deny: server.config.quiz.private
              ? ["SendMessages", "ViewChannel"]
              : ["SendMessages"],
          },
          {
            id: interaction.client.user.id,
            allow: ["ManageMessages", "SendMessages", "ManageChannels"],
            deny: [],
          },
        ];
        if (
          server.config.quiz.viewChannel.length !== 0 &&
          server.config.quiz.private
        ) {
          server.config.quiz.viewChannel.map((e) => {
            permissions.push({
              id: e,
              deny: ["SendMessages"],
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
              name: server.config.quiz.category_name || "Quiz Game",
              type: ChannelType.GuildCategory,
              permissionOverwrites: permissions,
            });
          server.config.quiz.channels_category = cat.id;
          await server.update();
          if (cat) {
            channel = await interaction.guild.channels.create({
              name: "waiting 🟡",
              parent: cat,
              type: ChannelType.GuildText,
              permissionOverwrites: permissions,
            });
          } else {
            await reply(interaction, {
              content: "Cannot create category :x:",
              ephemeral: true,
            });
            return;
          }
          mainChannel = false;
        }
        const row: any = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`join_quizgame_${hostId}`)
            .setLabel("join")
            .setStyle(3),
          new ButtonBuilder()
            .setCustomId(`leave_quizgame_${hostId}`)
            .setLabel("leave")
            .setStyle(4)
        );

        await channel.send({
          components: [row],
        });
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
          await reply(interaction, {
            content:
              "An error occurred while creating the channel :x:\n This may be from bad configurations, please check your configuration and make sure everything is OK.\n" +
              (errorCode ? `error code :${errorCode}\nmessage : ${msg}` : ""),
          });
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
    };
    const game = await createQzGame(hostId, gameBody);
    if (!empty) {
      game.players.push({
        id: hostId,
        username: interaction.user.username,
      });
    }
    const embed = game.generateEmbed();
    const content = `@everyone new Quiz Game created by <@${
      interaction.user.id
    }> ${TimeTampNow()}`;
    const row: any = game.generateRow(server.config.quiz.gameStart);
    if (game.mainChannel) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`join_quizgame_${hostId}`)
          .setLabel("Join")
          .setStyle(3)
      );
    }
    try {
      if (!msg) throw new Error(`Cannot create the game`);
      await msg.edit({
        embeds: [embed],
        components:
          (game.gameStart &&
            game.gameStart !== gameStartType.ADMIN &&
            !game.mainChannel) ||
          game.mainChannel
            ? [row]
            : [],
        content: content,
      });
      await reply(interaction, {
        content: `Game created ${
          !game.mainChannel ? `in <#${game.channelId}>` : ""
        } :white_check_mark:`,
      });
    } catch (err: any) {
      DiscordServers.deleteGame(hostId);
      if (server.config.quiz.multiple_channels) {
        await channel.delete();
      }
      if (interaction.replied || interaction.deferred) {
        await reply(interaction, {
          content: "Cannot create the game :x:",
        });
      } else {
        await reply(interaction, {
          content: "cannot create the game :x:",
        });
      }
      throw new Error(err?.message);
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
        if (server.config.quiz.multiple_channels) {
          await channel.delete();
        }
      } catch (err: any) {
        return;
      }
    }, 1000 * 60 * 5);
  },
  ephemeral: true,
  access: ["Administrator"],
});
