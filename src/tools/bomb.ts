import { rooms } from "../state/rooms.js";
import { broadcastEvent, getGameStatusContent } from "../events.js";

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
  {
    name: "get_updates",
    description: "Returns the latest game status, all players, bomb state, and recent events for a room. Call this when the user types 'status-[roomCode]'.",
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
  {
    name: "interact",
    description: "Allows the Defuser to interact with the bomb's physical components. Call this when the user types a command like 'cut-[WIRE]-[roomCode]-[playerId]'.",
    inputSchema: {
      type: "object",
      properties: {
        roomCode: { type: "string", description: "The 6-character room code." },
        playerId: { type: "string", description: "Your unique Player ID." },
        action: { 
          type: "string", 
          enum: ["cut_wire"],
          description: "The type of interaction to perform (e.g., 'cut_wire')." 
        },
        target: { 
          type: "string",
          description: "The target of the action, e.g. '2' to cut the second wire."
        }
      },
      required: ["roomCode", "playerId", "action", "target"]
    }
  }
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
    const mins = Math.floor(bomb.timerSeconds / 60);
    const secs = bomb.timerSeconds % 60;
    
    // Formatting the bomb state nicely
    const output = [
      `💣 BOMB STATUS [${bomb.status.toUpperCase()}] 💣`,
      `Timer: ${mins}m ${secs}s remaining`,
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

  if (name === "get_updates") {
    const roomCode = args?.roomCode?.toUpperCase();
    if (!roomCode) {
      return { isError: true, content: [{ type: "text", text: "Missing roomCode argument" }] };
    }
    const room = rooms.get(roomCode);
    if (!room) {
      return { isError: true, content: [{ type: "text", text: `Error: Room ${roomCode} does not exist.` }] };
    }

    const dashboardUrl = `http://localhost:3001/game/${roomCode}`;
    const statusBlock = getGameStatusContent(roomCode);
    const content: any[] = [{ type: "text", text: `📡 LIVE UPDATE FOR ROOM ${roomCode}\n\n🖥️ For real-time live updates, open the dashboard in your browser:\n${dashboardUrl}` }];
    if (statusBlock) content.push(statusBlock);
    return { content };
  }

  if (name === "interact") {
    const { roomCode, playerId, action, target } = args;
    if (!roomCode || !playerId || !action || !target) {
      return { isError: true, content: [{ type: "text", text: "Missing required arguments for interact." }] };
    }
    
    const room = rooms.get(roomCode.toUpperCase());
    if (!room) return { isError: true, content: [{ type: "text", text: `Room ${roomCode} not found.` }] };
    
    const player = room.players.find(p => p.id === playerId);
    if (!player) return { isError: true, content: [{ type: "text", text: `Player ${playerId} not found.` }] };
    
    if (player.role !== "Defuser") {
      return { isError: true, content: [{ type: "text", text: `Error: Only the Defuser can physically interact with the bomb! You are a ${player.role}.` }] };
    }
    
    const bomb = room.bomb;
    if (bomb.status !== "active") {
      return { isError: true, content: [{ type: "text", text: `Error: The bomb is not active. Current status: ${bomb.status}` }] };
    }

    if (action === "cut_wire") {
      const wireIndex = parseInt(target, 10) - 1; // 0-indexed internally
      const wireModule = bomb.modules.find(m => m.type === "wires");
      
      if (!wireModule) {
        return { isError: true, content: [{ type: "text", text: "Error: No wire module found on this bomb." }] };
      }
      if (wireModule.isDefused) {
        return { isError: true, content: [{ type: "text", text: "This module is already defused!" }] };
      }
      
      let textResponse = "";
      if (wireIndex === wireModule.targetWireIndex) {
        wireModule.isDefused = true;
        bomb.status = "defused";
        broadcastEvent(roomCode, `🎉 Defuser ${player.name} cut wire ${target} — CORRECT! The bomb is DEFUSED! Team wins!`);
        textResponse = `✅ SUCCESS! You cut wire ${target}. The wire module is DEFUSED! The bomb has been defused! YOU WIN!`;
      } else {
        bomb.strikes++;
        if (bomb.strikes >= bomb.maxStrikes) {
          bomb.status = "exploded";
          broadcastEvent(roomCode, `💥 BOOM! Defuser ${player.name} cut wire ${target} — WRONG! Strike ${bomb.strikes}! THE BOMB EXPLODED! Team loses.`);
          textResponse = `💥 BOOM! You cut wire ${target} — INCORRECT! Strike ${bomb.strikes}/${bomb.maxStrikes}. THE BOMB EXPLODED! YOU LOSE!`;
        } else {
          broadcastEvent(roomCode, `⚠️ Strike! Defuser ${player.name} cut wire ${target} — WRONG! Strike ${bomb.strikes}/${bomb.maxStrikes}.`);
          textResponse = `⚠️ WRONG WIRE! You cut wire ${target}. Strike ${bomb.strikes}/${bomb.maxStrikes}! The bomb is still active!`;
        }
      }

      const statusBlock = getGameStatusContent(roomCode);
      const content: any[] = [{ type: "text", text: textResponse }];
      if (statusBlock) content.push(statusBlock);
      return { content };
    }
    
    return { isError: true, content: [{ type: "text", text: `Unknown action: ${action}` }] };
  }

  return {
    isError: true,
    content: [{ type: "text", text: `Tool not found in bomb tools: ${name}` }]
  };
}
