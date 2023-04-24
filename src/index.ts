// importing the libs
import Discord, {Collection,GatewayIntentBits } from "discord.js"
import path from "path"
import fs from "fs"
import { error, log } from "./lib/cmd"
import { connectDB } from "./lib/connectDB"
import DiscordServers, { getServerByGuildId } from "./lib/DiscordServers"
import { Member } from "./model/discordServers"
require("dotenv").config()
declare module "discord.js" {
    export interface Client {
        commands: Collection<unknown, any>
    }
    }
// init the discord bot
const client = new Discord.Client({
    intents : [
        GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
]
})
// command handling
client.commands = new Collection()
const commandPath = path.join(__dirname,"commands")
const commandFiles = fs.readdirSync(commandPath).filter(file=>file.endsWith(".ts") || file.endsWith(".js"))
setTimeout(()=>{
    for(const file of commandFiles){
        const filePath = path.join(commandPath,file)
        const command = require(filePath)
        if("data" in command && "execute" in command){
            client.commands.set(command.data.name,command)
            client.application?.commands?.create(command.data)
        }else{
            console.log("\x1b[33m","[warning] : ","\x1b[37m",`The command at ${filePath} has a missing property.`)
        }
    }
},3000)
// execute commands

client.on("interactionCreate",async(interaction)=>{
    if(!interaction.isChatInputCommand()) return
    
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
            await command.execute(interaction)
            const after = Date.now()
            const ping = after - before
            log({text : `command executed successfully /${interaction.commandName} by ${interaction.user.tag}. ${ping}ms`,textColor : "Green",timeColor : "Green"})
        }else{
            await interaction.reply({
                content : ":x: This command is disabled",
                ephemeral : true
            })
        }
    }
    catch(err : any){
        log({text : `There was an error while executing the command \n ${err.message}`,textColor : "Red",timeColor : "Red"})
        if(interaction.replied || interaction.deferred){
            interaction.followUp({content : "There was an error while executing the command",ephemeral : true})
        }else{
            interaction.reply({content : "There was an error while executing the command",ephemeral : true})
        }
    }
})
// register servers
client.on("guildCreate",async(guild)=>{
    if(!guild && guild.id) return
    try{
        const members : Member[] = []
        guild.members.cache.map(e=>{
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

client.on("ready",async(c)=>{
    console.log(`[${new Date().toLocaleTimeString()}] Discord bot connected as : ${c.user.username}`);
    log({text : `connecting to the database`,textColor : "Magenta",timeColor : "Magenta"})
    try{
        await connectDB()
        log({text : `successfully connected to the database`,textColor : "Green",timeColor : "Green"})
    }
    catch(err : any){
        log({text : `There was an error while connecting to the database. \n ${err.message}`,textColor : "Red",timeColor : "Red"})
    }
})

client.login(process.env.TOKEN)