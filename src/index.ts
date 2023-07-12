import  {ActionRowBuilder, ActivityType, AuditLogEvent, ButtonBuilder, ChannelType, Collection,DiscordAPIError,EmbedBuilder,GatewayIntentBits } from "discord.js"
import path from "path"
import fs from "fs"
import { TimeTampNow, animateRotatingSlash, error, log, warning } from "./lib/cmd"
import { connectDB } from "./lib/connectDB"
import DiscordServers, { fetchServer, getServerByGuildId } from "./lib/DiscordServers"
import discordServers, { Member } from "./model/discordServers"
import Command, { reply, verify } from "./lib/Commands"
import QuizGame, { QuizCategory, categories ,amount as amountQs, maxPlayers, getCategoryByNum, CategoriesNum, maxGames, QuizGameInfo, QzGame, isQuizGame} from "./lib/QuizGame"
import { Bot } from "./lib/Bot"
import  listenToCmdRunTime, { addRuntimeCMD } from "./lib/consoleCmd"
import { QuizGame as QuizGameT } from "./model/QuizGame"

// 
listenToCmdRunTime()
require("dotenv").config()
declare module "discord.js" {
    export interface Client {
        commands: Collection<unknown, Command>,
        buttons : Collection<unknown, any>
    }
    }

const {client} = Bot
export {client}
// command handling



client.buttons = new Collection()
const buttonsPath = path.join(__dirname,"./buttons")
const buttonFolder = fs.readdirSync(buttonsPath).filter((file)=> file.endsWith(".ts") || file.endsWith(".js"))
for(let file of buttonFolder){
    const filePath = path.join(buttonsPath,file)
    const button = require(filePath)
    if("data" in button || "execute" in button){
        client.buttons.set(button.data.name,button)
    }else{
        console.log("\x1b[33m","[warning] : ","\x1b[37m",`The command at ${filePath} has a missing property.`)
    }
}
// execute commands
let msgs = new Map()
client.on("interactionCreate",async(interaction)=>{
    // if(!interaction.isChatInputCommand()) return
    if(!interaction.guild) return
    const user =  msgs.get(interaction.user.id)
    
    if(user) {
        //@ts-ignore
        interaction.user.count = user.count + 1
        msgs.set(interaction.user.id,interaction.user)
        if(user.count > 7) {
            log({text : `${interaction.user.tag} is blocked cause of spam`,timeColor : "Yellow",textColor : "Yellow"})
            return
        }
    }

    //@ts-ignore
    if(!interaction.user.count){
        //@ts-ignore
        interaction.user.count = 1
    }
    msgs.set(interaction.user.id,interaction.user)
    setTimeout(()=>{
        //@ts-ignore
        interaction.user.count = undefined
        msgs.delete(interaction.user.id)
    },1000*30)
    if(interaction.isButton()){
        let command = interaction.client.buttons.get(interaction.customId)
        if(interaction.customId.startsWith("join_spygame")){
            command = interaction.client.buttons.get("join_spygame_[:id]")
        }else if(interaction.customId.startsWith("leave_spygame")){
            command = interaction.client.buttons.get("leave_spygame_[:id]")
        }else if(interaction.customId.startsWith("join_quizgame")){
            command = interaction.client.buttons.get("join_quizgame_[:id]")
        }else if(interaction.customId.startsWith("leave_quizgame")){
            command = interaction.client.buttons.get("leave_quizgame_[:id]")
        }else if(interaction.customId.startsWith("answer")){
            command = interaction.client.buttons.get("answer_[:ans]_[:id]")
        }else if(interaction.customId.startsWith("delete_quiz")){
            command = interaction.client.buttons.get("delete_quiz_[:id]")
        }else if(interaction.customId.startsWith("quizgame_ready")){
            command = interaction.client.buttons.get(`quizgame_ready_[:id]`)
        }else if(interaction.customId.startsWith("quizgame_notready")){
            command = interaction.client.buttons.get(`quizgame_notready_[:id]`)
        }else if(interaction.customId.startsWith("remove_ans")){
            command = interaction.client.buttons.get(`remove_ans_[:id]`)
        }
        if(!command){
            console.log(`\x1b[33m`,`[warning]`,`Command Button ${interaction.customId} is not found`);
            return
        }
        try{
            const before = Date.now()
            log({text : `Executing ${interaction.customId} button command by ${interaction.user.tag}`})
            await command.execute(interaction)
            const after = Date.now()
            const ping = after - before
            log({text : `Button command executed successfully ${interaction.customId} by ${interaction.user.tag}. ${ping}ms`,textColor : "Green",timeColor : "Green"})
        }
        catch(err : any){
            error(err.message)
        }
    }else if(interaction.isCommand() && interaction.isChatInputCommand()){
        let check = Bot.checkRequest(interaction)
        if(!check) return
        const command = interaction.client.commands.get(interaction.commandName)
        if(!command){
            console.log(`\x1b[33m`,`[warning]`,`Command /${interaction.commandName} is not found`);
            return
        }
        try{
            const commandConfig = require("../config.json").commands[interaction.commandName]
            if(commandConfig){
                const before = Date.now()
                log({text : `Executing /${interaction.commandName} by ${interaction.user.tag}`})
                if(command.deferReply){
                    await interaction.deferReply({
                        ephemeral : command.ephemeral || false,
                    })
                }
                const pass = await verify(interaction)
                if(!pass){
                    const after = Date.now()
                    const ping = after - before
                    log({text : `command executed successfully /${interaction.commandName} by ${interaction.user.tag} in ${interaction.guild.name}<${interaction.guildId}>. ${ping}ms`,textColor : "Green",timeColor : "Green"})
                    return
                }
                try{
                    await command.execute(interaction)
                }
                catch(err){
                    error(`error when executing command ${interaction.commandName} : ${err.message}`)
                }
                const after = Date.now()
                const ping = after - before
                log({text : `command executed successfully /${interaction.commandName} by ${interaction.user.tag} in '${interaction.guild.name}'<${interaction.guildId}> ${ping}ms.`,textColor : "Green",timeColor : "Green"})
            }else{
                await interaction.reply({
                    content : ":x: This command is disabled",
                    ephemeral : true
                })
            }
        }
        catch(err){
            log({text : `There was an error while executing the command \n ${err}`,textColor : "Red",timeColor : "Red"})
            try{
                if(err instanceof DiscordAPIError){
                    if(err.code === 50001){
                        await reply(interaction,{
                            content : `:x: Missing Access`,
                            ephemeral : true
                        })
                        return
                    }
                    await reply(interaction,{
                        content : `:x: There was an error while executing the command
error code : DiscordAPIError_${err.code}
message : ${err.message}`,
                        ephemeral : true
                    })
                    return
                }
                if(interaction.replied || interaction.deferred){
                    await interaction.followUp({content : "There was an error while executing the command",ephemeral : true})
                }else{
                    await interaction.reply({content : "There was an error while executing the command",ephemeral : true})
                }
            }catch(err : any){
                error(err.message)
            }
        }
    }
    
})
// register servers
client.on("guildCreate",async(guild)=>{
    if(!guild && guild.id) return
    try{
        const members : Member[] = []
        let res = await guild.members.fetch()
        res.map(e=>{
            members.push({
                username : e.user.tag,
                id : e.user.id
            })
        })
        await new DiscordServers({
            name : guild.name,
            serverId : guild.id,
            members : members,
            games : []
        }).save()
        
        log({text: `Bot joined new server ${guild.name} ; ${guild.members.cache.size} members`,textColor : "Cyan"})
    }
    catch(err : any){
        error(err.message)
    }
})

client.on("guildDelete",async(guild)=>{
    if(!guild && !guild.id)return
    try{
        await DiscordServers.deleteGuild(guild.id)
        log({text: `Bot left a server ${guild.name} ; ${guild.members.cache.size} members`,textColor : "Yellow"})
    }
    catch(err : any){
        error(err.message)
    }
})

client.on("guildMemberAdd",async(m)=>{
    try{
        const dcServer = await getServerByGuildId(m.guild.id)
        let isIn = false
        dcServer.members.map(e=>{
            if(e.id === m.id) {
                isIn = true
            }
        })
        if(isIn) return
        dcServer.members.push({
            username : m.user.tag,
            id : m.id
        })
        await dcServer.save()
    }
    catch(err : any){
        error(err.message)
    }
})
client.on("guildMemberRemove",async(m)=>{
    try{
        const dcServer = await getServerByGuildId(m.guild.id)
        let isIn = false
        dcServer.members.map((e,i)=>{
            if(e.id === m.id) {
                isIn = true
                dcServer.members.splice(i,1)
            }
        })
        if(!isIn) return
        await dcServer.save()
    }
    catch(err : any){
        error(err.message)
    }
})
client.on("channelDelete",async(c)=>{
    try{
        if(c.type !== ChannelType.GuildText) return
        if(!c.guildId) return
        const server = await getServerByGuildId(c.guildId)
        if(!server.config.quiz?.multiple_channels) return
        if(c.parent.id !== server.config.quiz.channels_category) return
        for(let i =0;i<server.games.length;i++){
            if(server.games[i].channelId === c.id){
                await DiscordServers.deleteGame(c.guildId,server.games[i].hostId)
            }
        }
    }
    catch(err : any){
        error(err.message)
    }
})
client.on("channelCreate",async(c)=>{
    try{
        if(!c.guild) return
        if(c.type !== ChannelType.GuildText) return
        const AuditLogFetch  = await c.guild.fetchAuditLogs({limit : 1,type : AuditLogEvent.ChannelCreate})
        const logChannel = await client.channels.cache.get(c.id)
        if(!logChannel) return
        if(!AuditLogFetch.entries.first()) return
        const creator = AuditLogFetch.entries.first().executor
        if(creator.id === client.user.id) return
        const options = c.name.split("-")
        if(options.length !== 3 && options.length !== 4) return
        const cat = Object.keys(categories)
        let isValidCat = false
        let category : QuizCategory
        cat.map((e)=>{
            if(e.toLowerCase() === options[0].toLowerCase()){
                isValidCat = true
                category = e as QuizCategory
            }
        })
        if(!isValidCat) return
        if(typeof +options[1] !== "number") return
        const amount = +options[1]
        if(amount > amountQs[1] || amount <amountQs[0]) return
        const maxPl = +options[2]
        if(maxPl < maxPlayers[0] || maxPl > maxPlayers[1]) return
        let time : number
        if(options[3]){
            time = +options[3]
            if(time !== 5 && time!==10 && time!==15 && time!==30 && time!==45) return
        }
        if(!time){
            time = 30
        }
        time = time * 1000
        const channel = c
        const hostId = `${Date.now()}`
        const server = await fetchServer(channel.guildId)
        if(server.games.length >= maxGames){
            await channel.send({
                content : `Cannot create the game :x:\nThis server has reached the maximum number of games ${maxGames}.`
            })
            return
        }
        const jlAction : any = new ActionRowBuilder()
            .setComponents(
                new ButtonBuilder()
                .setLabel("join")
                .setCustomId("join_quizgame_"+hostId)
                .setStyle(3),
                new ButtonBuilder()
                .setLabel("leave")
                .setCustomId("leave_quizgame_"+hostId)
                .setStyle(4)
            )
            await c.send({
                components : [jlAction]
            })
        let msg = await channel.send({
            content : "creating Quiz Game..."
        })
        const permissions = c.permissionOverwrites
        permissions.cache.map(e=>{
            if(e.id === c.guild.roles.everyone.id){
                e.deny.add("SendMessages")
            }
        })
        await c.edit({
            name : "waiting 🟡",
            permissionOverwrites : permissions.cache
        })
        const gameBody : QuizGameInfo = {
            hostName : creator.tag,
            hostId : hostId,
            hostUserId : creator.id,
            maxPlayers : maxPl,
            channelId : channel.id,
            announcementId : msg.id,
            category : category,
            amount : amount,
            time : time || 30*1000,
            mainChannel : false,
            gameStart : server.config.quiz.gameStart || 0
        }
        try{
            const game = new QuizGame(channel.guildId,gameBody,true)
            await game.save()
        }
        catch(err : any){
            await msg.delete()
            msg = null
            await DiscordServers.deleteGame(c.guildId,hostId)
            await c.delete()
            throw new Error(err?.message)
        }
        const game = new QzGame(channel.guildId,hostId)
        game.applyData(gameBody)
        game.players = []
        const embed = game.generateEmbed()
        const row : any = game.generateRow(game.gameStart || 0)
        try{
            if(!msg) throw new Error(`Cannot create the game`)
            await msg.edit({
                embeds : [embed],
                components : (row.data.components ? [row] : []),
                content : `@everyone new Quiz Game created by <@${creator.id}> ${TimeTampNow()}`
            })
            
        }
        catch(err : any){
            await DiscordServers.deleteGame(c.guildId,hostId)
            await c.delete()
            throw new Error(err?.message)
        }
        setTimeout(async()=>{
            try{
                const game = await QuizGame.getGameWithHostId(c.guildId,hostId)
                if(game.started) return
                await DiscordServers.deleteGame(channel.guildId,hostId)
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
                await new Promise((res,rej)=>{
                    setTimeout(res,5*1000)
                })
                await channel.delete()
            }
            catch(err : any){
                warning(err.message)
            }
        },1000*60*5)
    }
    catch(err : any){
        warning(err.message)
    }
})

client.on("channelDelete",async(channel)=>{
    try{
        if(channel.type !== ChannelType.GuildText) return
        if(!channel.guild) return
        const server = await fetchServer(channel.guildId)
        for(let i = 0;i<server.games.length;i++){
            if(server.games[i].channelId === channel.id){
                server.games.splice(i,1)
                await server.update()   
                return         
            }
        }
    }catch(err){
        warning(err.message)
    }
})

client.on("ready",async(c)=>{
    try{
        console.clear();
        const bDate = Date.now()
        let scan = require("../config.json").scanSlashCommands
        if(scan){
            let ws = animateRotatingSlash("Scanning commands...")
            Bot.scanCommands()
            clearInterval(ws)
            console.log("\ncommands scanned successfully");
        }
        scan = null
        console.log(`[${new Date().toLocaleTimeString()}] Discord bot connected as : ${c.user.username}`);
        log({text : `connecting to the database`,textColor : "Magenta",timeColor : "Magenta"})
        await connectDB()
        log({text : `successfully connected to the database`,textColor : "Green",timeColor : "Green"})
        let guilds = await c.guilds.fetch()
        await DiscordServers.scanGuilds(guilds)
        await DiscordServers.cleanGuilds()
        const aDate = Date.now()
        const ping = aDate - bDate
        log({text : "Bot started "+ping+"ms",textColor : "Cyan"})
        const DcServers = await discordServers.find()
        let svs = DcServers.map(e=>{
            return {
                name : e.name,
                membersLength : e.members.length,
                "guild id" : e.serverId,
                id : e.id,
                __v : e.__v
            }
        })
        console.table(svs)
        client.user.setActivity({type : ActivityType.Watching,name : "/create_quizgame"})
    }
    catch(err : any){
        log({text : `There was an error while connecting to the database. \n ${err.message}`,textColor : "Red",timeColor : "Red"})
    }
})
let tokenName = "TOKEN"
const productionMode = require("../config.json").productionMode
if(productionMode){
    log({textColor : "Yellow",text : "You are running The bot on production mode",timeColor : "Yellow"})
    tokenName = "TOKEN1"
}
Bot.lunch()

// for express server :)
try{
    const server = require("./server.js")
    server()
}
catch(err : any){
    warning("Express Server is offline !.\nif you are in production mode please set 'productionMode' in ./config.json to true.")
}
