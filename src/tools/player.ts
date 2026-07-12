import { rooms } from "../state/rooms.js";

export const playerToolSchemas = [
  {
    name: "choose_role",
    description: "Allows a player to choose their role in the game. Valid roles are: Defuser, Expert, Overseer.",
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
        role: {
          type: "string",
          enum: ["Defuser", "Expert", "Overseer"],
          description: "The role you want to claim.",
        },
      },
      required: ["roomCode", "playerId", "role"],
    },
  },
  {
    name: "get_my_view",
    description: "Returns the specific information you are allowed to see based on your role (e.g., the bomb for the Defuser, or the manual for the Expert).",
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
  if (name === "choose_role") {
    const roomCode = args?.roomCode?.toUpperCase();
    const playerId = args?.playerId;
    const role = args?.role;

    if (!roomCode) {
      return { isError: true, content: [{ type: "text", text: "Missing roomCode argument." }] };
    }
    if (!playerId) {
      return { isError: true, content: [{ type: "text", text: "Missing playerId argument." }] };
    }
    
    //check if role is valid or not 
    if (!role || !["Defuser", "Expert", "Overseer"].includes(role)) {
      return { isError: true, content: [{ type: "text", text: "Invalid or missing role. Must be Defuser, Expert, or Overseer." }] };
    }

    const room = rooms.get(roomCode);
    if (!room) {
      return { isError: true, content: [{ type: "text", text: `Error: Room ${roomCode} does not exist.` }] };
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      return { isError: true, content: [{ type: "text", text: `Error: Player ${playerId} not found in room ${roomCode}.` }] };
    }

    // Check if the role is already taken by someone else
    const existingPlayerWithRole = room.players.find(p => p.role === role);
    if (existingPlayerWithRole && existingPlayerWithRole.id !== playerId) {
      return { 
        isError: true, 
        content: [{ type: "text", text: `Error: The role '${role}' is already taken by ${existingPlayerWithRole.name}. Please choose a different role.` }] 
      };
    }

    player.role = role;

    return {
      content: [
        {
          type: "text",
          text: `Success! ${player.name} is now assigned the role of **${role}**.`,
        },
      ],
    };
  }

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
        content: [{ type: "text", text: "The game has not started yet. Call start_game when all roles are filled." }]
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
