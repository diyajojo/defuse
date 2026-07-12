import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

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

let counter = 0;

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "hello",
        description: "Says hello from MCP",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "increment",
        description: "Increments a stateful counter on the server and returns the new value",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "hello") {
    return {
      content: [
        {
          type: "text",
          text: "Hello from MCP!",
        },
      ],
    };
  }

  if (request.params.name === "increment") {
    counter++;
    return {
      content: [
        {
          type: "text",
          text: `Counter has been incremented. The current value is: ${counter}`,
        },
      ],
    };
  }

  throw new Error(`Tool not found: ${request.params.name}`);
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
