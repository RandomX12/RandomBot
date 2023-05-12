import ServersModel ,{DiscordServer, Game, Member} from "../model/discordServers"
import { isSpyGame } from "./spygame"
import { SpyGame } from "../model/SpyGame"
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
    constructor(public server : DiscordServer){}
    async save(){
        const check =  await ServersModel.findOne({serverId : this.server.serverId})
        if(check) throw new Error(`This server is allready exist`)
        const server = new ServersModel(this.server)
        await server.save()
    }
}