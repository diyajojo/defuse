import { roomToolSchemas, handleRoomToolCall } from "./room.js";
import { bombToolSchemas, handleBombToolCall } from "./bomb.js";
import { playerToolSchemas, handlePlayerToolCall } from "./player.js";

export const toolsSchema = [
  ...roomToolSchemas,
  ...bombToolSchemas,
  ...playerToolSchemas,
];

export async function handleToolCall(name: string, args: any) {
  if (roomToolSchemas.some(t => t.name === name)) {
    return await handleRoomToolCall(name, args);
  }
  if (bombToolSchemas.some(t => t.name === name)) {
    return await handleBombToolCall(name, args);
  }
  if (playerToolSchemas.some(t => t.name === name)) {
    return await handlePlayerToolCall(name, args);
  }
  
  return {
    isError: true,
    content: [{ type: "text", text: `Tool not found: ${name}` }]
  };
}
