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
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const QuizGame_1 = __importStar(require("../lib/QuizGame"));
const DiscordServers_1 = __importStar(require("../lib/DiscordServers"));
const cmd_1 = require("../lib/cmd");
const discord_js_2 = require("discord.js");
let choices = Object.keys(QuizGame_1.categories).map(e => {
    return {
        name: e,
        value: `${QuizGame_1.categories[e]}`
    };
});
let cmdBody = {
    name: "create_quizgame",
    description: "create a quiz game",
    options: [
        {
            name: "category",
            description: "choose a category",
            type: discord_js_1.ApplicationCommandOptionType.String,
            required: true,
            choices: choices
        },
        {
            name: "amount",
            description: "amount of questions",
            type: discord_js_1.ApplicationCommandOptionType.Number,
            minValue: 3,
            maxValue: 10,
            required: true
        },
        {
            name: "max_players",
            description: "max players",
            type: discord_js_1.ApplicationCommandOptionType.Number,
            maxValue: 20,
            minValue: 2,
            required: true
        },
        {
            name: "time",
            description: "Time for each question",
            type: discord_js_1.ApplicationCommandOptionType.Number,
            required: false,
            choices: [{
                    name: "5 seconds",
                    value: 5 * 1000
                },
                {
                    name: "10 seconds",
                    value: 10 * 1000
                },
                {
                    name: "15 seconds",
                    value: 15 * 1000
                },
                {
                    name: "30 seconds",
                    value: 30 * 1000
                },
                {
                    name: "45 seconds",
                    value: 45 * 1000
                }
            ]
        }
    ]
};
module.exports = {
    data: cmdBody,
    async execute(interaction) {
        await interaction.deferReply({
            ephemeral: true
        });
        const isIn = await DiscordServers_1.default.isInGame(interaction.guildId, interaction.user.id);
        if (isIn) {
            await interaction.editReply({
                content: `You are already in game :x:`,
            });
            return;
        }
        let mainChannel = true;
        const category = interaction.options.getString("category");
        const amount = interaction.options.getNumber("amount");
        const maxPlayers = interaction.options.getNumber("max_players");
        let time = interaction.options.getNumber("time");
        const server = await (0, DiscordServers_1.getServerByGuildId)(interaction.guildId);
        if (server.games.length >= QuizGame_1.maxGames) {
            await interaction.editReply({
                content: `Cannot create the game :x:\nThis server has reached the maximum number of games ${QuizGame_1.maxGames}.`,
            });
            return;
        }
        const hostId = `${Date.now()}`;
        let channel;
        if (server.config.quiz?.multiple_channels) {
            try {
                const category = interaction.guild.channels.cache.get(server.config.quiz?.channels_category);
                let permissions = [{
                        id: interaction.guild.roles.everyone.id,
                        deny: ["SendMessages"]
                    }];
                if (server.config.quiz.private) {
                    permissions[0].deny = [discord_js_2.PermissionsBitField.Flags.ViewChannel];
                    server.config.quiz.roles?.map((role) => {
                        if (!role)
                            return;
                        permissions.push({
                            id: role,
                            allow: [discord_js_2.PermissionsBitField.Flags.ViewChannel],
                            deny: ["SendMessages"]
                        });
                    });
                }
                if (category) {
                    channel = await interaction.guild.channels.create({
                        name: `waiting 🟡`,
                        type: discord_js_1.ChannelType.GuildText,
                        //@ts-ignore
                        parent: category,
                        permissionOverwrites: permissions
                    });
                    mainChannel = false;
                }
                else {
                    const cat = await interaction.guild.channels.create({
                        name: server.config.quiz.category_name || "Quiz Game",
                        type: discord_js_1.ChannelType.GuildCategory,
                        permissionOverwrites: permissions
                    });
                    server.config.quiz.channels_category = cat.id;
                    await server.save();
                    if (cat) {
                        channel = await interaction.guild.channels.create({
                            name: "waiting 🟡",
                            parent: cat,
                            type: discord_js_1.ChannelType.GuildText,
                            permissionOverwrites: permissions
                        });
                    }
                    else {
                        await interaction.reply({
                            content: "Cannot create category :x:",
                            ephemeral: true
                        });
                        return;
                    }
                    mainChannel = false;
                }
                const row = new discord_js_1.ActionRowBuilder()
                    .addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId(`join_quizgame_${hostId}`)
                    .setLabel("join")
                    .setStyle(3), new discord_js_1.ButtonBuilder()
                    .setCustomId(`leave_quizgame_${hostId}`)
                    .setLabel("leave")
                    .setStyle(4));
                await channel.send({
                    components: [row]
                });
            }
            catch (err) {
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply({
                        content: "An error occurred while creating the channel :x:\n This may be from bad configurations, please check your configuration and make sure everything is OK."
                    });
                }
                (0, cmd_1.warning)(err.message);
                return;
            }
        }
        else {
            channel = interaction.channel;
        }
        if (!time) {
            time = 30 * 1000;
        }
        let msg = await channel.send({
            content: "creating Quiz Game..."
        });
        try {
            const game = new QuizGame_1.default(interaction.guildId, {
                hostName: interaction.user.tag,
                hostId: hostId,
                hostUserId: interaction.user.id,
                maxPlayers: maxPlayers,
                channelId: channel.id,
                announcementId: msg.id,
                category: (0, QuizGame_1.getCategoryByNum)(+category || category),
                amount: amount,
                time: time || 30 * 1000,
                mainChannel: mainChannel
            }, true);
            await game.save();
        }
        catch (err) {
            await msg.delete();
            await interaction.editReply({
                content: "cannot create the game :x:",
            });
            msg = null;
            await DiscordServers_1.default.deleteGame(interaction.guildId, hostId);
            if (server.config.quiz.multiple_channels) {
                await channel.delete();
            }
            throw new Error(err?.message);
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`Quiz Game`)
            .setThumbnail("https://hips.hearstapps.com/hmg-prod/images/quiz-questions-answers-1669651278.jpg")
            .addFields({ name: `Info`, value: `Category : **${(0, QuizGame_1.getCategoryByNum)(+category || category)}** \nAmount : **${amount}** \ntime : **${time / 1000 + " seconds" || "30 seconds"}** \nMax players : **${maxPlayers}**` })
            .setAuthor({ name: `Waiting for the players... 0 / ${maxPlayers}` })
            .setTimestamp(Date.now())
            .setFooter({ text: `id : ${hostId}` });
        const button = new discord_js_1.ButtonBuilder()
            .setLabel("join")
            .setStyle(3)
            .setCustomId(`join_quizgame_${hostId}`);
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(button);
        try {
            if (!msg)
                throw new Error(`Cannot create the game`);
            await msg.edit({
                embeds: [embed],
                components: [row],
                content: `@everyone new Quiz Game created by <@${interaction.user.id}> ${(0, cmd_1.TimeTampNow)()}`
            });
            const rowInte = new discord_js_1.ActionRowBuilder()
                .addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId(`delete_quiz_${interaction.user.id}`)
                .setLabel("Delete")
                .setStyle(4));
            await interaction.editReply({
                content: "Game created :white_check_mark:",
                components: [rowInte]
            });
        }
        catch (err) {
            await DiscordServers_1.default.deleteGame(interaction.guildId, hostId);
            if (server.config.quiz.multiple_channels) {
                await channel.delete();
            }
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({
                    content: "Cannot create the game :x:"
                });
            }
            else {
                await interaction.editReply({
                    content: "cannot create the game :x:",
                });
            }
            throw new Error(err?.message);
        }
        setTimeout(async () => {
            try {
                const game = await QuizGame_1.default.getGameWithHostId(interaction.guildId, hostId);
                if (game.started)
                    return;
                await DiscordServers_1.default.deleteGame(interaction.guildId, hostId);
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
                if (server.config.quiz.multiple_channels) {
                    await channel.delete();
                }
            }
            catch (err) {
                return;
            }
        }, 1000 * 60 * 5);
    }
};
