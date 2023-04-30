import { ApplicationCommandDataResolvable, ApplicationCommandOptionType, CacheType, ChatInputCommandInteraction, EmbedBuilder } from "discord.js"
import DiscordServers, { getServerByGuildId } from "../lib/DiscordServers"
import Spygame, { numberEmojis, numberEmojisStyled, numberEmojisUnicode } from "../lib/spygame"
import { error } from "../lib/cmd"

let cmdBody : ApplicationCommandDataResolvable = {
    name : "spygame_answer",
    description : "answer to someone question",
    options : [
        {
            name : "answer",
            description : "write the answer",
            type : ApplicationCommandOptionType.String,
            required : true,
        }
    ]
}
module.exports = {
    data : cmdBody,
    async execute(interaction : ChatInputCommandInteraction<CacheType>){
        const server = await getServerByGuildId(interaction.guildId)
        const game  = await Spygame.findGameByUserId(server.games,interaction.user.id)
        if(game.players[game.index].askId !== interaction.user.id){
            await interaction.reply({
                content : "You are not asked",
                ephemeral : true
            })
            return
        }
        const announcement = interaction.channel.messages.cache.get(game.announcementId)

        const answer = interaction.options.getString("answer")
        game.players[game.index].answer = answer
        game.index++
        let gameIndex
        server.games.map((e,i)=>{
            if(e.hostId === game.hostId){
                gameIndex = i
            }
        })
        if(gameIndex === undefined && gameIndex === null){
            await interaction.reply({
                content : "Game not found :x:",
                ephemeral : true
            })
            return
        }
        server.games[gameIndex] = game
        server.save()
        if(announcement){
            let nextTurn = ""
            if(game.index !== game.maxPlayers){
                nextTurn += `<@${game.players[game.index].id}> it's your turn to ask someone`
            }
            await announcement.edit({
                content : announcement.content + "``` " + answer + "```\n" + nextTurn
            })
            const reply = await interaction.reply({
                content : "Answer sent :white_check_mark:",
                ephemeral : true
            })
            setTimeout(async()=>{
                await reply.delete()
            },3000)
            if(game.index === game.maxPlayers){
                let playersStr = ""
                game.players.map((e,i)=>{
                    playersStr += numberEmojis[i] + " " + e.username + "\n"
                })
                const embed = new EmbedBuilder()
                .setAuthor({name :  "Spy Game"})
                .setTitle("Who you think is the imposter ? \n vote for the spy")
                .setFields({name : "Players",value : playersStr})
                .setTimestamp(Date.now())
                await announcement.edit({
                    embeds : [embed],
                    components : [],
                    
                })
                setTimeout(async()=>{
                    await announcement.edit({
                        content : "still",
                    })
                },1000*30)
            }
        }
    }
}