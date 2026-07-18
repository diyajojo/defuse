import { roomToolSchemas, handleRoomToolCall } from "./room.js";
import { bombToolSchemas, handleBombToolCall } from "./bomb.js";
import { playerToolSchemas, handlePlayerToolCall } from "./player.js";
import { helpToolSchemas, handleHelpToolCall } from "./help.js";

export const toolsSchema = [
  ...roomToolSchemas,
  ...bombToolSchemas,
  ...playerToolSchemas,
  ...helpToolSchemas,
];

export async function handleToolCall(name: string, args: any, sessionId: string) {
  if (roomToolSchemas.some(t => t.name === name)) {
    return await handleRoomToolCall(name, args, sessionId);
  }
  if (bombToolSchemas.some(t => t.name === name)) {
    return await handleBombToolCall(name, args, sessionId);
  }
  if (playerToolSchemas.some(t => t.name === name)) {
    return await handlePlayerToolCall(name, args, sessionId);
  }
  if (helpToolSchemas.some(t => t.name === name)) {
    return await handleHelpToolCall(name, args);
  }
  
  return {
    isError: true,
    content: [{ type: "text", text: `Tool not found: ${name}` }]
  };
}
