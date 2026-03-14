import { createLocalTetris } from "./tetris.js";

const roomIdInput = document.getElementById("roomId");
const playerIdInput = document.getElementById("playerId");
const nameInput = document.getElementById("name");
const joinBtn = document.getElementById("joinBtn");
const startBtn = document.getElementById("startBtn");
const targetSelect = document.getElementById("target");
const useBombBtn = document.getElementById("useBombBtn");
const restartBtn = document.getElementById("restartBtn");
const playersEl = document.getElementById("players");
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

function updateHud(snapshot) {
  gameStatusEl.textContent = snapshot.gameOver ? "game over" : "running";
  linesCountEl.textContent = String(snapshot.lines);
  scoreCountEl.textContent = String(snapshot.score);
  levelCountEl.textContent = String(snapshot.level);
  pieceTypeEl.textContent = snapshot.pieceType;
  nextTypeEl.textContent = snapshot.nextType;
}

const tetris = createLocalTetris({
  canvas,
  onLinesCleared: (lines) => {
    log(`Loop local: ${lines} linha(s) limpas`);
    sendIfConnected({
      type: "lineClear",
      roomId: roomIdInput.value,
      playerId: playerIdInput.value,
      lines
    });
  },
  onGameOver: () => log("Partida local finalizada (game over)", "warn"),
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
    opt.textContent = `${index + 1}. ${p.name}${p.id === playerIdInput.value ? " (voce)" : ""}`;
    targetSelect.appendChild(opt);
  });
}

joinBtn.addEventListener("click", () => {
  ws = new WebSocket(`ws://${location.host}/ws`);

  ws.onopen = () => {
    log("Conectado ao servidor");
    send({
      type: "join",
      roomId: roomIdInput.value,
      playerId: playerIdInput.value,
      name: nameInput.value
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
  };

  ws.onclose = () => log("Conexao encerrada", "warn");
});

startBtn.addEventListener("click", () => {
  send({ type: "start", roomId: roomIdInput.value, playerId: playerIdInput.value });
});

for (const btn of document.querySelectorAll("button[data-lines]")) {
  btn.addEventListener("click", () => {
    send({
      type: "lineClear",
      roomId: roomIdInput.value,
      playerId: playerIdInput.value,
      lines: Number(btn.dataset.lines)
    });
  });
}

useBombBtn.addEventListener("click", () => {
  const targetId = targetSelect.value;
  send({
    type: "useBomb",
    roomId: roomIdInput.value,
    playerId: playerIdInput.value,
    targetId
  });
});

log("Loop local de Tetris ativo. Abra 2 abas para testar multiplayer.");
