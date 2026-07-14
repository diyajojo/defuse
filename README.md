# 💣 DEFUSE

A real-time multiplayer bomb defusal game built on the **Model Context Protocol (MCP)**. Multiple players connect to the same shared game session using their own Claude Desktop clients and a synced web dashboard.

Inspired by *Keep Talking and Nobody Explodes*, each player receives only a fragment of the information needed to defuse the bomb. One player (the Defuser) sees the bomb, another (the Expert) has the defusal manual, while a third (the Overseer) monitors the external casing and countdown. Since no individual has the complete picture, success depends entirely on communication and teamwork.

This project demonstrates a unique "hybrid" architecture for LLM gaming:
1. **Claude Desktop (The Controller):** Players use Claude via MCP to perform actions, read secret information, and make moves (e.g. `cut-wire-2`).
2. **Web Dashboard (The View):** A live HTML dashboard powered by Server-Sent Events (SSE) that displays the ticking timer, player list, and game events in real-time, completely bypassing Claude's UI limitations.

