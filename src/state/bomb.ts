export interface WireModule {
  type: "wires";
  wires: string[]; // e.g., ["red", "blue", "yellow", "white"]
  targetWireIndex: number; // The correct wire to cut
  isDefused: boolean;
}

export interface MorseModule {
  type: "morse";
  targetWord: string; // e.g., "SHELL"
  morseSequence: string; // e.g., ".... .... . .-.. .-.." (with spacing)
  targetFrequency: string; // e.g., "3.515"
  isDefused: boolean;
}

export interface ControlPanelModule {
  type: "control_panel";
  targetButton: "red" | "blue" | "white";
  isDefused: boolean;
}

export type BombModule = WireModule | MorseModule | ControlPanelModule;

export interface Bomb {
  status: "uninitialized" | "active" | "defused" | "exploded";
  timerSeconds: number; // e.g., 300 for 5 minutes
  strikes: number; // Mistakes made
  maxStrikes: number; // Game over if strikes >= maxStrikes
  modules: BombModule[]; // The puzzles on the bomb
  serialNumber: string; // Dynamic serial number (e.g. X1Y-234)
  batteries: number; // e.g. 0 to 3 batteries
  indicators: string[]; // e.g. ["FRK", "CAR"]
}

export function generateSerialNumber(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const l1 = letters[Math.floor(Math.random() * letters.length)];
  const d1 = digits[Math.floor(Math.random() * digits.length)];
  const l2 = letters[Math.floor(Math.random() * letters.length)];
  const d2 = digits[Math.floor(Math.random() * digits.length)];
  const d3 = digits[Math.floor(Math.random() * digits.length)];
  const d4 = digits[Math.floor(Math.random() * digits.length)];
  return `${l1}${d1}${l2}-${d2}${d3}${d4}`;
}

export function generateWireModule(serialNumber: string): WireModule {
  const colors = ["red", "blue", "yellow", "white", "black"];
  // Generate a random number of wires between 3 and 6
  const numWires = Math.floor(Math.random() * 4) + 3;
  const wires: string[] = [];
  
  for (let i = 0; i < numWires; i++) {
    wires.push(colors[Math.floor(Math.random() * colors.length)]);
  }

  // Determine if the last digit of the serial number is odd
  const lastChar = serialNumber[serialNumber.length - 1];
  const lastDigit = parseInt(lastChar, 10);
  const isOdd = !isNaN(lastDigit) && lastDigit % 2 !== 0;

  let targetWireIndex = 0;
  
  if (isOdd) {
    // Rule 1: If there is a red wire, cut the second wire (index 1)
    if (wires.includes("red")) {
      targetWireIndex = 1;
    }
    // Rule 2: Otherwise, if the last wire is white, cut the last wire
    else if (wires[wires.length - 1] === "white") {
      targetWireIndex = wires.length - 1;
    }
    // Rule 3: Otherwise, if there is a blue wire, cut the first wire (index 0)
    else if (wires.includes("blue")) {
      targetWireIndex = 0;
    }
    // Rule 4: Otherwise, cut the last wire
    else {
      targetWireIndex = wires.length - 1;
    }
  } else {
    // Rule 1: If there is a red wire, cut the first wire (index 0)
    if (wires.includes("red")) {
      targetWireIndex = 0;
    }
    // Rule 2: Otherwise, if the last wire is white, cut the second wire (index 1)
    else if (wires[wires.length - 1] === "white") {
      targetWireIndex = 1;
    }
    // Rule 3: Otherwise, if there is a blue wire, cut the last wire
    else if (wires.includes("blue")) {
      targetWireIndex = wires.length - 1;
    }
    // Rule 4: Otherwise, cut the first wire (index 0)
    else {
      targetWireIndex = 0;
    }
  }

  return {
    type: "wires",
    wires,
    targetWireIndex,
    isDefused: false
  };
}

export function generateIndicators(): string[] {
  const pool = ["FRK", "CAR", "SND", "CLR", "IND", "NSA", "SIG", "TRN", "BOB"];
  const numIndicators = Math.floor(Math.random() * 3); // 0 to 2
  const shuffled = pool.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numIndicators);
}

export function createInitialBomb(): Bomb {
  return {
    status: "uninitialized",
    timerSeconds: 300,
    strikes: 0,
    maxStrikes: 3,
    modules: [],
    serialNumber: generateSerialNumber(),
    batteries: Math.floor(Math.random() * 4), // 0 to 3
    indicators: generateIndicators(),
  };
}

export const MORSE_WORDS: Record<string, string> = {
  "SHELL": "3.515",
  "STING": "3.542",
  "CLOCK": "3.555",
  "LATER": "3.572",
  "BLINK": "3.600"
};

export const MORSE_ALPHABET: Record<string, string> = {
  "A": "•—",    "B": "—•••",  "C": "—•—•",  "D": "—••",   "E": "•",
  "F": "••—•",  "G": "——•",   "H": "••••",  "I": "••",    "J": "•———",
  "K": "—•—",   "L": "•—••",  "M": "——",    "N": "—•",    "O": "———",
  "P": "•——•",  "Q": "——•—",  "R": "•—•",   "S": "•••",   "T": "—",
  "U": "••—",   "V": "•••—",  "W": "•——",   "X": "—••—",  "Y": "—•——",
  "Z": "——••"
};

export function translateWordToMorse(word: string): string {
  return word
    .toUpperCase()
    .split("")
    .map(char => MORSE_ALPHABET[char] || "")
    .filter(Boolean)
    .join("   "); // 3 spaces between letters for clarity
}

export function generateMorseModule(): MorseModule {
  const words = Object.keys(MORSE_WORDS);
  const targetWord = words[Math.floor(Math.random() * words.length)];
  const targetFrequency = MORSE_WORDS[targetWord];
  const morseSequence = translateWordToMorse(targetWord);
  
  return {
    type: "morse",
    targetWord,
    morseSequence,
    targetFrequency,
    isDefused: false
  };
}

export function generateControlPanelModule(bomb: Bomb): ControlPanelModule {
  let targetButton: "red" | "blue" | "white";
  
  const hasVowel = /[AEIOU]/.test(bomb.serialNumber.toUpperCase());
  
  if (bomb.batteries >= 3) {
    targetButton = "red";
  } else if (bomb.indicators.includes("CAR")) {
    targetButton = "blue";
  } else if (bomb.indicators.includes("FRK") && bomb.batteries === 0) {
    targetButton = "white";
  } else if (hasVowel) {
    targetButton = "blue";
  } else {
    targetButton = "white";
  }

  return {
    type: "control_panel",
    targetButton,
    isDefused: false
  };
}
