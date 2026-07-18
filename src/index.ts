import express from "express";
import { randomUUID } from "node:crypto";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { toolsSchema, handleToolCall } from "./tools/index.js";
import { activeServers } from "./events.js";
import { PORT, BASE_URL } from "./config.js";

const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports = new Map<string, StreamableHTTPServerTransport>();

function createServer(sessionId: string): Server {
  const server = new Server(
    { name: "defuse-server", version: "1.0.0" },
    { capabilities: { tools: {}, prompts: {}, logging: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: toolsSchema,
  }));

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: [
      {
        name: "start-defuse-game",
        description: "An interactive prompt that starts the Defuse game and guides players on how to play.",
      },
    ],
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    if (request.params.name === "start-defuse-game") {
      return {
        description: "Getting started guide for Defuse",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: "I want to play Defuse! Please call the 'start_defuse' tool to read the instructions and display them to me exactly as they are written so I can learn how to play. Do not create a room or do anything else yet.",
            },
          },
        ],
      };
    }
    throw new Error("Prompt not found");
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      return await handleToolCall(request.params.name, request.params.arguments, sessionId);
    } catch (error) {
      console.error(`[Tool Error] Error executing tool ${request.params.name}:`, error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Internal Server Error executing tool '${request.params.name}': ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  });

  return server;
}

// Single /mcp endpoint handles POST (initialize + tool calls)
app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports.has(sessionId)) {
    // Existing session — reuse the transport
    transport = transports.get(sessionId)!;
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // New session — create transport + server
    const newSessionId = randomUUID();
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => newSessionId,
      onsessioninitialized: (sid) => {
        transports.set(sid, transport);
        console.log(`Session initialized: ${sid}`);
      },
    });

    const server = createServer(newSessionId);

    transport.onclose = () => {
      const sid = transport.sessionId;
      if (sid) {
        transports.delete(sid);
        console.log(`Session closed: ${sid}`);
      }
      activeServers.delete(server);
    };

    await server.connect(transport);
    activeServers.add(server);
  } else {
    res.status(400).json({ error: "Invalid request: missing session ID or not an initialize request" });
    return;
  }

  await transport.handleRequest(req, res, req.body);
});

// GET /mcp — for SSE streaming of server-initiated notifications
app.get("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({ error: "Invalid or missing session ID" });
    return;
  }
  const transport = transports.get(sessionId)!;
  await transport.handleRequest(req, res);
});

// DELETE /mcp — for clean session termination
app.delete("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({ error: "Invalid or missing session ID" });
    return;
  }
  const transport = transports.get(sessionId)!;
  await transport.handleRequest(req, res);
});

app.listen(PORT, () => {
  console.log(`Defuse MCP Server (Streamable HTTP) running on port ${PORT}`);
  console.log(`MCP endpoint: ${BASE_URL}/mcp`);
});

import { rooms } from "./state/rooms.js";
import { broadcastEvent } from "./events.js";

// Game Loop: Decrement timers for active rooms + push timer ticks to browser
setInterval(() => {
  for (const [roomCode, room] of rooms.entries()) {
    if (room.bomb.status === "active" && room.bomb.timerSeconds > 0) {
      const oldT = room.bomb.timerSeconds;
      
      let tickAmount = 1;
      if (room.bomb.strikes === 1) tickAmount = 1.25;
      else if (room.bomb.strikes >= 2) tickAmount = 1.5;
      
      room.bomb.timerSeconds -= tickAmount;
      const newT = room.bomb.timerSeconds;
      
      if (newT <= 0 && oldT > 0) {
        room.bomb.timerSeconds = 0;
        room.bomb.status = "exploded";
        broadcastEvent(roomCode, "💥 BOOM! Time ran out! THE BOMB EXPLODED! Team loses.");
      } else if (newT <= 240 && oldT > 240) {
        broadcastEvent(roomCode, "⏱️ 4 minutes remaining.");
      } else if (newT <= 180 && oldT > 180) {
        broadcastEvent(roomCode, "⏱️ 3 minutes remaining.");
      } else if (newT <= 120 && oldT > 120) {
        broadcastEvent(roomCode, "⚠️ 2 minutes remaining!");
      } else if (newT <= 60 && oldT > 60) {
        broadcastEvent(roomCode, "🚨 1 MINUTE remaining! Hurry!");
      } else if (newT <= 30 && oldT > 30) {
        broadcastEvent(roomCode, "🔴 30 SECONDS! MOVE FAST!");
      } else if (newT <= 10 && oldT > 10) {
        broadcastEvent(roomCode, "💀 10 SECONDS LEFT!!!");
      }
    }
  }
}, 1000);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down...");
  for (const [sid, transport] of transports) {
    try {
      await transport.close();
      transports.delete(sid);
    } catch (err) {
      console.error(`Error closing session ${sid}:`, err);
    }
  }
  process.exit(0);
});
