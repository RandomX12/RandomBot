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
const DiscordServers_1 = __importStar(require("../lib/DiscordServers"));
const QuizGame_1 = __importStar(require("../lib/QuizGame"));
const cmd_1 = require("../lib/cmd");
module.exports = {
    data: {
        name: "join_quizgame_[:id]",
        description: "Join a Quiz Game"
    },
    async execute(interaction) {
        if (!interaction.customId || !interaction.customId.startsWith("join_quizgame")) {
            await interaction.reply({
                content: "Invalid request :x:",
                ephemeral: true
            });
            return;
        }
        const isIn = await DiscordServers_1.default.isInGame(interaction.guildId, interaction.user.id);
        if (isIn) {
            await interaction.reply({
                content: "You are already in this game :x:",
                ephemeral: true
            });
            return;
        }
        const hostId = interaction.customId.split("_")[2];
        const isFull = await DiscordServers_1.default.isGameFull(interaction.guildId, hostId);
        if (isFull) {
            await interaction.reply({
                content: "This Game is full :x:",
                ephemeral: true
            });
            return;
        }
        const server = await (0, DiscordServers_1.getServerByGuildId)(interaction.guildId);
        try {
            await QuizGame_1.default.join(interaction.guildId, hostId, interaction.user);
        }
        catch (err) {
            (0, cmd_1.warning)(err.message);
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({
                    content: "an error occurred while trying to join the game",
                });
            }
            else {
                await interaction.reply({
                    content: "an error occurred while trying to join the game",
                    ephemeral: true
                });
            }
            return;
        }
        const game = await QuizGame_1.QzGame.getGame(interaction.guildId, hostId);
        if (!(0, QuizGame_1.isQuizGame)(game))
            return;
        if (game.started)
            return;
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`Quiz Game`)
            .setThumbnail("https://hips.hearstapps.com/hmg-prod/images/quiz-questions-answers-1669651278.jpg")
            .addFields({ name: `Info`, value: `Category : **${game?.category}** \nAmount : **${game.amount}** \ntime : **${game.time / 1000 + " seconds" || "30 seconds"} ** \n Max players : **${game.maxPlayers}**` })
            .setAuthor({ name: `Waiting for the players... ${game.players.length} / ${game.maxPlayers}` })
            .setTimestamp(Date.now())
            .setFooter({ text: `id : ${game.hostId}` });
        const announcement = interaction.channel.messages.cache.get(game.announcementId);
        if (announcement) {
            await announcement.edit({
                embeds: [embed]
            });
            const button = new discord_js_1.ButtonBuilder()
                .setLabel("Leave")
                .setCustomId("leave_quizgame_" + game.hostId)
                .setStyle(4);
            const row = new discord_js_1.ActionRowBuilder()
                .setComponents(button);
            await interaction.reply({
                content: "You joined the game :white_check_mark:",
                components: [row],
                ephemeral: true
            });
        }
        else {
            await DiscordServers_1.default.deleteGame(interaction.guildId, hostId);
            const embed = new discord_js_1.EmbedBuilder()
                .setAuthor({ name: "Quiz Game" })
                .setTitle("It looks like someone deleted the game announcement ❌")
                .setFooter({ text: "Game deleted" });
            await interaction.channel.send({
                embeds: [embed],
            });
            return;
        }
        // Game start
        if (game.players.length === game.maxPlayers) {
            try {
                embed.setAuthor({ name: "Starting the game... 🟢" });
                await announcement.edit({
                    content: "",
                    embeds: [embed],
                    components: []
                });
                const channel = await QuizGame_1.default.getChannel(interaction, hostId);
                await QuizGame_1.default.start(interaction.guildId, hostId);
                if (!game.mainChannel) {
                    await channel.edit({ name: "started 🟢" });
                }
                const gameGenerator = game.play();
                while (gameGenerator.next().done === false) {
                    try {
                        const startingEmbed = new discord_js_1.EmbedBuilder()
                            .setAuthor({ name: game.round.category })
                            .setTitle(game.round.question)
                            .setThumbnail(QuizGame_1.QuizCategoryImg[game.category])
                            .setFooter({ text: `id : ${hostId}` });
                        const row = new discord_js_1.ActionRowBuilder();
                        let al = ["A", "B", "C", "D"];
                        if (game.round.answers.length === 2) {
                            let ans = ["A", "B"];
                            let trIndex = game.round.answers.indexOf("True");
                            let flIndex = game.round.answers.indexOf("False");
                            row.addComponents(new discord_js_1.ButtonBuilder()
                                .setCustomId(`answer_${ans[trIndex]}_${hostId}`)
                                .setLabel("True")
                                .setStyle(1), new discord_js_1.ButtonBuilder()
                                .setCustomId(`answer_${ans[flIndex]}_${hostId}`)
                                .setLabel("False")
                                .setStyle(1));
                        }
                        else {
                            let ans = "";
                            game.round.answers.map((e, j) => {
                                ans += al[j] + " : " + e + "\n";
                                row.addComponents(new discord_js_1.ButtonBuilder()
                                    .setCustomId(`answer_${al[j]}_${hostId}`)
                                    .setLabel(al[j])
                                    .setStyle(1));
                            });
                            startingEmbed.addFields({ name: "answers :", value: ans });
                        }
                        row.addComponents(new discord_js_1.ButtonBuilder()
                            .setCustomId(`remove_ans`)
                            .setLabel("remove answer")
                            .setStyle(2));
                        await announcement.edit({
                            embeds: [startingEmbed],
                            components: [row],
                            content: (0, cmd_1.TimeTampNow)()
                        });
                        await (0, QuizGame_1.stop)(game.time || 30 * 1000);
                        let endAns = "";
                        game.round.answers.map((e, j) => {
                            if (j === game.round.correctIndex) {
                                endAns += "**" + al[j] + " : " + e + " ✅" + "**\n";
                            }
                            else {
                                endAns += al[j] + " : " + e + "\n";
                            }
                        });
                        startingEmbed.setFields({ name: "answers :", value: endAns });
                        await announcement.edit({
                            embeds: [startingEmbed],
                            components: [],
                            content: ""
                        });
                        await QuizGame_1.default.scanAns(interaction.guildId, hostId);
                        await (0, QuizGame_1.stop)(5 * 1000);
                    }
                    catch (err) {
                        gameGenerator.return();
                    }
                }
                //     for(let i = 0;i<game.amount;i++){
                //     const startingEmbed = new EmbedBuilder()
                //     .setAuthor({name : game.quiz[i].category})
                //     .setTitle(game.quiz[i].question)
                //     .setThumbnail(QuizCategoryImg[game.category])
                //     .setFooter({text : `id : ${hostId}`})
                //     const row :any  = new ActionRowBuilder()
                //     let al : answers[] = ["A" , "B" ,"C","D"]
                //     if(game.quiz[i].answers.length === 2){
                //         let ans : answers[] = ["A","B"]
                //         let trIndex = game.quiz[i].answers.indexOf("True") 
                //         let flIndex = game.quiz[i].answers.indexOf("False")
                //         row.addComponents(
                //             new ButtonBuilder()
                //             .setCustomId(`answer_${ans[trIndex]}_${hostId}`)
                //             .setLabel("True")
                //             .setStyle(1)
                //             ,
                //             new ButtonBuilder()
                //             .setCustomId(`answer_${ans[flIndex]}_${hostId}`)
                //             .setLabel("False")
                //             .setStyle(1)
                //         )
                //     }else{
                //         let ans = ""
                //     game.quiz[i].answers.map((e,j)=>{
                //         ans += al[j] + " : " + e + "\n"
                //         row.addComponents(
                //             new ButtonBuilder()
                //             .setCustomId(`answer_${al[j]}_${hostId}`)
                //             .setLabel(al[j])
                //             .setStyle(1)
                //         )
                //     })
                //     startingEmbed.addFields({name : "answers :",value : ans})
                //     }
                //     row.addComponents(
                //         new ButtonBuilder()
                //         .setCustomId(`remove_ans`)
                //         .setLabel("remove answer")
                //         .setStyle(2)
                //     )
                //     await announcement.edit({
                //         embeds : [startingEmbed],
                //         components : [row],
                //         content : TimeTampNow()
                //     })
                //     await new Promise((res,rej)=>{
                //         setTimeout(res,game.time || 30*1000)
                //     })
                //     let endAns = ""
                //     game.quiz[i].answers.map((e,j)=>{
                //         if(j === game.quiz[i].correctIndex){
                //             endAns += "**" + al[j] + " : " + e + " ✅" +"**\n"
                //         }else{
                //         endAns += al[j] + " : " + e +"\n"
                //         }
                //     })
                //     startingEmbed.setFields({name : "answers :",value : endAns})
                //     await announcement.edit({
                //         embeds : [startingEmbed],
                //         components : [],
                //         content : ""
                //     })
                //     await QuizGame.scanAns(interaction.guildId,hostId)
                //     await new Promise((res,rej)=>{
                //         setTimeout(res,1000*5)
                //     })
                // }
                const gameUpdate = await QuizGame_1.default.getGameWithHostId(interaction.guildId, hostId);
                const endEmbed = new discord_js_1.EmbedBuilder()
                    .setTitle(`Quiz Game`)
                    .setAuthor({ name: "Game end 🔴" });
                let playersScore = "";
                let players = gameUpdate.players;
                let rankedPlayers = [];
                const length = gameUpdate.players.length;
                for (let i = 0; i < length; i++) {
                    let b = players.reduce((pe, ce) => {
                        if (players.length === 1) {
                            return ce;
                        }
                        return ce.score <= pe.score ? pe : ce;
                    });
                    players.map((e, j) => {
                        if (b.id === e.id) {
                            players.splice(j, 1);
                        }
                    });
                    rankedPlayers.push(b);
                }
                rankedPlayers.map((e, i) => {
                    playersScore += QuizGame_1.rank[i] + " - " + e.username + "\ \ \ \ **" + e.score + "**\n";
                });
                endEmbed.addFields({ name: "players score ", value: playersScore });
                endEmbed.setTimestamp(Date.now());
                await announcement.edit({
                    content: "",
                    components: [],
                    embeds: [endEmbed]
                });
                await DiscordServers_1.default.deleteGame(interaction.guildId, hostId);
                if (game.mainChannel)
                    return;
                if (channel) {
                    setTimeout(async () => {
                        try {
                            await channel.delete();
                        }
                        catch (err) {
                            (0, cmd_1.warning)(err.message);
                        }
                    }, 20 * 1000);
                    await channel.edit({ name: "game end 🔴", type: discord_js_1.ChannelType.GuildText, permissionOverwrites: [{
                                id: interaction.guild.roles.everyone,
                                deny: []
                            }] });
                }
            }
            catch (err) {
                try {
                    const announcement = await QuizGame_1.default.getAnnouncement(interaction, interaction.guildId, hostId);
                    await DiscordServers_1.default.deleteGame(interaction.guildId, hostId);
                    (0, cmd_1.error)(err?.message);
                    await announcement.edit({
                        content: "an error occured while starting the game :x:\nThe game is deleted",
                    });
                    if (!game.mainChannel) {
                        if (announcement) {
                            setTimeout(async () => {
                                try {
                                    await announcement.channel.delete();
                                }
                                catch (err) {
                                    (0, cmd_1.warning)(`An error occured while deleting the game channel`);
                                }
                            }, 1000 * 10);
                        }
                    }
                }
                catch (err) {
                    (0, cmd_1.warning)(err?.message);
                }
            }
        }
    }
};
