import { ApplicationCommandDataResolvable, CacheType, ChatInputCommandInteraction } from "discord.js";
import { getServerByGuildId } from "../lib/DiscordServers";
import Spygame from "../lib/spygame";

let cmdBody : ApplicationCommandDataResolvable = {
    name  : "spygame_remove_vote",
    description : "remove vote",
}

module.exports = {
    data : cmdBody,
    async execute(interaction : ChatInputCommandInteraction<CacheType>){
        let server = await getServerByGuildId(interaction.guildId)
        let game = await Spygame.findGameByUserId(server.games,interaction.user.id)
        let index = server.games.indexOf(game)
        game.players.map((e,i)=>{
            if(e.id === interaction.user.id){
                game.players[i].vote = ""
            }
        })
        server.games[index] = game
        await server.save()
        await interaction.reply({
            content : "Vote removed :white_check_mark:",
            ephemeral : true
        })
    }
}