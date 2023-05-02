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
                .setTimestamp(Date.now())
            let voteCount = 0
            game.players.map(e=>{
                if(e.vote){
                    voteCount++
                }
            })
            if(voteCount === game.maxPlayers){
                game.players.map((e)=>{
                    if(e.vote){
                        game.players.map((ele,i)=>{
                            if(e.vote === ele.id){
                                game.players[i].votedCount++
                            }
                        })
                    }
                })
                let votedPlayer =  game.players.reduce((pe,ce)=>{
                    return ce.votedCount > pe.votedCount ? ce : pe
                })
                let playersStr = ""
                game.players.map((e,i)=>{
                    if(e.votedCount){
                        let playerVoted = ""
                        game.players.map((ele,index)=>{
                            if(e.id === ele.vote){
                                playerVoted += numberEmojisStyled[index]
                            }
                        })
                        playersStr += numberEmojisStyled[i] + `${e.username}   ${playerVoted}\n`
                    }else{
                        playersStr += numberEmojisStyled[i] + `${e.username}\n`
                }
            })
                embed.addFields({name : "Players",value : playersStr})
                let draw = []
                if(votedPlayer.votedCount === 0){
                    embed.addFields({name : `Nobody voted 🟡`,value : "--"})
            }else{
                game.players.map((e)=>{
                    if(votedPlayer.votedCount === e.votedCount && e.id !== votedPlayer.id){
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
                game.end = true
                server.games[server.games.indexOf(game)] = game
                await server.save()
                const embed1 = new EmbedBuilder()
                .setAuthor({name :  "Spy Game"})
                .addFields({name : "Players",value : playersStr})
                .setTimestamp(Date.now())
                if(votedPlayer.votedCount === 0){
                    embed1.addFields({name : `Nobody voted 🟡`,value : "--"})
                    embed1.addFields({name : `${game.spy.username}`,value : `Is The Spy \n Spy wins 🔴`})
                    embed1.setThumbnail("https://media.istockphoto.com/id/846415384/vector/spy-icon.jpg?s=612x612&w=0&k=20&c=VJI5sbn-wprj6ikxVWxIm3p4fHYAwb2IHmr7lJBXa5g=")
                }else if(draw.length > 0){
                    embed1.addFields({name : `Draw 🟡`,value : "--"})
                    embed1.addFields({name : `${game.spy.username}`,value : `Is The Spy \n Spy wins 🔴`})
                    embed1.setThumbnail("https://media.istockphoto.com/id/846415384/vector/spy-icon.jpg?s=612x612&w=0&k=20&c=VJI5sbn-wprj6ikxVWxIm3p4fHYAwb2IHmr7lJBXa5g=")
                }else{
                    if(votedPlayer.id === game.spy.id){
                        embed1.addFields({name : `${votedPlayer.username}`,value : `Is The Spy ✅ \n Agents win 🔵`})
                    }else{
                        embed1.addFields({name : `${votedPlayer.username}`,value : `Is Not The Spy ❌ \n Spy wins 🔴`})
                    embed1.setThumbnail("https://media.istockphoto.com/id/846415384/vector/spy-icon.jpg?s=612x612&w=0&k=20&c=VJI5sbn-wprj6ikxVWxIm3p4fHYAwb2IHmr7lJBXa5g=")
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
                await Spygame.delete(interaction.guildId,game.hostId)
            },1000*10)
        return    
        }
        embed.addFields({name : "Players",value : playersStr})
            await announcement.edit({
                embeds :[embed],
                components : []
            })
        }
    }
}