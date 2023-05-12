import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, CacheType, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import DiscordServers, { getServerByGuildId } from "../lib/DiscordServers";
import QuizGame, { CategoriesNum, QuizCategoryImg, answerType, getCategoryByNum, isQuizGame, rank } from "../lib/QuizGame";
import { QuizGamePlayer, answers } from "../model/QuizGame";
import { TimeTampNow, error } from "../lib/cmd";
import { numberEmojisStyled } from "../lib/spygame";

module.exports = {
    data : {
        name : "join_quizgame_[:id]",
        description : "Join a Quiz Game"
    },
    async execute(interaction : ButtonInteraction<CacheType>){
        if(!interaction.customId || !interaction.customId.startsWith("join_quizgame")){
            await interaction.reply({
                content : "Invalid request :x:",
                ephemeral : true
            })
            return
        }
        const isIn = await DiscordServers.isInGame(interaction.guildId,interaction.user.id)
        
        if(isIn){
            await interaction.reply({
                content : "You are already in this game :x:",
                ephemeral : true
            })
            return
        }
        const hostId = interaction.customId.split("_")[2]
        const isFull = await DiscordServers.isGameFull(interaction.guildId,hostId)

        if(isFull){
            await interaction.reply({
                content : "This Game is full :x:",
                ephemeral : true
            })
            return
        }
        try{
            await QuizGame.join(interaction.guildId,hostId,interaction.user.id)
        }
        catch(err : any){
            if(interaction.replied || interaction.deferred){
                await interaction.editReply({
                    content : "an error occurred while trying to join the game",
                })
            }else{
                await interaction.reply({
                    content : "an error occurred while trying to join the game",
                    ephemeral : true
                })
            }
            return
        }
        const game = await DiscordServers.getGameByHostId(interaction.guildId,hostId)
        if(!isQuizGame(game)) return
        const embed = new EmbedBuilder()
        .setTitle(`Quiz Game`)
        .setThumbnail("https://hips.hearstapps.com/hmg-prod/images/quiz-questions-answers-1669651278.jpg")
        .addFields({name : `Info`,value : `Category : **${game?.category}** \nAmount : **${game.amount}** \nMax players : **${game.maxPlayers}**`})
        .setAuthor({name : `Waiting for the players... ${game.players.length} / ${game.maxPlayers}`})
        .setTimestamp(Date.now())
        const announcement = interaction.channel.messages.cache.get(game.announcementId)
        if(announcement){
            await announcement.edit({
                embeds : [embed]
            })
            const button = new ButtonBuilder()
            .setLabel("Leave")
            .setCustomId("leave_quizgame_"+game.hostId)
            .setStyle(4)
            const row : any = new ActionRowBuilder()
            .setComponents(button)
            await interaction.reply({
                content : "You joined the game :white_check_mark:",
                components : [row],
                ephemeral : true
            })
        }else{
            await DiscordServers.deleteGame(interaction.guildId,hostId)
            const embed = new EmbedBuilder()
            .setAuthor({name : "Quiz Game"})
            .setTitle("It looks like someone deleted the game announcement ❌")
            .setFooter({text : "Game deleted"})
            await interaction.channel.send({
                embeds : [embed],
            })
            return
        }
        // Game start

        if(game.players.length === game.maxPlayers){
            try{
                embed.setAuthor({name : "Starting the game... 🟢"})
                await announcement.edit({
                    content : "",
                    embeds : [embed],
                    components : []
                })
                await QuizGame.start(interaction.guildId,hostId)
                for(let i = 0;i<game.amount;i++){
                    const startingEmbed = new EmbedBuilder()
                .setAuthor({name : game.quiz[i].category})
                .setTitle(game.quiz[i].question)
                .setThumbnail(QuizCategoryImg[game.category])
                const row : any = new ActionRowBuilder()
                let ans = ""
                let al : answers[] = ["A" , "B" ,"C","D"]
                game.quiz[i].answers.map((e,j)=>{
                    ans += al[j] + " : " + e + "\n"
                    row.addComponents(
                        new ButtonBuilder()
                        .setCustomId(`answer_${al[j]}_${hostId}`)
                        .setLabel(al[j])
                        .setStyle(1)
                    )
                })
                startingEmbed.addFields({name : "answers :",value : ans})
                await announcement.edit({
                    embeds : [startingEmbed],
                    components : [row],
                    content : TimeTampNow()
                })
                await new Promise((res,rej)=>{
                    setTimeout(res,1000*30)
                })
                let endAns = ""
                game.quiz[i].answers.map((e,j)=>{
                    let check = ""
                    if(j === game.quiz[i].correctIndex){
                        check = "✅"
                    }
                    endAns += "**" + al[j] + " : " + e + check +"**\n"
                })
                startingEmbed.setFields({name : "answers :",value : endAns})
                await announcement.edit({
                    embeds : [startingEmbed],
                    components : [],
                    content : ""
                })
                await QuizGame.scanAns(interaction.guildId,hostId)
                await new Promise((res,rej)=>{
                    setTimeout(res,1000*5)
                })
            }
            const gameUpdate = await QuizGame.getGameWithHostId(interaction.guildId,hostId)
            const endEmbed = new EmbedBuilder()
            .setTitle(`Quiz Game`)
            .setAuthor({name : "Game end"})
            let playersScore = ""
            let players = gameUpdate.players
            let rankedPlayers = []
            const length = gameUpdate.players.length
            for(let i = 0;i<length;i++){
                let b = players.reduce((pe,ce)=>{
                    if(players.length === 1){
                        return ce
                    }
                    return ce.score <= pe.score ? pe : ce
                })
                players.map((e,j)=>{
                    if(b.id === e.id){
                        players.splice(j,1)
                    }
                })
                rankedPlayers.push(b)
            }
            rankedPlayers.map((e,i)=>{
                playersScore += rank[i] + " - " + e.username + "\ \ \ \ **" + e.score + "**\n"
            })
            endEmbed.addFields({name : "players score ",value : playersScore})
            endEmbed.setTimestamp(Date.now())
            await announcement.reply({
                content : "",
                components : [],
                embeds : [endEmbed]
            })
            await DiscordServers.deleteGame(interaction.guildId,hostId)
            }
            catch(err : any){
                await DiscordServers.deleteGame(interaction.guildId,hostId)
                await announcement?.edit({
                    content : "an error occurred while starting the game",
                })
                error(err?.message)
            }
        }
    }
}