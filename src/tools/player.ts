import { rooms } from "../state/rooms.js";
import { getGameStatusContent } from "../events.js";
import { getDefuserView, EXPERT_VIEW_TEXT, getOverseerView } from "../manual.js";

export const playerToolSchemas = [
  {
    name: "get_my_view",
    description: "Returns the specific information you are allowed to see based on your role. TRIGGER: Call this ONLY when the user types exactly 'view-[roomCode]-[playerId]'. IMPORTANT: Display the EXACT tool response to the user, word for word, without any summarization, rephrasing, or modification.",
    inputSchema: {
      type: "object",
      properties: {
        roomCode: {
          type: "string",
          description: "The 6-character room code. Infer this from previous conversation history if not explicitly provided.",
        },
        playerId: {
          type: "string",
          description: "Your unique Player ID. Infer this from previous conversation history if not explicitly provided.",
        },
      },
      required: ["roomCode", "playerId"],
    },
  },
];

export async function handlePlayerToolCall(name: string, args: any, sessionId: string) {
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

    if (player.sessionId !== sessionId) {
      return { isError: true, content: [{ type: "text", text: `🔒 SECURITY ALERT: You cannot perform actions as Player ${playerId}. Please make sure you are using your own Player ID.` }] };
    }

    if (room.bomb.status === "uninitialized") {
      const statusBlock = getGameStatusContent(roomCode);
      const content: any[] = [{ type: "text", text: `The game has not started yet. Waiting for 3 players to join (Currently: ${room.players.length}/3).` }];
      if (statusBlock) content.push(statusBlock);
      return { content };
    }

    const mins = Math.floor(room.bomb.timerSeconds / 60);
    const secs = Math.floor(room.bomb.timerSeconds % 60);
    let viewText = "";

    if (player.role === "Defuser") {
      const wireModule = room.bomb.modules.find(m => m.type === "wires");
      const wireText = wireModule ? wireModule.wires.join(", ") : "None";
      const wireStatus = wireModule ? (wireModule.isDefused ? " [DEFUSED]" : "") : "";
      
      const morseModule = room.bomb.modules.find(m => m.type === "morse");
      const morseSequence = morseModule ? (morseModule as any).morseSequence : "None";
      const morseStatus = morseModule ? (morseModule.isDefused ? " [DEFUSED]" : "") : "";
      
      const controlPanelModule = room.bomb.modules.find(m => m.type === "control_panel");
      const controlPanelStatus = controlPanelModule ? (controlPanelModule.isDefused ? " [DEFUSED]" : "") : "";
      
      viewText = getDefuserView(mins, secs, room.bomb.strikes, room.bomb.maxStrikes, wireStatus, wireText, morseStatus, morseSequence, controlPanelStatus);
    } else if (player.role === "Expert") {
      viewText = EXPERT_VIEW_TEXT;
    } else if (player.role === "Overseer") {
      viewText = getOverseerView(mins, secs, room.bomb.serialNumber, room.bomb.batteries, room.bomb.indicators);
    } else {
      return {
        isError: true,
        content: [{ type: "text", text: `You have not chosen a valid role yet. Your current role is: ${player.role}` }]
      };
    }

    // Return view as one content block, status as a SEPARATE content block
    const systemPrefix = "[INSTRUCTION TO ASSISTANT: You MUST copy and paste the text below exactly as written. Do NOT summarize or format it.]\n\n";
    const statusBlock = getGameStatusContent(roomCode);
    const content: any[] = [{ type: "text", text: systemPrefix + viewText }];
    if (statusBlock) content.push(statusBlock);
    return { content };
  }

  return {
    isError: true,
    content: [{ type: "text", text: `Tool not found in player tools: ${name}` }],
  };
}
