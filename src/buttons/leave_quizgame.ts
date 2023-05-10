import { ButtonInteraction, CacheType, EmbedBuilder } from "discord.js";
import DiscordServers, { getServerByGuildId } from "../lib/DiscordServers";
import QuizGame, { isQuizGame } from "../lib/QuizGame";
import Spygame, { isSpyGame } from "../lib/spygame";


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
        if(game.started) return
        const gameUpdate = await QuizGame.getGameWithHostId(interaction.guildId,game.hostId)
        
        const announcement = interaction.channel.messages.cache.get(gameUpdate.announcementId)
        if(announcement){
            const embed = new EmbedBuilder()
            .setTitle(`Quiz Game`)
            .setThumbnail("https://hips.hearstapps.com/hmg-prod/images/quiz-questions-answers-1669651278.jpg")
            .addFields({name : `Info`,value : `Category : **${gameUpdate.category}** \nAmount : **${gameUpdate.amount}** \nMax players : **${gameUpdate.maxPlayers}**`})
            .setAuthor({name : `Waiting for the players... ${gameUpdate.players.length} / ${gameUpdate.maxPlayers}`})
            .setTimestamp(Date.now())
            await announcement.edit({
                embeds: [embed]
            })
            return
        }else{
            await DiscordServers.deleteGame(interaction.guildId,gameUpdate.hostId)
            const embed = new EmbedBuilder()
            .setAuthor({name : "Quiz Game"})
            .setTitle("It looks like someone deleted the game announcement ❌")
            .setFooter({text : "Game deleted"})
            await interaction.channel.send({
                embeds : [embed],
            })
            return
        }    
    }
    
}