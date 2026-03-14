import { describe, expect, it } from "vitest";
import {
  MAX_BOMB_QUEUE,
  awardBombs,
  createMatch,
  createPlayer,
  useBomb,
  type BombType,
  BOARD_HEIGHT,
  BOARD_WIDTH
} from "./index.js";

function rngSeq(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i] ?? values[values.length - 1] ?? 0;
    i += 1;
    return v;
  };
}

describe("bomb queue rules", () => {
  it("awards 0/1/2/3 bombs based on lines", () => {
    const p = createPlayer("p1", "Player 1");
    const fixed = () => "A" as BombType;

    expect(awardBombs(p, 1, fixed).bombQueue).toEqual([]);
    expect(awardBombs(p, 2, fixed).bombQueue.length).toBe(1);
    expect(awardBombs(p, 3, fixed).bombQueue.length).toBe(2);
    expect(awardBombs(p, 4, fixed).bombQueue.length).toBe(3);
  });

  it("caps queue at 8 and discards extras", () => {
    let p = createPlayer("p1", "Player 1");
    p = { ...p, bombQueue: Array.from({ length: MAX_BOMB_QUEUE }, () => "A" as BombType) };
    const next = awardBombs(p, 4, () => "Q");
    expect(next.bombQueue.length).toBe(MAX_BOMB_QUEUE);
    expect(next.bombQueue.every((b) => b === "A")).toBe(true);
  });

  it("does not consume bomb when target is inactive", () => {
    let match = createMatch("m1", "u1", "u1");
    match.players.u2 = createPlayer("u2", "u2");
    match.order.push("u2");
    match.players.u1.bombQueue = ["A"];
    match.players.u2.active = false;

    const result = useBomb(match, "u1", "u2");
    expect(result.consumed).toBe(false);
    expect(result.match.players.u1.bombQueue).toEqual(["A"]);
  });
});

describe("bomb effects", () => {
  it("supports self-target and consumes on valid target", () => {
    let match = createMatch("m2", "u1", "u1");
    match.players.u1.bombQueue = ["Q"];
    match.players.u1.board[BOARD_HEIGHT - 1][0] = 1;

    const result = useBomb(match, "u1", "u1", rngSeq([0.9])); // shift +3
    expect(result.consumed).toBe(true);
    expect(result.match.players.u1.bombQueue.length).toBe(0);
    expect(result.match.players.u1.bombsUsed).toBe(1);
  });

  it("quake shifts rows horizontally immediately", () => {
    let match = createMatch("m3", "u1", "u1");
    match.players.u2 = createPlayer("u2", "u2");
    match.order.push("u2");
    match.players.u1.bombQueue = ["Q"];
    match.players.u2.board[0][1] = 2;

    const result = useBomb(match, "u1", "u2", rngSeq([0.9])); // shift +3
    expect(result.consumed).toBe(true);
    expect(result.match.players.u2.board[0][4]).toBe(2);
    expect(result.match.players.u2.board[0][1]).toBe(0);
  });

  it("switch swaps boards", () => {
    let match = createMatch("m4", "u1", "u1");
    match.players.u2 = createPlayer("u2", "u2");
    match.order.push("u2");
    match.players.u1.bombQueue = ["S"];
    match.players.u1.board[BOARD_HEIGHT - 1][0] = 7;
    match.players.u2.board[BOARD_HEIGHT - 1][BOARD_WIDTH - 1] = 9;

    const result = useBomb(match, "u1", "u2");
    expect(result.match.players.u1.board[BOARD_HEIGHT - 1][BOARD_WIDTH - 1]).toBe(9);
    expect(result.match.players.u2.board[BOARD_HEIGHT - 1][0]).toBe(7);
  });
});
