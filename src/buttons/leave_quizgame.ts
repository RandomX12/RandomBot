import { ButtonInteraction, CacheType, EmbedBuilder } from "discord.js";
import DiscordServers, { getServerByGuildId } from "../lib/DiscordServers";
import QuizGame, { QzGame, isQuizGame } from "../lib/QuizGame";
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
        const game = await QzGame.getGame(interaction.guildId,hostId)
        game.removePlayer(interaction.user.id)
        await game.update()
        await interaction.reply({
            content : "You left the game :white_check_mark:",
            ephemeral : true
        })
        const announcement = interaction.channel.messages.cache.get(game.announcementId)
        if(game.started) {
            if(game.players.length === 0){
                await DiscordServers.deleteGame(interaction.guildId,game.hostId)
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
                    return
                }
                setTimeout(async()=>{
                    try{
                        await announcement?.delete()
                    }catch(err){
                        warning(err.message)
                    }
                },5000)
            }
        return
        }
        if(announcement){
            const embed = game.generateEmbed()
            await announcement.edit({
                embeds: [embed]
            })
            return
        }else{
            const channel = await QuizGame.getChannel(interaction,hostId)
            await DiscordServers.deleteGame(interaction.guildId,game.hostId)
            const embed = new EmbedBuilder()
            .setAuthor({name : "Quiz Game"})
            .setTitle("It looks like someone deleted the game announcement ❌")
            .setFooter({text : "Game deleted"})
            await interaction.channel.send({
                embeds : [embed],
            })
            if(!game.mainChannel){
                if(!channel) return
                setTimeout(async()=>{
                    try{
                        await channel.delete()
                    }
                    catch(err : any){
                        warning(err.message)
                    }

                },10*1000)
            }
            return
        }    
    }
    
}