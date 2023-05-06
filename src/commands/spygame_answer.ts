import { ApplicationCommandDataResolvable, ApplicationCommandOptionType, CacheType, ChatInputCommandInteraction, EmbedBuilder } from "discord.js"
import DiscordServers, { getServerByGuildId } from "../lib/DiscordServers"
import Spygame, { numberEmojis, numberEmojisStyled, numberEmojisUnicode } from "../lib/spygame"
import { TimeTampNow, error } from "../lib/cmd"

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
                nextTurn += `<@${game.players[game.index].id}> it's your turn to ask someone ${TimeTampNow()}`
            }
            await announcement.edit({
                content : announcement.content + "``` " + answer + "```\n" + nextTurn
            })
            setTimeout(async()=>{
                try{
                    const gameCheck = await DiscordServers.getGameByHostId(interaction.guildId,game.hostId)
                    if(!gameCheck.players[game.index].question){
                        const embed = new EmbedBuilder()
                        .setAuthor({name : "Spy Game"})
                        .setTitle(`Timed out ${gameCheck.players[0].username} didn't ask ❌`)
                        await announcement.edit({
                            content : "",
                            embeds : [embed],
                            components : []
                        })
                        await Spygame.delete(interaction.guildId,gameCheck.hostId)
                        return
                    }
                    return
                }
                catch(err : any){
                }
            },1000*90)
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
                        let gameUpdate
                        try{
                            gameUpdate= await Spygame.findGameByUserId(server.games,interaction.user.id)
                        }
                        catch(err : any){
                            return
                        }
                        if(gameUpdate.end) return
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
                            if(e.votedCount){
                                let playerVoted = ""
                                gameUpdate.players.map((ele,index)=>{
                                    if(e.id === ele.vote){
                                        playerVoted += numberEmojisStyled[index]
                                    }
                                })
                                playersStr += numberEmojisStyled[i] + `${e.username}   ${playerVoted}\n`
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
                    
                    try{
                        await announcement.edit({
                            embeds : [embed],
                            components : []
                        })
                    }
                    catch(err : any){
                        const embed = new EmbedBuilder()
                                        .setAuthor({name : "Spy Game"})
                                        .setTitle(`an error occurred while running the game ❌`)
                                        await Spygame.delete(interaction.guildId,game.hostId)
                                        await announcement.edit({
                                            embeds : [embed],
                                            content : "",
                                            components : []
                                        })
                            throw new Error(err.message)
                    }
                    const embed1 = new EmbedBuilder()
                    .setAuthor({name :  "Spy Game"})
                    .addFields({name : "Players",value : playersStr})
                    .setTimestamp(Date.now())
    
                    if(votedPlayer.votedCount === 0){
                        embed1.addFields({name : `Nobody voted 🟡`,value : "--"})
                        embed1.addFields({name : `${gameUpdate.spy.username}`,value : `Is The Spy \n Spy wins 🔴`})
                        embed1.setThumbnail("https://media.istockphoto.com/id/846415384/vector/spy-icon.jpg?s=612x612&w=0&k=20&c=VJI5sbn-wprj6ikxVWxIm3p4fHYAwb2IHmr7lJBXa5g=")
                    }else if(draw.length > 0){
                        embed1.addFields({name : `Draw 🟡`,value : "--"})
                        embed1.addFields({name : `${gameUpdate.spy.username}`,value : `Is The Spy \n Spy wins 🔴`})
                    embed1.setThumbnail("https://media.istockphoto.com/id/846415384/vector/spy-icon.jpg?s=612x612&w=0&k=20&c=VJI5sbn-wprj6ikxVWxIm3p4fHYAwb2IHmr7lJBXa5g=")
                    }else{
                        if(votedPlayer.id === gameUpdate.spy.id){
                            embed1.addFields({name : `${votedPlayer.username}`,value : `Is The Spy ✅ \n Agents win 🔵`})
                        }else{
                            embed1.addFields({name : `${votedPlayer.username}`,value : `Is Not The Spy ❌ \n Spy wins 🔴`})
                            embed1.setThumbnail("https://media.istockphoto.com/id/846415384/vector/spy-icon.jpg?s=612x612&w=0&k=20&c=VJI5sbn-wprj6ikxVWxIm3p4fHYAwb2IHmr7lJBXa5g=")
                        }
                    }
                    setTimeout(async()=>{
                        try{
                            await announcement.edit({
                                embeds : [embed1],
                                components : [],
                                content : ""
                            })
                        }
                        catch(err : any){
                            await DiscordServers.deleteGame(interaction.guildId,game.hostId)
                            const errorEmbed = new EmbedBuilder()
                            .setAuthor({name : "Spy Game"})
                            .setTitle("an error occurred while running the game ❌")
                            .setFooter({text : "Game deleted"})
                            await interaction.channel.send({
                                embeds : [errorEmbed]
                            })
                        }
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
                        await DiscordServers.deleteGame(interaction.guildId,game.hostId)
                            const errorEmbed = new EmbedBuilder()
                            .setAuthor({name : "Spy Game"})
                            .setTitle("an error occurred while running the game ❌")
                            .setFooter({text : "Game deleted"})
                            await interaction.channel.send({
                                embeds : [errorEmbed]
                            })
                    }
                },1000*90)
            }
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