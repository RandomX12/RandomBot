import { OAuth2Guild } from "discord.js"
import ServersModel ,{DiscordServer, Game, Member} from "../model/discordServers"
import Config from "./DiscordServersConfig"
import { Collection } from "discord.js"
import discordServers from "../model/discordServers"
import { error, warning } from "./cmd"
import  DiscordSv  from "../model/discordServers"

export async function getServerByGuildId(id : string){
    const server =  await ServersModel.findOne({serverId : id})
    if(!server) throw new Error(`Server not found. id=${id}`)
    return server
}

export default class DiscordServers{
    static async deleteGuild(id : string){
        const server = await getServerByGuildId(id)
        server.deleteOne()
    }
    static async isInGame(guildId : string,userId : string) : Promise<boolean>{
        const server = await getServerByGuildId(guildId)
        let isIn = false
        for(let i = 0;i<server.games.length;i++){
            // if(server.games[i].hostId === userId){                
            //     isIn = true
            //     break
            // }

            for(let j = 0;j<server.games[i].players.length;j++){
                if(server.games[i].players[j].id === userId){
                    isIn = true
                    break
                }
            }

            if(isIn) break
        }
        return isIn
    }
    static async getGameByHostId(guildId : string,id:string){
        const server = await getServerByGuildId(guildId)
        let game : Game 
        server.games.map(e=>{
            if(e.hostId === id){
                game = e
            }
        })
        if(!game) throw new Error(`Game not found`)
        return game
    }
    static async getUser(guildId:string,userId : string){
        const server = await getServerByGuildId(guildId)
        let user : Member
        server.members.map(e=>{
            if(e.id === userId){
                user = e
            }
        })
        if(!user) throw new Error(`User not found`)
        return user
    }
    static async deleteGame(guildId : string,hostId : string){
        const server = await getServerByGuildId(guildId)
        server.games.map((e,i)=>{
            if(e.hostId === hostId){
                server.games.splice(i,1)
            }
        })
        await server.save()
    }
    static async isGameFull(guildId : string,hostId : string){
        const game = await DiscordServers.getGameByHostId(guildId,hostId)
        if(!("maxPlayers" in game)) return
        if(game.players.length === game.maxPlayers) return true
        return false
    }
    static async scanGuilds(guilds : Collection<string, OAuth2Guild>) : Promise<void>{
        const server = await discordServers.find()
        guilds.map(async e=>{
            try{
                let isIn = false
                server.map(ele=>{
                    if(ele.serverId === e.id){
                        isIn = true
                        return
                    }

                })
                if(isIn) return
                let members : Member[] = (await (await e.fetch()).members.fetch()).map(e=>{
                    return {
                        username : e.user.tag,
                        id : e.user.id
                    }
                })
                await new DiscordServers({
                    name : e.name,
                    members : members,
                    serverId : e.id,
                    games : []
                }).save()
            }
            catch(err:any){
                error(err.message)
            }
        })
        server.map(async(e,i)=>{
            try{
                let isIn = false
                guilds.map(ele=>{
                    if(e.serverId === ele.id){
                        isIn = true
                    }
                })
                if(!isIn){
                    await server[i].deleteOne()
                }
            }
            catch(err : any){
                warning(err.message)
            }
        })
    }
    static async cleanGuilds() : Promise<void>{
        const server = await DiscordSv.find()
        server.map(async (e,i)=>{
            try{
                if(e.games.length > 0){
                    server[i].games = []
                    await server[i].save()
                }
            }
            catch(err : any){
                warning(err.message)
            }
        })
    }
    constructor(public server : DiscordServer){}
    async save(){
        const check =  await ServersModel.findOne({serverId : this.server.serverId})
        if(check) throw new Error(`This server is allready exist`)
        const config = new Config()
        this.server.config = config.config
        const server = new ServersModel(this.server)
        await server.save()
    }
}