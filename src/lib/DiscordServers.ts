import ServersModel ,{DiscordServer} from "../model/discordServers"

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
    constructor(public server : DiscordServer){}
    async save(){
        const check =  await ServersModel.findOne({serverId : this.server.serverId})
        if(check) throw new Error(`This server is allready exist`)
        const server = new ServersModel(this.server)
        await server.save()
    }
}