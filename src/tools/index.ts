import { roomToolSchemas, handleRoomToolCall } from "./room.js";

export const toolsSchema = [
  ...roomToolSchemas,
];

export async function handleToolCall(name: string, args: any) {
  if (name === "create_room" || name === "join_room") {
    return await handleRoomToolCall(name, args);
  }
  return {
    isError: true,
    content: [{ type: "text", text: `Tool not found: ${name}` }]
  };
}
