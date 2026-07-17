import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generateSerialNumber, generateWireModule, createInitialBomb } from "../../src/state/bomb.js";

describe("Bomb Module Logic", () => {
  let originalRandom: typeof Math.random;
  let mockValues: number[] = [];
  let mockIndex = 0;

  beforeEach(() => {
    originalRandom = Math.random;
    mockIndex = 0;
    mockValues = [];
    Math.random = () => {
      if (mockIndex < mockValues.length) {
        return mockValues[mockIndex++];
      }
      return originalRandom();
    };
  });

  afterEach(() => {
    Math.random = originalRandom;
  });

  function setMockRandomForWires(colorsWanted: string[]) {
    const colors = ["red", "blue", "yellow", "white", "black"];
    // first random determines number of wires: Math.floor(r * 4) + 3 = len
    // we set len - 3 to get correct multiplier
    const len = colorsWanted.length;
    const lenRandom = (len - 3) / 4;
    mockValues = [lenRandom];

    for (const color of colorsWanted) {
      const idx = colors.indexOf(color);
      if (idx === -1) throw new Error("Invalid color: " + color);
      // Math.floor(r * 5) = idx
      // we can use idx / 5 to guarantee it matches
      mockValues.push(idx / 5);
    }
    mockIndex = 0;
  }

  it("should generate a valid serial number format", () => {
    const serial = generateSerialNumber();
    expect(serial).toMatch(/^[A-Z][0-9][A-Z]-[0-9]{3}$/);
  });

  it("should initialize a bomb correctly", () => {
    const bomb = createInitialBomb();
    expect(bomb.status).toBe("uninitialized");
    expect(bomb.timerSeconds).toBe(300);
    expect(bomb.strikes).toBe(0);
    expect(bomb.maxStrikes).toBe(3);
    expect(bomb.serialNumber).toMatch(/^[A-Z][0-9][A-Z]-[0-9]{3}$/);
  });

  describe("Odd Serial Number Rules (Ending in 5)", () => {
    const oddSerial = "A1B-125";

    it("Rule 1: Red wire present -> cut second wire (index 1)", () => {
      setMockRandomForWires(["red", "blue", "yellow"]); // contains red
      const module = generateWireModule(oddSerial);
      expect(module.wires).toEqual(["red", "blue", "yellow"]);
      expect(module.targetWireIndex).toBe(1);
    });

    it("Rule 2: No red, last is white -> cut last wire", () => {
      setMockRandomForWires(["blue", "yellow", "white"]);
      const module = generateWireModule(oddSerial);
      expect(module.targetWireIndex).toBe(2); // last wire
    });

    it("Rule 3: No red, last not white, has blue -> cut first wire (index 0)", () => {
      setMockRandomForWires(["blue", "yellow", "black"]);
      const module = generateWireModule(oddSerial);
      expect(module.targetWireIndex).toBe(0); // first wire
    });

    it("Rule 4: Otherwise -> cut last wire", () => {
      setMockRandomForWires(["black", "yellow", "black"]);
      const module = generateWireModule(oddSerial);
      expect(module.targetWireIndex).toBe(2); // last wire
    });
  });

  describe("Even Serial Number Rules (Ending in 4)", () => {
    const evenSerial = "A1B-124";

    it("Rule 1: Red wire present -> cut first wire (index 0)", () => {
      setMockRandomForWires(["red", "blue", "yellow"]); // contains red
      const module = generateWireModule(evenSerial);
      expect(module.targetWireIndex).toBe(0);
    });

    it("Rule 2: No red, last is white -> cut second wire (index 1)", () => {
      setMockRandomForWires(["blue", "yellow", "white"]);
      const module = generateWireModule(evenSerial);
      expect(module.targetWireIndex).toBe(1);
    });

    it("Rule 3: No red, last not white, has blue -> cut last wire", () => {
      setMockRandomForWires(["blue", "yellow", "black"]);
      const module = generateWireModule(evenSerial);
      expect(module.targetWireIndex).toBe(2); // last wire
    });

    it("Rule 4: Otherwise -> cut first wire (index 0)", () => {
      setMockRandomForWires(["black", "yellow", "black"]);
      const module = generateWireModule(evenSerial);
      expect(module.targetWireIndex).toBe(0); // first wire
    });
  });
});
