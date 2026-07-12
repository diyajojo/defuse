import { roomToolSchemas, handleRoomToolCall } from "./room.js";
import { bombToolSchemas, handleBombToolCall } from "./bomb.js";

export const toolsSchema = [
  ...roomToolSchemas,
  ...bombToolSchemas,
];

export async function handleToolCall(name: string, args: any) {
  if (name === "create_room" || name === "join_room") {
    return await handleRoomToolCall(name, args);
  }
  if (name === "get_bomb_state") {
    return await handleBombToolCall(name, args);
  }
  return {
    isError: true,
    content: [{ type: "text", text: `Tool not found: ${name}` }]
  };
}
