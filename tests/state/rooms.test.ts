import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generateRoomCode, generateUniqueRoomCode, rooms } from "../../src/state/rooms.js";

describe("Rooms State Logic", () => {
  beforeEach(() => {
    rooms.clear();
  });

  afterEach(() => {
    rooms.clear();
  });

  it("should generate a 6-character uppercase alphanumeric room code", () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it("should generate a unique room code that does not collide with existing rooms", () => {
    // Pre-populate rooms map with 5 generated codes
    const existingCodes: string[] = [];
    for (let i = 0; i < 5; i++) {
      const code = generateRoomCode();
      existingCodes.push(code);
      rooms.set(code, {
        code,
        players: [],
        bomb: {
          status: "uninitialized",
          timerSeconds: 300,
          strikes: 0,
          maxStrikes: 3,
          modules: [],
          serialNumber: "A1B-123",
          batteries: 2,
          indicators: ["CAR"],
        },
        events: [],
      });
    }

    // Generate a unique code
    const uniqueCode = generateUniqueRoomCode();
    expect(uniqueCode).toHaveLength(6);
    expect(uniqueCode).toMatch(/^[A-Z0-9]{6}$/);
    
    // Ensure the new code is not in the set of pre-populated codes
    expect(existingCodes).not.toContain(uniqueCode);
  });
});
