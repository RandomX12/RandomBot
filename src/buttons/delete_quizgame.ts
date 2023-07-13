import { ButtonInteraction, CacheType } from "discord.js";
import QuizGame from "../lib/QuizGame";
import DiscordServers from "../lib/DiscordServers";
import { ButtonCommand, reply } from "../lib/Commands";
import { error, warning } from "../lib/cmd";


module.exports = new ButtonCommand({
    data : {
        name : "deletequiz",
        description : "Delete a quiz game"
    },

    async execute(interaction : ButtonInteraction<CacheType>){
        if(!interaction?.customId?.startsWith("deletequiz")){
            await interaction.reply({
                content : "Invalid request :x:",
                ephemeral : true
            })
            return
        }
        const hostUserId = interaction.customId.split("_")[1]
            const msg = await interaction.deferReply({ephemeral : true})
            const game = await QuizGame.getQuizGamewithHostUserId(interaction.guildId,hostUserId)
            if(game.started) {
                await reply(interaction,{
                    content : "The game is started :x:"
                })
                return
            }
            const announcement = await QuizGame.getAnnouncement(interaction,interaction.guildId,game.hostId)
            await DiscordServers.deleteGame(interaction.guildId,game.hostId)
            await msg.delete()
            await announcement.edit({
                content : `The creator of this game <@${game.hostUserId}> deleted the game`,
                embeds : [],
                components : []
            })
            if(!game.mainChannel){
                setTimeout(async()=>{
                    try{
                        await announcement.channel.delete()
                    }
                    catch(err){
                        warning(err.message)
                    }
                },10*1000)
            }
        }
    
})