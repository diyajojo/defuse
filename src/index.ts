import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { toolsSchema, handleToolCall } from "./tools/index.js";

const server = new Server(
  {
    name: "defuse-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: toolsSchema,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  return await handleToolCall(request.params.name, request.params.arguments);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Defuse MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Server error:", err);
  process.exit(1);
});
