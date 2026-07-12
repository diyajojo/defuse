import { rooms } from "../state/rooms.js";

export const playerToolSchemas = [
  {
    name: "get_my_view",
    description: "Returns the specific information you are allowed to see based on your role (e.g., the bomb for the Defuser, or the manual for the Expert). Call this when the user types 'view-[roomCode]-[playerId]'.",
    inputSchema: {
      type: "object",
      properties: {
        roomCode: {
          type: "string",
          description: "The 6-character room code.",
        },
        playerId: {
          type: "string",
          description: "Your unique Player ID.",
        },
      },
      required: ["roomCode", "playerId"],
    },
  },
];

export async function handlePlayerToolCall(name: string, args: any) {
  if (name === "get_my_view") {
    const roomCode = args?.roomCode?.toUpperCase();
    const playerId = args?.playerId;

    if (!roomCode) {
      return { isError: true, content: [{ type: "text", text: "Missing roomCode argument." }] };
    }
    if (!playerId) {
      return { isError: true, content: [{ type: "text", text: "Missing playerId argument." }] };
    }

    const room = rooms.get(roomCode);
    if (!room) {
      return { isError: true, content: [{ type: "text", text: `Error: Room ${roomCode} does not exist.` }] };
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      return { isError: true, content: [{ type: "text", text: `Error: Player ${playerId} not found in room ${roomCode}.` }] };
    }

    if (room.bomb.status === "uninitialized") {
      return {
        content: [{ type: "text", text: `The game has not started yet. Waiting for 3 players to join (Currently: ${room.players.length}/3).` }]
      };
    }

    if (player.role === "Defuser") {
      const wireModule = room.bomb.modules.find(m => m.type === "wires");
      const wireText = wireModule ? wireModule.wires.join(", ") : "None";
      return {
        content: [{ type: "text", text: `[DEFUSER VIEW]\nYou are looking at the bomb.\nTimer: ${room.bomb.timerSeconds}s remaining\nStrikes: ${room.bomb.strikes}/${room.bomb.maxStrikes}\n\nMODULE 1: Wires\nThere are wires of the following colors in order: ${wireText}` }]
      };
    } else if (player.role === "Expert") {
      return {
        content: [{ type: "text", text: `[EXPERT VIEW]\nYou are looking at the Bomb Defusal Manual.\n\n--- WIRE MODULE INSTRUCTIONS ---\n1. If there is a red wire, cut the second wire.\n2. Otherwise, if the last wire is white, cut the last wire.\n3. Otherwise, if there is a blue wire, cut the first wire.\n4. Otherwise, cut the last wire.` }]
      };
    } else if (player.role === "Overseer") {
      return {
        content: [{ type: "text", text: `[OVERSEER VIEW]\nYou are monitoring the external casing of the bomb.\nTimer: ${room.bomb.timerSeconds}s remaining\nSerial Number: X1Y-234` }]
      };
    } else {
      return {
        isError: true,
        content: [{ type: "text", text: `You have not chosen a valid role yet. Your current role is: ${player.role}` }]
      };
    }
  }

  return {
    isError: true,
    content: [{ type: "text", text: `Tool not found in player tools: ${name}` }],
  };
}
