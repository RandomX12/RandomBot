import { ActionRowBuilder, ButtonBuilder, CacheType, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import Spygame from "../lib/spygame";
import DiscordServers from "../lib/DiscordServers";

module.exports = {
    data : {
        name : "leave_spygame_[:id]",
        descreption : "Leave a Spy game"
    },
    async execute(interaction : ChatInputCommandInteraction<CacheType> & {customId : string}){
        await Spygame.leave(interaction.guildId,interaction.customId.split("_")[2],interaction.user.id)
        const isHost = await Spygame.isHost(interaction.guildId,interaction.user.id)
        if(isHost){
            const game = await DiscordServers.getGameByHostId(interaction.guildId,interaction.customId.split("_")[2])
            const announcement =  interaction.channel.messages.cache.get(game.announcementId)
            if(announcement){
                await DiscordServers.deleteGame(interaction.guildId,interaction.customId.split("_")[2])
                const embed = new EmbedBuilder()
                .setTitle("Spy Game deleted :x:")
                .setAuthor({name : "The host left the game"})
                await announcement.edit({
                    content : '',
                    components : [],
                    embeds : [embed]
                })
                await interaction.reply({
                    content : "You left the game",
                    ephemeral : true
                })
            }
        }else{
            const game = await DiscordServers.getGameByHostId(interaction.guildId,interaction.customId.split("_")[2])
            const announcement =  interaction.channel.messages.cache.get(game.announcementId)
            if(announcement){
                if(game.started || game.players.length === game.maxPlayers){
                    const embed = new EmbedBuilder()
                .setTitle("Spy Game deleted :x:")
                .setAuthor({name : `${interaction.user.username} left the game`})

                await DiscordServers.deleteGame(interaction.guildId,interaction.customId.split("_")[2])
                    await announcement.edit({
                        embeds : [embed],
                        content : "",
                        components : []
                    })
                    return
                }
                const embed = new EmbedBuilder()
                .setTitle("Spy Game")
                .setThumbnail("https://media.istockphoto.com/id/846415384/vector/spy-icon.jpg?s=612x612&w=0&k=20&c=VJI5sbn-wprj6ikxVWxIm3p4fHYAwb2IHmr7lJBXa5g=")
                .setAuthor({name : `Waiting for players ${game.players.length} / ${game.maxPlayers}`})
                const button = new ButtonBuilder()
                .setCustomId(`join_spygame_${interaction.user.id}`)
                .setStyle(3)
                .setLabel("join")
                const row : any = new ActionRowBuilder()
                .addComponents(button)
                await announcement.edit({
                        embeds : [embed],
                        components : [row]
                    })
                    await interaction.reply({
                        content : "You left the game",
                        ephemeral : true
                    })
            }else{
                await DiscordServers.deleteGame(interaction.guildId,game.hostId)
                const errorEmbed = new EmbedBuilder()
            .setAuthor({name : "Spy Game"})
            .setTitle("Looks like someone deleted the game announcement ❌")
            .setFooter({text : "Game deleted"})
            await interaction.channel.send({
                embeds : [errorEmbed],
            })
            }
        }
    }
}