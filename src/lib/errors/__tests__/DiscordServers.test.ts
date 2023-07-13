import DiscordServersError from "../DiscordServers"


describe("test DiscordServersError system",()=>{
    it("create new error",()=>{
        const error = new DiscordServersError("404","any thing")
        expect(error.code).toBe("404")
        expect(error.message).toBe("any thing")
        expect(error.name).toBeDefined()
        expect(error.stack).toBeDefined()
    })
    it("create new error with invalid code",()=>{
        //@ts-ignore
        const error = new DiscordServersError("4048","any thing")
        expect(error.code).toBe("4048")
        expect(error.message).toBe("any thing")
        expect(error.name).toBeDefined()
        expect(error.stack).toBeDefined()
    })
})