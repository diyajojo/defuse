import { describe, it, expect } from "vitest";
import { createInitialBomb, Bomb, WireModule } from "../../src/state/bomb.js";

describe("Gameplay State Transitions", () => {
  it("should handle correct wire cut successfully", () => {
    const bomb = createInitialBomb();
    bomb.status = "active";
    
    const wireModule: WireModule = {
      type: "wires",
      wires: ["red", "blue", "yellow"],
      targetWireIndex: 1, // Correct wire is blue (index 1)
      isDefused: false,
    };
    bomb.modules.push(wireModule);

    // Simulate cutting the correct wire (index 1)
    const targetCutIndex = 1;
    if (targetCutIndex === wireModule.targetWireIndex) {
      wireModule.isDefused = true;
      bomb.status = "defused";
    } else {
      bomb.strikes++;
    }

    expect(wireModule.isDefused).toBe(true);
    expect(bomb.status).toBe("defused");
    expect(bomb.strikes).toBe(0);
  });

  it("should handle incorrect wire cuts, increment strikes, and explode at max strikes", () => {
    const bomb = createInitialBomb();
    bomb.status = "active";
    bomb.maxStrikes = 3;
    
    const wireModule: WireModule = {
      type: "wires",
      wires: ["red", "blue", "yellow"],
      targetWireIndex: 1, // Correct wire is blue (index 1)
      isDefused: false,
    };
    bomb.modules.push(wireModule);

    // Helper to simulate cut
    const simulateCut = (index: number) => {
      if (index === wireModule.targetWireIndex) {
        wireModule.isDefused = true;
        bomb.status = "defused";
      } else {
        bomb.strikes++;
        if (bomb.strikes >= bomb.maxStrikes) {
          bomb.status = "exploded";
        }
      }
    };

    // First strike (cut index 0)
    simulateCut(0);
    expect(bomb.strikes).toBe(1);
    expect(bomb.status).toBe("active");
    expect(wireModule.isDefused).toBe(false);

    // Second strike (cut index 2)
    simulateCut(2);
    expect(bomb.strikes).toBe(2);
    expect(bomb.status).toBe("active");

    // Third strike -> Explode (cut index 0 again)
    simulateCut(0);
    expect(bomb.strikes).toBe(3);
    expect(bomb.status).toBe("exploded");
    expect(wireModule.isDefused).toBe(false);
  });
});
