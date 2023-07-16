import {ButtonInteraction, CacheType} from "discord.js"
import { ButtonCommand, reply } from "../lib/Commands"
import { QzGame } from "../lib/QuizGame"

module.exports = new ButtonCommand({
    data : {
        name : "notready",
        description : "not ready"
    },
    async execute(interaction : ButtonInteraction<CacheType>){
            const hostId = interaction.customId?.split("_")[1]
            if(!hostId){
                await reply(interaction,{
                    content : "unknown game id",
                    ephemeral : true
                })
                return
            }
            const inGame = await QzGame.isIn(hostId,interaction.user.id)
            if(!inGame) {
                await reply(interaction,{
                    content : `You are not in this game`,
                    ephemeral : true
                })
                return
            }
            const game = await QzGame.getGame(hostId)
            if(!game.isReady(interaction.user.id)){
                await interaction.deleteReply()
                return
            }
            game.setPlayerReady(interaction.user.id,false)
            await game.update()
            const embed = game.generateEmbed()
            const announcement = await QzGame.getAnnouncement(interaction,hostId)
            await announcement.edit({
                embeds : [embed],
            })
            await interaction.deleteReply()
    },
    ephemeral : true,    

})