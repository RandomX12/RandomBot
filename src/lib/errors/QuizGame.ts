export const QzErrors = {
  "201": {
    name: "USER_NOT_IN_QUIZGAME",
    message: "this user is not in game",
  },
  "202": {
    name: "USER_IN_QUIZGAME",
    message: "this user is in quiz game",
  },
  "203": {
    name: "MAX_GAMES",
    message: "The server has reached the maximum number of games",
  },
  "204": {
    name: "GAME_EXIST",
    message: "this game already exist",
  },
  "205": {
    name: "CANNOT_ANSWER",
    message: "you can't answer now",
  },
  "301": {
    name: "INVALID_AMOUNT",
    message: `invalid question amount`,
  },
  "302": {
    name: "INVALID_ID",
    message: "invalid game id",
  },
  "303": {
    name: "NOT_QUIZ_GAME",
    message: "This is not a quiz game",
  },
  "304": {
    name: "INVALID_CHANNEL",
    message: "the game's channel is not valid",
  },
  "404": {
    message: "Quiz game not found",
    name: "NOT FOUND",
  },
  "405": {
    name: "USER_NOTFOUND",
    message: `user not found`,
  },
  "406": {
    name: "ANNOUNCEMENT_NOTFOUND",
    message: `game announcement not found`,
  },
  "408": {
    name: "CHANNEL_NOTFOUND",
    message: "game channel not found",
  },
  "409": {
    name: "GUILD_NOTFOUND",
    message: "guild not found",
  },
  "500": {
    name: "UNKNOWN_ERROR",
    message: "unexpected error occured",
  },
  "501": {
    name: "UNABLE_CREATE_GAME",
    message: "unable to create the game",
  },
  "502": {
    name: "UNABLE_START_GAME",
    message: "unable to start the game",
  },
  "503": {
    name: "STARTING_ERROR",
    message: "an error occurred when starting the game",
  },
  "504": {
    name: "ENDING_ERROR",
    message: "an error occurred when ending the game",
  },
  "505": {
    name: "UNABLE_QUIZ_FETCH",
    message: "unable to fetch the quiz from the api.",
  },
} satisfies Record<number, { message: string; name: string }>;

export type QzGameErrorCode = keyof typeof QzErrors;
export default class QzGameError extends Error {
  constructor(public code: QzGameErrorCode, description?: string) {
    super(description);
    Error.captureStackTrace(this);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
