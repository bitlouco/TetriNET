import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { WebSocketServer } from "ws";
import { z } from "zod";
import {
  awardBombs,
  createMatch,
  createPlayer,
  useBomb,
  type BombType,
  type MatchState
} from "@tetrinet/shared";

const PORT = Number(process.env.PORT ?? 8080);
const WEB_ROOT = join(process.cwd(), "apps/web");

type Client = {
  id: string;
  socket: import("ws").WebSocket;
  roomId?: string;
  playerId?: string;
};

const clients = new Map<string, Client>();
const rooms = new Map<string, MatchState>();

const joinSchema = z.object({ type: z.literal("join"), roomId: z.string(), playerId: z.string(), name: z.string() });
const startSchema = z.object({ type: z.literal("start"), roomId: z.string(), playerId: z.string() });
const lineClearSchema = z.object({ type: z.literal("lineClear"), roomId: z.string(), playerId: z.string(), lines: z.number().int().min(1).max(4) });
const bombSchema = z.object({ type: z.literal("useBomb"), roomId: z.string(), playerId: z.string(), targetId: z.string() });

function randomBomb(): BombType {
  const all: BombType[] = ["A", "N", "S", "Q", "G", "C", "R", "B"];
  return all[Math.floor(Math.random() * all.length)]!;
}

function send(client: Client, payload: unknown) {
  client.socket.send(JSON.stringify(payload));
}

function broadcastRoom(room: MatchState) {
  const payload = JSON.stringify({ type: "roomState", room });
  for (const client of clients.values()) {
    if (client.roomId === room.id) client.socket.send(payload);
  }
}

function ensureRoom(roomId: string, playerId: string, name: string): MatchState {
  const existing = rooms.get(roomId);
  if (existing) return existing;
  const room = createMatch(roomId, playerId, name);
  rooms.set(roomId, room);
  return room;
}

function contentType(path: string): string {
  const ext = extname(path);
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".js") return "text/javascript; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  return "text/plain; charset=utf-8";
}

const httpServer = createServer(async (req, res) => {
  try {
    const url = req.url ?? "/";
    const path = url === "/" ? "/index.html" : url;
    const fullPath = join(WEB_ROOT, path);
    const body = await readFile(fullPath);
    res.writeHead(200, { "content-type": contentType(fullPath) });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

wss.on("connection", (socket) => {
  const client: Client = { id: randomUUID(), socket };
  clients.set(client.id, client);

  send(client, { type: "connected", clientId: client.id });

  socket.on("message", (raw) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.toString());
    } catch {
      return;
    }

    const join = joinSchema.safeParse(parsed);
    if (join.success) {
      const { roomId, playerId, name } = join.data;
      const room = ensureRoom(roomId, playerId, name);

      if (!room.players[playerId]) {
        if (room.order.length >= 6) {
          send(client, { type: "error", message: "Sala cheia" });
          return;
        }
        room.players[playerId] = createPlayer(playerId, name);
        room.order.push(playerId);
      } else {
        room.players[playerId].active = true;
      }

      client.roomId = roomId;
      client.playerId = playerId;
      broadcastRoom(room);
      return;
    }

    const start = startSchema.safeParse(parsed);
    if (start.success) {
      const room = rooms.get(start.data.roomId);
      if (!room || room.leaderId !== start.data.playerId) return;
      room.started = true;
      broadcastRoom(room);
      return;
    }

    const lineClear = lineClearSchema.safeParse(parsed);
    if (lineClear.success) {
      const room = rooms.get(lineClear.data.roomId);
      if (!room) return;
      const p = room.players[lineClear.data.playerId];
      if (!p || !p.active) return;
      room.players[lineClear.data.playerId] = awardBombs(p, lineClear.data.lines, randomBomb);
      broadcastRoom(room);
      return;
    }

    const bomb = bombSchema.safeParse(parsed);
    if (bomb.success) {
      const room = rooms.get(bomb.data.roomId);
      if (!room) return;
      const result = useBomb(room, bomb.data.playerId, bomb.data.targetId);
      rooms.set(room.id, result.match);
      broadcastRoom(result.match);
      send(client, { type: "bombResult", consumed: result.consumed, reason: result.reason ?? null });
      return;
    }
  });

  socket.on("close", () => {
    if (client.roomId && client.playerId) {
      const room = rooms.get(client.roomId);
      const player = room?.players[client.playerId];
      if (room && player) {
        player.active = false;
        broadcastRoom(room);
      }
    }
    clients.delete(client.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`TetriNET server running at http://localhost:${PORT}`);
});