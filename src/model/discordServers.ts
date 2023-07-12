import { model,Schema } from "mongoose";
import { ConfigT } from "../lib/DiscordServersConfig";
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
    games : Game[],
    config? : ConfigT
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
    config : {
        required : true,
        type : {
            commands : {
                required : true,
                type : [{
                    name : String,
                    enable : Boolean,
                    //@ts-ignore
                    permissions : [String],
                    rolesId : [String],
                    bannedUsers : [String]
                }]
            },
            quiz : {
                type : {
                    multiple_channels : Boolean,
                    channels_category : {
                        required : false,
                        type : String
                    },
                    private : {
                        required : false,
                        default : false,
                        type : Boolean
                    },
                    category_name : {
                        type : String,
                        require : false
                    },
                    //@ts-ignore
                    roles : {
                        required : false,
                        type : [String],
                        default : []
                    },
                    gameStart : {
                        required : true,
                        type : Number,
                        default : 0
                    }
                },
                required : true,
                default : {
                    multiple_channels : false,
                    private : false
                }
            }
        }
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
                hostUserId : String,
                index : {
                    type : Number,
                    required : false,
                    default : 0
                },
                players : [{
                    username : String,
                    id : String,
                    answers : {
                        required : false,
                        type : [{
                            index : Number,
                            answer : String
                        }],
                        default : []
                    },
                    score : {
                        required : false,
                        type : Number,
                        default : 0
                    },
                    ready : {
                        required : false,
                        type : Boolean,
                        default : false
                    }
                }],
                word : String,
                maxPlayers : Number,
                channelId : String,
                announcementId : String,
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
                },
                time : {
                    require : false,
                    type : Number
                },
                mainChannel : {
                    require : false,
                    type : Boolean,
                    default : true
                },
                gameStart : {
                    required : false,
                    type : Number,
                    default : 0
                }
            }
        ],
        default : []
    }
})


export default model<DiscordServer>("Discord servers",discordServer)