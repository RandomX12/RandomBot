import { ActionRowBuilder, ButtonBuilder, CacheType, ChannelType, ChatInputCommandInteraction, EmbedBuilder, Interaction, ModalBuilder, PermissionResolvable, TextInputBuilder } from "discord.js";
import { getServerByGuildId } from "../lib/DiscordServers";
import { isQuizGame } from "../lib/QuizGame";
import Command, { reply } from "../lib/Commands";
import { error } from "../lib/cmd";
import handleError from "../lib/errors/handler";

const permissions : PermissionResolvable[] = ["Administrator"]

module.exports = new Command({
    data : {
        name : "delete_all",
        description : "Delete all the games"
    },
    async execute(interaction : Interaction<CacheType>){
        if(!interaction.isChatInputCommand()) return
        const server = await getServerByGuildId(interaction.guildId)
        if(!server.games || server.games.length === 0) {
            await reply(interaction,{
                content : "There is no game in this server",
                ephemeral : true
            })
            return
        }
        const modal = new ModalBuilder()
        .setTitle("Do you really want to delete all games ?")
        .setCustomId("deleteall")
        const inp = new TextInputBuilder()
        .setCustomId("yes_deleteall")
        .setLabel("write yes if you want to delete all the games")
        .setStyle(1)
        .setValue("")
        const row : any = new ActionRowBuilder().addComponents(inp)
        modal.addComponents(row)
        await interaction.showModal(modal)
        try{
            const listen = await interaction.awaitModalSubmit({filter :(id)=>id.customId === "deleteall",time : 15*1000})
            const res = listen.fields.getTextInputValue("yes_deleteall")
            if(res === "yes"){
                server.games?.map(async e=>{
                    try{
                        if(!isQuizGame(e)) return
                        if(e.mainChannel) {
                            const channel = interaction.guild.channels.cache.get(e.channelId)
                            if(channel){
                                if(channel.type === ChannelType.GuildText){
                                    const announcement = channel.messages.cache.get(e.announcementId)
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
                                        return
                                    }
                                }
                            }
                            return
                        }
                        const channel =  interaction.guild.channels.cache.get(e.channelId)
                        if(!channel) return
                        await channel.delete()
                    }
                    catch(err : any){
                        return
                    }
                })
                server.games = []
                await server.save()
                await listen.reply({
                    content : "All games are deleted :white_check_mark:",
                })
                return
            }
            await listen.reply({
                content : "The deletion is cancelled",
            })
            return
        }
        catch(err : any){
            error(err.message)
            await reply(interaction,{
                content : handleError(err) +  " :x:",
                ephemeral : true
            })
        }
    },
    permissions : permissions,
    deferReply : false,
    ephemeral : true,
    access : ["ManageChannels"]
})