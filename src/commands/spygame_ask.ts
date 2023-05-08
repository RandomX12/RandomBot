import { ApplicationCommandDataResolvable, ApplicationCommandOptionType, CacheType, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import DiscordServers, { getServerByGuildId } from "../lib/DiscordServers";
import { error } from "../lib/cmd";
import { isSpyGame } from "../lib/spygame";
const cmdBody : ApplicationCommandDataResolvable = {
    name : "spygame_ask",
    description : "ask someone about the secret word",
    options : [
        {
            name : "player",
            description : "Choose a player to ask",
            type : ApplicationCommandOptionType.User,
            required : true,
        },
        {
            name : "question",
            description :  "write a question",
            type : ApplicationCommandOptionType.String,
            required : true
        }
    ]
}
module.exports = {
    data : cmdBody,
    async execute(interaction : ChatInputCommandInteraction<CacheType>){
        const server = await getServerByGuildId(interaction.guildId)
        let gameIndex
        let playerIndex
        for(let i = 0;i<server.games.length;i++){
            for(let j = 0 ; j<server.games[i].players.length;j++){
                let ele = server.games[i].players[j]
                if(ele.id === interaction.user.id){
                    gameIndex = i
                    playerIndex = j
                    break
                }
            }
            if(gameIndex && playerIndex) break 
        }
        
        if(gameIndex === undefined || gameIndex === null){
            await interaction.reply({
                content : "Could not find the game :x:",
                ephemeral : true
            })
            return
        }
        const game = server.games[gameIndex]
        if(!isSpyGame(game)) return
        if(!game.started){
            await interaction.reply({
                content : "game not started :x:",
                ephemeral : true
            })
            return
        }
        if(playerIndex !== game.index){
            await interaction.reply({
                content : "It's not your turn to ask :x:",
                ephemeral : true
            })
            return
        }
        if(game.players[playerIndex].question){
            await interaction.reply({
                content : `You have already asked <@${game.players[playerIndex].askId}>`,
                ephemeral  : true
            })
            return
        }
        const player = interaction.options.getUser("player")
        const question = interaction.options.getString("question")
        if(player.id === interaction.user.id){
            await interaction.reply({
                content : "You can't ask yourself :x:",
                ephemeral : true
            })
            return
        }
        let isIn = false
        for(let i = 0;i<game.players.length;i++){
            if(game.players[i].id === player.id){
                isIn = true
                break
            }
        }
        if(!isIn){
            await interaction.reply({
                content : `<@${player.id}> is not in the game. ask someone in the game`,
                ephemeral : true
            })
            return
        }
        game.players[playerIndex].askId = player.id
        game.players[playerIndex].question = question
        server.games[gameIndex] = game
        await server.save()
        const reply = await interaction.reply({
            content : "Your question is sent :white_check_mark:",
            ephemeral : true
        })
        setTimeout(async()=>{
            await reply.delete()
        },3000)
        const announcement = interaction.channel.messages.cache.get(game.announcementId)
        if(announcement){
            let content = announcement.content.split(/\n/)
            content.splice(content.length-1,1)
            await announcement.edit({
                content : content.join("\n") + `<@${interaction.user.id}>'s` +" question : ```" + `${question}` + "```" + `<@${player.id}>'s answer :`
            })
            setTimeout(async()=>{
                try{
                    const gameCheck = await DiscordServers.getGameByHostId(interaction.guildId,game.hostId)
                    if(!isSpyGame(gameCheck)) return
                    gameCheck.players.map(async(e,i)=>{
                        if(e.id === gameCheck.players[playerIndex].askId){
                            if(!e.answer){
                                try{
                                    const embed = new EmbedBuilder()
                                    .setAuthor({name : "Spy Game"})
                                    .setTitle(`Timed out ${e.username} didn't answer ❌`)
                                    .setFooter({text  :"Game Delted"})
                                    await announcement.edit({
                                        content : "",
                                        embeds : [embed],
                                        components : []
                                    })
                                    await DiscordServers.deleteGame(interaction.guildId,gameCheck.hostId)
                                }
                                catch(err : any){
                                    console.log(err.message);
                                }
                                return
                            }
                        }
                    })
                }
                catch(err : any){
                    error(err.message)
                }
            },1000*90)
            return
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