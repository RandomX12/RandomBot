import { Schema, model } from "mongoose";
import { Game, Member } from "./discordServers";
import { QuizCategory, answerType } from "../lib/QuizGame";

export interface Qs{
    question : string,
    answers : string[],
    correctIndex : number,
    type : answerType,
    category : QuizCategory
}
export type answers = "A" | "B" | "C" | "D" | "N"
export interface QuizGamePlayer extends Member{
    answers? : answers[],
    score? : number
}
export interface QuizGame extends Game{
    players : QuizGamePlayer[],
    index : number,
    maxPlayers : number,
    announcementId : string,
    started? : boolean,
    end? : boolean,
    quiz : Qs[],
    category : QuizCategory,
    amount  : number
}
export const QuizSchema = new Schema<QuizGame>({
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
                    answers : {
                        required : false,
                        type : [String],
                    },
                    score : {
                        required : false,
                        type : Number
                    }
                }],
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
                    required : true,
                    type : [ {
                        question : String,
                        answers : [String],
                        correctIndex : Number,
                        type : String,
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

export default model<QuizGame>('Quiz Game',QuizSchema)