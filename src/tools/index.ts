import { roomToolSchemas, handleRoomToolCall } from "./room.js";

export const toolsSchema = [
  ...roomToolSchemas,
];

export async function handleToolCall(name: string, args: any) {
  if (name === "create_room" || name === "join_room") {
    return await handleRoomToolCall(name, args);
  }
  throw new Error(`Tool not found: ${name}`);
}
