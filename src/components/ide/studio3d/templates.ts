// All In One Engine — shared 3D scene templates (used by 3D Studio + Templates panel)
"use client";

export interface Template3DScene {
  id: string;
  name: string;
  description: string;
  gameMode: "sandbox" | "rpg";
  json: string;
}

const obj = (
  id: string, name: string, type: string,
  position: [number, number, number],
  scale: [number, number, number] = [1, 1, 1],
  color = "#3b82f6",
  extra: Record<string, unknown> = {},
) => JSON.stringify({ id, name, type, position, rotation: [0, 0, 0], scale, color, visible: true, locked: false, ...extra });

const arr = (parts: string[]) => `[${parts.join(",")}]`;

export const TEMPLATE_3D_SCENES: Template3DScene[] = [
  {
    id: "rpg-village",
    name: "RPG Village Quest",
    description: "A real playable RPG — collect 8 coins, open chests, talk to Elder Rowan, defeat 3 slimes. First-person with sword combat.",
    gameMode: "rpg",
    json: `{"type":"3d-scene","gameMode":"rpg","objects":${arr([
      obj("floor", "Village Ground", "plane", [0, 0, 0], [44, 44, 1], "#5aa64a"),
      obj("plaza", "Plaza", "plane", [0, 0.02, 2], [13, 13, 1], "#7fb35c"),
      obj("path", "Cobble Path", "plane", [0, 0.01, 9], [3.6, 22, 1], "#c9b489"),
      obj("fountain", "Fountain", "fountain", [0, 0, 1.5], [1, 1, 1], "#38bdf8"),
      obj("tower", "Castle Tower", "castle-tower", [11.5, 0, -6.5], [1, 1, 1], "#9aa0ab"),
      obj("house1", "Cottage East", "cottage", [8, 0, 5], [1, 1, 1], "#e8dcc0", { rotation: [0, -0.6, 0] }),
      obj("house2", "Cottage West", "cottage", [-8, 0, 6.5], [1, 1, 1], "#e8dcc0", { rotation: [0, 0.55, 0] }),
      obj("house3", "Cottage North", "cottage", [-7.5, 0, -2.5], [1, 1, 1], "#e8dcc0", { rotation: [0, 0.2, 0] }),
      obj("tree1", "Oak Tree 1", "oak-tree", [-12, 0, 10], [1.15, 1.15, 1.15], "#3f8f3a"),
      obj("tree2", "Oak Tree 2", "oak-tree", [13, 0, 9], [0.95, 0.95, 0.95], "#3f8f3a"),
      obj("tree3", "Oak Tree 3", "oak-tree", [-14, 0, -5], [1.25, 1.25, 1.25], "#3f8f3a"),
      obj("tree4", "Oak Tree 4", "oak-tree", [10.5, 0, 13], [1.05, 1.05, 1.05], "#3f8f3a"),
      obj("tree5", "Oak Tree 5", "oak-tree", [-6.5, 0, 14], [0.9, 0.9, 0.9], "#3f8f3a"),
      obj("lamp1", "Lamp Post 1", "lamp-post", [-3.2, 0, 9.5], [1, 1, 1], "#ffd27a"),
      obj("lamp2", "Lamp Post 2", "lamp-post", [3.4, 0, 6.5], [1, 1, 1], "#ffd27a"),
      obj("chest1", "Treasure Chest 1", "treasure-chest", [-4.2, 0, 3.2], [1, 1, 1], "#7c4a1e", { rpgKind: "chest", rotation: [0, -0.5, 0] }),
      obj("chest2", "Treasure Chest 2", "treasure-chest", [4.6, 0, -0.5], [1, 1, 1], "#7c4a1e", { rpgKind: "chest", rotation: [0, 0.4, 0] }),
      obj("coin1", "Gold Coin 1", "octahedron", [-1.2, 0, 12.5], [1, 1, 1], "#fbbf24", { rpgKind: "coin" }),
      obj("coin2", "Gold Coin 2", "octahedron", [1.1, 0, 10.2], [1, 1, 1], "#fbbf24", { rpgKind: "coin" }),
      obj("coin3", "Gold Coin 3", "octahedron", [-0.9, 0, 7.8], [1, 1, 1], "#fbbf24", { rpgKind: "coin" }),
      obj("coin4", "Gold Coin 4", "octahedron", [1.3, 0, 5.6], [1, 1, 1], "#fbbf24", { rpgKind: "coin" }),
      obj("coin5", "Gold Coin 5", "octahedron", [-1.4, 0, 2.6], [1, 1, 1], "#fbbf24", { rpgKind: "coin" }),
      obj("coin6", "Gold Coin 6", "octahedron", [1.5, 0, -0.8], [1, 1, 1], "#fbbf24", { rpgKind: "coin" }),
      obj("coin7", "Gold Coin 7", "octahedron", [-1.1, 0, -2.2], [1, 1, 1], "#fbbf24", { rpgKind: "coin" }),
      obj("coin8", "Gold Coin 8", "octahedron", [2.4, 0, -3.6], [1, 1, 1], "#fbbf24", { rpgKind: "coin" }),
      obj("npc-elder", "Elder Rowan", "npc-villager", [2.3, 0, -1.2], [1, 1, 1], "#7c5cbf", { rpgKind: "npc" }),
      obj("npc-mira", "Villager Mira", "npc-villager", [-2.6, 0, -3.4], [1, 1, 1], "#4f7e4f", { rpgKind: "npc" }),
      obj("slime1", "Slime 1", "sphere", [6.2, 0, -4.5], [1, 1, 1], "#4ade80", { rpgKind: "slime" }),
      obj("slime2", "Slime 2", "sphere", [-7.2, 0, -6.8], [1, 1, 1], "#4ade80", { rpgKind: "slime" }),
      obj("slime3", "Slime 3", "sphere", [9, 0, 3], [1, 1, 1], "#4ade80", { rpgKind: "slime" }),
      obj("sun", "Sun", "light", [5, 8, 5], [1, 1, 1], "#fff5e0", { lightSubtype: "directional", intensity: 1.2 }),
    ])}}`,
  },
  {
    id: "3d-sandbox",
    name: "3D Sandbox",
    description: "Walk around a 3D world with WASD + mouse look",
    gameMode: "sandbox",
    json: `{"type":"3d-scene","gameMode":"sandbox","objects":${arr([
      obj("floor", "Floor", "plane", [0, 0, 0], [20, 20, 1], "#16a34a"),
      obj("box1", "Box 1", "box", [3, 1, 0], [2, 2, 2], "#3b82f6"),
      obj("sphere1", "Sphere 1", "sphere", [-3, 0.5, 0], [1, 1, 1], "#ef4444"),
      obj("pillar", "Pillar", "cylinder", [0, 1, 3], [0.5, 2, 0.5], "#9ca3af"),
      obj("sun", "Sun", "light", [5, 8, 5], [1, 1, 1], "#fff5e0", { lightSubtype: "directional", intensity: 1.5 }),
    ])}}`,
  },
  {
    id: "3d-fps",
    name: "3D FPS Arena",
    description: "First-person arena with cover blocks and targets",
    gameMode: "sandbox",
    json: `{"type":"3d-scene","gameMode":"sandbox","objects":${arr([
      obj("floor", "Floor", "plane", [0, 0, 0], [30, 30, 1], "#1f2937"),
      obj("wall1", "Wall North", "box", [0, 2, -15], [30, 4, 1], "#374151"),
      obj("wall2", "Wall South", "box", [0, 2, 15], [30, 4, 1], "#374151"),
      obj("wall3", "Wall East", "box", [15, 2, 0], [1, 4, 30], "#374151"),
      obj("wall4", "Wall West", "box", [-15, 2, 0], [1, 4, 30], "#374151"),
      obj("target1", "Target 1", "sphere", [5, 1, -5], [1, 1, 1], "#ef4444"),
      obj("target2", "Target 2", "sphere", [-5, 1, 5], [1, 1, 1], "#ef4444"),
      obj("target3", "Target 3", "sphere", [8, 1, 8], [1, 1, 1], "#fbbf24"),
      obj("cover1", "Cover 1", "box", [3, 1, 3], [2, 2, 1], "#6b7280"),
      obj("cover2", "Cover 2", "box", [-3, 1, -3], [2, 2, 1], "#6b7280"),
      obj("sun", "Sun", "light", [10, 15, 10], [1, 1, 1], "#fff5e0", { lightSubtype: "directional", intensity: 2 }),
    ])}}`,
  },
  {
    id: "3d-castle",
    name: "3D Castle",
    description: "A real 3D castle with towers, walls, courtyard",
    gameMode: "sandbox",
    json: `{"type":"3d-scene","gameMode":"sandbox","objects":${arr([
      obj("floor", "Courtyard", "plane", [0, 0, 0], [20, 20, 1], "#16a34a"),
      obj("keep", "Keep", "box", [0, 3, 0], [4, 6, 4], "#9ca3af"),
      obj("tower1", "Tower NW", "cylinder", [-5, 4, -5], [1.5, 8, 1.5], "#6b7280"),
      obj("tower2", "Tower NE", "cylinder", [5, 4, -5], [1.5, 8, 1.5], "#6b7280"),
      obj("tower3", "Tower SW", "cylinder", [-5, 4, 5], [1.5, 8, 1.5], "#6b7280"),
      obj("tower4", "Tower SE", "cylinder", [5, 4, 5], [1.5, 8, 1.5], "#6b7280"),
      obj("wall_n", "Wall North", "box", [0, 2, -5], [10, 4, 0.5], "#71717a"),
      obj("wall_s", "Wall South", "box", [0, 2, 5], [10, 4, 0.5], "#71717a"),
      obj("wall_e", "Wall East", "box", [5, 2, 0], [0.5, 4, 10], "#71717a"),
      obj("wall_w", "Wall West", "box", [-5, 2, 0], [0.5, 4, 10], "#71717a"),
      obj("gate", "Gate", "box", [0, 1, -5], [3, 2, 0.6], "#92400e"),
      obj("flag", "Flag", "plane", [0.5, 8, 0], [1, 0.6, 1], "#dc2626", { rotation: [0, 1.5708, 0] }),
      obj("sun", "Sun", "light", [10, 15, 10], [1, 1, 1], "#fff5e0", { lightSubtype: "directional", intensity: 1.5 }),
    ])}}`,
  },
  {
    id: "multiplayer-3d",
    name: "3D Multiplayer Arena",
    description: "3D arena for 2-4 players via socket.io",
    gameMode: "sandbox",
    json: `{"type":"3d-scene","gameMode":"sandbox","objects":${arr([
      obj("floor", "Arena Floor", "plane", [0, 0, 0], [25, 25, 1], "#1e293b"),
      obj("spawn1", "Spawn 1", "box", [-8, 0.5, -8], [1, 1, 1], "#3b82f6"),
      obj("spawn2", "Spawn 2", "box", [8, 0.5, -8], [1, 1, 1], "#8b5cf6"),
      obj("spawn3", "Spawn 3", "box", [-8, 0.5, 8], [1, 1, 1], "#fbbf24"),
      obj("spawn4", "Spawn 4", "box", [8, 0.5, 8], [1, 1, 1], "#ef4444"),
      obj("cover1", "Cover 1", "box", [0, 1, 0], [3, 2, 1], "#475569"),
      obj("light1", "Sun", "light", [10, 15, 10], [1, 1, 1], "#fff5e0", { lightSubtype: "directional", intensity: 1.5 }),
      obj("light2", "Arena Light", "light", [0, 8, 0], [1, 1, 1], "#3b82f6", { lightSubtype: "point", intensity: 1 }),
    ])}}`,
  },
];

export function getTemplate(id: string): Template3DScene | undefined {
  return TEMPLATE_3D_SCENES.find((t) => t.id === id);
}
