# Deploying Defuse to Render & Pointing Local Proxy At It

This guide explains how to deploy the **Defuse MCP Server** to Render (Cloud Network Transport) and configure the local **Proxy** (`stdio`) on your machine so that multiple clients can play the game together in real-time.

---

## 1. Deploy the Server on Render

The Server maintains the shared game state, manages active rooms, and runs the game loop.

### Step 1: Create a Render Web Service
1. Sign in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New** and select **Web Service**.
3. Connect your GitHub repository (e.g., `diyajojo/defuse`).

### Step 2: Configure Service Settings
Specify the following build and execution settings in the Render UI:

- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`
- **Plan**: `Free` (or any tier)

### Step 3: Environment Variables
Go to the **Environment** tab of your Render service and add the following:

| Key | Value | Description |
| :--- | :--- | :--- |
| `BASE_URL` | `https://your-service-name.onrender.com` | Replace with the **actual URL** Render assigns to your Web Service. |

---

## 2. Test the Deployed Server

Before setting up the local proxy, verify that your Render server is up and responding.

1. **Verify the server is running**:
   Send a POST request to your `/mcp` endpoint using `curl`:
   ```bash
   curl -i -X POST -H "Content-Type: application/json" https://your-service-name.onrender.com/mcp
   ```
2. **Expected Response**:
   You should receive an HTTP `400 Bad Request` with the body:
   ```json
   {"error":"Invalid request: missing session ID or not an initialize request"}
   ```
   This confirms the server is active and the Express routing is working properly.

---

## 3. Run and Test the Proxy Locally

Because Claude Desktop communicates over standard input/output (`stdio`), you cannot connect it directly to a remote network server. The **Proxy** runs locally, listens to Claude over `stdio`, and forwards the requests to the Render server via HTTP.

### Run manually from the command line (for testing)
Run the built proxy on your machine using your new Render URL:
```bash
# Build the typescript files
npm run build

# Run the proxy client pointing to Render
BASE_URL=https://your-service-name.onrender.com npm run proxy
```
*Note: The command will seem to hang—this is normal, as it is waiting for `stdio` input from Claude.*

---

## 4. Configure Claude Desktop

To make Claude Desktop automatically launch the proxy and connect to the Render server, update your Claude Desktop configuration file.

### Step 1: Locate the Config File
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### Step 2: Add the Defuse MCP Client Configuration
Add the configuration block pointing to your local repository directory and remote Render server. Remember to replace `/absolute/path/to/defuse` with your actual directory path.

```json
{
  "mcpServers": {
    "defuse-client": {
      "command": "node",
      "args": ["/absolute/path/to/defuse/build/proxy.js"],
      "env": {
        "BASE_URL": "https://your-service-name.onrender.com"
      }
    }
  }
}
```

### Step 3: Restart Claude Desktop
1. Completely quit Claude Desktop.
2. Open Claude Desktop again.
3. Look for the 🔌 hammer/connection icon in the chat input. You should see the tools exposed by `defuse-client` (e.g. `create_room`, `join_room`, `get_bomb_state`).

---

## 5. Play with Friends!

1. Player 1 runs `create_room` in Claude Desktop (using their player name).
2. Claude will output the **Room Code** and confirmation text.
3. Tell your friends the room code. They can join by running `join_room` in their own Claude Desktop instances.
4. Use the game status and information tools to collaborate and defuse the bomb!
