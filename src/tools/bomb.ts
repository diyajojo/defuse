import { rooms } from "../state/rooms.js";

export const bombToolSchemas = [
  {
    name: "get_bomb_state",
    description: "Returns the current state of the bomb in a room, including timer, strikes, and modules.",
    inputSchema: {
      type: "object",
      properties: {
        roomCode: {
          type: "string",
          description: "The 6-character room code.",
        },
      },
      required: ["roomCode"],
    },
  },
];

export async function handleBombToolCall(name: string, args: any) {
  if (name === "get_bomb_state") {
    const roomCode = args?.roomCode?.toUpperCase();
    if (!roomCode) {
      return {
        isError: true,
        content: [{ type: "text", text: "Missing roomCode argument" }]
      };
    }

    const room = rooms.get(roomCode);
    if (!room) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: Room ${roomCode} does not exist.` }]
      };
    }

    const bomb = room.bomb;
    
    // Formatting the bomb state nicely
    const output = [
      `💣 BOMB STATUS [${bomb.status.toUpperCase()}] 💣`,
      `Timer: ${bomb.timerSeconds} seconds remaining`,
      `Strikes: ${bomb.strikes}/${bomb.maxStrikes}`,
      `Modules Active: ${bomb.modules.length}`,
    ].join("\n");

    return {
      content: [
        {
          type: "text",
          text: output,
        },
      ],
    };
  }

  return {
    isError: true,
    content: [{ type: "text", text: `Tool not found in bomb tools: ${name}` }]
  };
}
