import { Game, Member } from "../model/discordServers"
import Qz , { answers, Qs, QuizGame as QuizGameType } from "../model/QuizGame"
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
    
export const rank = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", "1️⃣1️⃣", "1️⃣2️⃣", "1️⃣3️⃣", "1️⃣4️⃣", "1️⃣5️⃣", "1️⃣6️⃣", "1️⃣7️⃣", "1️⃣8️⃣", "1️⃣9️⃣", "2️⃣0️⃣"];
export type CategoriesNum = 9 | 15 | 21 | 23 | 22 | 19 | 18 | 27 | 28
export type QuizCategory = "Random" | "GeneralKnowledge" | "VideoGames" | "Sports" | "History" | "Geography" | "Mathematics" | "Computers" | "Animals" | "Vehicles";
type Categories = Record<QuizCategory,CategoriesNum | "any">
export type answerType = "multiple" | "boolean"
export const regex = /&quot;|&amp;|&#039;|&eacute;|&#039;|&amp;|&quot;|&shy;|&ldquo;|&rdquo;|&#039;|;|&/g 
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
export const QuizCategoryImg : Record<QuizCategory,string> = {
    Random : "https://hips.hearstapps.com/hmg-prod/images/quiz-questions-answers-1669651278.jpg",
    GeneralKnowledge : "https://cdn-icons-png.flaticon.com/512/5248/5248763.png",
    VideoGames : "https://cdn-icons-png.flaticon.com/512/3408/3408506.png",
    Sports : "https://cdn-icons-png.flaticon.com/512/857/857455.png",
    History : "https://cdn.imgbin.com/0/14/17/ancient-scroll-icon-history-icon-scroll-icon-gHvzqatT.jpg",
    Geography : "https://upload.wikimedia.org/wikipedia/commons/1/1f/Geography_icon.png",
    Mathematics : "https://cdn-icons-png.flaticon.com/512/43/43102.png",
    Computers : "https://cdn-icons-png.flaticon.com/512/4703/4703650.png",
    Animals : "https://static.thenounproject.com/png/13643-200.png",
    Vehicles : "https://cdn2.iconfinder.com/data/icons/cars-tractors-and-trucks/117/cars-01-512.png",
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
    static async setAns(guildId : string,hostId : string,userId : string,ans : answers){
        const server = await getServerByGuildId(guildId)
        let isGame : boolean = false
        let isUser : boolean = false
        server.games.map((e,i)=>{
            if(e.hostId === hostId){
                if(!isQuizGame(e)) return
                isGame = true
                e.players.map((ele,index)=>{
                    if(ele.id === userId){
                        if(!(server.games[i] as QuizGameType).players[index].answers){
                            (server.games[i] as QuizGameType).players[index].answers = [ans]
                        }else{
                            (server.games[i] as QuizGameType).players[index].answers[e.index] = ans
                        }
                        isUser = true
                    }
                })
            }
        }) 
        if(!isGame) throw new Error(`Game not found !!`)
        if(!isUser) throw new Error(`User not found !!`);
        await server.save()
    }
    static async scanAns(guildId : string,hostId : string){
        const server = await getServerByGuildId(guildId)
        let isGame : boolean = false
        let ans : answers[] = ["A","B","C","D"]
        let gameIndex : number
        server.games.map((e,i)=>{
            if(e.hostId === hostId){
                if(!isQuizGame(e)) return
                isGame = true;
                gameIndex = i
                e.players.map((ele,index)=>{
                    if(!ele.answers[e.index]){
                        (server.games[i] as QuizGameType).players[index].answers.push("N")
                        return
                    }
                    if(ele.answers[e.index] === ans[e.quiz[e.index].correctIndex]){
                        if((server.games[i] as QuizGameType).players[index].score){
                            (server.games[i] as QuizGameType).players[index].score++
                        }else{
                            (server.games[i] as QuizGameType).players[index].score = 1
                        }
                    }
                })
            }
        })
        if(!isGame) throw new Error(`game not found`);
        (server.games[gameIndex] as QuizGameType).index++
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