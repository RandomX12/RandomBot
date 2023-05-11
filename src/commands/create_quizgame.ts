import { ActionRowBuilder, ApplicationCommandDataResolvable, ApplicationCommandOptionType, ButtonBuilder, CacheType, ChatInputCommandInteraction, EmbedBuilder } from "discord.js"
import QuizGame , { categories, getCategoryByNum,CategoriesNum } from "../lib/QuizGame"
import DiscordServers, { getServerByGuildId } from "../lib/DiscordServers"
import { TimeTampNow, error } from "../lib/cmd"

let choices = Object.keys(categories).map(e=>{
    return {
        name : e,
        value : `${categories[e]}`
    }
})

let cmdBody : ApplicationCommandDataResolvable = {
    name : "create_quizgame",
    description : "create a quiz game",
    options : [
        {
            name : "category",
            description : "choose a category",
            type : ApplicationCommandOptionType.String,
            required : true,
            choices  : choices
        },
        {
            name : "amount",
            description : "amount of questions",
            type : ApplicationCommandOptionType.Number,
            minValue : 3,
            maxValue : 10,
            required : true
        },
        {
            name : "max_players",
            description : "max players",
            type : ApplicationCommandOptionType.Number,
            maxValue : 20,
            minValue : 2,
            required : true
        }
    ]
}
module.exports = {
    data : cmdBody,
    async execute(interaction : ChatInputCommandInteraction<CacheType>){
        await interaction.deferReply({
            ephemeral : true
        })
        const isIn = await DiscordServers.isInGame(interaction.guildId,interaction.user.id)
        if(isIn) {
            await interaction.editReply({
                content : `You are already in game :x:`,
            })
            return
        }
        
        
        const category = interaction.options.getString("category")
        const amount = interaction.options.getNumber("amount")
        const maxPlayers = interaction.options.getNumber("max_players")
        let msg = await interaction.channel.send({
            content : "creating Quiz Game..."
        })
        try{
            const game = new QuizGame(interaction.guildId,{
                hostName : interaction.user.username,
                hostId : interaction.user.id,
                maxPlayers : maxPlayers,
                channelId : interaction.channelId,
                announcementId : msg.id,
                category : getCategoryByNum(+category as CategoriesNum || category as "any"),
                amount : amount
            })
            await game.save()
        }
        catch(err : any){
            await msg.delete()
            await interaction.editReply({
                content : "cannot create the game :x:",
                
            })
            msg = null
            await DiscordServers.deleteGame(interaction.guildId,interaction.user.id)
            throw new Error(err?.message)
        }
        const embed = new EmbedBuilder()
        .setTitle(`Quiz Game`)
        .setThumbnail("https://hips.hearstapps.com/hmg-prod/images/quiz-questions-answers-1669651278.jpg")
        .addFields({name : `Info`,value : `Category : **${getCategoryByNum(+category as CategoriesNum || category as "any")}** \nAmount : **${amount}** \nMax players : **${maxPlayers}**`})
        .setAuthor({name : `Waiting for the players... 1 / ${maxPlayers}`})
        .setTimestamp(Date.now())
        const button = new ButtonBuilder()
        .setLabel("join")
        .setStyle(3)
        .setCustomId(`join_quizgame_${interaction.user.id}`)
        const row : any = new ActionRowBuilder()
        .addComponents(button)
        try{
            if(!msg) throw new Error(`Cannot create the game`)
            await msg.edit({
                embeds : [embed],
                components : [row],
                content : `@everyone new Quiz Game created by <@${interaction.user.id}> ${TimeTampNow()}`
            })
            await interaction.editReply({
                content : "Game created :white_check_mark:",
                
            })
        }
        catch(err : any){
            await DiscordServers.deleteGame(interaction.guildId,interaction.user.id)
            if(interaction.replied || interaction.deferred){
                await interaction.editReply({
                    content : "Cannot create the game :x:"
                })
            }else{
                await interaction.editReply({
                    content : "cannot create the game :x:",
                    
                })
            }
            throw new Error(err?.message)
        }
        setTimeout(async()=>{
            try{
                const game = await QuizGame.getGameWithHostId(interaction.guildId,interaction.user.id)
                if(game.started) return
                await DiscordServers.deleteGame(interaction.guildId,interaction.user.id)
                const announcement = interaction.channel.messages.cache.get(game.announcementId)
                if(announcement){
                    const embed = new EmbedBuilder()
                    .setAuthor({name : "Quiz Game"})
                    .setTitle(`Time out : game deleted`)
                    await announcement.edit({
                        embeds : [embed],
                        components : [],
                        content : ""
                    })
                }
            }
            catch(err : any){
                error(err.message)
            }
        },1000*60*5)
    }
}