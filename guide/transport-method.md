## **Understanding** **`stdio` vs Network Transport in** 

## **MCP** 

One of the first architectural decisions when building an MCP server is choosing **how the AI client communicates with your server** . This communication mechanism is called a **transport** . 

The two common approaches are: 

- `stdio` (Standard Input / Standard Output) 

- Network Transport (HTTP / Streamable HTTP) 

## **`stdio` Transport** 

With `stdio` , the AI client **starts the MCP server itself** as a local process and communicates directly with it. 

```
Claude
↓
Starts Server
↓
Talks to Server
```

## **Characteristics** 

- Designed primarily for local development. 

- Typically one AI client communicates with one server process. 

- Excellent for local tools like filesystem access, Git, or SQLite. 

- Simple to set up since no network endpoint is required. 

## **Network Transport (HTTP)** 

With a network transport, the MCP server runs independently as a service, and multiple AI clients connect to the same server. 

1 

```
Claude A
        │
Claude B
        │
Claude C
        │
─────────────
        │
Running MCP Server
        │
Shared State
```

## **Characteristics** 

- Multiple AI clients can connect simultaneously. 

- Every client interacts with the same server instance. 

- All clients share the same application state. 

- Ideal for collaborative and multiplayer applications. 

## **Why Does This Matter?** 

The main difference is **where the server lives** . 

## **`stdio`** 

The AI client launches the server and communicates with its own local server process. 

## **Network Transport** 

The server is already running, and every client connects to that same server through a network endpoint (for example, `http://localhost:3000` during development or a deployed URL in production). 

Because everyone connects to the same server, they all interact with the same shared state, making collaboration and real-time synchronization possible. 

## **Mental Model** 

Think of it like this: 

- **`stdio`** → _"Claude starts and talks to its own server."_ 

- **Network Transport** → _"Multiple Claude clients talk to one shared server."_ 

2 

Neither approach is universally better—they are designed for different kinds of applications. For single-user local tools, `stdio` is usually the simplest choice. For collaborative applications where multiple AI clients need to work together on shared data, a network transport is the more appropriate architecture. 

3 

