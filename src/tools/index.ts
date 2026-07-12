import { generateUniqueRoomCode, rooms, Room } from "../state/rooms.js";

export const toolsSchema = [
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
    description: "Joins an existing game room using its 6-character room code.",
    inputSchema: {
      type: "object",
      properties: {
        roomCode: {
          type: "string",
          description: "The 6-character alphanumeric room code (case-insensitive)",
        },
      },
      required: ["roomCode"],
    },
  },
];

export async function handleToolCall(name: string, args: any) {
  if (name === "create_room") {
    const code = generateUniqueRoomCode();
    const newRoom: Room = {
      code,
      players: [],
      bombState: { initialized: false },
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
    if (!roomCode) {
      throw new Error("Missing roomCode argument");
    }
    const room = rooms.get(roomCode);
    if (!room) {
      return {
        content: [
          {
            type: "text",
            text: `Error: Room ${roomCode} does not exist.`,
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text",
          text: `Successfully joined room: ${roomCode}.`,
        },
      ],
    };
  }

  throw new Error(`Tool not found: ${name}`);
}
