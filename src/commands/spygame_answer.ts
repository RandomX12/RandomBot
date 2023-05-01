import { ApplicationCommandDataResolvable, ApplicationCommandOptionType, CacheType, ChatInputCommandInteraction, EmbedBuilder } from "discord.js"
import { getServerByGuildId } from "../lib/DiscordServers"
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
                .setTitle("Who you think is the spy ? \n vote for the spy with /spygame_vote")
                .setFields({name : "Players",value : playersStr})
                .setTimestamp(Date.now())
                await announcement.edit({
                    embeds : [embed],
                    components : [],
                    
                })
                setTimeout(async()=>{
                    try{
                        const server = await getServerByGuildId(interaction.guildId)
                        const gameUpdate= await Spygame.findGameByUserId(server.games,interaction.user.id)
                        if(gameUpdate.end)return
                        gameUpdate.players.map((e)=>{
                            if(e.vote){
                                gameUpdate.players.map((ele,i)=>{
                                    if(e.vote === ele.id){
                                        gameUpdate.players[i].votedCount++
                                    }
                                })
                            }
                        })
                        let votedPlayer =  gameUpdate.players.reduce((pe,ce)=>{
                            return ce.votedCount > pe.votedCount ? ce : pe
                        })
                        let playersStr = ""
                        gameUpdate.players.map((e,i)=>{
                            if(e.vote){
                                let playerVoted = Spygame.getUserInSpyGame(gameUpdate,e.vote)
                                playersStr += numberEmojisStyled[i] + `${e.username}    voted   ${playerVoted?.username || ""}\n`
                            }else{
                                playersStr += numberEmojisStyled[i] + `${e.username}\n`
                        }
            })
                    let draw = []
                        const embed = new EmbedBuilder()
                    .setAuthor({name :  "Spy Game"})
                    .addFields({name : "Players",value : playersStr})
                    .setTimestamp(Date.now())
                    if(votedPlayer.votedCount === 0){
                            embed.addFields({name : `Nobody voted 🟡`,value : "--"})
                    }else{
                        gameUpdate.players.map((e)=>{
                            if(votedPlayer.votedCount === e.votedCount){
                                draw.push(e)
                            }
                        })
                        if(draw.length > 0){
                        embed.addFields({name : `Draw 🟡`,value : "--"})
                        }else{
                            embed.addFields({name : `${votedPlayer.username}`,value : "Is"})
                        }
                    }
                    
                    await announcement.edit({
                        embeds : [embed],
                        components : []
                    })
                    const embed1 = new EmbedBuilder()
                    .setAuthor({name :  "Spy Game"})
                    .addFields({name : "Players",value : playersStr})
                    .setTimestamp(Date.now())
    
                    if(votedPlayer.votedCount === 0){
                        embed1.addFields({name : `Nobody voted 🟡`,value : "--"})
                        embed1.addFields({name : `${gameUpdate.spy.username}`,value : `Is The Spy \n Spy wins 🔴`})
                    }else if(draw.length > 0){
                        embed1.addFields({name : `Draw 🟡`,value : "--"})
                        embed1.addFields({name : `${gameUpdate.spy.username}`,value : `Is The Spy \n Spy wins 🔴`})
                    }else{
                        if(votedPlayer.id === gameUpdate.spy.id){
                            embed1.addFields({name : `${votedPlayer.username}`,value : `Is The Spy ✅ \n Agents win 🔵`})
                        }else{
                            embed1.addFields({name : `${votedPlayer.username}`,value : `Is Not The Spy ❌ \n Spy wins 🔴`})
                        }
                    }
                    setTimeout(async()=>{
                        await announcement.edit({
                            embeds : [embed1],
                            components : [],
                            content : ""
                        })
                    },5000)
                    setTimeout(async()=>{
                        try{
                            await Spygame.delete(interaction.guildId,game.hostId)
                        }
                        catch(err : any){
                            error(err.message)
                        }
                    },1000*10)
                    }
                    catch(err : any){
                        error(err.message)
                    }
                },1000*90)
            }
        }
    }
}