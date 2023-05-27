import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, CacheType, ChannelType, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import DiscordServers, { getServerByGuildId } from "../lib/DiscordServers";
import QuizGame, { CategoriesNum, QuizCategoryImg, answerType, getCategoryByNum, isQuizGame, rank } from "../lib/QuizGame";
import { QuizGamePlayer, answers } from "../model/QuizGame";
import { TimeTampNow, error, warning } from "../lib/cmd";
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
        const server = await getServerByGuildId(interaction.guildId)
        try{
            await QuizGame.join(interaction.guildId,hostId,interaction.user)
        }
        catch(err : any){
            warning(err.message)
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
        if(game.started) return
        const embed = new EmbedBuilder()
        .setTitle(`Quiz Game`)
        .setThumbnail("https://hips.hearstapps.com/hmg-prod/images/quiz-questions-answers-1669651278.jpg")
        .addFields({name : `Info`,value : `Category : **${game?.category}** \nAmount : **${game.amount}** \ntime : **${game.time / 1000 + " seconds" || "30 seconds"} ** \n Max players : **${game.maxPlayers}**`})
        .setAuthor({name : `Waiting for the players... ${game.players.length} / ${game.maxPlayers}`})
        .setTimestamp(Date.now())
        .setFooter({text : `id : ${game.hostId}`})
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
                .setFooter({text : `id : ${hostId}`})
                const row :any  = new ActionRowBuilder()
                let al : answers[] = ["A" , "B" ,"C","D"]
                if(game.quiz[i].answers.length === 2){
                    let ans : answers[] = ["A","B"]
                    let trIndex = game.quiz[i].answers.indexOf("True") 
                    let flIndex = game.quiz[i].answers.indexOf("False")
                    row.addComponents(
                        new ButtonBuilder()
                        .setCustomId(`answer_${ans[trIndex]}_${hostId}`)
                        .setLabel("True")
                        .setStyle(1)
                        ,
                        new ButtonBuilder()
                        .setCustomId(`answer_${ans[flIndex]}_${hostId}`)
                        .setLabel("False")
                        .setStyle(1)
                    )
                }else{
                    let ans = ""
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
                }
                row.addComponents(
                    new ButtonBuilder()
                    .setCustomId(`remove_ans`)
                    .setLabel("remove answer")
                    .setStyle(2)
                )
                await announcement.edit({
                    embeds : [startingEmbed],
                    components : [row],
                    content : TimeTampNow()
                })
                await new Promise((res,rej)=>{
                    setTimeout(res,game.time || 30*1000)
                })
                let endAns = ""
                game.quiz[i].answers.map((e,j)=>{
                    if(j === game.quiz[i].correctIndex){
                        endAns += "**" + al[j] + " : " + e + " ✅" +"**\n"

                    }else{
                    endAns += al[j] + " : " + e +"\n"
                    }
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
            await announcement.edit({
                content : "",
                components : [],
                embeds : [endEmbed]
            })

            const channel = await QuizGame.getChannel(interaction,hostId)
            await DiscordServers.deleteGame(interaction.guildId,hostId)
            if(game.mainChannel) return
            if(channel){
                await channel.edit({name : "game end",type : ChannelType.GuildText,permissionOverwrites : [{
                    id : interaction.guild.roles.everyone,
                    deny : []
                }]}) 
                setTimeout(async()=>{
                    try{
                        await channel.delete()
                    }
                    catch(err : any){
                        warning(err.message)
                    }
                },20*1000)
            }    
        }
            catch(err : any){
                try{
                    const announcement = await QuizGame.getAnnouncement(interaction,interaction.guildId,hostId)
                    if(server.config.quiz.multiple_channels){
                        if(announcement){
                            await announcement.channel.delete()
                        }
                    }else{
                        await announcement?.delete()
                    }
                }
                catch(err : any){
                    warning(err.message)
                }
                await DiscordServers.deleteGame(interaction.guildId,hostId)
                error(err?.message)
            }
        }
    }
}