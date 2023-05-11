import { model,Schema } from "mongoose";
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
    // @ts-ignore
    games : {
        required : false,
        type : [
            {
                //@ts-ignore
                name :String,
                hostId : String,
                hostName : String,
                index : {
                    type : Number,
                    required : false,
                    default : 0
                },
                players : [{
                    username : String,
                    id : String,
                    askId : {
                        type : String,
                        required : false
                    },
                    question : {
                        required : false,
                        type : String
                    },
                    answer : {
                        required : false,
                        type : String
                    },
                    vote : {
                        required : false,
                        type : String
                    },
                    votedCount : {
                        type : Number,
                        default : 0,
                        required : false
                    },
                    answers : {
                        required : false,
                        type : [String],
                    },
                    score : {
                        required : false,
                        type : Number,
                        default : 0
                    }
                }],
                word : String,
                maxPlayers : Number,
                channelId : String,
                announcementId : String,
                spy : {
                    id : String,
                    username: String,
                    
                },
                started : {
                    required : false,
                    type : Boolean,
                    default : false
                },
                end : {
                    required : false,
                    type : Boolean,
                    default : false
                },
                quiz :{
                    required : false,
                    type : []
                },
                amount : {
                    type : Number,
                    required : false,
                },
                category : {
                    type : String,
                    required : false
                }
            }
        ],
        default : null
    }
})


export default model<DiscordServer>("Discord servers",discordServer)