import { ApplicationCommandOptionType, CacheType, ChatInputCommandInteraction, Collection, GatewayIntentBits } from "discord.js";
import Discord, {  ApplicationCommandDataResolvable } from "discord.js";
import { Member } from "../model/discordServers";
import path from "path" 
import fs from "fs"
interface Command{
    name : string,
    description : string,
    options : [
        {
            name : string,
            description : string,
            type : ApplicationCommandOptionType,
            required? : boolean,
            choices? : [
                {
                    name : string,
                    value : any
                }
            ],
            maxValue? : number
            minValue? : number
        }
    ]
}

export abstract class Bot{
    /**
     * Create a new slash Command
     */
    static createCommand(command : Command){
        this.client.application?.commands?.create(command as ApplicationCommandDataResolvable)
        this.cmds.set(command.name,new Map<string,Member>())
        this.client.commands.set(command.name,command)
    }
    static cmds = new Map<string,Map<string,Member>>()
    /**
     * The bot :)
     */
    static client = new Discord.Client({
        intents : [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessageReactions
    ]
    })
    /**
     * Lunch the bot.
     * 
     * @note set the productionMode in config.json to false if you are testing the bot.
     */
    static lunch(){
        const productionMode = require("../../config.json").productionMode
        if(productionMode){
            this.client.login(process.env.TOKEN1)
        }else{
            this.client.login(process.env.TOKEN)
        }
    }
    /**
     * Scan command and button folder and save the commands
     * @note also create / command for the new commands
     */
    static async scanCommands(){
        this.client.commands = new Collection()
        const commandPath = path.join(__dirname+"/..","commands")
        const commandFiles = fs.readdirSync(commandPath).filter(file=>file.endsWith(".ts") || file.endsWith(".js"))
        for(const file of commandFiles){
            const filePath = path.join(commandPath,file)
            const command = require(filePath)
            if("data" in command && "execute" in command){
                this.client.commands.set(command.data.name,command)
                this.cmds.set(command.data.name,new Map<string,Member>())
                await this.client.application?.commands?.create(command.data)
            }else{
                console.log("\x1b[33m","[warning] : ","\x1b[37m",`The command at ${filePath} has a missing property.`)
            }
        }
    }
    /**
     * Delete All the commands
     */
    static async clearCommands(){
        await this.client.application?.commands?.set([])
    }
    /**
     * You can use this function to protect the bot from the spam
     * @returns true if the user is not spamming false if the user is spamming
     */
    static checkRequest(interaction : ChatInputCommandInteraction<CacheType>) : boolean{
        const userCMD = this.cmds.get(interaction.commandName)?.get(interaction.user.id)
        if(userCMD) return false
        if(!userCMD){
            this.cmds.get(interaction.commandName)?.set(interaction.user.id,{username : interaction.user.tag,id : interaction.user.id})
            setTimeout(()=>{
                this.cmds.get(interaction.commandName)?.delete(interaction.user.id)
            },5000)
            return true
        }
    }
    static get uptime(){
        let uptime = this.client.uptime
        let days = toInt(uptime / (1000 * 60 * 60 * 24))
        let hours = toInt((uptime / ( 1000 * 60 * 60)) - days * 24)
        let min = toInt(uptime / (1000 * 60) - (hours * 60 + days * 24 * 60))
        let sec = +(uptime / 1000 - (days * 24 * 60 * 60 + hours * 60 * 60 + min * 60)).toFixed(0)
        return `${days}d ${hours}h ${min}m ${sec}s`
    }
    static get stats(){
        const guildsSize = this.client.guilds.cache.size
        const members = this.client.users.cache.size
        return {
            guildsSize,
            members
        }
    }
}

function toInt(num : number){
    return +num.toString().split(".")[0]
}