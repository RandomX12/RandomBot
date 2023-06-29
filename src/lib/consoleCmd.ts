// this file is for handling runtime console commands
// still under dev

import readline  from "readline"
import { Bot } from "./Bot";
import { animateRotatingSlash, error, log, warning } from "./cmd";
import discordServers from "../model/discordServers";
import { stop } from "./QuizGame";
import DiscordServers from "./DiscordServers";

interface RuntimeCMD{
    input : string,
    fn : ()=>void | Promise<void>,
    type? : "SYNC" | "ASYNC",
    loadingTxt? : string,
    finishTxt? : string
}

let commands : RuntimeCMD[] = []
let rl = readline.createInterface({
    input : process.stdin,
    output : process.stdout
})
let specialWords : string[] = []
export let exe : boolean = false
/**
 * Start listening to runtime line commands
 */
export default function listenToCmdRunTime(){
    warning("runtime console commands still under dev")
    rl.on('line', (input) => {
        if(specialWords.indexOf(input) !== -1)return
        if(!input.replace(/ */g,""))return
        log({text : "Executing runtime command "+`"${input}"`})
        let found = false
        commands.map(async(e)=>{
            if(e.input === input){
                found = true
                if(e.type === "SYNC"){
                    e.fn()
                }else{
                    e.loadingTxt != "Executing..."
                    e.finishTxt != "Command Executed"
                    let wt = animateRotatingSlash(e.loadingTxt)
                    await e.fn()
                    clearInterval(wt)
                    process.stdout.write('\r' + `\x1b[32m ${e.finishTxt} \x1b[37m\n`);

                }
            }
        })
        if(!found){
            error(`"${input}" runtime command is not found. if you want to create a new runtime command use the addRuntimeCMD function from ${__filename}`)
        }
      });
}
/**
 * Add a new Runtime Command
 * @param input command name structure
 * @param fn the function that will run the command is called
 */
export function addRuntimeCMD(command: RuntimeCMD){
    if(!command.type){
        command.type = "SYNC"
    }
    commands.push(command)
}
/**
 * Add a new Special Word
 * @param word string
 */
export function addSpecialWord(word :string | string[]){
    if(typeof word === "string"){
        specialWords.push(word)
    }else if(typeof word === "object"){
        specialWords.push(...word)
    }
}

// default runtime cmd
addSpecialWord(["y","n"])

addRuntimeCMD({
    input : "uptime",
    fn() {
        log({text : `The bot has been running for : ${Bot.uptime}`,textColor : "Green"})
    },
})

addRuntimeCMD({
    input : "clear-slash-cmd",
    fn : ()=>{
        process.stdout.write("Do you really want to delete all the commands ? (y / n) : ");
        rl.once("line",async(input : string)=>{
            let before = Date.now()
            if(input !== "y"){
                log({textColor : "Red",text : "Command deletion has been canceled"})
                return
            }
            log({textColor : "Yellow",text : "deleting all the slash commands..."})
            await Bot.clearCommands()
            let ping = Date.now() - before
            log({textColor : "Green",text : "Commands are deleted."+ ` ${ping}ms`})
        })
    },
    type : "SYNC",
})

addRuntimeCMD({
    input : "scan-slash-cmd",
    async fn() {
        await Bot.scanCommands()

    },
    type : "ASYNC",
    loadingTxt : "Scanning commands...",
    finishTxt : " commands scanned successfully"
})

addRuntimeCMD({
    input : "cls",
    fn() {
        console.clear()
    },
    type : "SYNC"
})

addRuntimeCMD({
    input : "table",
    type : "ASYNC",
    loadingTxt : "Fetching Info...",
    finishTxt : "table fetched",
    async fn() {
        const server = await discordServers.find()
        const tableInfo = server.map((e)=>{
            return{
                name : e.name,
                membersLenght : e.members.length,
                guildId : e.serverId,
                id : e.id,
                __v : e.__v
            }
        })
        console.table(tableInfo)
    },
})

addRuntimeCMD({
    input : "shut-down",
    type : "SYNC",
    fn() {
        console.log("Do you really want to shut down the bot");
        process.stdout.write("This will make the bot offline and delete all the existing games and commands (y / n ) : ")
        rl.once("line",async(input)=>{
            if(input !== "y") return
            let wt = animateRotatingSlash("shutting down the bot...")
            await DiscordServers.cleanGuilds()
            await Bot.clearCommands()
            clearInterval(wt)
            log({textColor : "Cyan",text : "\nserver offline"})
            process.exit(0)
        })
    },
})