/**
 * this file will be deleted in the stable version of random bot 1.0.0
 */

import { Schema } from "mongoose";
import { Game } from "./discordServers";


const Game = new Schema<Game>({
                hostId : String,
                hostName : String,
                //@ts-ignore
                index : {
                    type : Number,
                    required : false,
                    default : 0
                },
                players : [{
                    username : String,
                    id : String,
                    askId : String,
                    question : String,
                    answer : Schema.Types.Mixed,
                    vote : String,
                    votedCount : {
                        type : Number,
                        default : 0,
                        required : false
                    }
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
                },
                end : {
                    required : false,
                    type : Boolean,
                    default : false
                },
                quiz :{
                    required : true,
                    type : [ {
                        question : String,
                        answers : [String],
                        correctIndex : Number,
                        type : String
                    }]
                },
                amount : {
                    type : Number,
                    required : true,
                },
                category : {
                    type : String,
                    required : true
                }
})