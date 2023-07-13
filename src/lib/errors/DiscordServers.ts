
export const ServersErrors = {
    "401" : {
        name : "COMMAND_CONFIG_NOTFOUND",
        message : "this command is not configured in this server"
    },
    "402" : {
        name : "NO_CONFIG",
        message : "this server has no configuration"
    },
    "403" : {
        name : "MEMBER_NOTFOUND",
        message : "user is not found"
    },
    "404" : {
        name : "NOTFOUND",
        message : "server not found"
    }
} satisfies Record<number,{name :string,message : string}>

export type DiscordServersErrorCode = keyof typeof ServersErrors
export default class DiscordServersError extends Error{
    constructor(public code : DiscordServersErrorCode,description : string){
        super(description)
        Object.setPrototypeOf(this,new.target.prototype)
        Error.captureStackTrace(this)
    }
}