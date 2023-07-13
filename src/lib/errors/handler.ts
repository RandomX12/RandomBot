

import DiscordServersError, { ServersErrors } from "./DiscordServers";
import QzGameError, { QzErrors } from "./QuizGame";

/**
 * returns an understandable error message for the user
 */
export default function handleError(error : unknown){
    if(error instanceof QzGameError){
        return QzErrors[error.code]?.message || "An unexpected error occurred"
    }
    if(error instanceof DiscordServersError){
        return ServersErrors[error.code]?.message || "An unexpected error occurred"
    }
    return `An unexpected error occurred`
}