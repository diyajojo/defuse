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
}

export function generateWireModule(): WireModule {
  const colors = ["red", "blue", "yellow", "white", "black"];
  // Generate a random number of wires between 3 and 6
  const numWires = Math.floor(Math.random() * 4) + 3;
  const wires: string[] = [];
  
  for (let i = 0; i < numWires; i++) {
    wires.push(colors[Math.floor(Math.random() * colors.length)]);
  }

  let targetWireIndex = 0;
  
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
  };
}
