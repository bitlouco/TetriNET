export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 22;

export type Cell = number;
export type Board = Cell[][];

export type BombType = "A" | "N" | "S" | "Q" | "G" | "C" | "R" | "B";

export interface PlayerState {
  id: string;
  name: string;
  active: boolean;
  board: Board;
  bombQueue: BombType[];
  linesCleared: number;
  bombsUsed: number;
}

export interface MatchState {
  id: string;
  started: boolean;
  players: Record<string, PlayerState>;
  order: string[];
  leaderId: string;
}