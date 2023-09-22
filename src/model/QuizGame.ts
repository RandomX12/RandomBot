/**
 * this file will be deleted in the stable version of random bot 1.0.0
 */

import { Schema, model } from "mongoose";
import { Game, Member } from "./discordServers";
import { QuizCategory, answerType, difficulty } from "../lib/QuizGame";
import { TGameStart } from "../lib/DiscordServersConfig";

export interface Qs {
  question: string;
  answers: string[];
  correctIndex: number;
  type: answerType;
  category: QuizCategory;
}
export type answer = "A" | "B" | "C" | "D" | "N";
export type AnswerBody = {
  index: number;
  answer: answer;
};
export interface QuizGamePlayer extends Member {
  answers?: AnswerBody[];
  score?: number;
  ready?: boolean;
}
export interface QuizGame extends Game {
  players: QuizGamePlayer[];
  index: number;
  maxPlayers: number;
  announcementId: string;
  started?: boolean;
  end?: boolean;
  quiz: Qs[];
  category: QuizCategory;
  amount: number;
  time?: number;
  hostUserId: string;
  mainChannel?: boolean;
  gameStart?: TGameStart;
  guildId: string;
  difficulty?: difficulty;
  bannedPlayers: string[];
  invitedPlayers: string[];
  canAnswer: boolean;
}
