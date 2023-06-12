// this file is for handling runtime console commands

import readline  from "readline"
import { Bot } from "./Bot";

interface RuntimeCMD{
    input : string,
    fn : ()=>void
}

let commands : RuntimeCMD[] = []

export default function listenToCmdRunTime(){
    let rl = readline.createInterface({
        input : process.stdin,
        output : process.stdout
    })
    
    rl.on('line', (input) => {
        if(input === "uptime"){
            console.log(Bot.uptime);
            return
        }
        commands.map((e)=>{
            if(e.input === input){
                e.fn()
            }
        })
      });
}

export function addRuntimeCMD(input : string,fn : ()=>void){
    commands.push({input,fn})
}