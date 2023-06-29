import { ButtonInteraction, CacheType, ChatInputCommandInteraction, GuildTextBasedChannel, Message, User } from "discord.js";
import { Game as GameT, Member } from "../model/discordServers"
import { answers, Qs, QuizGamePlayer, QuizGame as QuizGameType } from "../model/QuizGame"
import DiscordServers, { getServerByGuildId } from "./DiscordServers";
import { log, warning } from "./cmd";
export function isQuizGame(game : GameT) : game is QuizGameType{
    if(game.name === "Quiz Game"){
        return true
    }
}
export function getCategoryByNum<T extends CategoriesNum | "any">(num :T){
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
export function getCategoryNumByName<T extends QuizCategory,R extends typeof categories>(name : T) : R[T] {
    let catName : R[T]
    let cats : R = categories as R
    Object.keys(categories).map((e)=>{
        if(e === name){
            catName = cats[name]
        }
    })
    return catName
}

interface APIresponse{
    results : {category : string,type : answerType,difficulty :"easy",question : string,correct_answer : string,incorrect_answers : string[]}[]
}
    
export const rank = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", "1️⃣1️⃣", "1️⃣2️⃣", "1️⃣3️⃣", "1️⃣4️⃣", "1️⃣5️⃣", "1️⃣6️⃣", "1️⃣7️⃣", "1️⃣8️⃣", "1️⃣9️⃣", "2️⃣0️⃣"];
export type CategoriesNum = 9 | 15 | 21 | 23 | 22 | 19 | 18 | 27 | 28
export type answerType = "multiple" | "boolean"
export const regex = /&quot;|&amp;|&#039;|&eacute;|&#039;|&amp;|&quot;|&shy;|&ldquo;|&rdquo;|&#039;|;|&/g 
export const categories  = {
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
} as const
export type QuizCategory = keyof typeof categories;
export const QuizCategoryImg : Record<QuizCategory,string> = {
    Random : "https://hips.hearstapps.com/hmg-prod/images/quiz-questions-answers-1669651278.jpg",
    GeneralKnowledge : "https://cdn-icons-png.flaticon.com/512/2762/2762294.png",
    VideoGames : "https://cdn-icons-png.flaticon.com/512/3408/3408506.png",
    Sports : "https://cdn-icons-png.flaticon.com/512/857/857455.png",
    History : "https://cdn.imgbin.com/0/14/17/ancient-scroll-icon-history-icon-scroll-icon-gHvzqatT.jpg",
    Geography : "https://cdn-icons-png.flaticon.com/256/1651/1651598.png",
    Mathematics : "https://cdn-icons-png.flaticon.com/512/4954/4954397.png",
    Computers : "https://cdn-icons-png.flaticon.com/512/4703/4703650.png",
    Animals : "https://cdn-icons-png.flaticon.com/512/616/616408.png",
    Vehicles : "https://cdni.iconscout.com/illustration/premium/thumb/car-2953450-2451640.png",
}
interface QuizGameInfo{
    hostId : string,
    hostName : string,
    hostUserId : string,
    maxPlayers : number,
    channelId : string,
    announcementId : string,
    category : QuizCategory,
    amount : number,
    time? : number,
    mainChannel? : boolean
}

function createGameLog(){
    return function(target : Object,key : string,descriptor : PropertyDescriptor){
        let originalFn = descriptor.value
        descriptor.value = async function(){
            log({textColor : "Yellow",timeColor : "Yellow",text : `creating Quiz Game...`})
            await originalFn.apply(this,[])
            log({textColor : "Blue",timeColor : "Blue",text : `Game created`})
        }
    }
}
export function deleteGameLog(){
    return function(target : Object,key : string,descriptor : PropertyDescriptor){
        const originalFn = descriptor.value
        descriptor.value = async function(...args : string[]){
            await originalFn.apply(this,args)
            log({text : "Game deleted",textColor :"Magenta",timeColor : "Magenta"})
        }
    }
}

export const amount = [3,10] 
export const maxPlayers = [2,20]
export const maxGames = 15
export default class QuizGame{
    
    static async join(guildId : string,hostId : string,user : User){
        const server = await getServerByGuildId(guildId)
        let gameFound = false
        for(let i = 0;i<server.games.length;i++){
            if(server.games[i].hostId === hostId){
                if(!isQuizGame(server.games[i])) throw new Error(`This game is not Quiz Game`)
                gameFound = true
                const isIn = await DiscordServers.isInGame(guildId,user.id)
                if(isIn) throw new Error(`User id="${user.id} is already in the game"`)
                server.games[i].players.push({username  :user.tag,id : user.id})
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
                if(!isQuizGame(e)) return
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
    /**
     * This function will no longer be supported in the futur versions of RandomBot
     */
    static async getGameWithHostId(guildId : string,hostId : string){
        warning(`This function will no longer be supported in the futur versions of RandomBot`)
        const game = new QzGame(guildId,hostId)
        await game.fetch()
        if(!isQuizGame(game)) throw new Error(`Game With hostId="${hostId}" is not a Quiz Game`)
        return game
    }
    static async isIn(guildId : string,hostId : string,userId : string) : Promise<boolean>{
        const server = await getServerByGuildId(guildId)
        let game : GameT
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
            if(e.hostId === hostId){
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
    static async removeAns(guildId : string,userId : string){
        const server = await getServerByGuildId(guildId)
        server.games.map((e,i)=>{
            if(!isQuizGame(e)) return
            e.players.map((ele,j)=>{
                if(ele.id === userId){
                    (server.games[i] as QuizGameType).players[j].answers[e.index] = "N"
                }
            })
        })
        await server.save()
    }
    static async getQuizGamewithHostUserId(guildId : string,hostUserId : string){
        const server = await getServerByGuildId(guildId)
        for(let i = 0;i<server.games.length;i++){
            if(isQuizGame(server.games[i])) {
                if((server.games[i]as QuizGameType ).hostUserId === hostUserId){
                    return server.games[i] as QuizGameType
                }
            }
        }
        throw new Error(`Game not found`)
    }
    static async getAnnouncement(interaction : ChatInputCommandInteraction<CacheType> | ButtonInteraction<CacheType>,guildId: string,hostId : string){
        const server = await getServerByGuildId(guildId)
        for(let i = 0;i<server.games.length;i++){
            if(server.games[i].hostId === hostId){
                if(!isQuizGame(server.games[i])) throw new Error(`This game is not a Quiz Game`)
                const channel : any = await interaction.guild.channels.cache.get(server.games[i].channelId).fetch()
                const announcement : Message<true> = channel.messages.cache.get((server.games[i] as QuizGameType).announcementId)
                return announcement
            }
        }
        throw new Error(`announcement not found`)
    }
    static async getChannel(interaction : ChatInputCommandInteraction<CacheType> | ButtonInteraction<CacheType>,hostId : string){
        const server = await getServerByGuildId(interaction.guildId)
        for(let i = 0 ;i<server.games.length;i++){
            if(server.games[i].hostId === hostId){
                if(!isQuizGame(server.games[i])) throw new Error(`This game is not quiz game`)
                const channel : any = await interaction.guild.channels.cache.get((server.games[i] as QuizGameType).channelId).fetch()
                return channel as GuildTextBasedChannel
            }
        }
        throw new Error(`Game with id="${hostId}" not found`)
    }
    static async getGameWithUserId(guildId : string,userId :string){
        const server  = await getServerByGuildId(guildId)
        for(let i = 0;i<server.games.length;i++){
            let isIn = false
            for(let j = 0;j< server.games[i].players.length;j++){
                if(server.games[i].players[j].id === userId){
                    isIn = true
                    if(server.games[i].name === "Quiz Game"){
                        const g = new QzGame(guildId,server.games[i].hostId)
                        g.applyData(server.games[i])
                        return g
                    }else{
                        throw new Error(`This is not a quiz game`)
                    }
                }
            }
            if(isIn) return
        }
        throw new Error(`Game not found`)
    }

    constructor(public serverId : string,public info : QuizGameInfo,public empty? : boolean){
        if(info.amount < amount[0] || info.amount > amount[1]) throw new Error(`Amount must be between 3 and 10`)
    }
    @createGameLog()
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
        let qz = new Quiz(this.info.category,this.info.amount)
        await qz.fetch()
        const quiz = qz.quiz
        let players = [{username : this.info.hostName,id : this.info.hostUserId}]
        if(this.empty){
            players = []
        }
        server.games.push({
            ...this.info,
            name : "Quiz Game",
            index : 0,
            players : players,
            quiz : quiz,
            category : this.info.category,
            amount : this.info.amount,
            time : this.info.time || 15*1000,
            hostId : this.info.hostId,
            hostUserId : this.info.hostUserId,
        } as QuizGameType)
        await server.save()
    }
}


export abstract class Game implements GameT{
    
    static async getGame(guildId : string,hostId : string){
        const server = await getServerByGuildId(guildId)
        for(let i = 0;i<server.games.length;i++){
            if(server.games[i].hostId === hostId){
                return server.games[i]
            }
        }
        throw new Error(`Game not found with id="${hostId}"`)
    }
    static async getGameWithUserId(guildId : string,userId : string){
        const server  = await getServerByGuildId(guildId)
        for(let i = 0;i<server.games.length;i++){
            let isIn = false
            for(let j = 0;j< server.games[i].players.length;j++){
                if(server.games[i].players[j].id === userId){
                    isIn = true
                    if(server.games[i].name === "Quiz Game"){
                        const g = new QzGame(guildId,server.games[i].hostId)
                        g.applyData(server.games[i])
                        return g
                    }
                    return server.games[i]
                }
            }
            if(isIn) return
        }
        throw new Error(`Game not found`)
    }
    
    abstract hostName: string;
    abstract players?: Member[];
    abstract channelId: string;
    abstract name: "Spy Game" | "Quiz Game";
    abstract hostId: string;
    abstract guildId : string

    abstract update() :void
    abstract delete(reason? : string) : void
}


/**
 * The New Constructor for Quiz Game
 */
export class QzGame extends Game implements QuizGameType{
    /**
     * New Get game Function
     * @param guildId Server id
     * @param hostId game id
     * @returns new QzGame()
     */
    static async getGame(guildId: string, hostId: string): Promise<QzGame> {
        const server = await getServerByGuildId(guildId)
        for(let i = 0;server.games.length;i++){
            if(server.games[i].hostId  === hostId){
                if(!isQuizGame(server.games[i])) throw new Error(`This is not a quiz game`)
                const game = new QzGame(server.serverId,server.games[i].hostId)
                game.applyData(server.games[i])
                return game
            }
        }
        throw new Error(`Game with id="${hostId}" not found`)
    }
    
    
    
    public hostName: string;
    public name: "Spy Game" | "Quiz Game";
    public players: QuizGamePlayer[];
    public channelId: string;
    /**
     * Round number of the game.
     * start from 0
     */
    public index : number = 0;
    /**
     * id of the user who creates the game
     */
    public readonly hostUserId : string;
    public maxPlayers : number;
    public announcementId : string;
    public started : boolean = false;
    public end : boolean = false;
    /**
     * Number of questions in the game
     */
    public amount: number;
    /**
     * All the questions and the answers 
     */
    public quiz: Qs[];
    public category: QuizCategory;
    /**
     * Time for each question
     */
    public time?: number;
    public mainChannel?: boolean = false;
    /**
     * get the round body
     */
    public round : Qs | null
    /**
     * Get all game data without the methods
     */
    get cache(){
        const cache = this
        delete cache.delete
        delete cache.applyData
        delete cache.fetch
        delete cache.update
        return cache as QuizGameType
    }
    constructor(
    /**
     * Server id 
     */
    public readonly guildId : string,
    /**
     * Game id
     */
    public readonly hostId : string){super()}
    /**
     * Set the game data.
     */
    applyData(game : Partial<QuizGameType>){
        this.name = game.name || this.name
        this.hostName = game.hostName || this.hostName
        this.players = game.players ||this.players
        this.channelId = game.channelId||this.channelId
        this.index = game.index || this.index
        this.maxPlayers = game.maxPlayers||this.maxPlayers
        this.announcementId = game.announcementId||this.announcementId
        this.started = game.started||this.started
        this.end = game.end||this.end
        this.amount = game.amount||this.amount
        this.quiz = game.quiz||this.quiz
        this.category = game.category||this.category
        this.time = game.time||this.time
        this.mainChannel = game.mainChannel ||this.mainChannel
    }
    /**
     * Fetch the game data from the database and update the local props
     */
    async fetch() : Promise<void>{
        const game = await Game.getGame(this.guildId,this.hostId)
        if(!isQuizGame(game)) throw new Error("This game is not a quiz game")
        this.applyData(game)
    }
    /**
     * Save changes in the database
     */
    async update(): Promise<void> {
        const server = await getServerByGuildId(this.guildId)
        for(let i = 0 ;i<server.games.length;i++){
            if(server.games[i].hostId === this.hostId){
                server.games[i] = this.cache
                await server.save()
            }
        }
    }
    /**
     * Delete the game from the database
     */
    async delete(reason?: string): Promise<void> {
        await DiscordServers.deleteGame(this.guildId,this.hostId)
    }
    /**
     * set the property started to true and save it in the database
     */
    async start() : Promise<void>{
        const server = await getServerByGuildId(this.guildId)
        for(let i = 0;i<server.games.length;i++){
            if(server.games[i].hostId === this.hostId){
                if(!isQuizGame(server.games[i])) throw new Error(`This game is not Quiz Game`);
                (server.games[i] as QuizGameType).started = true
                await server.save()
                this.started = true
                return
            }
        }
        throw new Error(`Game with id="${this.hostId}" is not found`)
    }
    /**
     * set the property end to true and save it in the database
     */
    async endGame() : Promise<void>{
        const server = await getServerByGuildId(this.guildId)
        for(let i = 0;i<server.games.length;i++){
            if(server.games[i].hostId === this.hostId){
                if(!isQuizGame(server.games[i])) throw new Error(`This is not a Quiz Game`);
                (server.games[i] as QuizGameType).end = true
                await server.save()
                this.end = true
                return
            }
        }
        throw new Error(`Game with id="${this.hostId}" is not found`)
    }
    /**
     * @returns Game Generator
     */
    *play(){
        for(let i = 0;i<this.amount;i++){
            this.round = this.quiz[i]
            yield this.quiz[i]
        }
    }
}
 
/**
 * Stop the execution of the code
 * @param time timer
 */
export async function stop(time : number){
    await new Promise((res)=>setTimeout(res,time))
}

interface QuizT{
    category : QuizCategory,
    amount  : number,
    quiz : Qs[],
    fetch : ()=> void,
    categoryNum : CategoriesNum | 'any'
}

/**
 * New Constructor of Quiz.
 */
export class Quiz<CategoryT extends QuizCategory> implements QuizT{
    /**
     * Quiz body
     */
    public quiz: Qs[];
    /**
     * Number of the category in the API
     */
    public categoryNum = getCategoryNumByName(this.category)
    constructor(
    /**
     * Name of the category
     */
    public category : CategoryT,
    /**
     * Number of questions
     */
    public amount : number){}
    /**
     * Fetch the quiz from the API
     */
    async fetch() : Promise<void> {
        let catUrl = `&category=${this.categoryNum}`
        if(this.categoryNum === "any"){
            catUrl = ""
        }
        const req = await fetch(`https://opentdb.com/api.php?amount=${this.amount}&difficulty=easy${catUrl}`)
        const res : APIresponse = await req.json()
        this.quiz = res.results.map((e)=>{
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
    }
}