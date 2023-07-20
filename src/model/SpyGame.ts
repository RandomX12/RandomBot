/**
 * this file will be deleted in the stable version of random bot 1.0.0
 */

import { Schema } from "mongoose";
import { Game, Member } from "./discordServers";

export interface SpyGamePlayer extends Member{
    askId? : string,
    question? : string,
    answer? : string,
    vote? : string,
    votedCount? : number
}

export interface SpyGame extends Game{
    players : (Member & {askId? : string,question? : string,answer? : string,vote? : string,votedCount? : number})[],
    word : string,
    index : number,
    maxPlayers : number,
    announcementId : string,
    spy? : Member,
    started? : boolean,
    end? : boolean
}
export const SpyGameSchema = new Schema<SpyGame>({
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
                    askId : String,
                    question : String,
                    answer : String,
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
                }
})