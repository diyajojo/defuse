# DEFUSE

**A 3-player cooperative bomb defusal game powered by AI.**

Built entirely on the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/), DEFUSE is a real-time multiplayer party game where three players connect to the same bomb through their own Claude Desktop clients. No single player has the full picture — you must communicate, decode, and act as a team before the timer hits zero.

Inspired by *Keep Talking and Nobody Explodes*.

---

##  How It Works

Three players join a shared room. A bomb is generated with **3 puzzle modules**, a **5-minute countdown timer**, and a unique set of variables (serial number, batteries, indicators). Each player is randomly assigned one of three roles, and each role can only see specific information:
| Role | What You See | What You Do |
|------|-------------|-------------|
| 🔴 **Defuser** | The physical bomb — wires, blinking lights, buttons | Perform actions: cut wires, submit frequencies, press buttons |
| 📖 **Expert** | The Bomb Defusal Manual — the rules for each module | Read the rules and guide the Defuser on what to do |
| 👁️ **Overseer** | The bomb's external casing — serial number, batteries, indicators, frequency table | Feed critical clues to the Expert |

**No one can win alone.** The Defuser sees the bomb but has no idea what to do. The Expert has the rules but can't see the bomb. The Overseer has the lookup tables and variables that make the rules work. Everyone must talk.

---

## The 3 Modules

Every bomb has exactly three modules. All three must be defused to win.

### Module 1: Wires
The Defuser sees a set of colored wires. The Expert has conditional rules (based on wire colors and the serial number) that determine which single wire to cut. The Overseer must provide the serial number.

### Module 2: Morse Code
The Defuser sees a blinking Morse code sequence. The Expert has the Morse alphabet lookup table to decode it into a word. The Overseer has a frequency directory that maps the decoded word to a radio frequency. The Defuser must submit the correct frequency.

### Module 3: Control Panel
The Defuser sees three colored buttons: **RED**, **BLUE**, and **WHITE**. The Expert has a decision tree based on the bomb's batteries, lit indicators, and serial number. The Overseer must share those casing variables so the Expert can determine the correct button.

---

##  Strikes & Pressure

- Every wrong action earns a **strike**.
- **3 strikes = 💥 BOOM.** The bomb explodes. Game over.
- Strikes make the timer **tick faster**:
  - 0 strikes → normal speed
  - 1 strike → timer runs **1.25x** faster
  - 2 strikes → timer runs **1.5x** faster
- If the timer reaches **0:00**, the bomb explodes regardless of strikes.

---

##  How to Play

*(Note: If you ever forget how to play or need the manual, you can use the **`start-defuse`** prompt built into the MCP server via Claude Desktop's prompt menu to get a full guide!)*

### Step 1 — Setup
One player creates a room. Two others join using the room code. Each player is randomly assigned a role.


```
create-room-[YOUR NAME]        → Creates a room, gives you a Room Code + Player ID
join-[CODE]-[NAME]             → Joins an existing room
```

### Step 2 — The Game Begins
Once all 3 players have joined, the bomb activates automatically. Each player should immediately check their view:

```
view-[CODE]-[YOUR ID]          → See your role-specific information
```

- **Defuser** sees the bomb modules (wires, Morse light, buttons)
- **Expert** sees the defusal manual with rules for all 3 modules
- **Overseer** sees the casing (serial number, batteries, indicators) and frequency table

### Step 3 — Communicate & Defuse
Talk to each other. The Defuser describes what they see. The Expert reads the rules. The Overseer shares casing data. Work through each module:

```
cut-[WIRE NUMBER]-[CODE]-[ID]              → Cut a wire (Wires module)
submit-frequency-[FREQ]-[CODE]-[ID]        → Submit a frequency (Morse module)
press-button-[COLOR]-[CODE]-[ID]           → Press a button (Control Panel module)
```

### Step 4 — Check Status Anytime
Any player can check the current game state at any time:

```
status-[CODE]                  → See timer, strikes, players, and recent events
```

---

##  Win & Lose Conditions

| Outcome | Condition |
|---------|-----------|
| ✅ **WIN** | All 3 modules defused before time runs out |
| 💥 **LOSE** | 3 strikes accumulated OR timer reaches 0:00 |

---

## 

| Command | Who | Description |
|---------|-----|-------------|
| `create-room-[NAME]` | Anyone | Create a new game room |
| `join-[CODE]-[NAME]` | Anyone | Join an existing room |
| `view-[CODE]-[ID]` | Anyone | View your role-specific information |
| `status-[CODE]` | Anyone | Check game status, timer, and events |
| `cut-[WIRE]-[CODE]-[ID]` | Defuser | Cut a wire by number |
| `submit-frequency-[FREQ]-[CODE]-[ID]` | Defuser | Submit a Morse frequency |
| `press-button-[COLOR]-[CODE]-[ID]` | Defuser | Press a button (red/blue/white) |

---

##  Getting Started

### ⚡ Option 1 — Play Now (No Setup Required)

The game server is already deployed and running. Just point your Claude Desktop at the live server and you're ready to play!

**MCP Server URL:** `https://defuse-ho2w.onrender.com/mcp`

Add this to your Claude Desktop MCP config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "defuse": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://defuse-ho2w.onrender.com/mcp"]
    }
  }
}
```

Restart Claude Desktop and you're ready to go. All 3 players use the same URL — each in their own Claude client.

> [!NOTE]
> The server is hosted on Render's free tier. It may take ~30 seconds to wake up on the first request.

---

### 🛠️ Option 2 — Self-Host Locally

#### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Claude Desktop](https://claude.ai/download) with MCP support

#### Installation

```bash
git clone https://github.com/diyajojo/defuse.git
cd defuse
npm install
npm run build
npm start
```

The server starts on `http://localhost:3001/mcp`.

Then point your Claude Desktop config at `http://localhost:3001/mcp` instead.

