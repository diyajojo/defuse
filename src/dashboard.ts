import { Express, Request, Response } from "express";
import { rooms } from "./state/rooms.js";

// ── SSE Client Management ──────────────────────────────────────────────
interface SSEClient {
  id: string;
  res: Response;
  roomCode: string;
}

const sseClients: SSEClient[] = [];

export function pushSSE(roomCode: string, event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    if (client.roomCode === roomCode.toUpperCase()) {
      client.res.write(payload);
    }
  }
}

// Push full game state to all browsers watching a room
export function pushFullState(roomCode: string) {
  const room = rooms.get(roomCode.toUpperCase());
  if (!room) return;

  const state = {
    roomCode: room.code,
    players: room.players,
    bomb: {
      status: room.bomb.status,
      timerSeconds: room.bomb.timerSeconds,
      strikes: room.bomb.strikes,
      maxStrikes: room.bomb.maxStrikes,
      moduleCount: room.bomb.modules.length,
    },
    events: room.events.slice(-20),
    playerCount: room.players.length,
  };

  pushSSE(roomCode, "gameState", state);
}

// ── Dashboard Routes ───────────────────────────────────────────────────
export function registerDashboard(app: Express) {

  // SSE endpoint — browsers connect here for live updates
  app.get("/api/events/:roomCode", (req: Request, res: Response) => {
    const roomCode = (req.params.roomCode as string).toUpperCase();

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();

    const clientId = `sse-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const client: SSEClient = { id: clientId, res, roomCode };
    sseClients.push(client);

    console.log(`[SSE] Client ${clientId} connected to room ${roomCode} (${sseClients.filter(c => c.roomCode === roomCode).length} viewers)`);

    // Send initial state immediately
    const room = rooms.get(roomCode);
    if (room) {
      const state = {
        roomCode: room.code,
        players: room.players,
        bomb: {
          status: room.bomb.status,
          timerSeconds: room.bomb.timerSeconds,
          strikes: room.bomb.strikes,
          maxStrikes: room.bomb.maxStrikes,
          moduleCount: room.bomb.modules.length,
        },
        events: room.events.slice(-20),
        playerCount: room.players.length,
      };
      res.write(`event: gameState\ndata: ${JSON.stringify(state)}\n\n`);
    }

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      res.write(":heartbeat\n\n");
    }, 15000);

    // Clean up on disconnect
    req.on("close", () => {
      clearInterval(heartbeat);
      const idx = sseClients.indexOf(client);
      if (idx !== -1) sseClients.splice(idx, 1);
      console.log(`[SSE] Client ${clientId} disconnected from room ${roomCode}`);
    });
  });

  // Dashboard HTML page
  app.get("/game/:roomCode", (req: Request, res: Response) => {
    const roomCode = (req.params.roomCode as string).toUpperCase();
    res.setHeader("Content-Type", "text/html");
    res.send(getDashboardHTML(roomCode));
  });

} // end registerDashboard

// ── Dashboard HTML ─────────────────────────────────────────────────────
function getDashboardHTML(roomCode: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DEFUSE — Room ${roomCode}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --bg-primary: #0a0a0f;
      --bg-secondary: #12121a;
      --bg-card: #1a1a2e;
      --bg-card-hover: #222240;
      --border: #2a2a4a;
      --text-primary: #e8e8f0;
      --text-secondary: #8888aa;
      --text-muted: #555577;
      --accent-red: #ff3355;
      --accent-red-glow: rgba(255, 51, 85, 0.3);
      --accent-green: #00ff88;
      --accent-green-glow: rgba(0, 255, 136, 0.3);
      --accent-blue: #4488ff;
      --accent-yellow: #ffcc00;
      --accent-orange: #ff8844;
      --accent-purple: #aa44ff;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      overflow-x: hidden;
    }
    
    /* Animated background grid */
    body::before {
      content: '';
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: 
        linear-gradient(rgba(68, 136, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(68, 136, 255, 0.03) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
      z-index: 0;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      position: relative;
      z-index: 1;
    }
    
    /* Header */
    .header {
      text-align: center;
      padding: 30px 0 20px;
    }
    
    .header h1 {
      font-family: 'JetBrains Mono', monospace;
      font-size: 2.4rem;
      font-weight: 800;
      letter-spacing: 8px;
      background: linear-gradient(135deg, var(--accent-red), var(--accent-orange));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 0 40px var(--accent-red-glow);
    }
    
    .room-code-badge {
      display: inline-block;
      margin-top: 10px;
      padding: 6px 20px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 1rem;
      color: var(--text-secondary);
      letter-spacing: 3px;
    }
    
    .room-code-badge span {
      color: var(--accent-blue);
      font-weight: 700;
    }
    
    .connection-status {
      margin-top: 8px;
      font-size: 0.75rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    
    .status-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--accent-green);
      box-shadow: 0 0 8px var(--accent-green-glow);
      animation: pulse 2s ease-in-out infinite;
    }
    
    .status-dot.disconnected {
      background: var(--accent-red);
      box-shadow: 0 0 8px var(--accent-red-glow);
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    
    /* Main Grid */
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 20px;
    }
    
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      transition: border-color 0.3s ease;
    }
    
    .card:hover {
      border-color: rgba(68, 136, 255, 0.3);
    }
    
    .card-title {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--text-muted);
      margin-bottom: 12px;
      font-weight: 600;
    }
    
    /* Bomb Timer */
    .timer-card {
      grid-column: 1 / -1;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .timer-card.active { border-color: var(--accent-red); }
    .timer-card.defused { border-color: var(--accent-green); }
    .timer-card.exploded { border-color: var(--accent-red); background: rgba(255, 51, 85, 0.08); }
    
    .timer-display {
      font-family: 'JetBrains Mono', monospace;
      font-size: 4.5rem;
      font-weight: 800;
      letter-spacing: 4px;
      color: var(--text-primary);
      line-height: 1;
      margin: 10px 0;
    }
    
    .timer-card.active .timer-display {
      color: var(--accent-red);
      text-shadow: 0 0 30px var(--accent-red-glow);
    }
    
    .timer-card.active.warning .timer-display {
      animation: timerFlash 1s ease-in-out infinite;
    }
    
    .timer-card.defused .timer-display {
      color: var(--accent-green);
      text-shadow: 0 0 30px var(--accent-green-glow);
    }
    
    .timer-card.exploded .timer-display {
      color: var(--accent-red);
      animation: explodeFlash 0.3s ease-in-out infinite;
    }
    
    @keyframes timerFlash {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    @keyframes explodeFlash {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.2; }
    }
    
    .bomb-status-badge {
      display: inline-block;
      padding: 4px 16px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .bomb-status-badge.waiting {
      background: rgba(136, 136, 170, 0.15);
      color: var(--text-secondary);
      border: 1px solid rgba(136, 136, 170, 0.3);
    }
    
    .bomb-status-badge.active {
      background: rgba(255, 51, 85, 0.15);
      color: var(--accent-red);
      border: 1px solid rgba(255, 51, 85, 0.3);
      animation: badgePulse 2s ease-in-out infinite;
    }
    
    .bomb-status-badge.defused {
      background: rgba(0, 255, 136, 0.15);
      color: var(--accent-green);
      border: 1px solid rgba(0, 255, 136, 0.3);
    }
    
    .bomb-status-badge.exploded {
      background: rgba(255, 51, 85, 0.25);
      color: var(--accent-red);
      border: 1px solid rgba(255, 51, 85, 0.5);
    }
    
    @keyframes badgePulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(255, 51, 85, 0.3); }
      50% { box-shadow: 0 0 15px 5px rgba(255, 51, 85, 0.15); }
    }
    
    /* Strikes */
    .strikes-display {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin-top: 12px;
    }
    
    .strike-pip {
      width: 18px; height: 18px;
      border-radius: 50%;
      border: 2px solid var(--border);
      transition: all 0.3s ease;
    }
    
    .strike-pip.filled {
      background: var(--accent-red);
      border-color: var(--accent-red);
      box-shadow: 0 0 10px var(--accent-red-glow);
    }
    
    /* Players */
    .players-card {
      grid-column: 1 / -1;
    }
    
    .player-list {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    
    .player-slot {
      background: var(--bg-secondary);
      border: 1px dashed var(--border);
      border-radius: 10px;
      padding: 14px;
      text-align: center;
      transition: all 0.4s ease;
    }
    
    .player-slot.filled {
      border-style: solid;
      border-color: rgba(68, 136, 255, 0.3);
      background: var(--bg-card-hover);
    }
    
    .player-name {
      font-weight: 700;
      font-size: 0.95rem;
      margin-bottom: 4px;
    }
    
    .player-role {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--text-secondary);
    }
    
    .player-role.defuser { color: var(--accent-red); }
    .player-role.expert { color: var(--accent-blue); }
    .player-role.overseer { color: var(--accent-purple); }
    
    .player-empty {
      color: var(--text-muted);
      font-size: 0.8rem;
      font-style: italic;
    }
    
    /* Events Log */
    .events-card {
      grid-column: 1 / -1;
    }
    
    .event-list {
      max-height: 260px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    .event-list::-webkit-scrollbar {
      width: 4px;
    }
    .event-list::-webkit-scrollbar-track {
      background: transparent;
    }
    .event-list::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 2px;
    }
    
    .event-item {
      padding: 8px 12px;
      background: var(--bg-secondary);
      border-radius: 6px;
      font-size: 0.82rem;
      color: var(--text-secondary);
      border-left: 3px solid var(--border);
      animation: slideIn 0.3s ease-out;
    }
    
    .event-item.new {
      border-left-color: var(--accent-blue);
      color: var(--text-primary);
    }
    
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-10px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    .no-events {
      color: var(--text-muted);
      font-style: italic;
      font-size: 0.85rem;
      text-align: center;
      padding: 20px;
    }
    
    /* Game Over Overlay */
    .game-over-overlay {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      z-index: 100;
      display: none;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(8px);
    }
    
    .game-over-overlay.show {
      display: flex;
      animation: fadeIn 0.5s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .game-over-content {
      text-align: center;
    }
    
    .game-over-emoji {
      font-size: 5rem;
      margin-bottom: 16px;
    }
    
    .game-over-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: 4px;
      margin-bottom: 8px;
    }
    
    .game-over-title.win {
      color: var(--accent-green);
      text-shadow: 0 0 40px var(--accent-green-glow);
    }
    
    .game-over-title.lose {
      color: var(--accent-red);
      text-shadow: 0 0 40px var(--accent-red-glow);
    }
    
    .game-over-sub {
      color: var(--text-secondary);
      font-size: 1rem;
    }
    
    /* Waiting state */
    .waiting-message {
      text-align: center;
      padding: 20px;
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    
    .waiting-message .spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid var(--border);
      border-top-color: var(--accent-blue);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 8px;
      vertical-align: middle;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Responsive */
    @media (max-width: 600px) {
      .player-list { grid-template-columns: 1fr; }
      .timer-display { font-size: 3rem; }
      .header h1 { font-size: 1.8rem; letter-spacing: 4px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>💣 DEFUSE</h1>
      <div class="room-code-badge">ROOM <span id="roomCodeDisplay">${roomCode}</span></div>
      <div class="connection-status">
        <div class="status-dot" id="statusDot"></div>
        <span id="connectionText">Connecting...</span>
      </div>
    </div>

    <!-- Timer -->
    <div class="grid">
      <div class="card timer-card" id="timerCard">
        <div class="card-title">Bomb Status</div>
        <div class="bomb-status-badge waiting" id="bombBadge">Waiting</div>
        <div class="timer-display" id="timerDisplay">05:00</div>
        <div class="strikes-display" id="strikesDisplay"></div>
      </div>

      <!-- Players -->
      <div class="card players-card">
        <div class="card-title">Players (0/3)</div>
        <div class="player-list" id="playerList">
          <div class="player-slot"><div class="player-empty">Waiting...</div></div>
          <div class="player-slot"><div class="player-empty">Waiting...</div></div>
          <div class="player-slot"><div class="player-empty">Waiting...</div></div>
        </div>
      </div>

      <!-- Events -->
      <div class="card events-card">
        <div class="card-title">📢 Live Event Feed</div>
        <div class="event-list" id="eventList">
          <div class="no-events">No events yet. Waiting for game activity...</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Game Over Overlay -->
  <div class="game-over-overlay" id="gameOverOverlay">
    <div class="game-over-content">
      <div class="game-over-emoji" id="gameOverEmoji">🎉</div>
      <div class="game-over-title win" id="gameOverTitle">DEFUSED!</div>
      <div class="game-over-sub" id="gameOverSub">The team saved the day!</div>
    </div>
  </div>

  <script>
    const ROOM_CODE = "${roomCode}";
    let currentTimerSeconds = 300;
    let bombStatus = "uninitialized";
    let timerInterval = null;
    let previousEventCount = 0;
    let gameEnded = false;

    // ── SSE Connection ──────────────────────
    function connectSSE() {
      const evtSource = new EventSource("/api/events/" + ROOM_CODE);
      
      evtSource.addEventListener("gameState", (e) => {
        const state = JSON.parse(e.data);
        updateDashboard(state);
      });

      evtSource.addEventListener("gameEvent", (e) => {
        const data = JSON.parse(e.data);
        addEvent(data.message);
      });

      evtSource.addEventListener("timerTick", (e) => {
        const data = JSON.parse(e.data);
        currentTimerSeconds = data.timerSeconds;
        bombStatus = data.status;
        updateTimerDisplay();
      });

      evtSource.onopen = () => {
        document.getElementById("statusDot").classList.remove("disconnected");
        document.getElementById("connectionText").textContent = "Live";
      };

      evtSource.onerror = () => {
        document.getElementById("statusDot").classList.add("disconnected");
        document.getElementById("connectionText").textContent = "Reconnecting...";
      };
    }

    // ── Update Dashboard ────────────────────
    function updateDashboard(state) {
      // Update bomb
      bombStatus = state.bomb.status;
      currentTimerSeconds = state.bomb.timerSeconds;
      updateTimerDisplay();
      updateBombBadge(state.bomb.status);
      updateStrikes(state.bomb.strikes, state.bomb.maxStrikes);
      
      // Start/stop local timer
      if (state.bomb.status === "active" && !timerInterval) {
        startLocalTimer();
      } else if (state.bomb.status !== "active" && timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }

      // Update players
      updatePlayers(state.players);

      // Update events
      if (state.events && state.events.length > 0) {
        const isInitialLoad = previousEventCount === 0;
        updateEvents(state.events, isInitialLoad);
        previousEventCount = state.events.length;
      }

      // Check game over
      if (!gameEnded && (state.bomb.status === "defused" || state.bomb.status === "exploded")) {
        gameEnded = true;
        showGameOver(state.bomb.status);
      }
    }

    // ── Timer ────────────────────────────────
    function startLocalTimer() {
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        if (bombStatus === "active" && currentTimerSeconds > 0) {
          currentTimerSeconds--;
          updateTimerDisplay();
        }
        if (currentTimerSeconds <= 0 || bombStatus !== "active") {
          clearInterval(timerInterval);
          timerInterval = null;
        }
      }, 1000);
    }

    function updateTimerDisplay() {
      const mins = Math.floor(currentTimerSeconds / 60);
      const secs = currentTimerSeconds % 60;
      const display = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
      document.getElementById("timerDisplay").textContent = display;

      const timerCard = document.getElementById("timerCard");
      timerCard.className = "card timer-card";
      if (bombStatus === "active") {
        timerCard.classList.add("active");
        if (currentTimerSeconds <= 60) timerCard.classList.add("warning");
      } else if (bombStatus === "defused") {
        timerCard.classList.add("defused");
      } else if (bombStatus === "exploded") {
        timerCard.classList.add("exploded");
      }
    }

    function updateBombBadge(status) {
      const badge = document.getElementById("bombBadge");
      const labels = {
        uninitialized: "Waiting",
        active: "💣 Active",
        defused: "✅ Defused",
        exploded: "💥 Exploded"
      };
      badge.textContent = labels[status] || status;
      badge.className = "bomb-status-badge";
      if (status === "active") badge.classList.add("active");
      else if (status === "defused") badge.classList.add("defused");
      else if (status === "exploded") badge.classList.add("exploded");
      else badge.classList.add("waiting");
    }

    function updateStrikes(strikes, maxStrikes) {
      const container = document.getElementById("strikesDisplay");
      container.innerHTML = "";
      for (let i = 0; i < maxStrikes; i++) {
        const pip = document.createElement("div");
        pip.className = "strike-pip" + (i < strikes ? " filled" : "");
        container.appendChild(pip);
      }
    }

    // ── Players ──────────────────────────────
    function updatePlayers(players) {
      const container = document.getElementById("playerList");
      const roleColors = { Defuser: "defuser", Expert: "expert", Overseer: "overseer" };
      const roleEmojis = { Defuser: "🔴", Expert: "📖", Overseer: "👁️" };
      
      let html = "";
      for (let i = 0; i < 3; i++) {
        if (players[i]) {
          const p = players[i];
          const roleClass = roleColors[p.role] || "";
          const emoji = roleEmojis[p.role] || "🎮";
          html += '<div class="player-slot filled">' +
            '<div class="player-name">' + emoji + ' ' + escapeHtml(p.name) + '</div>' +
            '<div class="player-role ' + roleClass + '">' + p.role + '</div>' +
          '</div>';
        } else {
          html += '<div class="player-slot"><div class="player-empty">Waiting...</div></div>';
        }
      }
      container.innerHTML = html;

      // Update player count in title
      const title = container.parentElement.querySelector(".card-title");
      if (title) title.textContent = "Players (" + players.length + "/3)";
    }

    // ── Events ───────────────────────────────
    function updateEvents(events, isInitialLoad) {
      const container = document.getElementById("eventList");
      container.innerHTML = "";
      events.forEach((evt, i) => {
        const div = document.createElement("div");
        div.className = "event-item" + (!isInitialLoad && i >= previousEventCount ? " new" : "");
        div.textContent = evt;
        container.appendChild(div);
      });
      container.scrollTop = container.scrollHeight;
    }

    function addEvent(message) {
      const container = document.getElementById("eventList");
      // Remove "no events" placeholder if present
      const noEvents = container.querySelector(".no-events");
      if (noEvents) noEvents.remove();
      
      const div = document.createElement("div");
      div.className = "event-item new";
      div.textContent = message;
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    }

    // ── Game Over ────────────────────────────
    function showGameOver(status) {
      const overlay = document.getElementById("gameOverOverlay");
      const emoji = document.getElementById("gameOverEmoji");
      const title = document.getElementById("gameOverTitle");
      const sub = document.getElementById("gameOverSub");

      if (status === "defused") {
        emoji.textContent = "🎉";
        title.textContent = "DEFUSED!";
        title.className = "game-over-title win";
        sub.textContent = "The team saved the day!";
      } else {
        emoji.textContent = "💥";
        title.textContent = "BOOM!";
        title.className = "game-over-title lose";
        sub.textContent = "The bomb exploded. Better luck next time.";
      }

      overlay.classList.add("show");
    }

    // ── Helpers ───────────────────────────────
    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    // ── Init ─────────────────────────────────
    connectSSE();
  </script>
</body>
</html>`;
}
