import { createLocalTetris } from "./tetris.js";

const ROOM_ID = "sala-1";

const startBtn = document.getElementById("startBtn");
const playerLabel = document.getElementById("playerLabel");
const targetSelect = document.getElementById("target");
const useBombBtn = document.getElementById("useBombBtn");
const restartBtn = document.getElementById("restartBtn");
const playersEl = document.getElementById("players");
const roomBoardsEl = document.getElementById("roomBoards");
const logEl = document.getElementById("log");

const gameStatusEl = document.getElementById("gameStatus");
const linesCountEl = document.getElementById("linesCount");
const scoreCountEl = document.getElementById("scoreCount");
const levelCountEl = document.getElementById("levelCount");
const pieceTypeEl = document.getElementById("pieceType");
const nextTypeEl = document.getElementById("nextType");
const canvas = document.getElementById("tetrisCanvas");

let ws;
let state;
let localBoard = null;
let lastBoardSyncAt = 0;
const BOARD_SYNC_INTERVAL_MS = 33;

const suffix = (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)).slice(0, 5);
const playerId = `jogador-${suffix}`;
const playerName = `Jogador ${suffix}`;
playerLabel.textContent = `${playerName} (${playerId})`;

const CELL_COLORS = {
  I: "#40e0ff",
  O: "#ffe14a",
  T: "#b16cff",
  S: "#56f281",
  Z: "#ff6677",
  J: "#6ea0ff",
  L: "#ffb35f",
  1: "#40e0ff",
  2: "#ffe14a",
  3: "#b16cff",
  4: "#56f281",
  5: "#ff6677",
  6: "#6ea0ff",
  7: "#ffb35f",
  8: "#999999"
};

const PIECE_TO_ID = {
  I: 1,
  O: 2,
  T: 3,
  S: 4,
  Z: 5,
  J: 6,
  L: 7
};

function log(message, type = "ok") {
  const line = document.createElement("div");
  line.className = type;
  line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logEl.prepend(line);
}

function send(payload) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    log("WebSocket desconectado", "warn");
    return;
  }
  ws.send(JSON.stringify(payload));
}

function sendIfConnected(payload) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(payload));
}

function drawBoardOnCanvas(canvasEl, board) {
  const ctx = canvasEl.getContext("2d");
  if (!ctx) return;

  const cols = 10;
  const hiddenRows = 2;
  const rows = 20;
  const cell = 12;

  canvasEl.width = cols * cell;
  canvasEl.height = rows * cell;

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

  for (let y = hiddenRows; y < hiddenRows + rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const value = board?.[y]?.[x] ?? 0;
      if (value === 0) continue;
      const color = CELL_COLORS[value] ?? "#888";
      ctx.fillStyle = color;
      ctx.fillRect(x * cell + 1, (y - hiddenRows) * cell + 1, cell - 2, cell - 2);
    }
  }

  ctx.strokeStyle = "#1f1f1f";
  for (let x = 0; x <= cols; x += 1) {
    ctx.beginPath();
    ctx.moveTo(x * cell + 0.5, 0);
    ctx.lineTo(x * cell + 0.5, rows * cell);
    ctx.stroke();
  }
  for (let y = 0; y <= rows; y += 1) {
    ctx.beginPath();
    ctx.moveTo(0, y * cell + 0.5);
    ctx.lineTo(cols * cell, y * cell + 0.5);
    ctx.stroke();
  }
}

function renderRoomBoards(room) {
  roomBoardsEl.innerHTML = "";

  for (let index = 0; index < 6; index += 1) {
    const id = room.order[index];
    const p = id ? room.players[id] : null;

    const wrapper = document.createElement("div");
    wrapper.className = "room-board";
    if (!p) wrapper.classList.add("inactive");

    const title = document.createElement("h4");
    title.textContent = p
      ? `${index + 1}. ${p.name}${id === playerId ? " (voce)" : ""}`
      : `${index + 1}. Vazio`;
    wrapper.appendChild(title);

    const boardCanvas = document.createElement("canvas");
    wrapper.appendChild(boardCanvas);
    const board = p ? (id === playerId && p.active && localBoard ? localBoard : p.board) : null;
    drawBoardOnCanvas(boardCanvas, board);

    roomBoardsEl.appendChild(wrapper);
  }
}

function renderEmptyRoomBoards() {
  renderRoomBoards({ order: [], players: {} });
}

function encodeBoardForSync(board) {
  return (board ?? []).map((row) =>
    row.map((cell) => {
      if (typeof cell === "number") return cell;
      return PIECE_TO_ID[cell] ?? 0;
    })
  );
}

function updateHud(snapshot) {
  gameStatusEl.textContent = snapshot.gameOver ? "game over" : "running";
  linesCountEl.textContent = String(snapshot.lines);
  scoreCountEl.textContent = String(snapshot.score);
  levelCountEl.textContent = String(snapshot.level);
  pieceTypeEl.textContent = snapshot.pieceType;
  nextTypeEl.textContent = snapshot.nextType;
  localBoard = snapshot.board;

  const now = Date.now();
  if (now - lastBoardSyncAt >= BOARD_SYNC_INTERVAL_MS) {
    sendIfConnected({
      type: "boardSync",
      roomId: ROOM_ID,
      playerId,
      board: encodeBoardForSync(snapshot.board)
    });
    lastBoardSyncAt = now;
  }

  if (state) renderRoomBoards(state);
}

const tetris = createLocalTetris({
  canvas,
  onLinesCleared: (lines) => {
    log(`Loop local: ${lines} linha(s) limpas`);
    sendIfConnected({
      type: "lineClear",
      roomId: ROOM_ID,
      playerId,
      lines
    });
  },
  onGameOver: () => {
    log("Partida local finalizada (game over)", "warn");
    sendIfConnected({
      type: "gameOver",
      roomId: ROOM_ID,
      playerId
    });
  },
  onState: updateHud
});

tetris.start();
restartBtn.addEventListener("click", () => tetris.restart());

function renderRoom(room) {
  state = room;
  playersEl.innerHTML = "";
  targetSelect.innerHTML = "";

  room.order.forEach((id, index) => {
    const p = room.players[id];
    const card = document.createElement("div");
    card.className = "player";
    card.innerHTML = `<strong>${index + 1}. ${p.name}</strong><br>ID: ${p.id}<br>Ativo: ${p.active ? "sim" : "nao"}<br>Fila: [${p.bombQueue.join(", ")}]<br>Bombas usadas: ${p.bombsUsed}`;
    playersEl.appendChild(card);

    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = `${index + 1}. ${p.name}${p.id === playerId ? " (voce)" : ""}`;
    targetSelect.appendChild(opt);
  });

  renderRoomBoards(room);
}

function connectWebSocket() {
  ws = new WebSocket(`ws://${location.host}/ws`);

  ws.onopen = () => {
    log("Conectado ao servidor");
    send({
      type: "join",
      roomId: ROOM_ID,
      playerId,
      name: playerName
    });
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "roomState") {
      renderRoom(msg.room);
      log(`Estado atualizado (jogadores: ${msg.room.order.length})`);
    }
    if (msg.type === "bombResult") {
      log(`useBomb => consumed=${msg.consumed} reason=${msg.reason ?? "ok"}`, msg.consumed ? "ok" : "warn");
    }
    if (msg.type === "error") {
      log(msg.message, "warn");
    }
    if (msg.type === "bombUsed") {
      if (msg.targetId === playerId) {
        tetris.applyBomb(msg.bomb);
        log(`Bomba recebida: ${msg.bomb} (de ${msg.userId})`, "warn");
      }
    }
  };

  ws.onclose = () => log("Conexao encerrada", "warn");
}

startBtn.addEventListener("click", () => {
  send({ type: "start", roomId: ROOM_ID, playerId });
});

for (const btn of document.querySelectorAll("button[data-lines]")) {
  btn.addEventListener("click", () => {
    send({
      type: "lineClear",
      roomId: ROOM_ID,
      playerId,
      lines: Number(btn.dataset.lines)
    });
  });
}

useBombBtn.addEventListener("click", () => {
  const targetId = targetSelect.value;
  send({
    type: "useBomb",
    roomId: ROOM_ID,
    playerId,
    targetId
  });
});

connectWebSocket();
renderEmptyRoomBoards();
log("Loop local de Tetris ativo. Sala fixa conectada automaticamente.");
