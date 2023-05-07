import { model,Schema } from "mongoose";
import { SpyGameSchema } from "./SpyGame";
import { QuizSchema } from "./QuizGame";
export interface Member{
    username: string, // with tag
    id : string
}
type GameName = "Spy Game" | "Quiz Game"
export interface Game{
    name : GameName
    hostId : string,
    hostName : string,
    players? : Member[]
    channelId : string,
}


export interface DiscordServer{
    serverId : string,
    name : string,
    members : Member[]
    games : Game[]
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
            SpyGameSchema,
            QuizSchema
        ],
        default : null
    }
})


export default model<DiscordServer>("Discord servers",discordServer)