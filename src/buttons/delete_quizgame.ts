import { ButtonInteraction, CacheType, CategoryChannel, ChannelType, GuildTextBasedChannel } from "discord.js";
import QuizGame from "../lib/QuizGame";
import DiscordServers, { getServerByGuildId } from "../lib/DiscordServers";


module.exports = {
    data : {
        name : "delete_quiz_[:id]",
        description : "Delete a quiz game"
    },

    async execute(interaction : ButtonInteraction<CacheType>){
        if(!interaction?.customId?.startsWith("delete_quiz")){
            await interaction.reply({
                content : "Invalid request :x:",
                ephemeral : true
            })
            return
        }
        const hostUserId = interaction.customId.split("_")[2]
        try{
            const msg = await interaction.deferReply({ephemeral : true})
            const game = await QuizGame.getQuizGamewithHostUserId(interaction.guildId,hostUserId)
            if(game.started) throw new Error(`Game started`)
            await DiscordServers.deleteGame(interaction.guildId,game.hostId)
            const channel : any = await interaction.guild.channels.cache.get(game.channelId)?.fetch()
            const announcement : GuildTextBasedChannel = channel.messages.cache.get(game.announcementId)
            if(game.mainChannel){
                await msg.delete()
                await announcement.delete()
                return 
            }
            if(announcement){
                await announcement.delete()
            }
            await channel.delete()
            await msg.delete()
            return
        }
        catch(err : any){
            if(interaction.deferred || interaction.replied){
                await interaction.editReply({
                    content : "You can't delete this game 🙄",
                }) 
            }else{
                await interaction.reply({
                    content : "You can't delete this game 🙄",
                    ephemeral : true
                })
            }
        }
    }
}