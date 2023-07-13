import {ButtonInteraction, CacheType} from "discord.js"
import QuizGame, { QzGame } from "../lib/QuizGame"
import { ButtonCommand, reply } from "../lib/Commands"
import { gameStartType } from "../lib/DiscordServersConfig"
import { error } from "../lib/cmd"
import handleError from "../lib/errors/handler"

module.exports = new ButtonCommand({
    data : {
        name : "ready",
        description : "ready"
    },
    async execute(interaction : ButtonInteraction<CacheType>){
            await interaction.deferReply({ephemeral : true})
            const hostId = interaction.customId?.split("_")[1]
            if(!hostId){
                await reply(interaction,{
                    content : "unknown game id",
                    ephemeral : true
                })
                return
            }
            const inGame = await QuizGame.isIn(interaction.guildId,hostId,interaction.user.id)
            if(!inGame) {
                await reply(interaction,{
                    content : `You are not in this game`,
                    ephemeral : true
                })
                return
            }
            const game = await QzGame.getGame(interaction.guildId,hostId)
            if(game.isReady(interaction.user.id)){
                await interaction.deleteReply()
                return
            }
            game.setPlayerReady(interaction.user.id)
            await game.update()
            const embed = game.generateEmbed()
            const announcement = await QuizGame.getAnnouncement(interaction,interaction.guildId,hostId)
            await announcement.edit({
                embeds : [embed],
            })
            await interaction.deleteReply()
            let allReady = true
            game.players.map(e=>{
                if(!e.ready){
                    allReady = false
                }
            })
            if(
                (game.gameStart === gameStartType.READY && allReady) ||
                (game.gameStart === gameStartType.FULL_READY && allReady && game.maxPlayers === game.players.length)
              
                ){
                await game.executeGame(interaction,announcement)
            }
    }
})