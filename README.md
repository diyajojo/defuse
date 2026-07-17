# 💣 DEFUSE

A real-time multiplayer bomb defusal game built entirely on the **Model Context Protocol (MCP)**. Multiple players connect to the same shared game session using their own Claude Desktop clients communicating with a central deployed server.

Inspired by *Keep Talking and Nobody Explodes*, each player receives only a fragment of the information needed to defuse the bomb. One player (the **Defuser**) sees the bomb, another (the **Expert**) has the defusal manual, while a third (the **Overseer**) monitors the external casing (like dynamic serial numbers) and countdown. Since no individual has the complete picture, success depends entirely on communication and teamwork.

## 🏗️ Architecture

This project demonstrates a unique network architecture for LLM gaming using MCP:
1. **Claude Desktop (The Client):** Players interact via Claude using custom MCP tools to perform actions, read secret role-specific information, and make moves (e.g., `cut_wire`).
2. **Local Proxy Bridge:** Since Claude Desktop requires MCP servers to run as local terminal processes (via standard input/output), a local `proxy.ts` bridges the gap. It translates local stdio messages into network requests.
3. **Render Express Server (The Shared Brain):** The central HTTP Express server hosted on Render holds the active `rooms` in memory, resolving game states, strikes, and puzzle parity rules seamlessly across multiple players.

