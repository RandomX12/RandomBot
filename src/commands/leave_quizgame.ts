import { CacheType, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import DiscordServers, { getServerByGuildId } from "../lib/DiscordServers";
import  QuizGame, { isQuizGame } from "../lib/QuizGame";
import Spygame, { isSpyGame } from "../lib/spygame";
import { warning } from "../lib/cmd";


module.exports = {
    data : {
        name : "leave_quizgame",
        description : "Leave Quiz Game"
    },
    async execute(interaction : ChatInputCommandInteraction<CacheType>){
        const isIn = await DiscordServers.isInGame(interaction.guildId,interaction.user.id)
        if(!isIn) {
            await interaction.reply({
                content : "You are not in game :x:",
                ephemeral : true
            })
            return
        }
        // still under dev :)
        const server = await getServerByGuildId(interaction.guildId)
        const game = await Spygame.findGameByUserId(server.games,interaction.user.id)
        if(!isQuizGame(game)){
            let tryTxt = ""
            if(isSpyGame(game)){
                tryTxt = "Try /leave_spygame"
            }
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
        const announcement = await QuizGame.getAnnouncement(interaction,interaction.guildId,gameUpdate.hostId)
        if(game.started) {
            if(gameUpdate.players.length === 0){
                if(announcement){
                    const deleteEmbed = new EmbedBuilder()
                    .setTitle("No one else in the game ❌")
                    .setFooter({text : "Game Deleted"})
                    .setAuthor({name : "Quiz Game"})
                    await DiscordServers.deleteGame(interaction.guildId,gameUpdate.hostId)
                    await announcement.edit({
                        embeds : [deleteEmbed],
                        components : [],
                        content : ""
                    })
                    const server = await getServerByGuildId(interaction.guildId)
                    if(server.config.quiz.multiple_channels){
                        setTimeout(async()=>{
                            try{
                                await announcement.channel.delete()
                            }
                            catch(err : any){
                                warning(err.message)
                            }
                        },1000*10)
                    }
                }else{
                    await DiscordServers.deleteGame(interaction.guildId,gameUpdate.hostId)
                }
            }
            return
        }
        if(announcement){
            const embed = new EmbedBuilder()
            .setTitle(`Quiz Game`)
            .setThumbnail("https://hips.hearstapps.com/hmg-prod/images/quiz-questions-answers-1669651278.jpg")
            .addFields({name : `Info`,value : `Category : **${gameUpdate.category}** \nAmount : **${gameUpdate.amount}**\ntime : **${game.time / 1000 + " seconds" || "30 seconds"} **  \nMax players : **${gameUpdate.maxPlayers}**`})
            .setAuthor({name : `Waiting for the players... ${gameUpdate.players.length} / ${gameUpdate.maxPlayers}`})
            .setTimestamp(Date.now())
            .setFooter({text : `id : ${game.hostId}`})
            await announcement.edit({
                embeds: [embed]
            })
            return
        }else{
            const channel = await QuizGame.getChannel(interaction,game.hostId)
            await DiscordServers.deleteGame(interaction.guildId,gameUpdate.hostId)
            if(server.config.quiz.multiple_channels){
                if(channel){
                    await channel.delete()
                    return
                }
            }
            const embed = new EmbedBuilder()
            .setAuthor({name : "Quiz Game"})
            .setTitle("It looks like someone deleted the game announcement ❌")
            .setFooter({text : "Game deleted"})
            await interaction.channel?.send({
                embeds : [embed],
            })

            return
        }
    }
}
