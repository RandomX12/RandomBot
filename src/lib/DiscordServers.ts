import ServersModel ,{DiscordServer, Member, SpyGame} from "../model/discordServers"

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
    static async getGameByHostId(guildId : string,id:string){
        const server = await getServerByGuildId(guildId)
        let game : SpyGame 
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
    constructor(public server : DiscordServer){}
    async save(){
        const check =  await ServersModel.findOne({serverId : this.server.serverId})
        if(check) throw new Error(`This server is allready exist`)
        const server = new ServersModel(this.server)
        await server.save()
    }
}