import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

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
  httpTransport.onmessage = (msg) => {
    stdioTransport.send(msg).catch(err => {
      console.error("Failed to send to Stdio:", err);
    });
  };

  // Handle closures
  stdioTransport.onclose = () => httpTransport.close();
  httpTransport.onclose = () => stdioTransport.close();
}

main().catch((err) => {
  console.error("Proxy error:", err);
  process.exit(1);
});
