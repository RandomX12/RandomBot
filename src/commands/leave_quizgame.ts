import { CacheType, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import DiscordServers from "../lib/DiscordServers";
import  {  QzGame } from "../lib/QuizGame";
import { warning } from "../lib/cmd";
import Command, { reply } from "../lib/Commands";


module.exports = new Command({
    data : {
        name : "leave_quizgame",
        description : "Leave Quiz Game"
    },
    async execute(interaction : ChatInputCommandInteraction<CacheType>){
        const isIn = await DiscordServers.isInGame(interaction.guildId,interaction.user.id)
        if(!isIn) {
            await reply(interaction,{
                content : "You are not in a game :x:",
                ephemeral : true
            })
            return
        }
        // still under dev :)
        const game = await QzGame.getGameWithUserId(interaction.guildId,interaction.user.id)
        game.removePlayer(interaction.user.id)
        await game.update()
        await reply(interaction,{
            content : "You left the game :white_check_mark:",
            ephemeral : true
        })
        const announcement = await QzGame.getAnnouncement(interaction,game.hostId)
        if(game.started) {
            if(game.players.length === 0){
                if(announcement){
                    const deleteEmbed = new EmbedBuilder()
                    .setTitle("No one else in the game ❌")
                    .setFooter({text : "Game Deleted"})
                    .setAuthor({name : "Quiz Game"})
                    DiscordServers.deleteGame(game.hostId)
                    const msg = await announcement.edit({
                        embeds : [deleteEmbed],
                        components : [],
                        content : ""
                    })
                    if(!game.mainChannel){
                        await announcement.channel.edit({name : "Game end 🔴"})
                        setTimeout(async()=>{
                            try{
                                await announcement.channel.delete()
                            }
                            catch(err : any){
                                warning(err.message)
                            }
                        },1000*10)
                        return
                    }
                    setTimeout(async()=>{
                        try{
                            await msg.delete()
                        }catch(err){
                            warning(err.message)
                        }
                    },5000)
                }else{
                    if(!game.mainChannel){
                        const channel = await QzGame.getChannel(interaction,game.hostId)
                        if(channel){
                            await channel.delete()
                        }
                    }
                    DiscordServers.deleteGame(game.hostId)
                }
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
            const channel = await QzGame.getChannel(interaction,game.hostId)
            DiscordServers.deleteGame(game.hostId)
            
            const embed = new EmbedBuilder()
            .setAuthor({name : "Quiz Game"})
            .setTitle("It looks like someone deleted the game announcement ❌")
            .setFooter({text : "Game deleted"})
            const msg = await interaction.channel?.send({
                embeds : [embed],
            })
            setTimeout(async()=>{
                try{
                    if(!game.mainChannel || channel){
                        await channel?.delete()
                        return
                    }
                    await msg.delete()
                }catch(err){
                    warning(err.message)
                }
            },5000)
            return
        }
    },
    ephemeral : true
})
