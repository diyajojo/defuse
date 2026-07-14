import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";

// State tracking for auto-polling
let trackedRoomCode: string | null = null;
let lastSequence = 0;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let gameOver = false;
let requestIdCounter = 900000; // High counter to avoid collision with Claude's request IDs

const POLL_INTERVAL_MS = 15000; // Poll every 15 seconds

async function main() {
  const stdioTransport = new StdioServerTransport();
  const httpTransport = new StreamableHTTPClientTransport(new URL("http://localhost:3001/mcp"));

  // Connect both sides
  await stdioTransport.start();
  await httpTransport.start();

  // Forward messages from Claude (Stdio) to Server (HTTP)
  stdioTransport.onmessage = (msg) => {
    httpTransport.send(msg).catch(err => {
      console.error("Failed to send to HTTP server:", err);
    });
  };

  // Forward messages from Server (HTTP) to Claude (Stdio)
  // Also intercept responses to track room codes and game state
  httpTransport.onmessage = (msg) => {
    // Try to extract room info from tool call responses
    tryExtractRoomInfo(msg);

    stdioTransport.send(msg).catch(err => {
      console.error("Failed to send to Stdio:", err);
    });
  };

  // Start auto-polling function
  function startPolling(roomCode: string) {
    if (pollTimer) {
      clearInterval(pollTimer);
    }

    trackedRoomCode = roomCode;
    gameOver = false;
    console.error(`[Proxy] Starting auto-poll for room ${roomCode} every ${POLL_INTERVAL_MS / 1000}s`);

    pollTimer = setInterval(async () => {
      if (gameOver || !trackedRoomCode) {
        if (pollTimer) clearInterval(pollTimer);
        console.error("[Proxy] Polling stopped (game over or no room).");
        return;
      }

      try {
        // Send a get_updates tool call directly to the HTTP server
        const reqId = requestIdCounter++;
        const pollRequest: JSONRPCMessage = {
          jsonrpc: "2.0",
          id: reqId,
          method: "tools/call",
          params: {
            name: "get_updates",
            arguments: {
              roomCode: trackedRoomCode,
              sinceSequence: lastSequence,
            },
          },
        };

        // We need to track whether we got a response for this specific request
        // Set up a one-time listener by wrapping the existing onmessage
        const originalOnMessage = httpTransport.onmessage;

        httpTransport.onmessage = (msg: JSONRPCMessage) => {
          // Check if this is the response to our poll request
          if (isResponseToOurPoll(msg, reqId)) {
            handlePollResponse(msg, stdioTransport);
            // Don't forward poll responses to Claude — instead we send a notification
          } else {
            // Forward all other messages to Claude normally
            tryExtractRoomInfo(msg);
            stdioTransport.send(msg).catch(err => {
              console.error("Failed to send to Stdio:", err);
            });
          }
        };

        await httpTransport.send(pollRequest);
      } catch (err) {
        console.error("[Proxy] Poll error:", err);
      }
    }, POLL_INTERVAL_MS);
  }

  // Check if a JSON-RPC message is a response to our polling request
  function isResponseToOurPoll(msg: any, expectedId: number): boolean {
    return msg && typeof msg === "object" && "id" in msg && msg.id === expectedId;
  }

  // Handle the poll response: extract new events and send a notification to Claude
  function handlePollResponse(msg: any, stdio: StdioServerTransport) {
    try {
      const result = msg?.result;
      if (!result || !result.content) return;

      // Extract the text content from the poll response
      let fullText = "";
      let hasNewEvents = false;
      
      for (const block of result.content) {
        if (block.type === "text") {
          fullText += block.text + "\n";
        }
      }

      // Check if there are new events
      if (fullText.includes("🆕") || fullText.includes("NEW EVENT")) {
        hasNewEvents = true;
      }

      // Extract sequence number from response to update our tracker
      const seqMatch = fullText.match(/seq:\s*(\d+)/);
      if (seqMatch) {
        lastSequence = parseInt(seqMatch[1], 10);
      }

      // Check if game is over
      if (fullText.includes("game is over") || fullText.includes("DEFUSED") || fullText.includes("EXPLODED")) {
        if (fullText.includes("game is over")) {
          gameOver = true;
          console.error("[Proxy] Game over detected, stopping polling.");
        }
      }

      // Only send notification to Claude if there are new events
      if (hasNewEvents) {
        // Send as a logging notification so Claude processes it
        const notification: JSONRPCMessage = {
          jsonrpc: "2.0",
          method: "notifications/message",
          params: {
            level: "alert",
            logger: "defuse-game",
            data: fullText,
          },
        };

        stdio.send(notification).catch(err => {
          console.error("[Proxy] Failed to send poll notification:", err);
        });

        console.error(`[Proxy] Forwarded new events to Claude (seq: ${lastSequence})`);
      } else {
        console.error(`[Proxy] No new events (seq: ${lastSequence})`);
      }
    } catch (err) {
      console.error("[Proxy] Error processing poll response:", err);
    }
  }

  // Try to extract room code from responses flowing through the proxy
  function tryExtractRoomInfo(msg: any) {
    try {
      if (!msg || typeof msg !== "object") return;
      
      const result = msg?.result;
      if (!result || !result.content) return;

      for (const block of result.content) {
        if (block.type !== "text") continue;
        const text = block.text;

        // Look for room code in response text
        // Pattern: "Room Code: XXXXXX" or "ROOM STATUS [XXXXXX]" or "joined room XXXXXX"
        const roomCodeMatch = text.match(/Room Code:\s*([A-Z0-9]{6})/i) 
          || text.match(/ROOM STATUS \[([A-Z0-9]{6})\]/i)
          || text.match(/joined room ([A-Z0-9]{6})/i);
        
        if (roomCodeMatch && !trackedRoomCode) {
          const detectedRoom = roomCodeMatch[1].toUpperCase();
          console.error(`[Proxy] Detected room code: ${detectedRoom}`);
          startPolling(detectedRoom);
        }

        // Extract sequence number
        const seqMatch = text.match(/seq:\s*(\d+)/);
        if (seqMatch) {
          lastSequence = parseInt(seqMatch[1], 10);
        }

        // Detect game over
        if (text.includes("game is over") || text.includes("🏁")) {
          gameOver = true;
          if (pollTimer) clearInterval(pollTimer);
          console.error("[Proxy] Game over detected, stopping polling.");
        }
      }
    } catch {
      // Silently ignore parse errors
    }
  }

  // Handle closures
  stdioTransport.onclose = () => {
    if (pollTimer) clearInterval(pollTimer);
    httpTransport.close();
  };
  httpTransport.onclose = () => {
    if (pollTimer) clearInterval(pollTimer);
    stdioTransport.close();
  };
}

main().catch((err) => {
  console.error("Proxy error:", err);
  process.exit(1);
});
