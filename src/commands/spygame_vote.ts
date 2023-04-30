import { ApplicationCommandDataResolvable, ApplicationCommandOptionType, CacheType, ChatInputCommandInteraction, EmbedBuilder } from "discord.js"
import DiscordServers, { getServerByGuildId } from "../lib/DiscordServers"
import Spygame, { numberEmojisStyled } from "../lib/spygame"

let cmdBody : ApplicationCommandDataResolvable = {
    name : "spygame_vote",
    description : "vote",
    options : [
        {
            name : "player",
            description : "the spy",
            type : ApplicationCommandOptionType.User,
            required : true
        }
    ]
}
module.exports = {
    data : cmdBody,
    async execute(interaction : ChatInputCommandInteraction<CacheType>){
        const server = await getServerByGuildId(interaction.guildId)
        const game = await Spygame.findGameByUserId(server.games,interaction.user.id)
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
        const user = interaction.options.getUser("player")
        let isIn = false
        game.players.map((e)=>{
            if(user.id === e.id){
                isIn = true
            }
        })
        if(!isIn){
            await interaction.reply({
                content : `<@${user.id}> is not in the game :x:`,
                ephemeral : true
            })
            return
        }
        let gameIndex = server.games.indexOf(game)
        game.players.map((e,i)=>{
            if(e.id === interaction.user.id){
                game.players[i].vote = user.id
            }
        })
        server.games[gameIndex] = game
        await server.save()
        await interaction.reply({
            content : "Vote has been sent :white_check_mark:",
            ephemeral : true
        })
        let playersStr = ""
        game.players.map((e,i)=>{
            if(e.vote){
                playersStr += numberEmojisStyled[i] + `${e.username}\t voted\n`
            }else{
                playersStr += numberEmojisStyled[i] + `${e.username}\n`
            }
        })
        const announcement = interaction.channel.messages.cache.get(game.announcementId)
        if(announcement){
            const embed = new EmbedBuilder()
                .setAuthor({name :  "Spy Game"})
                .setTitle("Who you think is the imposter ? \n vote for the spy")
                .setFields({name : "Players",value : playersStr})
                .setTimestamp(Date.now())
            let voteCount = 0
            game.players.map(e=>{
                if(e.vote){
                    voteCount++
                }
            })
            if(voteCount === game.maxPlayers){
                embed.setFields({name : `The Spy is <@${game.spy.id}>`,value : ``})
            }
            await announcement.edit({
                embeds :[embed],
                components : []
            })
        }
    }
}