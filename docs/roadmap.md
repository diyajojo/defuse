## **Multiplayer Bomb Defusal (MCP) — Beginner Learning Roadmap** 

**Goal:** Learn the Model Context Protocol (MCP) by building a real-time multiplayer bombdefusal game where multiple Claude chats connect to the same server but receive different information. 

This project is intentionally designed to teach **real MCP concepts** , not just how to expose tools. 

## **Final Vision** 

Imagine three people. 

Each opens **their own Claude Desktop chat** . 

Each connects to the same MCP server. 

Each joins the same room. 

None of them sees the entire bomb. 

Instead, 

Player A 

- Wire colors 

Player B 

- Bomb manual 

Player C 

- Countdown timer 

- Serial number 

No player can solve the bomb alone. 

They must communicate with each other. 

The MCP server is the single source of truth. 

1 

## **What You'll Learn** 

By completing this project you should understand: 

- What MCP actually is 

- Why MCP servers exist 

- Tool registration 

- Resources 

- Shared server state 

- Multiple client connections 

- Session management 

- Concurrency 

- Server push 

- Event-driven architecture 

- Designing AI-native tools 

## **Project Architecture** 

**==> picture [456 x 227] intentionally omitted <==**

**----- Start of picture text -----**<br>
             Claude Desktop<br>                  │<br>        ┌─────────┴─────────┐<br>        │                   │<br>     Player A            Player B<br>        │                   │<br>        └─────────┬─────────┘<br>                  │<br>            MCP Server<br>                  │<br>         Shared Bomb State<br>                  │<br>       ┌──────────┴──────────┐<br>       │                     │<br>   Room Manager         Puzzle Engine<br>**----- End of picture text -----**<br>


## **Tech Stack** 

|Component|Technology|
|---|---|
|Language|TypeScript|



2 

|Component|Technology|
|---|---|
|Runtime|Node.js|
|MCP SDK|Ofcial MCP TypeScript SDK|
|State|In-memory (later SQLite)|
|Communication|MCP Transport|
|Optional UI|Claude Desktop|



## **Phase 0 — Understand MCP** 

## **Goal** 

Before writing code, understand what MCP is. 

You should be able to answer: 

- What is an MCP Server? • What is an MCP Client? • What is a Tool? • What is a Resource? • What is a Prompt? • Why not expose a REST API instead? 

## **Mental Model** 

Think of MCP like this: 

```
Claude
↓
"I need outside information."
↓
MCP Tool
↓
Your Server
```

3 

```
↓
Real World
```

Claude never directly edits your game. 

Everything happens through your server. 

## **Phase 1 — Build the Smallest MCP Server** 

## **Goal** 

Create a server Claude can connect to. 

Don't build the game yet. 

Simply expose one tool. 

Example 

```
hello()
```

Returns 

```
Hello from MCP!
```

## **Learn** 

- Server lifecycle 

- Tool registration 

- Claude Desktop connection 

- Testing tools 

Deliverable 

A working MCP server. 

4 

## **Phase 2 — Learn Server State** 

## **Goal** 

Understand why MCP servers are powerful. 

Create 

```
counter = 0
```

Tool 

```
increment()
```

Every call changes the server state. 

Example 

```
increment()
↓
1
increment()
↓
2
increment()
↓
3
```

## **Learn** 

Unlike HTTP, 

5 

your server remembers things. 

This is the foundation of your bomb game. 

## **Phase 3 — Create Rooms** 

Goal 

Support multiple games. 

Data Model 

```
Room
↓
Code
↓
Bomb
↓
Players
```

Tool 

```
create_room()
```

Returns 

```
ABCD12
```

Another tool 

```
join_room("ABCD12")
```

6 

Learn 

- Session management 

- Game lifecycle 

- Room ownership 

Deliverable 

Multiple rooms can exist simultaneously. 

## **Phase 4 — Player Management** 

Goal 

Track who joined. 

Each room stores 

```
Player A
Player B
Player C
```

Each player receives 

- ID • Role • Connection 

Learn 

Why identity matters. 

Without player identity, 

everyone would see the same information. 

## **Phase 5 — Shared Bomb State** 

Goal 

7 

Create the bomb. 

Example 

```
Bomb
Timer
Modules
Strikes
Solved
Failed
```

This is your central state. 

Every player interacts with the same object. 

Learn 

Single source of truth. 

## **Phase 6 — Per-Player Views** 

This is the heart of the project. 

Tool 

```
get_my_view()
```

Player A receives 

```
Wire Module
```

Player B receives 

```
Bomb Manual
```

8 

Player C receives 

```
Serial Number
```

```
Timer
```

Everyone is connected to 

the same bomb, 

but nobody sees everything. 

Learn 

Different clients 

Different resources 

Same shared state 

This is one of MCP's strongest capabilities. 

## **Phase 7 — Player Actions** 

Goal 

Allow interaction. 

Tool 

```
interact()
```

Examples 

```
Cut Wire
```

```
Enter Code
```

```
Flip Switch
```

9 

```
Rotate Dial
```

The server validates 

against 

the hidden bomb. 

Learn 

Business logic belongs 

inside the server, 

not Claude. 

## **Phase 8 — Game Rules** 

Goal 

Implement the bomb logic. 

Example 

Wrong wire 

↓ 

Strike 

Three strikes 

↓ 

Explosion 

Correct module 

↓ 

Solved 

10 

Learn 

Server-side validation. 

Claude cannot cheat. 

## **Phase 9 — Real-Time Updates** 

Goal 

Notify everyone. 

Player A cuts a wire. 

Player B instantly sees 

```
Wire cut.
```

Timer changes. 

Everyone updates. 

Learn 

Server push 

instead of 

constant polling. 

This is where the experience becomes multiplayer. 

## **Phase 10 — Handle Concurrency** 

Goal 

Handle two players acting simultaneously. 

Example 

11 

Player A 

cuts wire. 

Player B cuts same wire at the same time. 

Questions Who wins? Who receives the error? 

How is state protected? 

Learn 

Race conditions 

Atomic updates 

Server synchronization 

This is a major backend concept beyond MCP. 

## **Phase 11 — Puzzle Generation** 

Instead of hardcoding every bomb, 

generate puzzles. 

Example 

```
Wire puzzle
Button puzzle
Keypad puzzle
```

12 

```
Memory puzzle
```

The server randomly assembles a bomb. 

Learn 

Procedural generation 

Randomization 

Replayability 

## **Phase 12 — AI Flavor (Sampling)** 

This is an advanced MCP feature. 

The server asks each Claude instance 

to generate 

- Panic dialogue • Mission briefing 

- NPC chatter 

- Funny warnings 

This isn't required 

but demonstrates 

AI collaborating with the server. 

## **Phase 13 — Polish** 

Add 

- Better logging 

- Error handling 

- Room cleanup 

- Reconnect support 

- Timer improvements 

- Better prompts 

13 

• Rich responses 

## **Final Architecture** 

**==> picture [456 x 337] intentionally omitted <==**

**----- Start of picture text -----**<br>
             Claude Desktop<br>                    │<br>      ┌─────────────┼─────────────┐<br>      │             │             │<br>  Player A      Player B      Player C<br>      │             │             │<br>      └─────────────┼─────────────┘<br>                    │<br>              MCP Server<br>                    │<br>        ┌───────────┴───────────┐<br>        │                       │<br>   Room Manager           Player Manager<br>        │                       │<br>        └───────────┬───────────┘<br>                    │<br>              Bomb Manager<br>                    │<br>        ┌───────────┴───────────┐<br>        │                       │<br>   Puzzle Engine         Timer Engine<br>                    │<br>             Shared Game State<br>**----- End of picture text -----**<br>


## **Learning Experiments** 

Don't stop when it works. 

Experiment. 

## **Experiment 1** 

Instead of three players, 

support five. 

14 

Observe 

How the server scales. 

## **Experiment 2** 

Add another bomb module. 

Observe 

How game state grows. 

## **Experiment 3** 

Disconnect one Claude. 

Reconnect. 

Can they recover? 

## **Experiment 4** 

Store rooms in SQLite. 

Instead of memory, 

persist games. 

## **Experiment 5** 

Support multiple bombs simultaneously. 

Observe 

Room isolation. 

15 

## **Learning Checklist** 

- [ ] Understand the MCP architecture 

- [ ] Build a basic MCP server 

- [ ] Register tools 

- [ ] Connect Claude Desktop 

- [ ] Learn persistent server state 

- [ ] Implement room management 

- [ ] Implement player management 

- [ ] Build the bomb state model 

- [ ] Create per-player views 

- [ ] Validate player actions 

- [ ] Push live updates 

- [ ] Handle concurrent actions 

- [ ] Add puzzle generation 

- [ ] Add AI-generated flavor 

- [ ] Polish and test multiplayer sessions 

- 

## **What You'll Know After Completing This Project** 

You won't just know how to write an MCP server—you'll understand why MCP exists and what it enables: 

- How AI clients interact with external systems through tools 

- Why the server, not the LLM, owns application state 

- How multiple AI clients can collaborate through a shared backend 

- How to design tools that expose capabilities instead of implementation details 

- How event-driven updates differ from simple request/response APIs 

- How concurrency and shared state affect AI-powered applications 

- How to build MCP applications that go beyond single-user assistants into collaborative, real-time systems 

Most importantly, you'll have built a project that demonstrates MCP's strengths—shared state, controlled capabilities, multi-client coordination, and server orchestration—in a way that is difficult to replicate with a conventional REST API or a single AI chat. 

16 

