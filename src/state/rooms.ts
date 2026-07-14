import { Bomb, createInitialBomb } from "./bomb.js";

//Room is the actual obejct which contains what a room should have 
export interface Player {
  id: string;
  name: string;
  role: string;
}

export interface Room {
  code: string;
  players: Player[];
  bomb: Bomb;
  events: string[];
}

//rooms is a dictionary which contains key as room code and value as the Room object
export const rooms = new Map<string, Room>();

export function generateRoomCode(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export function generateUniqueRoomCode(): string {
  let code = "";
  // generating unique room codes if it exists in the rooms dictionary
  do {
    code = generateRoomCode();
  } while (rooms.has(code));
  return code;
}
