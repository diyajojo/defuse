## **Understanding MCP (Model Context Protocol)** 

Before building an MCP server, it's important to understand **what MCP is** and **why it exists** . This document serves as a conceptual guide before diving into implementation. 

## **What is MCP?** 

**MCP (Model Context Protocol)** is an open standard that allows **AI clients** (such as Claude Desktop, ChatGPT, or other MCP-compatible applications) to communicate with **external systems** in a structured and standardized way. 

Think of it as a common language between AI and the outside world. 

Just as **HTTP** standardizes communication between web browsers and web servers, **MCP** standardizes communication between AI clients and external applications. 

Without MCP, an AI only knows: 

- Its training data 

- The current conversation 

It cannot directly: 

- Read your local files 

- Access a database 

- Control an application 

- Interact with your game 

- Use third-party services 

MCP provides a secure, structured way for AI to interact with these external systems. 

## **What is an MCP Server?** 

An **MCP Server** is an application that exposes an external system to AI clients. 

It acts as the bridge between the AI and your application. 

The server: 

- Owns the application's state 

- Stores all data 

1 

- Implements business logic 

- Decides what the AI is allowed to access 

- Executes actions requested by the AI 

It is the **single source of truth** . 

## **Example** 

Imagine building a multiplayer bomb defusal game. 

The MCP server stores: 

```
Room
Players
Bomb
Timer
Strikes
Solved Modules
```

Claude never stores this information. 

Whenever Claude needs information or wants to perform an action, it asks the MCP server. 

## **What is an MCP Client?** 

An **MCP Client** is an application capable of communicating with MCP servers. 

Examples include: 

- Claude Desktop 

- ChatGPT (where MCP is supported) 

- Gemini (where MCP is supported) 

- AI coding assistants 

The client discovers the server's capabilities and invokes them when necessary. 

In your project: 

```
Claude Desktop
        │
        ▼
Bomb MCP Server
```

2 

Each Claude Desktop instance acts as its own MCP client. 

## **MCP Server vs External Resource** 

This is a common point of confusion. 

The **external resource** is **not** the MCP server. 

The MCP server simply exposes that resource. 

Example: 

```
Supabase Database
        │
        ▼
Supabase MCP Server
        │
        ▼
Claude Desktop
```

The database is the resource. 

The MCP server is the bridge. 

Similarly, 

```
Bomb Game
        │
        ▼
Bomb MCP Server
        │
        ▼
Claude Desktop
```

Your game is the resource. 

The MCP server exposes it to AI. 

3 

## **Does Claude Have Access to Everything?** 

No. 

Claude only has access to what **you explicitly expose** . 

Suppose your application contains: 

```
Players
Bomb State
Admin Controls
Passwords
Secret Solution
```

The AI cannot automatically see or modify everything inside your application. 

The MCP server decides exactly what information and functionality is exposed to the AI. 

This makes the server the authority over your application's data and behavior. 

## **Why Use MCP Instead of HTTP APIs?** 

A common question is: 

"Couldn't I just expose a REST API?" 

Technically, yes. 

However, REST APIs are designed for applications—not AI. 

A REST API might expose endpoints like: 

```
POST /game/cutWire
GET /game/status
POST /join
```

An AI doesn't automatically know: 

- What each endpoint does 

4 

- Which endpoint to call 

- What parameters are required 

- What responses to expect 

You would need to build custom integrations and manually teach the AI how to use your API. 

MCP solves this problem. 

An MCP server describes its capabilities in a standardized format, allowing any MCP-compatible AI client to discover and use them automatically without writing client-specific integrations. 

This makes MCP a standard interface specifically designed for AI applications. 

## **Mental Model** 

The easiest way to understand MCP is with this flow. 

```
                User
                  │
                  ▼
          Claude Desktop
           (MCP Client)
                  │
                  ▼
          Bomb MCP Server
                  │
      ┌───────────┴───────────┐
      │                       │
      ▼                       ▼
   Game Logic           Shared Game State
      │                       │
      └───────────┬───────────┘
                  │
                  ▼
             Response
                  │
                  ▼
          Claude Desktop
                  │
                  ▼
                User
```

Notice that Claude **never talks directly to the game** . 

5 

Everything passes through the MCP server. 

The server is responsible for: 

- Maintaining the application's state 

- Executing business logic 

- Controlling what the AI can access 

- Returning the appropriate response to the client 

This separation keeps the application secure, consistent, and reliable. 

6 

