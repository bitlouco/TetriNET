import { BOARD_HEIGHT, BOARD_WIDTH, type Board, type BombType, type MatchState, type PlayerState } from "./types.js";

export const MAX_BOMB_QUEUE = 8;
const ALL_BOMBS: BombType[] = ["A", "N", "S", "Q", "G", "C", "R", "B", "D"];

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () => Array.from({ length: BOARD_WIDTH }, () => 0));
}

export function createPlayer(id: string, name: string): PlayerState {
  return {
    id,
    name,
    active: true,
    board: createEmptyBoard(),
    bombQueue: [],
    linesCleared: 0,
    bombsUsed: 0
  };
}

export function createMatch(id: string, leaderId: string, leaderName: string): MatchState {
  return {
    id,
    started: false,
    players: { [leaderId]: createPlayer(leaderId, leaderName) },
    order: [leaderId],
    leaderId
  };
}

export function bombCountFromLineClear(lines: number): number {
  if (lines <= 1) return 0;
  if (lines === 2) return 1;
  if (lines === 3) return 2;
  return 3;
}

export function enqueueBombs(queue: BombType[], bombs: BombType[]): BombType[] {
  const next = [...queue];
  for (const bomb of bombs) {
    if (next.length >= MAX_BOMB_QUEUE) break;
    next.push(bomb);
  }
  return next;
}

export function awardBombs(player: PlayerState, lines: number, generator: () => BombType): PlayerState {
  const amount = bombCountFromLineClear(lines);
  const newBombs = Array.from({ length: amount }, () => generator());
  return { ...player, bombQueue: enqueueBombs(player.bombQueue, newBombs), linesCleared: player.linesCleared + lines };
}

function shiftRow(row: number[], amount: number): number[] {
  const width = row.length;
  const out = Array.from({ length: width }, () => 0);
  for (let i = 0; i < width; i += 1) {
    const next = i + amount;
    if (next >= 0 && next < width) out[next] = row[i];
  }
  return out;
}

function compactGravity(board: Board): Board {
  const out = createEmptyBoard();
  for (let col = 0; col < BOARD_WIDTH; col += 1) {
    const stack: number[] = [];
    for (let row = BOARD_HEIGHT - 1; row >= 0; row -= 1) {
      if (board[row][col] !== 0) stack.push(board[row][col]);
    }
    for (let row = BOARD_HEIGHT - 1, i = 0; i < stack.length; row -= 1, i += 1) {
      out[row][col] = stack[i];
    }
  }
  return out;
}

function randomInt(maxExclusive: number, rng: () => number): number {
  return Math.floor(rng() * maxExclusive);
}

function randomColor(rng: () => number): number {
  return randomInt(7, rng) + 1;
}

function randomGarbageLine(rng: () => number): number[] {
  const line: number[] = Array.from({ length: BOARD_WIDTH }, () => (rng() < 0.35 ? 0 : randomColor(rng)));
  if (!line.every((cell) => cell === 0)) return line;
  const filledAt = randomInt(BOARD_WIDTH, rng);
  return Array.from({ length: BOARD_WIDTH }, (_, i) => (i === filledAt ? randomColor(rng) : 0));
}

function clearCompleteRows(board: Board): { board: Board; lines: number } {
  const kept = board.filter((row) => !row.every((cell) => cell !== 0));
  const lines = BOARD_HEIGHT - kept.length;
  while (kept.length < BOARD_HEIGHT) {
    kept.unshift(Array.from({ length: BOARD_WIDTH }, () => 0));
  }
  return { board: kept, lines };
}

function randomBombFromRng(rng: () => number): BombType {
  return ALL_BOMBS[randomInt(ALL_BOMBS.length, rng)]!;
}

export function applyBombEffect(
  bomb: BombType,
  user: PlayerState,
  target: PlayerState,
  rng: () => number = Math.random
): { user: PlayerState; target: PlayerState } {
  let nextUser = { ...user, board: user.board.map((r) => [...r]) };
  let nextTarget = { ...target, board: target.board.map((r) => [...r]) };

  switch (bomb) {
    case "A": {
      nextTarget.board.shift();
      nextTarget.board.push(randomGarbageLine(rng));
      break;
    }
    case "N": {
      nextTarget.board = createEmptyBoard();
      break;
    }
    case "S": {
      const userBoard = nextUser.board;
      nextUser.board = nextTarget.board;
      nextTarget.board = userBoard;
      break;
    }
    case "Q": {
      nextTarget.board = nextTarget.board.map((row) => {
        const amount = randomInt(7, rng) - 3;
        return shiftRow(row, amount);
      });
      break;
    }
    case "G": {
      nextTarget.board = compactGravity(nextTarget.board);
      break;
    }
    case "C": {
      let found = -1;
      for (let row = BOARD_HEIGHT - 1; row >= 0; row -= 1) {
        if (nextTarget.board[row].some((c) => c !== 0)) {
          found = row;
          break;
        }
      }
      if (found >= 0) {
        nextTarget.board.splice(found, 1);
        nextTarget.board.unshift(Array.from({ length: BOARD_WIDTH }, () => 0));
      }
      break;
    }
    case "R": {
      for (let i = 0; i < 12; i += 1) {
        const row = randomInt(BOARD_HEIGHT, rng);
        const col = randomInt(BOARD_WIDTH, rng);
        nextTarget.board[row][col] = 0;
      }
      break;
    }
    case "B": {
      const occupied: Array<[number, number]> = [];
      for (let r = 0; r < BOARD_HEIGHT; r += 1) {
        for (let c = 0; c < BOARD_WIDTH; c += 1) {
          if (nextTarget.board[r][c] !== 0) occupied.push([r, c]);
        }
      }
      let centerRow = randomInt(BOARD_HEIGHT, rng);
      let centerCol = randomInt(BOARD_WIDTH, rng);
      if (occupied.length > 0) {
        const [r, c] = occupied[randomInt(occupied.length, rng)]!;
        centerRow = r;
        centerCol = c;
      }
      for (let r = centerRow - 1; r <= centerRow + 1; r += 1) {
        for (let c = centerCol - 1; c <= centerCol + 1; c += 1) {
          if (r >= 0 && r < BOARD_HEIGHT && c >= 0 && c < BOARD_WIDTH) {
            nextTarget.board[r][c] = 0;
          }
        }
      }
      break;
    }
    case "D": {
      const rowsWithBlocks: number[] = [];
      for (let row = 0; row < BOARD_HEIGHT; row += 1) {
        if (nextTarget.board[row].some((c) => c !== 0)) rowsWithBlocks.push(row);
      }
      if (rowsWithBlocks.length > 0) {
        const rowToDelete = rowsWithBlocks[randomInt(rowsWithBlocks.length, rng)]!;
        nextTarget.board.splice(rowToDelete, 1);
        nextTarget.board.unshift(Array.from({ length: BOARD_WIDTH }, () => 0));
      }
      break;
    }
  }

  return { user: nextUser, target: nextTarget };
}

export function useBomb(
  match: MatchState,
  userId: string,
  targetId: string,
  rng: () => number = Math.random
): { match: MatchState; consumed: boolean; reason?: string } {
  const user = match.players[userId];
  const target = match.players[targetId];
  if (!user || !target) return { match, consumed: false, reason: "missing-player" };
  if (!user.active) return { match, consumed: false, reason: "inactive-user" };
  if (!target.active) return { match, consumed: false, reason: "inactive-target" };
  if (user.bombQueue.length === 0) return { match, consumed: false, reason: "empty-queue" };

  const [bomb, ...rest] = user.bombQueue;
  const { user: nextUser, target: rawTarget } = applyBombEffect(bomb, user, target, rng);
  let nextTarget = rawTarget;

  if (bomb === "G") {
    const cleared = clearCompleteRows(nextTarget.board);
    nextTarget.board = cleared.board;
    if (cleared.lines > 0) {
      nextTarget = awardBombs(nextTarget, cleared.lines, () => randomBombFromRng(rng));
    }
  }

  const consumedUser: PlayerState =
    targetId === userId
      ? { ...nextTarget, bombQueue: rest, bombsUsed: user.bombsUsed + 1 }
      : { ...nextUser, bombQueue: rest, bombsUsed: user.bombsUsed + 1 };

  return {
    consumed: true,
    match: {
      ...match,
      players: {
        ...match.players,
        [userId]: consumedUser,
        [targetId]: targetId === userId ? consumedUser : nextTarget
      }
    }
  };
}
