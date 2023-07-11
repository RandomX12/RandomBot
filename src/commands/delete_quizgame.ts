import { ApplicationCommandDataResolvable, ApplicationCommandOptionType, CacheType, ChatInputCommandInteraction, EmbedBuilder, GuildMember, PermissionResolvable } from "discord.js";
import QuizGame from "../lib/QuizGame";
import DiscordServers from "../lib/DiscordServers";
import { error, warning } from "../lib/cmd";
import Command, { reply } from "../lib/Commands";

const cmdBody : ApplicationCommandDataResolvable = {
    name : "delete_quizgame",
    description : "Delete a Quiz Game",
    options : [
        {
            name : "id",
            description : "Game id",
            type : ApplicationCommandOptionType.String,
            required : true,
            maxLength : 15,
            minLength : 13
        }
    ]
}
const permissions : PermissionResolvable[] = ["Administrator"]
module.exports = new Command({
    data : cmdBody,
    async execute(interaction : ChatInputCommandInteraction<CacheType>){
        try{
            const hostId = interaction.options.getString("id")
            const game = await QuizGame.getGameWithHostId(interaction.guildId,hostId)
            const announcement = await QuizGame.getAnnouncement(interaction,interaction.guildId,game.hostId)
            await DiscordServers.deleteGame(interaction.guildId,game.hostId)
            if(announcement){
                const deleteEmbed = new EmbedBuilder()
                .setTitle(`${interaction.user.tag} deleted the game`)
                .setAuthor({name : "Quiz Game"})
                .setFooter({text : "Game Deleted"})
                await announcement.edit({
                    content : "",
                    components : [],
                    embeds : [deleteEmbed]
                })
                await reply(interaction,{
                    content : "Game deleted :white_check_mark:",
                    ephemeral : true
                })
                if(!game.mainChannel){
                await announcement.channel.edit({name : "Game Deleted"})
                    setTimeout(async()=>{
                        try{
                            await announcement.channel.delete()
                        }
                        catch(err : any){
                            warning(err.message)
                        }
                    },1000*10)
                }
            }
        }
        catch(err : any){
            await reply(interaction,{
                content : "Cannot delete the game :x:",
                ephemeral : true
            })
            error(err.message)
        }
    },
    permissions : permissions,
    ephemeral : true  ,
    access : ["ManageChannels"]
})