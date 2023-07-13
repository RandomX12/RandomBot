import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, CacheType,  EmbedBuilder } from "discord.js";
import DiscordServers from "../lib/DiscordServers";
import QuizGame, { QzGame } from "../lib/QuizGame";
import { error, warning } from "../lib/cmd";
import { gameStartType } from "../lib/DiscordServersConfig";
import { ButtonCommand } from "../lib/Commands";

module.exports = new ButtonCommand({
    data : {
        name : "join",
        description : "Join a Quiz Game"
    },
    async execute(interaction : ButtonInteraction<CacheType>){
        if(!interaction.customId || !interaction.customId.startsWith("join_quizgame")){
            await interaction.reply({
                content : "Invalid request :x:",
                ephemeral : true
            })
            return
        }
        const isIn = await DiscordServers.isInGame(interaction.guildId,interaction.user.id)
        
        if(isIn){
            await interaction.reply({
                content : "You are already in a game :x:",
                ephemeral : true
            })
            return
        }
        const hostId = interaction.customId.split("_")[2]
        const isFull = await DiscordServers.isGameFull(interaction.guildId,hostId)

        if(isFull){
            await interaction.reply({
                content : "This Game is full :x:",
                ephemeral : true
            })
            return
        }
        const game = await QzGame.getGame(interaction.guildId,hostId)
        game.players.push({
            id : interaction.user.id,
            username : interaction.user.username
        })
        await game.update()
        const embed = game.generateEmbed()
        const announcement = interaction.channel.messages.cache.get(game.announcementId)
        if(announcement){
            await announcement.edit({
                embeds : [embed]
            })
            const button = new ButtonBuilder()
            .setLabel("Leave")
            .setCustomId("leave_quizgame_"+game.hostId)
            .setStyle(4)
            const row : any = new ActionRowBuilder()
            .setComponents(button)
            await interaction.reply({
                content : "You joined the game :white_check_mark:",
                components : [row],
                ephemeral : true
            })
        }else{
            const channel = await QuizGame.getChannel(interaction,hostId)
            await DiscordServers.deleteGame(interaction.guildId,hostId)
            const embed = new EmbedBuilder()
            .setAuthor({name : "Quiz Game"})
            .setTitle("It looks like someone deleted the game announcement ❌")
            .setFooter({text : "Game deleted"})
            await interaction.channel.send({
                embeds : [embed],
            })
            if(!game.mainChannel || channel){
                setTimeout(async()=>{
                    try{
                        await channel?.delete()
                    }catch(err){
                        warning(err.message)
                    }
                },10*1000)
            }
            return
        }
        // Game start
        let allReady = true
        if(game.gameStart === gameStartType.READY || game.gameStart === gameStartType.FULL_READY){
            for(let i = 0;i<game.players.length;i++){
                if(!game.players[i].ready){
                    allReady = false
                    break
                }
            }
        }
        if(
        (
            game.players.length === game.maxPlayers && 
            game.gameStart === gameStartType.AUTO
        
        ) 
        || 
        (
            game.gameStart === gameStartType.READY &&
            allReady
        )
        ||
        (
            game.gameStart === gameStartType.FULL_READY &&
            game.players.length === game.maxPlayers &&
            allReady
        )
        ){
            try{
                 await game.executeGame(interaction,announcement)
        }
            catch(err : any){
                try{
                    const announcement = await QuizGame.getAnnouncement(interaction,interaction.guildId,hostId)
                    await DiscordServers.deleteGame(interaction.guildId,hostId)
                    error(err)
                    await announcement.edit({
                        content : "an error occured while starting the game :x:\nThe game is deleted",
                    })
                    if(!game.mainChannel){
                        if(announcement){
                            setTimeout(async()=>{
                                try{
                                await announcement.channel.delete()
                                }
                                catch(err : any){
                                    warning(`An error occured while deleting the game channel`)
                                }
                            },1000*10)
                        }
                    }
                }
                catch(err : any){
                    warning(err?.message)
                }
            }
        }
    },
    ephemeral : true
})