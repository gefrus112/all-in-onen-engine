// All In One Engine — 3D Studio shared types & constants
"use client";

export type SceneObjType =
  | "box" | "sphere" | "cylinder" | "cone" | "torus" | "plane" | "octahedron"
  | "light" | "camera" | "terrain" | "water" | "model"
  // compound prefab assets
  | "castle-tower" | "fountain" | "treasure-chest" | "oak-tree" | "cottage" | "lamp-post" | "npc-villager";

export type LightSubtype = "directional" | "point" | "spot" | "ambient" | "hemisphere";
export type CameraMode = "orbit" | "first-person" | "third-person";
export type RpgKind = "coin" | "chest" | "npc" | "slime" | "gate";

export const RPG_COMPONENTS = [
  "Rigid Body", "Box Collider", "Audio Source", "Script", "Particle Emitter", "Network Sync",
] as const;

export const COMPONENT_ICONS: Record<string, string> = {
  "Transform": "move",
  "Mesh Renderer": "box",
  "Light": "lightbulb",
  "Rigid Body": "gravity",
  "Box Collider": "frame",
  "Audio Source": "music",
  "Script": "code",
  "Particle Emitter": "sparkles",
  "Network Sync": "globe",
  "Tag & Layer": "tag",
};

// Roblox-style script block attached to an object (runs during play test)
export interface ScriptBlock {
  id: string;
  name: string;
  code: string;
  enabled: boolean;
}

export const DEFAULT_SCRIPT_TEMPLATE = `// This script runs every frame during play test.
// API: self (this object) · engine · input · print(...)

let t = 0;

function onStart(self) {
  print(self.name + " started!");
}

function update(dt, self) {
  t += dt;
  self.rotation.y += dt * 1.4;              // spin
  self.position.y = 0.5 + Math.sin(t * 2) * 0.35; // bob up & down
}`;

export interface SceneObject3D {
  id: string;
  name: string;
  type: SceneObjType;
  scripts?: ScriptBlock[];
  lightSubtype?: LightSubtype;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  intensity?: number;
  visible: boolean;
  locked: boolean;
  // Material (wired)
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
  transparent?: boolean;
  wireframe?: boolean;
  flatShading?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  // Components
  components?: string[];
  script?: string;
  audioClip?: string;
  audioVolume?: number;
  audioLoop?: boolean;
  audioPlayOnAwake?: boolean;
  // Physics (wired at play time)
  mass?: number;
  gravityScale?: number;
  bounciness?: number;
  isTrigger?: boolean;
  isKinematic?: boolean;
  // RPG
  rpgKind?: RpgKind;
  rpgData?: Record<string, number | string | boolean>;
  // Tag
  tag?: string;
  layer?: string;
  networked?: boolean;
  networkOwner?: string;
}

export interface GUIElement {
  id: string;
  type: "button" | "text" | "panel" | "image" | "input" | "slider" | "checkbox" | "healthbar" | "crosshair" | "menu";
  name: string;
  x: number; y: number; width: number; height: number;
  text: string;
  color: string;
  fontSize: number;
  visible: boolean;
}

export interface DebugLogEntry {
  id: string;
  type: "info" | "warn" | "error" | "success";
  text: string;
  timestamp: number;
}

export type LightPresetId = "day" | "golden-hour" | "night" | "dawn" | "underworld";

export interface WorldSettings {
  // Lighting
  lightPreset: LightPresetId;
  sunIntensity: number;
  sunElevation: number;   // degrees 5..85
  sunAzimuth: number;     // degrees 0..360
  sunColor: string;
  ambientIntensity: number;
  ambientColor: string;
  fogEnabled: boolean;
  fogDensity: number;     // 0..1
  fogColor: string;
  skyColor: string;
  // Rendering
  shadows: boolean;
  shadowMapSize: 512 | 1024 | 2048 | 4096;
  toneMapping: "aces" | "linear" | "reinhard" | "none";
  exposure: number;
  showGrid: boolean;
  showGizmo: boolean;
  fov: number;
  // Edge water (ocean around the baseplate)
  edgeWater: boolean;
  edgeWaterLevel: number;  // world Y of the water surface
  edgeWaterColor: string;
}

export const DEFAULT_WORLD: WorldSettings = {
  lightPreset: "day",
  sunIntensity: 2.4,
  sunElevation: 48,
  sunAzimuth: 40,
  sunColor: "#fff3e0",
  ambientIntensity: 0.5,
  ambientColor: "#bcd4ff",
  fogEnabled: false,
  fogDensity: 0.25,
  fogColor: "#a8cfe8",
  skyColor: "#8fc4ea",
  shadows: true,
  shadowMapSize: 2048,
  toneMapping: "aces",
  exposure: 1.05,
  showGrid: true,
  showGizmo: true,
  fov: 50,
  edgeWater: true,
  edgeWaterLevel: -0.6,
  edgeWaterColor: "#2f7fd4",
};

export interface LightPreset {
  id: LightPresetId;
  label: string;
  description: string;
  swatch: [string, string];
  apply: Partial<WorldSettings>;
}

export const LIGHT_PRESETS: LightPreset[] = [
  {
    id: "day", label: "Daylight", description: "Bright noon sun, clear sky",
    swatch: ["#8fc4ea", "#ffffff"],
    apply: { sunIntensity: 2.4, sunElevation: 48, sunAzimuth: 40, sunColor: "#fff3e0", ambientIntensity: 0.5, ambientColor: "#bcd4ff", fogEnabled: false, skyColor: "#8fc4ea", fogColor: "#a8cfe8", exposure: 1.05 },
  },
  {
    id: "golden-hour", label: "Golden Hour", description: "Warm low sun, long shadows",
    swatch: ["#ffb27a", "#ffd9a0"],
    apply: { sunIntensity: 2.2, sunElevation: 14, sunAzimuth: 295, sunColor: "#ffd9a0", ambientIntensity: 0.38, ambientColor: "#ffd9b8", fogEnabled: true, fogDensity: 0.16, skyColor: "#ffb27a", fogColor: "#f8b26a", exposure: 1.1 },
  },
  {
    id: "night", label: "Night", description: "Moonlight, deep blue ambience",
    swatch: ["#0b1026", "#7d9cff"],
    apply: { sunIntensity: 0.35, sunElevation: 38, sunAzimuth: 200, sunColor: "#7d9cff", ambientIntensity: 0.14, ambientColor: "#2a3566", fogEnabled: true, fogDensity: 0.3, skyColor: "#0b1026", fogColor: "#0d1430", exposure: 1.25 },
  },
  {
    id: "dawn", label: "Dawn", description: "Soft pink sunrise glow",
    swatch: ["#f7b2b2", "#ffc4d1"],
    apply: { sunIntensity: 1.6, sunElevation: 10, sunAzimuth: 80, sunColor: "#ffc4d1", ambientIntensity: 0.32, ambientColor: "#e8b8d8", fogEnabled: true, fogDensity: 0.2, skyColor: "#f7b2b2", fogColor: "#eec0c8", exposure: 1.05 },
  },
  {
    id: "underworld", label: "Underworld", description: "Eerie purple realm, green fog",
    swatch: ["#14101c", "#22c55e"],
    apply: { sunIntensity: 0.5, sunElevation: 60, sunAzimuth: 140, sunColor: "#c084fc", ambientIntensity: 0.2, ambientColor: "#7c3aed", fogEnabled: true, fogDensity: 0.42, skyColor: "#14101c", fogColor: "#12241a", exposure: 1.15 },
  },
];

export type PaletteSize = "small" | "medium" | "large";

export const PALETTE_SIZES: { id: PaletteSize; label: string; cols: number; icon: string }[] = [
  { id: "small", label: "S", cols: 4, icon: "w-4 h-4" },
  { id: "medium", label: "M", cols: 3, icon: "w-6 h-6" },
  { id: "large", label: "L", cols: 2, icon: "w-9 h-9" },
];

export interface AssetDef {
  name: string;
  type: SceneObjType;
  color: string;
  compound?: boolean;
  scale?: [number, number, number];
}

export const ASSET_LIBRARY_3D: AssetDef[] = [
  { name: "Wooden Crate", type: "box", color: "#92400e" },
  { name: "Stone Block", type: "box", color: "#6b7280" },
  { name: "Gold Bar", type: "box", color: "#fbbf24" },
  { name: "Crystal", type: "octahedron", color: "#06b6d4" },
  { name: "Apple", type: "sphere", color: "#ef4444" },
  { name: "Boulder", type: "sphere", color: "#52525b" },
  { name: "Tree Trunk", type: "cylinder", color: "#92400e" },
  { name: "Pillar", type: "cylinder", color: "#d1d5db" },
  { name: "Barrel", type: "cylinder", color: "#a16207" },
  { name: "Wizard Hat", type: "cone", color: "#1e3a8a" },
  { name: "Traffic Cone", type: "cone", color: "#f97316" },
  { name: "Pyramid", type: "cone", color: "#fbbf24" },
  { name: "Donut", type: "torus", color: "#ec4899" },
  { name: "Ring", type: "torus", color: "#fbbf24" },
  { name: "Platform", type: "plane", color: "#6b7280" },
  { name: "Ground Tile", type: "plane", color: "#16a34a" },
  // NEW v3.1 — compound prefabs
  { name: "Castle Tower", type: "castle-tower", color: "#9aa0ab", compound: true },
  { name: "Fountain", type: "fountain", color: "#38bdf8", compound: true },
  { name: "Treasure Chest", type: "treasure-chest", color: "#7c4a1e", compound: true },
  { name: "Sky Light", type: "light", color: "#ffffff" },
  { name: "Warm Glow", type: "light", color: "#fbbf24" },
  { name: "Purple Lamp", type: "light", color: "#8b5cf6" },
  { name: "Cyan Glow", type: "light", color: "#06b6d4" },
];

export const OBJECT_TYPES: { type: SceneObjType; name: string }[] = [
  { type: "box", name: "Box" },
  { type: "sphere", name: "Sphere" },
  { type: "cylinder", name: "Cylinder" },
  { type: "cone", name: "Cone" },
  { type: "torus", name: "Torus" },
  { type: "plane", name: "Plane" },
];

export const LIGHT_TYPES: LightSubtype[] = ["ambient", "directional", "point", "spot", "hemisphere"];

export const AVATAR_PRESETS = [
  { id: "knight", name: "Knight", color: "#3b82f6" },
  { id: "mage", name: "Mage", color: "#8b5cf6" },
  { id: "archer", name: "Archer", color: "#10b981" },
  { id: "rogue", name: "Rogue", color: "#1f2937" },
  { id: "wizard", name: "Wizard", color: "#1e3a8a" },
  { id: "robot", name: "Robot", color: "#06b6d4" },
] as const;

export const uid = () => Math.random().toString(36).slice(2, 10);

export function defaultComponentsFor(type: SceneObjType): string[] {
  if (type === "light") return ["Transform", "Light"];
  return ["Transform", "Mesh Renderer"];
}
