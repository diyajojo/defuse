import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
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
      prompts: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: toolsSchema,
  };
});

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "start-defuse-game",
        description: "An interactive prompt that starts the Defuse game and guides players on how to play.",
      }
    ]
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name === "start-defuse-game") {
    return {
      description: "Getting started guide for Defuse",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "I want to play Defuse! Please call the 'start_defuse' tool to read the instructions and display them to me exactly as they are written so I can learn how to play. Do not create a room or do anything else yet."
          }
        }
      ]
    };
  }
  
  throw new Error("Prompt not found");
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
