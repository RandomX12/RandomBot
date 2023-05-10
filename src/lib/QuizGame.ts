import { Game, Member } from "../model/discordServers"
import Qz , { Qs, QuizGame as QuizGameType } from "../model/QuizGame"
import DiscordServers, { getServerByGuildId } from "./DiscordServers";
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
export type QuizCategory = "Random" | "GeneralKnowledge" | "VideoGames" | "Sports" | "History" | "Geography" | "Mathematics" | "Computers" | "Animals" | "Vehicles";
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

export default class QuizGame{
    
    static async join(guildId : string,hostId : string,userId : string){
        const server = await getServerByGuildId(guildId)
        let gameFound = false
        for(let i = 0;i<server.games.length;i++){
            if(server.games[i].hostId === hostId){
                if(!isQuizGame(server.games[i])) throw new Error(`This game is not Quiz Game`)
                gameFound = true
                const isIn = await DiscordServers.isInGame(guildId,userId)
                if(isIn) throw new Error(`User id="${userId} is already in the game"`)
                const user = await DiscordServers.getUser(guildId,userId)
                server.games[i].players.push(user)
                await server.save()
                break
            }
        }
        if(!gameFound) throw new Error(`Cannot join the game : Game not found`)
    }
    static async leave(guildId : string,hostId : string,userId : string){
        const server = await getServerByGuildId(guildId)
        let isGame = false
        let isIn = false
        server.games.map((e,i)=>{
            if(e.hostId === hostId){
                isGame = true
                e.players.map((ele,j)=>{
                    if(ele.id === userId){
                        isIn = true
                        server.games[i].players.splice(j,1)
                    }
                })
            }
        })
        if(!isGame) throw new Error(`Game not found`)
        if(!isIn) throw new Error(`This user is not in game`)
        await server.save()
    }
    static async getGameWithHostId(guildId : string,hostId : string){
        const game = await DiscordServers.getGameByHostId(guildId,hostId)
        if(!isQuizGame(game)) throw new Error(`Game With hostId="${hostId}" is not a Quiz Game`)
        return game
    }
    static async isIn(guildId : string,hostId : string,userId : string) : Promise<boolean>{
        const server = await getServerByGuildId(guildId)
        let game : Game
        let player : Member
        server.games.map(e=>{
            if(e.hostId === hostId){
                game = e
                e.players.map(ele=>{
                    if(ele.id === userId){
                        player = ele
                    }
                })
            }
        })

        if(!game) throw new Error(`Game not found`)
        if(!isQuizGame(game)) throw new Error(`This is not a quiz game`)
        if(!player) return false
        return true
    }
    static async next(guildId : string,hostId : string){
        const server = await getServerByGuildId(guildId)
        let isGame = false
        server.games.map((e,i)=>{
            if(e.hostId === hostId){
                if(!isQuizGame(e)) return
                isGame = true;
                (server.games[i] as QuizGameType).index++
            }
        })
        if(!isGame) throw new Error(`Quiz Game not found`)
        await server.save()
    }
    static async start(guildId : string,hostId : string){
        const server = await getServerByGuildId(guildId)
        let isGame = false
        server.games.map((e,i)=>{
            if(e.hostId === e.hostId){
                if(!isQuizGame(e)) return
                isGame = true;
                (server.games[i] as QuizGameType).started = true
            }
            
        })
        if(!isGame)throw new Error(`Quiz Game not found`)
        await server.save()
    }
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
            let num = Math.floor(Math.random() * ans.length)
            let an = ans[num]
            ans[num] = c
            ans.push(an)
            let t = e.type
            return {
                question : q,
                answers : ans,
                correctIndex : num,
                type : t,
                category : e.category as QuizCategory
            }
        })
        server.games.push({
            ...this.info,
            name : "Quiz Game",
            index : 0,
            players : [{username : this.info.hostName,id : this.info.hostId}],
            quiz : quiz,
            category : this.info.category,
            amount : this.info.amount
        } as QuizGameType)
        await server.save()
    }
}