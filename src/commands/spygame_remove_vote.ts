import { ApplicationCommandDataResolvable, CacheType, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { getServerByGuildId } from "../lib/DiscordServers";
import Spygame, { numberEmojisStyled } from "../lib/spygame";

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
        if(!game.started){
            await interaction.reply({
                content  : `Game not started :x:`,
                ephemeral : true
            }) 
            return
        }
        if(game.maxPlayers !== game.index){
            await interaction.reply({
                content : `Game still running :x:`,
                ephemeral : true
            })
            return
        }
        game.players.map((e,i)=>{
            if(e.id === interaction.user.id){
                game.players[i].vote = ""
            }
        })
        server.games[index] = game
        await server.save()
        let playersStr = ""
        game.players.map((e,i)=>{
            if(e.vote){
                playersStr += numberEmojisStyled[i] + `${e.username}\t voted\n`
            }else{
                playersStr += numberEmojisStyled[i] + `${e.username}\n`
            }
        })
        const embed = new EmbedBuilder()
                .setAuthor({name :  "Spy Game"})
                .setTitle("Who you think is the imposter ? \n vote for the spy")
                .setFields({name : "Players",value : playersStr})
                .setTimestamp(Date.now())
        const announcement = interaction.channel.messages.cache.get(game.announcementId)
        if(announcement){
            await announcement.edit({
                embeds : [embed],
                components : [],
            })
            await interaction.reply({
                content : "Vote removed :white_check_mark:",
                ephemeral : true,
            })
        }
    }
}