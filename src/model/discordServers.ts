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
    announcementId : string,
    spy? : Member,
    started? : boolean
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
        type : [
            {
                hostId : String,
                hostName : String,
                index : {
                    type : Number,
                    required : false,
                    default : 0
                },
                players : [{
                    username : String,
                    id : String
                }],
                word : String,
                maxPlayers : Number,
                channelId : String,
                announcementId : String,
                spy : {
                    id : String,
                    username: String
                },
                started : {
                    required : false,
                    type : Boolean,
                    default : false
                }
            }
        ],
        default : null
    }
})


export default model<DiscordServer>("Discord servers",discordServer)