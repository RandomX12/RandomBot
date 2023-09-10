import { DiscordAPIError } from "discord.js";
import DiscordServersError, { ServersErrors } from "./DiscordServers";
import QzGameError, { QzErrors } from "./QuizGame";

/**
 * returns an understandable error message for the user
 */
export default function handleError<T extends unknown>(error: T): string {
  if (error instanceof QzGameError) {
    return QzErrors[error.code]?.message || "An unexpected error occurred";
  }
  if (error instanceof DiscordServersError) {
    return ServersErrors[error.code]?.message || "An unexpected error occurred";
  }
  if (error instanceof DiscordAPIError) {
    if (error.code === 50001) {
      return `Missing Access`;
    } else if (error.code === 50013) {
      return "Missing Permissions";
    }
  }
  return `An unexpected error occurred`;
}
