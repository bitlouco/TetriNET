const COLS = 10;
const ROWS = 22;
const VISIBLE_START_ROW = 2;
const CELL = 24;
const BOARD_PIXEL_WIDTH = COLS * CELL;
const BOARD_PIXEL_HEIGHT = (ROWS - VISIBLE_START_ROW) * CELL;
const LOCK_DELAY_MS = 500;
const SOFT_DROP_MS = 40;

const COLORS = {
  I: "#40e0ff",
  O: "#ffe14a",
  T: "#b16cff",
  S: "#56f281",
  Z: "#ff6677",
  J: "#6ea0ff",
  L: "#ffb35f"
};

const PIECES = {
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]]
  ],
  O: [
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]]
  ],
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2]]
  ],
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2]]
  ],
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [0, 1], [1, 1], [0, 2]]
  ],
  J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2]]
  ],
  L: [
    [[2, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1], [1, 2]]
  ]
};

const KICKS_JLSTZ = {
  "0>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "1>0": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "1>2": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "2>1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "2>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "3>2": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "3>0": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "0>3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]
};

const KICKS_I = {
  "0>1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "1>0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "1>2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  "2>1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "2>3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "3>2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "3>0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "0>3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]
};

function createBoard() {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 0));
}

function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

function getCells(piece) {
  return PIECES[piece.type][piece.rotation].map(([x, y]) => [x + piece.x, y + piece.y]);
}

function canPlace(board, piece) {
  for (const [x, y] of getCells(piece)) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
    if (board[y][x] !== 0) return false;
  }
  return true;
}

function movePiece(board, piece, dx, dy) {
  const moved = { ...piece, x: piece.x + dx, y: piece.y + dy };
  return canPlace(board, moved) ? moved : null;
}

function getKickTests(type, from, to) {
  if (type === "O") return [[0, 0]];
  const key = `${from}>${to}`;
  if (type === "I") return KICKS_I[key] ?? [[0, 0]];
  return KICKS_JLSTZ[key] ?? [[0, 0]];
}

function rotatePiece(board, piece, dir) {
  const from = piece.rotation;
  const to = (from + dir + 4) % 4;
  const tests = getKickTests(piece.type, from, to);
  for (const [kx, ky] of tests) {
    const candidate = {
      ...piece,
      rotation: to,
      x: piece.x + kx,
      y: piece.y - ky
    };
    if (canPlace(board, candidate)) return candidate;
  }
  return null;
}

function merge(board, piece) {
  const next = board.map((row) => [...row]);
  for (const [x, y] of getCells(piece)) {
    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
      next[y][x] = piece.type;
    }
  }
  return next;
}

function clearLines(board) {
  const kept = [];
  let lines = 0;
  for (let y = 0; y < ROWS; y += 1) {
    if (board[y].every((cell) => cell !== 0)) {
      lines += 1;
    } else {
      kept.push(board[y]);
    }
  }
  while (kept.length < ROWS) kept.unshift(Array.from({ length: COLS }, () => 0));
  return { board: kept, lines };
}

function scoreForLines(lines) {
  if (lines === 1) return 100;
  if (lines === 2) return 300;
  if (lines === 3) return 500;
  if (lines >= 4) return 800;
  return 0;
}

function gravityInterval(elapsedMs) {
  const steps = Math.floor(elapsedMs / 30000);
  return Math.max(120, 1000 - steps * 80);
}

function ghostY(board, piece) {
  let y = piece.y;
  while (canPlace(board, { ...piece, y: y + 1 })) y += 1;
  return y;
}

function drawCell(ctx, x, y, color, alpha = 1) {
  if (y < VISIBLE_START_ROW) return;
  const drawX = x * CELL;
  const drawY = (y - VISIBLE_START_ROW) * CELL;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(drawX + 1, drawY + 1, CELL - 2, CELL - 2);
  ctx.globalAlpha = 1;
}

function drawMiniPiece(ctx, type, left, top) {
  const shape = PIECES[type][0];
  ctx.fillStyle = COLORS[type];
  for (const [x, y] of shape) {
    ctx.fillRect(left + x * 12, top + y * 12, 10, 10);
  }
}

export function createLocalTetris({ canvas, onLinesCleared, onGameOver, onState }) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas2D indisponivel");

  const state = {
    board: createBoard(),
    current: null,
    queue: [],
    bag: [],
    lines: 0,
    score: 0,
    level: 1,
    elapsedMs: 0,
    gameOver: false,
    lockMs: 0,
    gravityMs: 0,
    softDrop: false,
    running: false,
    frameId: 0,
    lastTs: 0
  };

  function refillBagIfNeeded() {
    if (state.bag.length === 0) {
      state.bag = shuffle(["I", "O", "T", "S", "Z", "J", "L"]);
    }
  }

  function ensureQueue(min = 6) {
    while (state.queue.length < min) {
      refillBagIfNeeded();
      state.queue.push(state.bag.shift());
    }
  }

  function nextPiece() {
    ensureQueue();
    const type = state.queue.shift();
    return { type, rotation: 0, x: 3, y: 0 };
  }

  function emitState() {
    const next = state.queue[0] ?? "-";
    onState?.({
      lines: state.lines,
      score: state.score,
      level: state.level,
      gameOver: state.gameOver,
      pieceType: state.current ? state.current.type : "-",
      nextType: next
    });
  }

  function spawnPiece() {
    state.current = nextPiece();
    if (!canPlace(state.board, state.current)) {
      state.gameOver = true;
      onGameOver?.();
    }
  }

  function restart() {
    state.board = createBoard();
    state.queue = [];
    state.bag = [];
    state.lines = 0;
    state.score = 0;
    state.level = 1;
    state.elapsedMs = 0;
    state.gameOver = false;
    state.lockMs = 0;
    state.gravityMs = 0;
    state.softDrop = false;
    ensureQueue();
    spawnPiece();
    emitState();
    render();
  }

  function lockCurrentPiece() {
    state.board = merge(state.board, state.current);
    const cleared = clearLines(state.board);
    state.board = cleared.board;

    if (cleared.lines > 0) {
      state.lines += cleared.lines;
      state.score += scoreForLines(cleared.lines) * state.level;
      state.level = Math.floor(state.elapsedMs / 60000) + 1;
      onLinesCleared?.(cleared.lines);
    }

    state.lockMs = 0;
    state.gravityMs = 0;
    spawnPiece();
  }

  function tryMove(dx, dy) {
    const moved = movePiece(state.board, state.current, dx, dy);
    if (!moved) return false;
    state.current = moved;
    state.lockMs = 0;
    return true;
  }

  function tryRotate(dir) {
    const rotated = rotatePiece(state.board, state.current, dir);
    if (!rotated) return false;
    state.current = rotated;
    state.lockMs = 0;
    return true;
  }

  function hardDrop() {
    if (!state.current || state.gameOver) return;
    while (tryMove(0, 1)) {
      // empty
    }
    lockCurrentPiece();
  }

  function update(deltaMs) {
    if (state.gameOver || !state.current) return;

    state.elapsedMs += deltaMs;
    state.level = Math.floor(state.elapsedMs / 60000) + 1;

    const interval = state.softDrop ? SOFT_DROP_MS : gravityInterval(state.elapsedMs);
    state.gravityMs += deltaMs;

    while (state.gravityMs >= interval) {
      state.gravityMs -= interval;
      if (!tryMove(0, 1)) {
        break;
      }
    }

    const grounded = !movePiece(state.board, state.current, 0, 1);
    if (grounded) {
      state.lockMs += deltaMs;
      if (state.lockMs >= LOCK_DELAY_MS) {
        lockCurrentPiece();
      }
    } else {
      state.lockMs = 0;
    }
  }

  function drawBoard() {
    ctx.fillStyle = "#060606";
    ctx.fillRect(0, 0, BOARD_PIXEL_WIDTH, BOARD_PIXEL_HEIGHT);

    for (let y = VISIBLE_START_ROW; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const value = state.board[y][x];
        if (value !== 0) {
          const color = COLORS[value] ?? "#888";
          drawCell(ctx, x, y, color);
        }
      }
    }

    if (state.current) {
      const gy = ghostY(state.board, state.current);
      const ghost = { ...state.current, y: gy };
      for (const [x, y] of getCells(ghost)) {
        drawCell(ctx, x, y, COLORS[state.current.type], 0.28);
      }
      for (const [x, y] of getCells(state.current)) {
        drawCell(ctx, x, y, COLORS[state.current.type], 1);
      }
    }

    ctx.strokeStyle = "#1f1f1f";
    for (let x = 0; x <= COLS; x += 1) {
      const px = x * CELL + 0.5;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, BOARD_PIXEL_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS - VISIBLE_START_ROW; y += 1) {
      const py = y * CELL + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(BOARD_PIXEL_WIDTH, py);
      ctx.stroke();
    }
  }

  function drawSidebar() {
    const sidebarX = BOARD_PIXEL_WIDTH + 12;
    ctx.fillStyle = "#101010";
    ctx.fillRect(sidebarX, 0, canvas.width - sidebarX, canvas.height);

    ctx.fillStyle = "#ddd";
    ctx.font = "14px Arial";
    ctx.fillText("Next", sidebarX + 10, 20);

    const previews = state.queue.slice(0, 3);
    previews.forEach((type, i) => {
      const top = 36 + i * 84;
      ctx.fillStyle = "#222";
      ctx.fillRect(sidebarX + 10, top, 130, 68);
      if (type) drawMiniPiece(ctx, type, sidebarX + 24, top + 16);
    });

    if (state.gameOver) {
      ctx.fillStyle = "#ff6677";
      ctx.fillText("GAME OVER", sidebarX + 10, 320);
      ctx.fillStyle = "#ddd";
      ctx.fillText("Use o botao reiniciar", sidebarX + 10, 344);
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawSidebar();
  }

  function frame(ts) {
    if (!state.running) return;
    const last = state.lastTs || ts;
    const delta = Math.min(48, ts - last);
    state.lastTs = ts;

    update(delta);
    render();
    emitState();

    state.frameId = requestAnimationFrame(frame);
  }

  function onKeyDown(event) {
    if (!state.running) return;

    if (event.code === "Space") {
      event.preventDefault();
    }

    if (state.gameOver) {
      if (event.code === "KeyR") restart();
      return;
    }

    if (event.code === "ArrowLeft") {
      tryMove(-1, 0);
      return;
    }
    if (event.code === "ArrowRight") {
      tryMove(1, 0);
      return;
    }
    if (event.code === "ArrowDown") {
      state.softDrop = true;
      return;
    }
    if (event.code === "ArrowUp" || event.code === "KeyX") {
      tryRotate(1);
      return;
    }
    if (event.code === "KeyZ") {
      tryRotate(-1);
      return;
    }
    if (event.code === "Space") {
      hardDrop();
      return;
    }
    if (event.code === "KeyR") {
      restart();
    }
  }

  function onKeyUp(event) {
    if (event.code === "ArrowDown") {
      state.softDrop = false;
    }
  }

  function start() {
    if (state.running) return;
    state.running = true;
    restart();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    state.frameId = requestAnimationFrame(frame);
  }

  function stop() {
    state.running = false;
    cancelAnimationFrame(state.frameId);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  }

  return {
    start,
    stop,
    restart
  };
}
