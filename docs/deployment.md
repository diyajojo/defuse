# Defuse: Deployment & Architecture Guide

This guide explains how to deploy the **Defuse MCP Server** to Render, configure your local environment, and details how the architecture bridges standard input/output (`stdio`) to network protocols (`HTTP`).

---

## 1. Deploy the Server on Render

The Server maintains the shared multiplayer game state, manages active rooms, and runs the game loop.

### Step-by-Step Render Setup:
1. Sign in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Set the following build and runtime configurations:
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: `Free` (or any tier)
5. Click **Deploy Web Service**.

> [!NOTE]
> Since we removed the browser dashboard, the server runs completely self-contained. You do **not** need to add any environment variables on Render.

---

## 2. Configure Local Claude Desktop

Because Claude Desktop communicates over standard input/output (`stdio`), it cannot talk directly to a remote network server. We use a local **Proxy** script as a bridge.

### Step 1: Open the Claude Desktop Configuration
Open the config file in your preferred text editor:
* **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
* **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### Step 2: Add your Deployed Service Configuration
Modify the `mcpServers` block to include your custom proxy pointing to your Render server:

```json
{
  "mcpServers": {
    "defuse-game": {
      "command": "node",
      "args": ["/Users/diyajojo/Desktop/coding/defuse/build/proxy.js"],
      "env": {
        "BASE_URL": "https://defuse-ho2w.onrender.com"
      }
    }
  }
}
```

### Step 3: Restart Claude Desktop
Completely quit the Claude Desktop application and start it again to initialize the proxy client.

---

## 3. Architecture Deep Dive

The diagram below shows how Claude Desktop interacts with your remote server using the local proxy:

```
┌───────────────────────── LOCAL MACHINE ─────────────────────────┐               ┌───────── CLOUD ─────────┐
│                                                                 │               │                         │
│  ┌────────────────┐           ┌──────────────────────────────┐  │               │    ┌────────────────┐   │
│  │ Claude Desktop │ ──stdio──> │         Local Proxy          │  │ ─── HTTPS ──> │    │   MCP Server   │   │
│  │  (AI Player)   │ <──stdio── │ (build/proxy.js via Node.js) │  │ <─── HTTPS ───│    │    (Render)    │   │
│  └────────────────┘           └──────────────────────────────┘  │               │    └────────────────┘   │
│                                                                 │               │            │            │
└─────────────────────────────────────────────────────────────────┘               │    ┌───────▼────────┐   │
                                                                                  │    │  Shared State  │   │
                                                                                  │    │ (Active Rooms) │   │
                                                                                  │    └────────────────┘   │
                                                                                  └─────────────────────────┘
```

---

## 4. FAQ & Common Doubts Cleared

### Q: Why do we need a local proxy? Why can't Claude talk to Render directly?
**Answer**: Claude Desktop is hardcoded to only communicate with MCP servers running locally on your computer via Standard Input/Output (`stdio`). It does not support connecting directly to web sockets, SSE streams, or HTTP URLs. 
The local proxy script (`proxy.js`) runs on your machine to satisfy Claude's `stdio` requirement, then acts as a network forwarder translating those inputs into HTTP requests sent to Render.

### Q: Why did we write the main server as a Streamable HTTP Server instead of a Stdio Server?
**Answer**: A standard `stdio` MCP server can only communicate with a single client process running on the same local computer. If you have 3 players, they would each launch their own local server process, resulting in 3 separate, isolated games.
By using `Streamable HTTP`, all players can connect to the **same** server instance, allowing them to share the exact same room and bomb state.

### Q: Do I need to run a local server in a terminal while using the deployed Render URL?
**Answer**: **No.** Because the server is hosted 24/7 in the cloud on Render, you do not need to run `npm run start` or keep a terminal open on your computer. When Claude Desktop starts up, it spawns your local `proxy.js` which automatically routes requests over the internet to Render.

### Q: What is the difference between `claude_desktop_config.json` env parameters and the local `.env` file?
**Answer**: 
* **`claude_desktop_config.json`**: This configures the environment variables (like `BASE_URL`) passed to the proxy process when **Claude Desktop** launches it automatically.
* **`.env` file**: This is used exclusively for **manual testing** when you execute commands yourself in the terminal (like `npm run start` or running `npm run proxy` manually to test connections).

### Q: How do I switch back to testing locally on my computer?
**Answer**:
1. Run the server locally in your terminal:
   ```bash
   npm run start
   ```
2. Update your `claude_desktop_config.json` to change the `BASE_URL` env variable back to localhost:
   ```json
   "env": {
     "BASE_URL": "http://localhost:3001"
   }
   ```
3. Restart Claude Desktop.
