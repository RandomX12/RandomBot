import { ApplicationCommandDataResolvable, ApplicationCommandOptionType, CacheType, ChatInputCommandInteraction, EmbedBuilder, GuildMember, PermissionResolvable } from "discord.js";
import QuizGame from "../lib/QuizGame";
import DiscordServers from "../lib/DiscordServers";

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
module.exports = {
    data : cmdBody,
    async execute(interaction : ChatInputCommandInteraction<CacheType>){
        const member = interaction.member as GuildMember
        if(!member.permissions.has("Administrator")){
            await interaction.reply({
                content : "You don't have the permission to delete the game :x:",
                ephemeral : true
            })
            return
        }
        try{
            const hostId = interaction.options.getString("id")
            const game = await QuizGame.getGameWithHostId(interaction.guildId,hostId)
            await DiscordServers.deleteGame(interaction.guildId,game.hostId)
            const announcement = interaction.channel.messages.cache.get(game.announcementId)
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
                await interaction.reply({
                    content : "Game deleted :white_check_mark:",
                    ephemeral : true
                })
            }
        }
        catch(err : any){
            await interaction.reply({
                content : "Cannot delete the game :x:",
                ephemeral : true
            })
        }
    },
    permissions : permissions
}