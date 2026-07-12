export const helpToolSchemas = [
  {
    name: "start_defuse",
    description: "Call this tool immediately when the user wants to start playing the Defuse game, or types something like 'start-defuse'. It returns a concise manual explaining the rules, roles, and flow.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

export async function handleHelpToolCall(name: string, args: any) {
  if (name === "start_defuse") {
    return {
      content: [
        {
          type: "text",
          text: `
# 💣 DEFUSE — GAME MANUAL 💣

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
> Tell Claude: *"Create a room for me, my name is [your name]"*
> You will receive your **Room Code**, **Player ID**, and **Role**.

**Step 2 — Friends join the room:**
> Each friend tells their Claude: *"Join room [ROOM CODE], my name is [their name]"*
> They will each receive their own **Player ID** and **Role**.

**Step 3 — Game starts automatically when 3 players join!**

---

## 📋 DURING THE GAME

Once the game starts, each player must check their view **using their own Room Code + Player ID**:

**🔴 If you are the Defuser:**
> Tell Claude: *"Show me my view. Room Code: [CODE], Player ID: [YOUR ID]"*
> You will see the bomb's wires. Describe them out loud to your teammates.

**📖 If you are the Expert:**
> Tell Claude: *"Show me my view. Room Code: [CODE], Player ID: [YOUR ID]"*
> You will see the Defusal Manual. Read the rules and guide the Defuser.

**👁️ If you are the Overseer:**
> Tell Claude: *"Show me my view. Room Code: [CODE], Player ID: [YOUR ID]"*
> You will see the bomb casing details. Share clues with the Expert.

---

## ✂️ CUTTING A WIRE (Defuser only)

Once the team agrees on which wire to cut, the Defuser tells Claude:
> *"Cut wire [NUMBER]. Room Code: [CODE], Player ID: [YOUR ID]"*

- ✅ Correct wire → Module defused!
- ❌ Wrong wire → Strike added (3 strikes = 💥 BOOM, game over!)

---

**Ready? Tell Claude: *"Create a room for me, my name is [your name]"* to begin!**
`.trim(),
        },
      ],
    };
  }

  return {
    isError: true,
    content: [{ type: "text", text: `Tool not found in help tools: ${name}` }]
  };
}
