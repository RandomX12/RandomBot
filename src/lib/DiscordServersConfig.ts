import { PermissionResolvable } from "discord.js"
import { getServerByGuildId } from "./DiscordServers"
import fs from "fs"
import path from "path"
export interface CommandsConfig{
    name : string,
    enable : boolean,
    permissions? : PermissionResolvable[],
    rolesId? : string[],
    bannedUsers? : string[]
}


export interface ConfigT{
    commands : CommandsConfig[],
    quiz? : QuizGameConfig<boolean,boolean>
}

export interface command{
    name : string,
    description : string,
    permissions? : PermissionResolvable[]
}

type MlChannels<Private extends boolean> = Private extends true
?{
    multiple_channels : boolean,
    channels_category : string
    private: Private,
    roles : string[]
    category_name :string,
    gameStart : typeof gameStartType[keyof typeof gameStartType]
}
:
{
    multiple_channels : boolean,
    channels_category : string
    private: Private,
    category_name :string ,
    gameStart : typeof gameStartType[keyof typeof gameStartType]
}

export type QuizGameConfig<Multiple extends boolean,Private extends boolean>  = Multiple extends true 
? MlChannels<Private>
: {
    multiple_channels : false,
    gameStart : typeof gameStartType[keyof typeof gameStartType]
}



export const gameStartType = {
    /**
     * Automatically start when the game is full 
     */
    AUTO : 0,
    /**
     * Start When Everyone is ready
     */
    READY : 1,
    /**
     * Start When Everyone is ready and the game is full.
     */
    FULL_READY : 2,
    /**
     * Wait for the moderator to start the game
     */
    ADMIN : 3
} as const

export type TGameStart = typeof gameStartType[keyof typeof gameStartType]

export default class Config{
    constructor(public config? : ConfigT){
        // written by KHLALA 
        if(!this.config){
            this.config = {
                commands : [],
                quiz : {
                    multiple_channels : false,
                    gameStart : 0
                }
            }
        }
        if(this.config.quiz.multiple_channels){
            if(!this.config.quiz.category_name || !this.config.quiz.channels_category){
                throw new Error(`category props are required when "multiple_channels" is set to "true"`)
            }
            if(!this.config.quiz.gameStart){
                this.config.quiz.gameStart = gameStartType.AUTO
            }
        }
        let commands : command[] = []
        const cmdPath = path.join(__dirname,"../commands")
        const files = fs.readdirSync(cmdPath).filter((e)=>e.endsWith(".ts") || e.endsWith(".js"))
        for(let file of files){
            const cmdBody = require(path.join(cmdPath,file))
            if("data" in cmdBody){
                commands.push({
                    name : cmdBody.data.name,
                    description : cmdBody.data.description,
                    permissions :  cmdBody.permissions
                }) 
            }
        }
        if(this.config.commands || this.config.commands.length > 0){
            this.config.commands.map((e)=>{
                let isValid = false
                commands.map(ele=>{
                    if(ele.name === e.name){
                        isValid = true
                    }
                })
                if(!isValid){
                    this.config.commands.splice(this.config.commands.indexOf(e),1)
                }
            })
            commands.map((e)=>{
                let isIn = false
                this.config.commands.map(ele=>{
                    if(e.name === ele.name){
                        isIn = true
                    }
                })
                if(!isIn){
                    this.config.commands.push({
                        name : e.name,
                        permissions : e.permissions || [],
                        enable : true,
                    })
                }
            })
        }else{
            commands.map((e)=>{
                this.config.commands.push({
                    name : e.name,
                    enable : true,
                    permissions :e.permissions || [],
                })
            })
        }
    }
    
    async save(guildId : string){
        const server = await getServerByGuildId(guildId)
        server.config = this.config
        await server.save()
    }
}