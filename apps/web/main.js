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
const remotePreviewBoards = new Map();
let lastBoardSyncAt = 0;
let lastOwnSlot = null;
const BOARD_SYNC_INTERVAL_MS = 33;
const BURST_INTERVAL_MS = 80;
const BURST_START_DELAY_MS = 220;
let burstTimer = null;
let burstStartTimer = null;
let burstTargetId = null;
let heldDigit = null;

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
  const cell = 18;

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

    const boardStack = document.createElement("div");
    boardStack.className = "board-stack";

    const boardCanvas = document.createElement("canvas");
    boardStack.appendChild(boardCanvas);
    const board = p
      ? (!p.active
        ? p.board
        : (id === playerId && localBoard ? localBoard : (remotePreviewBoards.get(id) ?? p.board)))
      : null;
    drawBoardOnCanvas(boardCanvas, board);

    const bombTray = document.createElement("div");
    bombTray.className = "bomb-tray";
    const queue = p?.bombQueue ?? [];
    for (let i = 0; i < 10; i += 1) {
      const slot = document.createElement("div");
      slot.className = `bomb-slot${i === 0 && queue.length > 0 ? " first" : ""}`;
      if (i < queue.length) {
        const icon = document.createElement("div");
        icon.className = "bomb-icon";
        icon.textContent = queue[i];
        slot.appendChild(icon);
      }
      bombTray.appendChild(slot);
    }
    boardStack.appendChild(bombTray);
    wrapper.appendChild(boardStack);

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
      board: encodeBoardForSync(snapshot.syncBoard ?? snapshot.board),
      previewBoard: encodeBoardForSync(snapshot.board)
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
restartBtn.addEventListener("click", () => {
  tetris.restart();
  sendIfConnected({
    type: "join",
    roomId: ROOM_ID,
    playerId,
    name: playerName
  });
});

function renderRoom(room) {
  state = room;
  playersEl.innerHTML = "";
  targetSelect.innerHTML = "";
  const ownIndex = room.order.findIndex((id) => id === playerId);
  const ownSlot = ownIndex >= 0 ? ownIndex + 1 : null;
  const ownSlotText = ownSlot ? `slot ${ownSlot}` : "fora da sala";
  playerLabel.textContent = `${playerName} (${playerId}) - ${ownSlotText}`;
  if (ownSlot !== lastOwnSlot) {
    log(ownSlot ? `Seu jogador esta no slot ${ownSlot}` : "Seu jogador nao esta em um slot ativo", "warn");
    lastOwnSlot = ownSlot;
  }

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

  for (const id of remotePreviewBoards.keys()) {
    if (!room.players[id]) remotePreviewBoards.delete(id);
  }
  for (const id of room.order) {
    if (!room.players[id]?.active) remotePreviewBoards.delete(id);
  }

  renderRoomBoards(room);
}

function useBombAtSlot(slotNumber) {
  if (!state) {
    log("Estado da sala ainda nao carregado", "warn");
    return;
  }

  const idx = slotNumber - 1;
  const targetId = state.order[idx];
  if (!targetId) {
    log(`Slot ${slotNumber} vazio`, "warn");
    return;
  }

  targetSelect.value = targetId;
  send({
    type: "useBomb",
    roomId: ROOM_ID,
    playerId,
    targetId
  });
}

function useBombOnSelf() {
  if (!state || !state.players?.[playerId]) {
    log("Voce ainda nao esta ativo na sala", "warn");
    return;
  }

  targetSelect.value = playerId;
  send({
    type: "useBomb",
    roomId: ROOM_ID,
    playerId,
    targetId: playerId
  });
}

function stopBombBurst(reason = "stopped") {
  if (burstStartTimer) {
    clearTimeout(burstStartTimer);
    burstStartTimer = null;
  }
  if (burstTimer) {
    clearInterval(burstTimer);
    burstTimer = null;
  }
  if (burstTargetId) {
    log(`Rajada encerrada (${reason})`, "warn");
  }
  burstTargetId = null;
}

function sendUseBombTo(targetId) {
  send({
    type: "useBomb",
    roomId: ROOM_ID,
    playerId,
    targetId
  });
}

function startBombBurst(targetId, label) {
  if (!targetId) {
    log("Alvo invalido para rajada", "warn");
    return;
  }
  if (!state?.players?.[playerId]) {
    log("Jogador local ainda nao ativo para rajada", "warn");
    return;
  }

  stopBombBurst("restart");
  burstTargetId = targetId;
  targetSelect.value = targetId;
  log(`Rajada iniciada em ${label}`);

  // First shot is immediate.
  sendUseBombTo(targetId);

  // Continuous burst starts only if the key stays held for a short delay.
  burstStartTimer = setTimeout(() => {
    burstStartTimer = null;
    if (heldDigit === null) return;
    burstTimer = setInterval(() => {
      const queueLen = state?.players?.[playerId]?.bombQueue?.length ?? 0;
      if (queueLen <= 0) {
        stopBombBurst("empty-queue");
        return;
      }
      sendUseBombTo(targetId);
    }, BURST_INTERVAL_MS);
  }, BURST_START_DELAY_MS);
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
      if (!msg.consumed && msg.reason === "empty-queue") {
        stopBombBurst("empty-queue");
      }
      if (!msg.consumed && msg.reason === "inactive-target") {
        stopBombBurst("inactive-target");
      }
    }
    if (msg.type === "error") {
      log(msg.message, "warn");
    }
    if (msg.type === "bombUsed") {
      if (msg.targetId === playerId) {
        tetris.applyBomb(msg.bomb, msg.targetBoard);
        log(`Bomba recebida: ${msg.bomb} (de ${msg.userId})`, "warn");
      }
      if (msg.bomb === "S" && msg.userId === playerId && msg.userBoard) {
        tetris.applyBomb(msg.bomb, msg.userBoard);
        log(`Switch aplicado em ambos os campos`, "warn");
      }
    }
    if (msg.type === "boardPreview") {
      remotePreviewBoards.set(msg.playerId, msg.board);
      if (state) renderRoomBoards(state);
    }
  };

  ws.onclose = () => {
    stopBombBurst("socket-closed");
    log("Conexao encerrada", "warn");
  };
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

window.addEventListener("keydown", (event) => {
  if (event.code === "Escape") {
    event.preventDefault();
    stopBombBurst("manual-stop");
    heldDigit = null;
    return;
  }

  const keyDigit = /^[0-9]$/.test(event.key) ? Number(event.key) : null;
  let codeDigit = null;
  if (event.code.startsWith("Digit")) codeDigit = Number(event.code.slice("Digit".length));
  if (event.code.startsWith("Numpad")) codeDigit = Number(event.code.slice("Numpad".length));

  const digit = keyDigit ?? codeDigit;
  if (digit === null || Number.isNaN(digit)) return;

  event.preventDefault();
  if (event.repeat) return;
  heldDigit = digit;

  if (digit === 0) {
    log("Atalho de bomba: autoalvo (0) [segure para rajada]");
    startBombBurst(playerId, "autoalvo");
    return;
  }

  if (digit >= 1 && digit <= 6) {
    const idx = digit - 1;
    const targetId = state?.order?.[idx];
    if (!targetId) {
      log(`Slot ${digit} vazio`, "warn");
    } else {
      log(`Atalho de bomba: slot ${digit} [segure para rajada]`);
      startBombBurst(targetId, `slot ${digit}`);
    }
  }
});

window.addEventListener("keyup", (event) => {
  const keyDigit = /^[0-9]$/.test(event.key) ? Number(event.key) : null;
  let codeDigit = null;
  if (event.code.startsWith("Digit")) codeDigit = Number(event.code.slice("Digit".length));
  if (event.code.startsWith("Numpad")) codeDigit = Number(event.code.slice("Numpad".length));
  const digit = keyDigit ?? codeDigit;
  if (digit === null || Number.isNaN(digit)) return;

  if (heldDigit === digit) {
    stopBombBurst("key-release");
    heldDigit = null;
  }
});

connectWebSocket();
renderEmptyRoomBoards();
log("Loop local de Tetris ativo. Sala fixa conectada automaticamente.");
