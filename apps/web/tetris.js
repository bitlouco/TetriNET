const COLS = 10;
const ROWS = 22;
const VISIBLE_START_ROW = 2;
const CELL = 24;
const BOARD_PIXEL_WIDTH = COLS * CELL;
const BOARD_PIXEL_HEIGHT = (ROWS - VISIBLE_START_ROW) * CELL;
const LOCK_DELAY_MS = 500;
const SOFT_DROP_MS = 40;
const BACKGROUND_TICK_MS = 100;

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

function reconcileCurrentPiece(board, piece) {
  if (!piece) return { piece, ok: true };
  if (canPlace(board, piece)) return { piece, ok: true };

  // Try lifting current piece upward first, preserving type/rotation/x.
  for (let dy = 1; dy <= ROWS; dy += 1) {
    const candidate = { ...piece, y: piece.y - dy };
    if (canPlace(board, candidate)) return { piece: candidate, ok: true };
  }

  // Fallback: same piece type in spawn area with multiple rotations/x positions.
  for (let rotation = 0; rotation < 4; rotation += 1) {
    for (let x = -2; x < COLS; x += 1) {
      const candidate = { ...piece, rotation, x, y: VISIBLE_START_ROW };
      if (canPlace(board, candidate)) return { piece: candidate, ok: true };
    }
  }

  return { piece, ok: false };
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
    lastTs: 0,
    backgroundTimer: 0,
    backgroundLastTs: 0
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
    return { type, rotation: 0, x: 3, y: VISIBLE_START_ROW };
  }

  function emitState() {
    const next = state.queue[0] ?? "-";
    const boardWithCurrent = state.current ? merge(state.board, state.current) : state.board;
    onState?.({
      lines: state.lines,
      score: state.score,
      level: state.level,
      gameOver: state.gameOver,
      pieceType: state.current ? state.current.type : "-",
      nextType: next,
      board: boardWithCurrent,
      syncBoard: state.board.map((row) => [...row])
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

  function compactGravity(board) {
    const out = createBoard();
    for (let col = 0; col < COLS; col += 1) {
      const stack = [];
      for (let row = ROWS - 1; row >= 0; row -= 1) {
        if (board[row][col] !== 0) stack.push(board[row][col]);
      }
      for (let row = ROWS - 1, i = 0; i < stack.length; row -= 1, i += 1) {
        out[row][col] = stack[i];
      }
    }
    return out;
  }

  function shiftRow(row, amount) {
    const out = Array.from({ length: row.length }, () => 0);
    for (let i = 0; i < row.length; i += 1) {
      const next = i + amount;
      if (next >= 0 && next < row.length) out[next] = row[i];
    }
    return out;
  }

  function applyBomb(bomb, targetBoard = null) {
    if (state.gameOver) return;

    if (targetBoard) {
      state.board = targetBoard.map((row) => [...row]);
      const reconciled = reconcileCurrentPiece(state.board, state.current);
      state.current = reconciled.piece;
      if (!reconciled.ok) {
        if (bomb === "S") {
          // Switch rule: if active piece becomes invalid, discard it and continue.
          state.lockMs = 0;
          state.gravityMs = 0;
          spawnPiece();
        } else {
          state.gameOver = true;
          onGameOver?.();
        }
      }
      render();
      emitState();
      return;
    }

    const board = state.board.map((row) => [...row]);

    switch (bomb) {
      case "A": {
        board.shift();
        const line = Array.from({ length: COLS }, () => (Math.random() < 0.35 ? 0 : Math.floor(Math.random() * 7) + 1));
        if (line.every((cell) => cell === 0)) {
          line[Math.floor(Math.random() * COLS)] = Math.floor(Math.random() * 7) + 1;
        }
        board.push(line);
        break;
      }
      case "N": {
        for (let y = 0; y < ROWS; y += 1) {
          board[y] = Array.from({ length: COLS }, () => 0);
        }
        break;
      }
      case "Q": {
        for (let y = 0; y < ROWS; y += 1) {
          const amount = Math.floor(Math.random() * 7) - 3;
          board[y] = shiftRow(board[y], amount);
        }
        break;
      }
      case "G": {
        state.board = compactGravity(board);
        break;
      }
      case "C": {
        for (let y = ROWS - 1; y >= 0; y -= 1) {
          if (board[y].some((cell) => cell !== 0)) {
            board[y] = Array.from({ length: COLS }, () => 0);
            break;
          }
        }
        break;
      }
      case "R": {
        for (let i = 0; i < 12; i += 1) {
          const row = Math.floor(Math.random() * ROWS);
          const col = Math.floor(Math.random() * COLS);
          board[row][col] = 0;
        }
        break;
      }
      case "B": {
        const centerRow = Math.floor(Math.random() * ROWS);
        const centerCol = Math.floor(Math.random() * COLS);
        for (let r = centerRow - 1; r <= centerRow + 1; r += 1) {
          for (let c = centerCol - 1; c <= centerCol + 1; c += 1) {
            if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
              board[r][c] = 0;
            }
          }
        }
        break;
      }
      case "D": {
        const rowsWithBlocks = [];
        for (let row = 0; row < ROWS; row += 1) {
          if (board[row].some((cell) => cell !== 0)) rowsWithBlocks.push(row);
        }
        if (rowsWithBlocks.length > 0) {
          const rowToDelete = rowsWithBlocks[Math.floor(Math.random() * rowsWithBlocks.length)];
          board.splice(rowToDelete, 1);
          board.unshift(Array.from({ length: COLS }, () => 0));
        }
        break;
      }
      case "S": {
        return;
      }
      default:
        return;
    }

    if (bomb !== "G") {
      state.board = board;
    }

    const reconciled = reconcileCurrentPiece(state.board, state.current);
    state.current = reconciled.piece;
    if (!reconciled.ok) {
      if (bomb === "S") {
        // Switch rule: discard invalid active piece instead of instant elimination.
        state.lockMs = 0;
        state.gravityMs = 0;
        spawnPiece();
      } else {
        state.gameOver = true;
        onGameOver?.();
      }
    }

    render();
    emitState();
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
    if (document.hidden) {
      state.frameId = requestAnimationFrame(frame);
      return;
    }
    const last = state.lastTs || ts;
    const delta = Math.min(100, ts - last);
    state.lastTs = ts;

    update(delta);
    render();
    emitState();

    state.frameId = requestAnimationFrame(frame);
  }

  function startBackgroundLoop() {
    if (state.backgroundTimer) return;
    state.backgroundLastTs = performance.now();
    state.backgroundTimer = window.setInterval(() => {
      if (!state.running || !document.hidden) return;
      const now = performance.now();
      const delta = Math.min(1000, now - state.backgroundLastTs);
      state.backgroundLastTs = now;
      update(delta);
      emitState();
    }, BACKGROUND_TICK_MS);
  }

  function stopBackgroundLoop() {
    if (!state.backgroundTimer) return;
    clearInterval(state.backgroundTimer);
    state.backgroundTimer = 0;
  }

  function onVisibilityChange() {
    if (document.hidden) {
      startBackgroundLoop();
      return;
    }
    stopBackgroundLoop();
    state.lastTs = performance.now();
    render();
    emitState();
  }

  function onKeyDown(event) {
    if (!state.running) return;

    if (
      event.code === "Space" ||
      event.code === "ArrowUp" ||
      event.code === "ArrowDown" ||
      event.code === "ArrowLeft" ||
      event.code === "ArrowRight"
    ) {
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
    document.addEventListener("visibilitychange", onVisibilityChange);
    if (document.hidden) startBackgroundLoop();
    state.frameId = requestAnimationFrame(frame);
  }

  function stop() {
    state.running = false;
    cancelAnimationFrame(state.frameId);
    stopBackgroundLoop();
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  }

  return {
    start,
    stop,
    restart,
    applyBomb
  };
}
