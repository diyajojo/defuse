import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { rooms } from "./state/rooms.js";

export const activeServers = new Set<Server>();

// Log event to room's event history, push to SSE browsers, and attempt MCP logging
export function broadcastEvent(roomCode: string, message: string) {
  const room = rooms.get(roomCode.toUpperCase());
  if (room) {
    room.events.push(message);
  }

  // Best-effort MCP server push (goes to dev logs only)
  for (const server of activeServers) {
    server.sendLoggingMessage({
      level: "info",
      data: `[ROOM ${roomCode}] ${message}`
    }).catch(() => {});
  }
}


// Returns a full shared game status as a separate content block
export function getGameStatusContent(roomCode: string): { type: string; text: string } | null {
  const room = rooms.get(roomCode.toUpperCase());
  if (!room) return null;

  const playerCount = room.players.length;
  const maxPlayers = 3;
  const playerList = room.players.map(p => `${p.name} (${p.role})`).join(" | ");

  const bombStatusEmoji: Record<string, string> = {
    uninitialized: "⏳ Waiting",
    active: "💣 ACTIVE",
    defused: "✅ DEFUSED",
    exploded: "💥 EXPLODED",
  };
  const bombStatus = bombStatusEmoji[room.bomb.status] ?? room.bomb.status.toUpperCase();

  let statusLine = `Bomb: ${bombStatus}`;
  if (room.bomb.status === "active" || room.bomb.status === "defused" || room.bomb.status === "exploded") {
    const mins = Math.floor(room.bomb.timerSeconds / 60);
    const secs = room.bomb.timerSeconds % 60;
    statusLine += `  |  ⏱ ${mins}m ${secs}s  |  ⚡ Strikes: ${room.bomb.strikes}/${room.bomb.maxStrikes}`;
  }

  const events = room.events.slice(-5);
  const eventsBlock = events.length > 0
    ? "\n📢 RECENT EVENTS:\n" + events.map(e => `  • ${e}`).join("\n")
    : "";

  const text = [
    `[IMPORTANT: Display this status block exactly as-is to the user]`,
    `${"─".repeat(40)}`,
    `🎮 ROOM STATUS [${roomCode}] — ${playerCount}/${maxPlayers} players`,
    `👥 ${playerList || "No players yet"}`,
    statusLine,
    eventsBlock,
    `${"─".repeat(40)}`,
  ].filter(Boolean).join("\n");

  return { type: "text", text };
}
