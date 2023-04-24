import { model,Schema } from "mongoose";
export interface Member{
    username: string, // with tag
    id : string
}
export interface SpyGame{
    hostId : string,
    hostName : string,
    players : Member[],
    word : string,
    index : number,
    maxPlayers : number,
    channelId : string,
    announcementId : string
}
export interface DiscordServer{
    serverId : string,
    name : string,
    members : Member[]
    games : SpyGame[]
}

const discordServer = new Schema<DiscordServer>({
    name : {
        required : true,
        type : String
    },
    serverId : {
        required : true,
        type : String
    },
    members : {
        required : true,
        type : [Object]
    },
    games : {
        required : false,
        type : [Object],
        default : null
    }
})


export default model<DiscordServer>("Discord servers",discordServer)