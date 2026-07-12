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

export function createInitialBomb(): Bomb {
  return {
    status: "uninitialized",
    timerSeconds: 300,
    strikes: 0,
    maxStrikes: 3,
    modules: [],
  };
}
