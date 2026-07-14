import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { rooms } from "./state/rooms.js";

export const activeServers = new Set<Server>();

// Log event to room's event history AND attempt server push (best-effort)
export function broadcastEvent(roomCode: string, message: string) {
  const room = rooms.get(roomCode.toUpperCase());
  if (room) {
    room.events.push(message);
    room.eventSequence += 1;
  }

  // Best-effort server push (may not reach all clients)
  for (const server of activeServers) {
    server.sendLoggingMessage({
      level: "info",
      data: `[ROOM ${roomCode}] ${message}`
    }).catch(() => {});
  }
}

// Get only events that occurred after a given sequence number
export function getEventsSince(roomCode: string, sinceSequence: number): { events: string[]; currentSequence: number } {
  const room = rooms.get(roomCode.toUpperCase());
  if (!room) return { events: [], currentSequence: 0 };

  const totalEvents = room.events.length;
  const currentSequence = room.eventSequence;

  // Calculate how many events have happened since the given sequence
  const eventsSinceCount = currentSequence - sinceSequence;
  
  if (eventsSinceCount <= 0) {
    return { events: [], currentSequence };
  }

  // Get the last N events (where N = events since the given sequence)
  const newEvents = room.events.slice(Math.max(0, totalEvents - eventsSinceCount));
  return { events: newEvents, currentSequence };
}

// Format recent events as a readable block to include in tool responses
export function getRecentEventsText(roomCode: string): string {
  const room = rooms.get(roomCode.toUpperCase());
  if (!room || room.events.length === 0) return "";

  const recentEvents = room.events.slice(-5); // Last 5 events
  return "\n\n--- 📢 RECENT EVENTS ---\n" + recentEvents.map(e => `• ${e}`).join("\n");
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
    `🎮 ROOM STATUS [${roomCode}] — ${playerCount}/${maxPlayers} players  (seq: ${room.eventSequence})`,
    `👥 ${playerList || "No players yet"}`,
    statusLine,
    eventsBlock,
    `${"─".repeat(40)}`,
  ].filter(Boolean).join("\n");

  return { type: "text", text };
}

// Generate the polling instruction text that tells Claude to keep calling get_updates
export function getPollingInstruction(roomCode: string): string {
  const room = rooms.get(roomCode.toUpperCase());
  if (!room) return "";

  // Don't poll if game is over
  if (room.bomb.status === "defused" || room.bomb.status === "exploded") {
    return "\n\n🏁 The game is over. No need to poll for further updates.";
  }

  return `\n\n⏰ AUTO-POLL INSTRUCTION: You MUST call the "get_updates" tool with roomCode "${roomCode}" again after approximately 15 seconds to check for game state changes. Keep polling until the game ends (bomb defused or exploded). This is critical for real-time gameplay — do NOT skip this step, do NOT wait for the user to ask. Just call get_updates again after a brief pause.`;
}
