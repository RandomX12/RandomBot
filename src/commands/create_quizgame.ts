import { ActionRowBuilder, ApplicationCommandDataResolvable, ApplicationCommandOptionType, ButtonBuilder, CacheType, ChannelType, ChatInputCommandInteraction, EmbedBuilder, GuildTextBasedChannel, OverwriteResolvable, PermissionOverwrites, TextChannel } from "discord.js"
import QuizGame , { categories, getCategoryByNum,CategoriesNum } from "../lib/QuizGame"
import DiscordServers, { getServerByGuildId } from "../lib/DiscordServers"
import { TimeTampNow, error, warning } from "../lib/cmd"
import { PermissionsBitField } from "discord.js"

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
        let mainChannel = true
        const category = interaction.options.getString("category")
        const amount = interaction.options.getNumber("amount")
        const maxPlayers = interaction.options.getNumber("max_players")
        let time = interaction.options.getNumber("time")
        const server = await getServerByGuildId(interaction.guildId)
        const hostId = `${Date.now()}`
        let channel : TextChannel | GuildTextBasedChannel
        if(server.config.quiz?.multiple_channels){
            try{
                const category = interaction.guild.channels.cache.get(server.config.quiz?.channels_category)
                let permissions : OverwriteResolvable[] = [{
                    id : interaction.guild.roles.everyone.id,
                    deny : ["SendMessages"]
                }]
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
                        permissionOverwrites : permissions
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
                        await interaction.reply({
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
                    await interaction.editReply({
                        content  : "An error occurred while creating the channel :x:\n This may be from bad configurations, please check your configuration and make sure everything is OK."
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
        
        try{
            const game = new QuizGame(interaction.guildId,{
                hostName : interaction.user.tag,
                hostId : hostId,
                hostUserId : interaction.user.id,
                maxPlayers : maxPlayers,
                channelId : channel.id,
                announcementId : msg.id,
                category : getCategoryByNum(+category as CategoriesNum || category as "any"),
                amount : amount,
                time : time || 30*1000,
                mainChannel : mainChannel
            })
            await game.save()
        }
        catch(err : any){
            await msg.delete()
            await interaction.editReply({
                content : "cannot create the game :x:",
                
            })
            msg = null
            await DiscordServers.deleteGame(interaction.guildId,hostId)
            if(server.config.quiz.multiple_channels){
                await channel.delete()
            }
            throw new Error(err?.message)
        }
        const embed = new EmbedBuilder()
        .setTitle(`Quiz Game`)
        .setThumbnail("https://hips.hearstapps.com/hmg-prod/images/quiz-questions-answers-1669651278.jpg")
        .addFields({name : `Info`,value : `Category : **${getCategoryByNum(+category as CategoriesNum || category as "any")}** \nAmount : **${amount}** \ntime : **${time / 1000 + " seconds" || "30 seconds"}** \nMax players : **${maxPlayers}**`})
        .setAuthor({name : `Waiting for the players... 1 / ${maxPlayers}`})
        .setTimestamp(Date.now())
        .setFooter({text : `id : ${hostId}`})
        const button = new ButtonBuilder()
        .setLabel("join")
        .setStyle(3)
        .setCustomId(`join_quizgame_${hostId}`)
        const row : any = new ActionRowBuilder()
        .addComponents(button)
        try{
            if(!msg) throw new Error(`Cannot create the game`)
            await msg.edit({
                embeds : [embed],
                components : [row],
                content : `@everyone new Quiz Game created by <@${interaction.user.id}> ${TimeTampNow()}`
            })
            const rowInte : any = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setCustomId(`delete_quiz_${interaction.user.id}`)
                .setLabel("Delete")
                .setStyle(4)
            )
            await interaction.editReply({
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
    }
}