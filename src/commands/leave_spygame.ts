import { CacheType, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import Spygame from "../lib/spygame";
import DiscordServers, { getServerByGuildId } from "../lib/DiscordServers";

module.exports = {
    data : {
        name : "leave_spygame",
        description : "leave a Spy Game"
    },
    async execute(interaction : ChatInputCommandInteraction<CacheType>){
        const server = await getServerByGuildId(interaction.guildId)
        let stop = false
        for(let i = 0;i<server.games.length;i++){
            if(interaction.user.id === server.games[i].hostId){
                await DiscordServers.deleteGame(interaction.guildId,interaction.user.id)
                const announcement = interaction.channel.messages.cache.get(server.games[i].announcementId)
                const embed = new EmbedBuilder()
                .setTitle("Spy Game deleted :x:")
                .setAuthor({name : "The host left the game"})
                await announcement.edit({
                    embeds : [embed],
                    components : [],
                    content : ""
                })
                await interaction.reply({
                    content : "You left the game",
                    ephemeral : true
                })
                break
            }
            for(let j = 0;j<server.games[i].players.length ; j++){
                if(server.games[i].players[j].id === interaction.user.id){
                    await Spygame.leave(interaction.guildId,server.games[i].hostId,interaction.user.id)
                    stop = true
                    const announcement = interaction.channel.messages.cache.get(server.games[i].announcementId)
                    const embed = new EmbedBuilder()
                    .setTitle("Spy Game")
                    .setAuthor({name : `Waiting for players ${server.games[i].players.length} / ${server.games[i].maxPlayers}`})
                    await announcement.edit({
                        embeds : [embed]
                    })
                    await interaction.reply({
                        content : "You left the game",
                        ephemeral : true
                    })
                    break
                }
            }
            if(stop) break
        }
    }
}