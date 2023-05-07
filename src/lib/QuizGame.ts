import { Game } from "../model/discordServers"
import Qz , { Qs, QuizGame as QuizGameType } from "../model/QuizGame"
import { getServerByGuildId } from "./DiscordServers";
export function isQuizGame(game : Game) : game is QuizGameType{
    if(game.name === "Quiz Game"){
        return true
    }
}
export function getCategoryByNum(num : CategoriesNum | "any"){
    if(num === "any") return "Random"
    let names : QuizCategory[] = Object.keys(categories) as QuizCategory[]
    let category : QuizCategory
    names.map(e=>{
        if(categories[e] === num){
            category = e
        }
    })
    return category
}
interface APIresponse{
    results : {category : string,type : answerType,difficulty :"easy",question : string,correct_answer : string,incorrect_answers : string[]}[]
}

export type CategoriesNum = 9 | 15 | 21 | 23 | 22 | 19 | 18 | 27 | 28
type QuizCategory = "Random" | "GeneralKnowledge" | "VideoGames" | "Sports" | "History" | "Geography" | "Mathematics" | "Computers" | "Animals" | "Vehicles";
type Categories = Record<QuizCategory,CategoriesNum | "any">
export type answerType = "multiple" | "boolean"
export const regex = /&quot;|&amp;|&#039;|&eacute;|&#039;|&amp;|&quot;|&shy;|&ldquo;|&rdquo;|&#039;/g 
export const categories : Categories = {
    Random : "any",
    GeneralKnowledge : 9,
    VideoGames : 15,
    Sports : 21,
    History : 23,
    Geography : 22,
    Mathematics : 19,
    Computers : 18,
    Animals : 27,
    Vehicles : 28,
}

interface QuizGameInfo{
    hostId : string,
    hostName : string,
    maxPlayers : number,
    channelId : string,
    announcementId : string,
    category : QuizCategory,
    amount : number
}

export class QuizGame{
    constructor(public serverId : string,public info : QuizGameInfo){
        if(info.amount < 3 || info.amount > 10) throw new Error(`Amount must be between 3 and 10`)
    }
    async save(){
        const server = await getServerByGuildId(this.serverId)
        let hasGame = false
        server.games.map(e=>{
            if(e.hostId === this.info.hostId){
                hasGame = true
            }
        })
        if(hasGame) throw new Error(`This user already has a game`)
        const QuizCatNum = categories[this.info.category]
        let catUrl = `&category=${QuizCatNum}`
        if(QuizCatNum === "any"){
            catUrl = ""
        }
        let amount = this.info.amount
        const req = await fetch(`https://opentdb.com/api.php?amount=${amount}&difficulty=easy${catUrl}`)
        const res : APIresponse = await req.json()
        let quiz : Qs[] = 
        res.results.map((e)=>{
            let q = e.question.replace(regex,' ')
            let c = e.correct_answer.replace(regex,' ')
            let ans = e.incorrect_answers.map(ele=>{
                return ele.replace(regex,' ')
            })
            ans.push(c)
            let t = e.type
            return {
                question : q,
                answers : ans,
                correctIndex : 0,
                type : t
            }
        })
        console.log(new Qz({
            ...this.info,
            name : "Quiz Game",
            index : 0,
            players : [{username : this.info.hostName,id : this.info.hostId}],
            quiz : quiz
        }));
        server.games.push({
            ...this.info,
            name : "Quiz Game",
            index : 0,
            players : [{username : this.info.hostName,id : this.info.hostId}],
            quiz : quiz
        } as QuizGameType)
        await server.save()
    }
}