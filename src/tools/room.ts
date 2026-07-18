import { generateUniqueRoomCode, rooms, Room, Player } from "../state/rooms.js";
import { createInitialBomb, generateWireModule, generateMorseModule, generateControlPanelModule } from "../state/bomb.js";
import { broadcastEvent, getGameStatusContent } from "../events.js";

export const roomToolSchemas = [
  {
    name: "create_room",
    description: "Creates a new game room. TRIGGER: Call this ONLY when the user types exactly 'create-room [playerName]'.",
    inputSchema: {
      type: "object",
      properties: {
        playerName: {
          type: "string",
          description: "The name you want to use in the game (e.g., 'Agent Smith', 'Diya')",
        },
      },
      required: ["playerName"],
    },
  },
  {
    name: "join_room",
    description: "Joins an existing game room. TRIGGER: Call this ONLY when the user types exactly 'join-[roomCode]-[playerName]'.",
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

export async function handleRoomToolCall(name: string, args: any, sessionId: string) {
  if (name === "create_room") {
    const playerName = args?.playerName;
    
    if (!playerName) {
      return {
        isError: true,
        content: [{ type: "text", text: "Missing playerName argument. Please provide a name to create a room." }]
      };
    }
    
    const code = generateUniqueRoomCode();
    
    // Pick a random role for the host
    const allRoles = ["Defuser", "Expert", "Overseer"];
    const randomRole = allRoles[Math.floor(Math.random() * allRoles.length)];

    const playerId = `P-${Math.floor(Math.random() * 10000)}`;
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      role: randomRole,
      sessionId,
    };

    const newRoom: Room = {
      code,
      players: [newPlayer],
      bomb: createInitialBomb(),
      events: [],
    };
    rooms.set(code, newRoom);
    broadcastEvent(code, `🌟 Room ${code} created! ${newPlayer.name} joined as ${newPlayer.role}. (1/3 players)`);
    
    const statusBlock = getGameStatusContent(code);
    const content: any[] = [
      { type: "text", text: `Room created successfully! Room Code: ${code}\n\nYour Identity:\n- Name: ${newPlayer.name}\n- Player ID: ${newPlayer.id}\n- Role: ${newPlayer.role}\n\nWaiting for 2 more player(s) to join...` },
    ];
    if (statusBlock) content.push(statusBlock);

    return { content };
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
      sessionId,
    };

    room.players.push(newPlayer);
    
    broadcastEvent(roomCode, `👋 Player ${playerName} joined the room as the ${randomRole}! (${room.players.length}/3 players)`);

    let gameStatusMsg = "";
    if (room.players.length === 3) {
      room.bomb.status = "active";
      room.bomb.modules.push(generateWireModule(room.bomb.serialNumber));
      room.bomb.modules.push(generateMorseModule());
      room.bomb.modules.push(generateControlPanelModule(room.bomb));
      gameStatusMsg = "\n\n🚀 THE GAME HAS STARTED! All 3 players have joined. The bomb is now ACTIVE! 🚀";
    } else {
      const needed = 3 - room.players.length;
      gameStatusMsg = `\n\nWaiting for ${needed} more player(s) to join before the game starts... Ask your friends to join using room code: ${roomCode}`;
    }

    const playersList = room.players.map(p => `- ${p.name} (Role: ${p.role})`).join("\n");
    const statusBlock = getGameStatusContent(roomCode);
    const content: any[] = [
      { type: "text", text: `Successfully joined room ${roomCode}!\n\nYour Identity:\n- Name: ${newPlayer.name}\n- Player ID: ${newPlayer.id}\n- Role: ${newPlayer.role}\n${gameStatusMsg}` },
    ];
    if (statusBlock) content.push(statusBlock);

    return { content };
  }

  return {
    isError: true,
    content: [{ type: "text", text: `Tool not found in room tools: ${name}` }]
  };
}
