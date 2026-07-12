A real-time multiplayer bomb defusal game built on the Model Context Protocol (MCP), where multiple Claude clients connect to the same shared game session.

Each player receives only a fragment of the information needed to defuse the bomb. One player may see the wiring, another the bomb manual, while another monitors the countdown and serial number. Since no individual has the complete picture, success depends entirely on communication, coordination, and teamwork.

The MCP server acts as the authoritative game engine, maintaining shared state across all connected clients while exposing personalized views and validating every player action in real time. The result is an AI-native collaborative experience where no single participant—or Claude instance—can solve the challenge alone.