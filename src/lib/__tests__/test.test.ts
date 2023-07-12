import QuizGame from "../../lib/QuizGame";
import { connectDB } from "./../connectDB";

describe("lunch bot",()=>{
    beforeAll(async()=>{
        await connectDB()
    })
    it.only("get the game",async()=>{
        await expect(new QuizGame("15456468",{
            hostName : "",
            hostId : "",
            hostUserId : "",
            gameStart : 1,
            maxPlayers : 5, 
            amount : 4,
            announcementId : "",
            channelId : "",
            category : "Computers"

        }).save()).resolves.toBe(undefined)
    })
})