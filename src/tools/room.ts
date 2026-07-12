import { generateUniqueRoomCode, rooms, Room, Player } from "../state/rooms.js";
import { createInitialBomb } from "../state/bomb.js";

export const roomToolSchemas = [
  {
    name: "create_room",
    description: "Creates a new game room with a unique 6-character code and returns the room details.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "join_room",
    description: "Joins an existing game room using its 6-character room code. Registers the user as a player.",
    inputSchema: {
      type: "object",
      properties: {
        roomCode: {
          type: "string",
          description: "The 6-character alphanumeric room code (case-insensitive)",
        },
        playerName: {
          type: "string",
          description: "The name you want to use in the game (e.g., 'Agent Smith', 'Diya')",
        },
      },
      required: ["roomCode", "playerName"],
    },
  },
];

export async function handleRoomToolCall(name: string, args: any) {
  if (name === "create_room") {
    const code = generateUniqueRoomCode();
    const newRoom: Room = {
      code,
      players: [],
      bomb: createInitialBomb(),
    };
    rooms.set(code, newRoom);
    return {
      content: [
        {
          type: "text",
          text: `Room created successfully! Room Code: ${code}`,
        },
      ],
    };
  }

  if (name === "join_room") {
    const roomCode = args?.roomCode?.toUpperCase();
    const playerName = args?.playerName;
    
    if (!roomCode) {
      return {
        isError: true,
        content: [{ type: "text", text: "Missing roomCode argument" }]
      };
    }
    
    if (!playerName) {
      return {
        isError: true,
        content: [{ type: "text", text: "Missing playerName argument. Please provide a name to join." }]
      };
    }

    const room = rooms.get(roomCode);
    if (!room) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error: Room ${roomCode} does not exist.`,
          },
        ],
      };
    }

    if (room.players.length >= 3) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: Room ${roomCode} is already full (3 players max).` }]
      };
    }

    // Determine available roles
    const allRoles = ["Defuser", "Expert", "Overseer"];
    const takenRoles = room.players.map(p => p.role);
    const availableRoles = allRoles.filter(r => !takenRoles.includes(r));
    
    // Pick a random role from the available ones
    const randomRole = availableRoles[Math.floor(Math.random() * availableRoles.length)];

    // Generate a simple Player ID and assign the role
    const playerId = `P-${Math.floor(Math.random() * 10000)}`;
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      role: randomRole,
    };

    room.players.push(newPlayer);
    
    let gameStatusMsg = "";
    if (room.players.length === 3) {
      room.bomb.status = "active";
      gameStatusMsg = "\n\n🚀 THE GAME HAS STARTED! All 3 players have joined. The bomb is now ACTIVE! 🚀";
    } else {
      const needed = 3 - room.players.length;
      gameStatusMsg = `\n\nWaiting for ${needed} more player(s) to join before the game starts... Ask your friends to join using room code: ${roomCode}`;
    }

    const playersList = room.players.map(p => `- ${p.name} (Role: ${p.role})`).join("\n");

    return {
      content: [
        {
          type: "text",
          text: `Successfully joined room ${roomCode}!\n\nYour Identity:\n- Name: ${newPlayer.name}\n- Player ID: ${newPlayer.id}\n- Role: ${newPlayer.role}\n\nCurrent Players in Room:\n${playersList}${gameStatusMsg}`,
        },
      ],
    };
  }

  return {
    isError: true,
    content: [{ type: "text", text: `Tool not found in room tools: ${name}` }]
  };
}
