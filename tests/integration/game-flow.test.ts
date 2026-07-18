import { describe, it, expect, beforeEach } from "vitest";
import { handleRoomToolCall } from "../../src/tools/room.js";
import { handlePlayerToolCall } from "../../src/tools/player.js";
import { rooms } from "../../src/state/rooms.js";

describe("Full Game Flow Integration", () => {
  beforeEach(() => {
    rooms.clear();
  });

  it("should create a room, join players, and generate views with Control Panel data", async () => {
    // 1. Create a room
    const mockSession = "test-session-123";
    const createRes = await handleRoomToolCall("create_room", { playerName: "Host" }, mockSession);
    expect(createRes.isError).toBeFalsy();
    
    const code = Array.from(rooms.keys())[0];
    
    // 2. Join 2 more players to start the game
    await handleRoomToolCall("join_room", { roomCode: code, playerName: "P2" }, mockSession);
    await handleRoomToolCall("join_room", { roomCode: code, playerName: "P3" }, mockSession);
    
    const room = rooms.get(code)!;
    expect(room.players.length).toBe(3);
    expect(room.bomb.status).toBe("active");
    expect(room.bomb.modules.length).toBe(3); // Wires, Morse, Control Panel
    
    // 3. Find the overseer
    const overseer = room.players.find(p => p.role === "Overseer");
    expect(overseer).toBeDefined();
    
    // 4. Call get_my_view for Overseer
    const viewRes = await handlePlayerToolCall("get_my_view", { roomCode: code, playerId: overseer!.id }, mockSession);
    
    // 5. Verify the view contains the new casing information (Batteries & Indicators)
    const viewText = viewRes.content[0].text;
    expect(viewText).toContain("[OVERSEER VIEW]");
    expect(viewText).toContain("--- CASING INFORMATION ---");
    expect(viewText).toContain("Batteries:");
    
    // 6. Test Defuser view
    const defuser = room.players.find(p => p.role === "Defuser");
    const defuserView = await handlePlayerToolCall("get_my_view", { roomCode: code, playerId: defuser!.id }, mockSession);
    const defuserText = defuserView.content[0].text;
    expect(defuserText).toContain("MODULE 3: Control Panel");
  });
});
