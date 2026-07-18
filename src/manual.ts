export const START_DEFUSE_MANUAL_TEXT = `[INSTRUCTION TO ASSISTANT: The text between the === markers below is the official game manual. You MUST copy and paste it to the user EXACTLY as written below — every line, every emoji, every heading. Do NOT summarize, rephrase, shorten, or add any text of your own before or after it. Just display it verbatim.]

===
# 💣 DEFUSE — GAME MANUAL 

A cooperative bomb-defusal game for 3 players. No single player has the full picture. 
You must communicate and work as a team to defuse the bomb before time runs out.

---

## 👥 THE 3 ROLES

| Role | What You See | What You Can Do |
|------|-------------|-----------------|
| **Defuser** | The physical bomb (wires, modules) | Cut wires using \`interact\` |
| **Expert** | The Bomb Defusal Manual (the rules) | Read rules aloud to the Defuser |
| **Overseer** | The bomb's external casing (serial number, timer) | Feed clues to the Expert |

---

## 🎮 HOW TO START

**Step 1 — Host creates a room:**
> Tell Claude: **create-room-[YOUR NAME]**
> You will receive your **Room Code**, **Player ID**, and **Role**.

**Step 2 — Friends join the room:**
> Tell Claude: **join-[CODE]-[THEIR NAME]**
> They will each receive their own **Player ID** and **Role**.

**Step 3 — Game starts automatically when 3 players join!**

---

## 📋 DURING THE GAME

Once the game starts, each player must check their view using their Room Code and Player ID:
**🔴 If you are the Defuser:**
> Tell Claude: **view-[CODE]-[YOUR ID]**
> You will see the wires and the Morse code blinking sequence. Describe them out loud.

**📖 If you are the Expert:**
> Tell Claude: **view-[CODE]-[YOUR ID]**
> You will see the Wires rules and the Morse translation table. Guide your teammates.

**👁️ If you are the Overseer:**
> Tell Claude: **view-[CODE]-[YOUR ID]**
> You will see the bomb casing and the Frequency directory table. Share information with the Expert.

---

## ✂️ INTERACTING WITH THE BOMB (Defuser only)

**To cut a wire:**
> Tell Claude: **cut-[WIRE NUMBER]-[CODE]-[YOUR ID]**

**To submit a frequency for the Morse module:**
> Tell Claude: **submit-frequency-[FREQUENCY]-[CODE]-[YOUR ID]**

**To press a button on the Control Panel:**
> Tell Claude: **press-button-[COLOR]-[CODE]-[YOUR ID]**

- ✅ Correct action → Module defused! (Defuse all modules to win)
- ❌ Wrong action → Strike added (3 strikes = 💥 BOOM, game over!)

---

## 📡 CHECK FOR UPDATES (Any player)

Want to see what's happening? Check who joined, bomb status, and recent events:
> Tell Claude: **status-[CODE]**

Use this anytime to see the latest game state — who joined, strikes, and if the bomb was defused or exploded!

---

**Ready? Tell Claude: "create-room-[YOUR NAME]" to begin!**

---

## ⌨️ QUICK COMMAND REFERENCE

**Pre-Game:**
- \`create-room-[NAME]\` : Create a new room
- \`join-[CODE]-[NAME]\` : Join an existing room

**During Game (Any Player):**
- \`view-[CODE]-[ID]\` : Look at your specific puzzle / manual
- \`status-[CODE]\` : Check the timer, strikes, and game status

**Defusing (Defuser Only):**
- \`cut-[WIRE NUMBER]-[CODE]-[ID]\` : Cut a wire (1-indexed)
- \`submit-frequency-[FREQ]-[CODE]-[ID]\` : Submit Morse frequency
- \`press-button-[COLOR]-[CODE]-[ID]\` : Press Control Panel button (red/blue/white)

===`.trim();

export function getDefuserView(
  mins: number,
  secs: number,
  strikes: number,
  maxStrikes: number,
  wireStatus: string,
  wireText: string,
  morseStatus: string,
  morseSequence: string,
  controlPanelStatus: string
): string {
  return `[DEFUSER VIEW]
You are looking at the bomb.
Timer: ${mins}m ${secs}s remaining
Strikes: ${strikes}/${maxStrikes}

MODULE 1: Wires${wireStatus}
There are wires of the following colors in order: ${wireText}

MODULE 2: Morse Code Light${morseStatus}
A status light is blinking: ${morseSequence}

MODULE 3: Control Panel${controlPanelStatus}
There are 3 colored buttons: RED, BLUE, and WHITE.`;
}

export const EXPERT_VIEW_TEXT = `[EXPERT VIEW]
You are looking at the Bomb Defusal Manual.

--- WIRE MODULE INSTRUCTIONS ---
First, ask the Overseer for the bomb's Serial Number.

IF THE LAST DIGIT OF THE SERIAL NUMBER IS ODD:
1. If there is a red wire, cut the second wire.
2. Otherwise, if the last wire is white, cut the last wire.
3. Otherwise, if there is a blue wire, cut the first wire.
4. Otherwise, cut the last wire.

IF THE LAST DIGIT OF THE SERIAL NUMBER IS EVEN:
1. If there is a red wire, cut the first wire.
2. Otherwise, if the last wire is white, cut the second wire.
3. Otherwise, if there is a blue wire, cut the last wire.
4. Otherwise, cut the first wire.

--- MORSE CODE MODULE INSTRUCTIONS ---
The Defuser will see a blinking Morse code sequence representing a word.
1. Translate the Morse code to a word using this table:
   A: •—      B: —•••    C: —•—•    D: —••     E: •
   F: ••—•    G: ——•     H: ••••    I: ••      J: •———
   K: —•—     L: •—••    M: ——      N: —•      O: ———
   P: •——•    Q: ——•—    R: •—•     S: •••     T: —
   U: ••—     V: •••—    W: •——     X: —••—    Y: —•——
   Z: ——••
2. Tell the decoded word to the Overseer.
3. The Overseer will give you a frequency. Tell the Defuser to enter that frequency.

--- CONTROL PANEL INSTRUCTIONS ---
The Defuser will see 3 colored buttons: RED, BLUE, and WHITE.
1. If the bomb has 3 or more batteries, press the RED button.
2. Otherwise, if there is a lit "CAR" indicator, press the BLUE button.
3. Otherwise, if there is a lit "FRK" indicator AND exactly 0 batteries, press the WHITE button.
4. Otherwise, if the Serial Number contains a vowel (A, E, I, O, U), press the BLUE button.
5. Otherwise, press the WHITE button.`;

export function getOverseerView(
  mins: number,
  secs: number,
  serialNumber: string,
  batteries: number,
  indicators: string[]
): string {
  const indText = indicators.length > 0 ? indicators.map(i => `- Lit Indicator: ${i}`).join("\n") : "- No lit indicators";
  
  return `[OVERSEER VIEW]
You are monitoring the external casing of the bomb.
Timer: ${mins}m ${secs}s remaining

--- CASING INFORMATION ---
Serial Number: ${serialNumber}
Batteries: ${batteries}
${indText}

--- FREQUENCY DIRECTORY (MORSE MODULE) ---
Look up the word translated by the Expert to find the correct frequency:
- SHELL: 3.515 MHz
- STING: 3.542 MHz
- CLOCK: 3.555 MHz
- LATER: 3.572 MHz
- BLINK: 3.600 MHz`;
}
