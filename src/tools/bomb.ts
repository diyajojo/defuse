import { rooms } from "../state/rooms.js";
import { broadcastEvent, getGameStatusContent } from "../events.js";

export const bombToolSchemas = [
  {
    name: "get_status",
    description: "Returns the global game status, including players in the room, timer, strikes, and recent events. TRIGGER: Call this ONLY when the user types exactly 'status-[roomCode]'. Do NOT call this if the user wants to see their puzzle view.",
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
    description: "Allows the Defuser to interact with the bomb modules (e.g., cutting a wire or entering a radio frequency). TRIGGER: Call this ONLY when the user types exactly 'cut [wire number] [player ID]' or 'submit frequency [frequency] [player ID]'. Provide 'cut_wire' or 'submit_frequency' as action, the target value (e.g., '2' or '3.515'), your player ID, and infer the room code from context.",
    inputSchema: {
      type: "object",
      properties: {
        roomCode: { type: "string", description: "The 6-character room code." },
        playerId: { type: "string", description: "Your unique Player ID." },
        action: { 
          type: "string", 
          enum: ["cut_wire", "submit_frequency", "press_button"],
          description: "The type of interaction to perform ('cut_wire', 'submit_frequency', or 'press_button')." 
        },
        target: { 
          type: "string",
          description: "The target of the action, e.g. '2' for wire index, or '3.515' for Morse frequency."
        }
      },
      required: ["roomCode", "playerId", "action", "target"]
    }
  }
];

export async function handleBombToolCall(name: string, args: any) {

  if (name === "get_status") {
    const roomCode = args?.roomCode?.toUpperCase();
    if (!roomCode) {
      return { isError: true, content: [{ type: "text", text: "Missing roomCode argument" }] };
    }
    const room = rooms.get(roomCode);
    if (!room) {
      return { isError: true, content: [{ type: "text", text: `Error: Room ${roomCode} does not exist.` }] };
    }

    const statusBlock = getGameStatusContent(roomCode);
    const content: any[] = [{ type: "text", text: `📡 LIVE STATUS FOR ROOM ${roomCode}` }];
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
        const allDefused = bomb.modules.every(m => m.isDefused);
        if (allDefused) {
          bomb.status = "defused";
          broadcastEvent(roomCode, `🎉 Defuser ${player.name} cut wire ${target} — CORRECT! The bomb is DEFUSED! Team wins!`);
          textResponse = `✅ SUCCESS! You cut wire ${target}. The wire module is DEFUSED! The bomb has been defused! YOU WIN!`;
        } else {
          broadcastEvent(roomCode, `🎉 Defuser ${player.name} cut wire ${target} — CORRECT! Wire module defused!`);
          textResponse = `✅ SUCCESS! You cut wire ${target}. The wire module is DEFUSED! One more module remaining.`;
        }
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

    if (action === "submit_frequency") {
      const morseModule = bomb.modules.find(m => m.type === "morse");
      
      if (!morseModule) {
        return { isError: true, content: [{ type: "text", text: "Error: No Morse module found on this bomb." }] };
      }
      if (morseModule.isDefused) {
        return { isError: true, content: [{ type: "text", text: "This module is already defused!" }] };
      }
      
      let textResponse = "";
      if (target === morseModule.targetFrequency) {
        morseModule.isDefused = true;
        const allDefused = bomb.modules.every(m => m.isDefused);
        if (allDefused) {
          bomb.status = "defused";
          broadcastEvent(roomCode, `🎉 Defuser ${player.name} submitted frequency ${target} — CORRECT! The bomb is DEFUSED! Team wins!`);
          textResponse = `✅ SUCCESS! You submitted frequency ${target}. The Morse module is DEFUSED! The bomb has been defused! YOU WIN!`;
        } else {
          broadcastEvent(roomCode, `🎉 Defuser ${player.name} submitted frequency ${target} — CORRECT! Morse module defused!`);
          textResponse = `✅ SUCCESS! You submitted frequency ${target}. The Morse module is DEFUSED! One more module remaining.`;
        }
      } else {
        bomb.strikes++;
        if (bomb.strikes >= bomb.maxStrikes) {
          bomb.status = "exploded";
          broadcastEvent(roomCode, `💥 BOOM! Defuser ${player.name} submitted frequency ${target} — WRONG! Strike ${bomb.strikes}! THE BOMB EXPLODED! Team loses.`);
          textResponse = `💥 BOOM! You submitted frequency ${target} — INCORRECT! Strike ${bomb.strikes}/${bomb.maxStrikes}. THE BOMB EXPLODED! YOU LOSE!`;
        } else {
          broadcastEvent(roomCode, `⚠️ Strike! Defuser ${player.name} submitted frequency ${target} — WRONG! Strike ${bomb.strikes}/${bomb.maxStrikes}.`);
          textResponse = `⚠️ WRONG FREQUENCY! You submitted frequency ${target}. Strike ${bomb.strikes}/${bomb.maxStrikes}! The bomb is still active!`;
        }
      }

      const statusBlock = getGameStatusContent(roomCode);
      const content: any[] = [{ type: "text", text: textResponse }];
      if (statusBlock) content.push(statusBlock);
      return { content };
    }

    if (action === "press_button") {
      const controlPanelModule = bomb.modules.find(m => m.type === "control_panel");
      
      if (!controlPanelModule) {
        return { isError: true, content: [{ type: "text", text: "Error: No Control Panel module found on this bomb." }] };
      }
      if (controlPanelModule.isDefused) {
        return { isError: true, content: [{ type: "text", text: "This module is already defused!" }] };
      }
      
      let textResponse = "";
      if (target.toLowerCase() === (controlPanelModule as any).targetButton) {
        controlPanelModule.isDefused = true;
        const allDefused = bomb.modules.every(m => m.isDefused);
        if (allDefused) {
          bomb.status = "defused";
          broadcastEvent(roomCode, `🎉 Defuser ${player.name} pressed the ${target} button — CORRECT! The bomb is DEFUSED! Team wins!`);
          textResponse = `✅ SUCCESS! You pressed the ${target} button. The Control Panel is DEFUSED! The bomb has been defused! YOU WIN!`;
        } else {
          broadcastEvent(roomCode, `🎉 Defuser ${player.name} pressed the ${target} button — CORRECT! Control Panel defused!`);
          textResponse = `✅ SUCCESS! You pressed the ${target} button. The Control Panel is DEFUSED! One more module remaining.`;
        }
      } else {
        bomb.strikes++;
        if (bomb.strikes >= bomb.maxStrikes) {
          bomb.status = "exploded";
          broadcastEvent(roomCode, `💥 BOOM! Defuser ${player.name} pressed the ${target} button — WRONG! Strike ${bomb.strikes}! THE BOMB EXPLODED! Team loses.`);
          textResponse = `💥 BOOM! You pressed the ${target} button — INCORRECT! Strike ${bomb.strikes}/${bomb.maxStrikes}. THE BOMB EXPLODED! YOU LOSE!`;
        } else {
          broadcastEvent(roomCode, `⚠️ Strike! Defuser ${player.name} pressed the ${target} button — WRONG! Strike ${bomb.strikes}/${bomb.maxStrikes}.`);
          textResponse = `⚠️ WRONG BUTTON! You pressed the ${target} button. Strike ${bomb.strikes}/${bomb.maxStrikes}! The bomb is still active!`;
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
