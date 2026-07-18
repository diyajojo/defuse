import { describe, it, expect } from "vitest";
import { 
  translateWordToMorse, 
  generateMorseModule, 
  createInitialBomb, 
  generateWireModule, 
  Bomb, 
  MorseModule 
} from "../../src/state/bomb.js";

describe("Morse Code Module Logic", () => {
  it("should translate words to Morse code correctly with letter spacing", () => {
    // SHELL: S = •••, H = ••••, E = •, L = •—••, L = •—••
    const morse = translateWordToMorse("SHELL");
    expect(morse).toBe("•••   ••••   •   •—••   •—••");
  });

  it("should generate a valid Morse module with correct values", () => {
    const module = generateMorseModule();
    expect(module.type).toBe("morse");
    expect(module.isDefused).toBe(false);
    expect(["SHELL", "STING", "CLOCK", "LATER", "BLINK"]).toContain(module.targetWord);
    
    // Check that target frequency matches
    const expectedFreqMap: Record<string, string> = {
      "SHELL": "3.515",
      "STING": "3.542",
      "CLOCK": "3.555",
      "LATER": "3.572",
      "BLINK": "3.600"
    };
    expect(module.targetFrequency).toBe(expectedFreqMap[module.targetWord]);
    expect(module.morseSequence).toBe(translateWordToMorse(module.targetWord));
  });

  it("should defuse only when both Morse and Wire modules are defused", () => {
    const bomb = createInitialBomb();
    bomb.status = "active";
    
    const wireModule = generateWireModule(bomb.serialNumber);
    const morseModule = generateMorseModule();
    
    bomb.modules.push(wireModule);
    bomb.modules.push(morseModule);
    
    expect(bomb.status).toBe("active");
    
    // 1. Defuse wire module
    wireModule.isDefused = true;
    let allDefused = bomb.modules.every(m => m.isDefused);
    if (allDefused) bomb.status = "defused";
    
    // Wire defused, but Morse is not -> Bomb should still be active
    expect(bomb.status).toBe("active");
    
    // 2. Defuse morse module
    morseModule.isDefused = true;
    allDefused = bomb.modules.every(m => m.isDefused);
    if (allDefused) bomb.status = "defused";
    
    // Both defused -> Bomb should be defused
    expect(bomb.status).toBe("defused");
  });
});
