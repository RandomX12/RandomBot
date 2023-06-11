import { Guild, GuildMember, OAuth2Guild } from "discord.js"
import ServersModel ,{DiscordServer, Game, Member} from "../model/discordServers"
import Config, { ConfigT } from "./DiscordServersConfig"
import { Collection } from "discord.js"
import discordServers from "../model/discordServers"
import { error, warning } from "./cmd"
import  DiscordSv  from "../model/discordServers"
import { deleteGameLog } from "./QuizGame"
import { client } from ".."
/**
 * Get the server document from the data base
 * @param id server id
 * @returns Server Document
 */
export async function getServerByGuildId(id : string){
    const server =  await ServersModel.findOne({serverId : id})
    if(!server) throw new Error(`Server not found. id=${id}`)
    return server
}
/**
 * Get discord server
 * @param id server id 
 * @returns new Server()
 */
export async function  fetchServer(id : string) : Promise<Server>{
    const sv = new Server(id)
    await sv.fetch()
    return sv
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
    @deleteGameLog()
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


/**
 * New Constructor for discord server
 */
export class Server implements DiscordServer{
    /**
     * New Get server function
     * @param guildId server id
     * @returns new Server()
     */
    static async getServer(guildId : string){
        const server = await getServerByGuildId(guildId)
        const guild = new Server(server.serverId)
        guild.applyData(server)
        return guild
    }
    /**server name */
    public name: string;
    /**server config */
    public config?: ConfigT;
    /** server members */
    public members: Member[]
    /** */
    public games: Game[]
    constructor(public readonly serverId : string){}
    /**
     * Set the server data.
     */
    applyData(data : Partial<DiscordServer>) : void{
        this.name = data.name || this.name
        this.config = data.config || this.config
        this.members = data.members
        this.games = data.games || this.games
    }
    /**
     * fetch the server data from the database
     */
    async fetch() : Promise<void>{
        const server = await getServerByGuildId(this.serverId)
        this.applyData(server)
    }
    /**
     * delete the server
     */
    async delete() : Promise<void>{
        await DiscordServers.deleteGuild(this.serverId)
    }
    /**
     * Update the server
     */
    async update() : Promise<void>{
        const server = await getServerByGuildId(this.serverId)
        server.name = this.name
        server.config = this.config
        server.members = this.members
        server.games = this.games
        await server.save()
    }
    /**
     * change server config
     * @param config config of the server
     */
    async setConfig(config : ConfigT) : Promise<void>{
        const server = await getServerByGuildId(this.serverId)
        const c = new Config(config)
        server.config = c.config
        await server.save()
        this.config = c.config
        return
    }
    /**
     * delete all games in this server
     */
    async cleanGames() : Promise<void>{
        const server = await getServerByGuildId(this.serverId)
        server.games = []
        await server.save()
    }
    /**
     * Get the number of online member in this server
     * @returns number of online members
     */
    async getOnlineMembersNumber() : Promise<number>{
        let server : Guild
        client.guilds.cache.map(async(e)=>{
            if(e.id === this.serverId){
                server = e
            }
        })
        if(!server) throw new Error(`server not found`)
        const sv = await server.fetch()
        return sv.approximatePresenceCount
    }
}