import { ButtonInteraction, CacheType, EmbedBuilder } from "discord.js";
import DiscordServers, { getServerByGuildId } from "../lib/DiscordServers";
import QuizGame, { isQuizGame } from "../lib/QuizGame";
import { error, warning } from "../lib/cmd";


module.exports = {
    data : {
        name : "leave_quizgame_[:id]",
        description : "Leave a Quiz Game"
    },
    async execute(interaction : ButtonInteraction<CacheType>){
        if(!interaction.customId || !interaction.customId.startsWith("leave_quizgame")){
            await interaction.reply({
                content : "Invalid request :x:",
                ephemeral : true
            })
            return
        }
        const hostId = interaction.customId.split("_")[2]
        const isIn = await QuizGame.isIn(interaction.guildId,hostId,interaction.user.id)
        if(!isIn) {
            await interaction.reply({
                content : "You are not in this quiz game :x:",
                ephemeral : true
            })
            return
        }
        const game = await QuizGame.getGameWithHostId(interaction.guildId,hostId)
        if(!isQuizGame(game)){
            let tryTxt = ""
            await interaction.reply({
                content : "You are not in Quiz Game, "+tryTxt,
                ephemeral : true
            })
            return
        }
        await QuizGame.leave(interaction.guildId,game.hostId,interaction.user.id)
        await interaction.reply({
            content : "You left the game",
            ephemeral : true
        })
        const gameUpdate = await QuizGame.getGameWithHostId(interaction.guildId,game.hostId)
        const announcement = interaction.channel.messages.cache.get(gameUpdate.announcementId)
        if(game.started) {
            if(gameUpdate.players.length === 0){
                await DiscordServers.deleteGame(interaction.guildId,gameUpdate.hostId)
                if(announcement){
                    const deleteEmbed = new EmbedBuilder()
                    .setTitle("No one else in the game ❌")
                    .setFooter({text : "Game Deleted"})
                    .setAuthor({name : "Quiz Game"})
                    await announcement.edit({
                        embeds : [deleteEmbed],
                        components : [],
                        content : ""
                    })
                }
                if(!game.mainChannel){
                    await announcement.channel.edit({name : "Game end 🔴"})
                    setTimeout(async()=>{
                        try{
                            await announcement.channel.delete()
                        }catch(err : any){
                            warning(err.message)
                        }
                    },1000*10)
                }
            }
        return
        }
        if(announcement){
            const embed = new EmbedBuilder()
            .setTitle(`Quiz Game`)
            .setThumbnail("https://hips.hearstapps.com/hmg-prod/images/quiz-questions-answers-1669651278.jpg")
            .addFields({name : `Info`,value : `Category : **${gameUpdate.category}** \nAmount : **${gameUpdate.amount}** \ntime : **${game.time / 1000 + " seconds" || "30 seconds"} ** \nMax players : **${gameUpdate.maxPlayers}**`})
            .setAuthor({name : `Waiting for the players... ${gameUpdate.players.length} / ${gameUpdate.maxPlayers}`})
            .setTimestamp(Date.now())
            .setFooter({text : `id : ${game.hostId}`})
            if(gameUpdate.players.length !== 0){
                let players = ``
                gameUpdate.players.map((e)=>{
                    players += `${e.username}\n`
                })
                embed.addFields({name : "players",value : players})
            }else{
                embed.addFields({name : "players",value : "**NO PLAYER IN THE GAME**"})
            }
            await announcement.edit({
                embeds: [embed]
            })
            return
        }else{
            const channel = await QuizGame.getChannel(interaction,hostId)
            await DiscordServers.deleteGame(interaction.guildId,gameUpdate.hostId)
            const embed = new EmbedBuilder()
            .setAuthor({name : "Quiz Game"})
            .setTitle("It looks like someone deleted the game announcement ❌")
            .setFooter({text : "Game deleted"})
            await interaction.channel.send({
                embeds : [embed],
            })
            const server = await getServerByGuildId(interaction.guildId)
            if(server.config.quiz.multiple_channels){
                if(!channel) return
                setTimeout(async()=>{
                    try{
                        await channel.delete()
                    }
                    catch(err : any){
                        warning(err.message)
                    }

                })
            }
            return
        }    
    }
    
}