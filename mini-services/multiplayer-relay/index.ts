/**
 * Lapia Studio — Multiplayer Relay
 *
 * A lightweight socket.io server that relays player state between
 * browser sessions. Used by the "Multiplayer Arena" template.
 *
 * Run: `cd mini-services/multiplayer-relay && bun run dev`
 * Listens on port 3001.
 *
 * Protocol:
 *   Client → Server:
 *     - 'state_update' {x, y, vx, vy, color, name}
 *     - 'join' {room, name}
 *   Server → Client:
 *     - 'player_joined' {id, x, y, color, name}
 *     - 'player_left' {id}
 *     - 'state_update' {id, x, y, vx, vy}
 *     - 'room_state' {players: [...]}
 */

import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const PORT = 3001;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

interface PlayerState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: [number, number, number];
  name: string;
  last_seen: number;
}

const rooms: Map<string, Map<string, PlayerState>> = new Map();

function getRoom(name: string): Map<string, PlayerState> {
  if (!rooms.has(name)) rooms.set(name, new Map());
  return rooms.get(name)!;
}

function cleanupStalePlayers(room: Map<string, PlayerState>) {
  const now = Date.now();
  const stale: string[] = [];
  for (const [id, p] of room) {
    if (now - p.last_seen > 5000) {  // 5s timeout
      stale.push(id);
    }
  }
  for (const id of stale) {
    room.delete(id);
    io.emit("player_left", { id });
    console.log(`[room] Player ${id} timed out and was removed`);
  }
}

setInterval(() => {
  for (const room of rooms.values()) cleanupStalePlayers(room);
}, 2000);

io.on("connection", (socket) => {
  console.log(`[socket] Connected: ${socket.id}`);
  let currentRoom = "default";

  socket.on("join", (data: { room?: string; name?: string }) => {
    currentRoom = data?.room || "default";
    const name = data?.name || `Player-${socket.id.slice(0, 4)}`;
    const color: [number, number, number] = [
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
    ];

    const room = getRoom(currentRoom);
    const player: PlayerState = {
      id: socket.id,
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      color,
      name,
      last_seen: Date.now(),
    };
    room.set(socket.id, player);

    // Tell everyone else about the new player
    socket.broadcast.emit("player_joined", {
      id: socket.id,
      x: 400,
      y: 300,
      color,
      name,
    });

    // Tell the new player about everyone already in the room
    const players: any[] = [];
    for (const [id, p] of room) {
      if (id !== socket.id) {
        players.push({ id, x: p.x, y: p.y, color: p.color, name: p.name });
      }
    }
    socket.emit("room_state", { players });

    console.log(`[room:${currentRoom}] ${name} (${socket.id}) joined. Room has ${room.size} players.`);
  });

  socket.on("state_update", (data: { x: number; y: number; vx: number; vy: number; color?: [number, number, number]; name?: string }) => {
    const room = getRoom(currentRoom);
    const player = room.get(socket.id);
    if (!player) return;
    player.x = data.x;
    player.y = data.y;
    player.vx = data.vx;
    player.vy = data.vy;
    if (data.color) player.color = data.color;
    if (data.name) player.name = data.name;
    player.last_seen = Date.now();

    // Broadcast to all other clients
    socket.broadcast.emit("state_update", {
      id: socket.id,
      x: data.x,
      y: data.y,
      vx: data.vx,
      vy: data.vy,
    });
  });

  socket.on("disconnect", () => {
    console.log(`[socket] Disconnected: ${socket.id}`);
    const room = getRoom(currentRoom);
    room.delete(socket.id);
    socket.broadcast.emit("player_left", { id: socket.id });
  });

  // Heartbeat
  socket.on("ping", () => {
    socket.emit("pong");
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`[Lapia Multiplayer Relay] Listening on http://0.0.0.0:${PORT}`);
  console.log(`[Lapia Multiplayer Relay] WebSocket: ws://0.0.0.0:${PORT}`);
  console.log(`[Lapia Multiplayer Relay] CORS: enabled (any origin)`);
});
