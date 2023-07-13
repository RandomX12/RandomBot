import { ActionRowBuilder, ApplicationCommandDataResolvable, ApplicationCommandOptionType, ButtonBuilder, CacheType, ChannelType, ChatInputCommandInteraction, DiscordAPIError, EmbedBuilder, GuildTextBasedChannel, OverwriteResolvable, PermissionOverwrites, TextChannel } from "discord.js"
import QuizGame , { categories, getCategoryByNum,CategoriesNum, maxGames, QzGame, QuizGameInfo } from "../lib/QuizGame"
import DiscordServers, { getServerByGuildId } from "../lib/DiscordServers"
import { TimeTampNow, error, warning } from "../lib/cmd"
import { PermissionsBitField } from "discord.js"
import Command, { reply } from "../lib/Commands"
import { gameStartType } from "../lib/DiscordServersConfig"

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
        },
        {
            name : "time",
            description : "Time for each question",
            type : ApplicationCommandOptionType.Number,
            required : false,
            choices : [{
                name : "5 seconds",
                value : 5*1000
            },
            {
                name : "10 seconds",
                value : 10*1000
            },
            {
                name : "15 seconds",
                value : 15*1000
            },
            {
                name : "30 seconds",
                value : 30*1000
            },
            {
                name : "45 seconds",
                value : 45*1000
            }
        ]
        }
    ]
}
module.exports = new Command({
    data : cmdBody,
    async execute(interaction : ChatInputCommandInteraction<CacheType>){
        const isIn = await DiscordServers.isInGame(interaction.guildId,interaction.user.id)
        if(isIn) {
            await reply(interaction,{
                content : `You are already in game :x:`,
            })
            return
        }
        let mainChannel = true
        const category = interaction.options.getString("category")
        const amount = interaction.options.getNumber("amount")
        const maxPlayers = interaction.options.getNumber("max_players")
        let time = interaction.options.getNumber("time")
        const server = await getServerByGuildId(interaction.guildId)
        if(server.games.length >= maxGames) {
            await reply(interaction,{
                content : `Cannot create the game :x:\nThis server has reached the maximum number of games ${maxGames}.`,
            })
            return
        }
        const hostId = `${Date.now()}`
        let channel : TextChannel | GuildTextBasedChannel
        if(server.config.quiz?.multiple_channels){
            try{
                const category = interaction.guild.channels.cache.get(server.config.quiz?.channels_category)
                let permissions : OverwriteResolvable[] = [{
                    id : interaction.guild.roles.everyone.id,
                    deny : (server.config.quiz.private ? ["SendMessages","ViewChannel"] : ["SendMessages"])
                },
                {
                    id : interaction.client.user.id,
                    allow : ["ManageMessages","SendMessages","ManageChannels"],
                    deny : []
                }]
                if(server.config.quiz.private){
                    server.config.quiz.roles.map((e)=>{
                        permissions.push({
                            id : e,
                            deny : ["SendMessages"]
                        })
                    })
                }
                if(server.config.quiz.private){
                    permissions[0].deny = [PermissionsBitField.Flags.ViewChannel]
                    server.config.quiz.roles?.map((role)=>{
                        if(!role) return
                        permissions.push({
                            id : role,
                            allow : [PermissionsBitField.Flags.ViewChannel],
                            deny : ["SendMessages"]
                        })
                    })
                }
                if(category){
                    channel =  await interaction.guild.channels.create({
                        name : `waiting 🟡`,
                        type : ChannelType.GuildText,
                        //@ts-ignore
                        parent : category,
                        permissionOverwrites : permissions,
                        
                    })
                    mainChannel = false
                }else{
                    
                    const cat = await interaction.guild.channels.create<ChannelType.GuildCategory>({
                        name : server.config.quiz.category_name || "Quiz Game",
                        type : ChannelType.GuildCategory,
                        permissionOverwrites : permissions
                    })
                    server.config.quiz.channels_category = cat.id
                    await server.save()
                    if(cat){
                        channel = await interaction.guild.channels.create({
                           name : "waiting 🟡",
                           parent : cat,
                           type : ChannelType.GuildText,
                           permissionOverwrites : permissions
                        })
                    }else{
                        await reply(interaction,{
                            content : "Cannot create category :x:",
                            ephemeral : true
                        })
                        return
                    }
                    mainChannel = false
                }
                const row : any = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setCustomId(`join_quizgame_${hostId}`)
                    .setLabel("join")
                    .setStyle(3),
                    new ButtonBuilder()
                    .setCustomId(`leave_quizgame_${hostId}`)
                    .setLabel("leave")
                    .setStyle(4),
                )
                
                await channel.send({
                    components : [row]
                })
            }
            catch(err : any){
                if(interaction.replied || interaction.deferred){
                    let errorCode = ""
                    let msg = ""
                    if(err instanceof DiscordAPIError) {errorCode = `DiscordAPIError_${err.code}`;msg = err.message}
                    await reply(interaction,{
                        content  : "An error occurred while creating the channel :x:\n This may be from bad configurations, please check your configuration and make sure everything is OK.\n"+(errorCode ? `error code :${errorCode}\nmessage : ${msg}` : "")
                    })
                }
                warning(err.message)
                return
            }
            
        }else{
            channel = interaction.channel
        }
        if(!time){
            time = 30*1000
        }
        let msg = await channel.send({
            content : "creating Quiz Game..."
        })
        const empty = require("../../config.json").quizGame.emptyWhenCreateNewGame
        let gameBody : QuizGameInfo = {
            hostName : interaction.user.tag,
            hostId : hostId,
            hostUserId : interaction.user.id,
            maxPlayers : maxPlayers,
            channelId : channel.id,
            announcementId : msg.id,
            category : getCategoryByNum(+category as CategoriesNum || category as "any"),
            amount : amount,
            time : time || 30*1000,
            mainChannel : mainChannel,
            gameStart : server.config.quiz.gameStart || 0
        }
        try{
            const game = new QuizGame(interaction.guildId,gameBody,empty || false)
            
            await game.save()
        }
        catch(err : any){
            await msg.delete()
            await reply(interaction,{
                content : "cannot create the game :x:",
                
            })
            msg = null
            await DiscordServers.deleteGame(interaction.guildId,hostId)
            if(server.config.quiz.multiple_channels){
                await channel.delete()
            }
            throw new Error(err?.message)
        }
        const game = new QzGame(interaction.guildId,hostId)
        game.applyData(gameBody)
        game.players = []
        if(!empty){
            game.players.push({
                id : hostId,
                username : interaction.user.username
            })
        }
        const embed = game.generateEmbed()
        const content = `@everyone new Quiz Game created by <@${interaction.user.id}> ${TimeTampNow()}`
        const row : any = game.generateRow(server.config.quiz.gameStart)
        if(game.mainChannel){
            row.addComponents(
                new ButtonBuilder()
                        .setCustomId(`join_quizgame_${hostId}`)
                        .setLabel("Join")
                        .setStyle(3)
            )
        }
        try{
            if(!msg) throw new Error(`Cannot create the game`)
            await msg.edit({
                embeds : [embed],
                components : [row],
                content : content
            })
            const rowInte : any = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setCustomId(`deletequiz_${interaction.user.id}`)
                .setLabel("Delete")
                .setStyle(4)
            )
            await reply(interaction,{
                content : "Game created :white_check_mark:",
                components : [rowInte]
            })
        }
        catch(err : any){
            await DiscordServers.deleteGame(interaction.guildId,hostId)
            if(server.config.quiz.multiple_channels){
                await channel.delete()
            }
            if(interaction.replied || interaction.deferred){
                await reply(interaction,{
                    content : "Cannot create the game :x:"
                })
            }else{
                await reply(interaction,{
                    content : "cannot create the game :x:",
                    
                })
            }
            throw new Error(err?.message)
        }
        setTimeout(async()=>{
            try{
                const game = await QuizGame.getGameWithHostId(interaction.guildId,hostId)
                if(game.started) return
                await DiscordServers.deleteGame(interaction.guildId,hostId)
                const announcement = channel.messages.cache.get(game.announcementId)
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
                if(server.config.quiz.multiple_channels){
                    await channel.delete()
                }
            }
            catch(err : any){
                return
            }
        },1000*60*5)
    },
    ephemeral : true,
    access : ["Administrator"]
})