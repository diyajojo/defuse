export interface WireModule {
  type: "wires";
  wires: string[]; // e.g., ["red", "blue", "yellow", "white"]
  targetWireIndex: number; // The correct wire to cut
  isDefused: boolean;
}

export interface Bomb {
  status: "uninitialized" | "active" | "defused" | "exploded";
  timerSeconds: number; // e.g., 300 for 5 minutes
  strikes: number; // Mistakes made
  maxStrikes: number; // Game over if strikes >= maxStrikes
  modules: WireModule[]; // The puzzles on the bomb
  serialNumber: string; // Dynamic serial number (e.g. X1Y-234)
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

export function createInitialBomb(): Bomb {
  return {
    status: "uninitialized",
    timerSeconds: 300,
    strikes: 0,
    maxStrikes: 3,
    modules: [],
    serialNumber: generateSerialNumber(),
  };
}
