export interface Room {
  code: string;
  players: string[];
  bombState: {
    initialized: boolean;
  };
}

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
  do {
    code = generateRoomCode();
  } while (rooms.has(code));
  return code;
}
