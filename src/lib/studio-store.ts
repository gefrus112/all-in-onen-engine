"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FileKind = "python" | "css" | "json" | "text";

export interface ProjectFile {
  path: string;
  content: string;
  kind: FileKind;
}

export interface ConsoleMessage {
  id: string;
  type: "info" | "error" | "warn" | "success" | "debug" | "system";
  text: string;
  timestamp: number;
  source?: string;
}

export interface SceneEntity {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  expanded?: boolean;
  icon?: string;
  properties?: Record<string, unknown>;
}

export type RunState = "idle" | "loading" | "running" | "paused" | "error";

export type StudioTheme = "dark" | "midnight" | "ocean" | "purple" | "sunset";

export type EngineKind = "pygame2d" | "threejs3d" | "zhitlow3d";

export type AvatarPreset = "knight" | "mage" | "archer" | "rogue" | "wizard" | "robot";

interface StudioState {
  // Files
  files: Record<string, ProjectFile>;
  activeFile: string | null;
  openTabs: string[];

  // Scene
  sceneTree: SceneEntity[];
  selectedEntityId: string | null;

  // Console
  consoleMessages: ConsoleMessage[];

  // Runtime
  runState: RunState;
  fps: number;
  frameTime: number;
  drawCalls: number;
  entityCount: number;

  // UI state
  showGrid: boolean;
  showProperties: boolean;
  showExplorer: boolean;
  showConsole: boolean;
  showDebug: boolean;
  showAssetPicker: boolean;
  showToolbox: boolean;
  previewScale: number;

  // Selected sprite from picker (for drag-to-canvas or click-to-insert)
  selectedSpritePath: string | null;

  // Settings dialog
  settingsOpen: boolean;
  theme: StudioTheme;
  editorFontFamily: string;
  editorFontSize: number;
  editorWordWrap: boolean;
  showMinimap: boolean;
  enableSounds: boolean;
  uiSoundVolume: number;
  enableCRT: boolean;
  autoSave: boolean;

  // Project wizard
  wizardOpen: boolean;

  // GitHub auth
  authOpen: boolean;
  user: { name: string; avatar: string; githubLogin: string } | null;

  // Engine picker + 3D studio
  engineKind: EngineKind;
  studio3DOpen: boolean;
  avatarPickerOpen: boolean;
  avatar: AvatarPreset;
  avatarColor: string;
  avatarBodyType: "slim" | "average" | "tall";
  publishDialogOpen: boolean;
  instructionsOpen: boolean;

  // Pyodide
  pyodideReady: boolean;
  pyodideLoading: boolean;

  // Actions
  setFile: (path: string, content: string, kind?: FileKind) => void;
  createFile: (path: string, kind?: FileKind) => void;
  deleteFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => void;
  openFile: (path: string) => void;
  closeTab: (path: string) => void;
  setActiveFile: (path: string | null) => void;

  setSceneTree: (tree: SceneEntity[]) => void;
  selectEntity: (id: string | null) => void;
  toggleEntityExpanded: (id: string) => void;
  updateEntityProperty: (id: string, key: string, value: unknown) => void;

  addConsole: (type: ConsoleMessage["type"], text: string, source?: string) => void;
  clearConsole: () => void;

  setRunState: (s: RunState) => void;
  setRuntimeStats: (s: { fps?: number; frameTime?: number; drawCalls?: number; entityCount?: number }) => void;

  toggleGrid: () => void;
  toggleProperties: () => void;
  toggleExplorer: () => void;
  toggleConsole: () => void;
  toggleDebug: () => void;
  toggleAssetPicker: () => void;
  toggleToolbox: () => void;
  setPreviewScale: (s: number) => void;
  setSelectedSpritePath: (p: string | null) => void;

  setPyodideReady: (r: boolean) => void;
  setPyodideLoading: (l: boolean) => void;

  // Settings
  setSettingsOpen: (open: boolean) => void;
  setTheme: (t: StudioTheme) => void;
  setEditorFontFamily: (f: string) => void;
  setEditorFontSize: (n: number) => void;
  setEditorWordWrap: (w: boolean) => void;
  setShowMinimap: (s: boolean) => void;
  setEnableSounds: (s: boolean) => void;
  setUiSoundVolume: (v: number) => void;
  setEnableCRT: (s: boolean) => void;
  setAutoSave: (s: boolean) => void;

  // Wizard
  setWizardOpen: (open: boolean) => void;

  // Auth
  setAuthOpen: (open: boolean) => void;
  setUser: (u: { name: string; avatar: string; githubLogin: string } | null) => void;

  // Engine + 3D studio
  setEngineKind: (k: EngineKind) => void;
  setStudio3DOpen: (open: boolean) => void;
  setAvatarPickerOpen: (open: boolean) => void;
  setAvatar: (a: AvatarPreset) => void;
  setAvatarColor: (c: string) => void;
  setAvatarBodyType: (b: "slim" | "average" | "tall") => void;
  setPublishDialogOpen: (open: boolean) => void;
  setInstructionsOpen: (open: boolean) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

// Default project files — a copy of the platformer demo
const DEFAULT_PLAYER_PY = `"""
Lapia Studio — demo player script.
Runs inside the Pyodide sandbox with the pygame-canvas shim.
"""
from lapia_shim import Game, Scene, Sprite, Vector2, Color, Math
import math


class Player:
    def __init__(self, x, y):
        self.pos = Vector2(x, y)
        self.vel = Vector2(0, 0)
        self.size = Vector2(28, 36)
        self.on_ground = False
        self.facing = 1
        self.coyote = 0.0
        self.jump_buffer = 0.0
        self.sprite = Sprite(color=Color(80, 180, 240), size=(self.size.x, self.size.y))
        self.sprite.position = self.pos
        self.trail = []

    def update(self, dt, input_mgr, level):
        move = 0
        if input_mgr.key_down('left') or input_mgr.key_down('a'): move = -1
        if input_mgr.key_down('right') or input_mgr.key_down('d'): move = 1
        if move != 0:
            self.facing = move
            self.vel.x = Math.lerp(self.vel.x, move * 220, 0.2)
        else:
            self.vel.x *= 0.85

        if input_mgr.key_pressed('space') or input_mgr.key_pressed('w') or input_mgr.key_pressed('up'):
            self.jump_buffer = 0.15
        self.jump_buffer = max(0, self.jump_buffer - dt)
        self.coyote = max(0, self.coyote - dt)

        if self.jump_buffer > 0 and self.coyote > 0:
            self.vel.y = -480
            self.on_ground = False
            self.coyote = 0
            self.jump_buffer = 0
            return 'jump'

        if not input_mgr.key_down('space') and self.vel.y < -150:
            self.vel.y *= 0.85

        # Move and collide against tilemap
        self.pos.x += self.vel.x * dt
        self._collide(level, 'x')
        self.pos.y += self.vel.y * dt
        self.on_ground = False
        self._collide(level, 'y')
        if self.on_ground:
            self.coyote = 0.1
        self.vel.y += 1400 * dt
        if self.vel.y > 800: self.vel.y = 800

        self.sprite.position = self.pos
        self.sprite.flip_x = (self.facing < 0)
        self.trail.append(self.pos.copy())
        if len(self.trail) > 8: self.trail.pop(0)
        return None

    def _collide(self, level, axis):
        ts = level['tile_size']
        bx = self.pos.x - self.size.x / 2
        by = self.pos.y - self.size.y / 2
        tx0 = max(0, int(bx // ts)); tx1 = min(level['w'] - 1, int((bx + self.size.x) // ts))
        ty0 = max(0, int(by // ts)); ty1 = min(level['h'] - 1, int((by + self.size.y) // ts))
        for ty in range(ty0, ty1 + 1):
            for tx in range(tx0, tx1 + 1):
                if level['solid'](tx, ty):
                    tile_x = tx * ts; tile_y = ty * ts
                    if (bx < tile_x + ts and bx + self.size.x > tile_x and
                        by < tile_y + ts and by + self.size.y > tile_y):
                        if axis == 'x':
                            if self.vel.x > 0: self.pos.x = tile_x - self.size.x / 2
                            elif self.vel.x < 0: self.pos.x = tile_x + ts + self.size.x / 2
                            self.vel.x = 0; bx = self.pos.x - self.size.x / 2
                        else:
                            if self.vel.y > 0:
                                self.pos.y = tile_y - self.size.y / 2
                                self.on_ground = True
                            elif self.vel.y < 0:
                                self.pos.y = tile_y + ts + self.size.y / 2
                            self.vel.y = 0; by = self.pos.y - self.size.y / 2


class PlatformerScene(Scene):
    def on_load(self):
        self.player = Player(100, 400)
        self.score = 0
        # Tilemap: 40 cols x 18 rows
        self.tile_size = 32
        self.tilemap_w = 40; self.tilemap_h = 18
        self.solid_tiles = set()
        for x in range(self.tilemap_w):
            self.solid_tiles.add((x, 16))
        for px, py, pw in [(5, 12, 4), (12, 10, 3), (20, 11, 5), (28, 9, 4), (15, 7, 3)]:
            for x in range(px, px + pw):
                self.solid_tiles.add((x, py))
        for y in range(self.tilemap_h):
            self.solid_tiles.add((0, y))
            self.solid_tiles.add((self.tilemap_w - 1, y))
        self.camera.follow(self.player.pos, lerp=0.1, offset=Vector2(0, -40))
        self.camera.set_bounds(0, 0, self.tilemap_w * self.tile_size, self.tilemap_h * self.tile_size)
        # Coins
        self.coins = []
        for cx, cy in [(200,460),(250,460),(300,460),(350,460),(500,380),(550,380),(600,380),(700,380),(750,380),(800,380),(900,460),(950,460),(1000,460),(1100,320),(1150,320)]:
            s = Sprite(color=Color(240, 200, 80), size=(16, 16))
            s.position = Vector2(cx, cy)
            self.coins.append({'pos': Vector2(cx, cy), 'sprite': s, 'collected': False, 't': 0, 'base_y': cy})
        # Enemies
        self.enemies = []
        for ex, ey, pr in [(300, 480 - 14, 80), (700, 480 - 14, 120), (1100, 480 - 14, 100)]:
            s = Sprite(color=Color(230, 80, 100), size=(28, 28), layer='enemy')
            s.position = Vector2(ex, ey)
            self.enemies.append({'pos': Vector2(ex, ey), 'sprite': s, 'start_x': ex, 'dir': 1, 'range': pr, 'alive': True, 't': 0})

    def is_solid(self, tx, ty):
        return (tx, ty) in self.solid_tiles

    def on_update(self, dt):
        ev = self.player.update(dt, self.input, {'tile_size': self.tile_size, 'w': self.tilemap_w, 'h': self.tilemap_h, 'solid': self.is_solid})
        # Enemies
        for e in self.enemies:
            if not e['alive']: continue
            e['t'] += dt
            e['pos'].x += e['dir'] * 60 * dt
            if abs(e['pos'].x - e['start_x']) > e['range']:
                e['dir'] *= -1
            e['sprite'].position = Vector2(e['pos'].x, e['pos'].y + math.sin(e['t'] * 4) * 3)
            e['sprite'].flip_x = e['dir'] < 0
            if self.player.pos.distance_to(e['pos']) < 32:
                if self.player.vel.y > 50 and self.player.pos.y < e['pos'].y - 10:
                    e['alive'] = False; e['sprite'].visible = False; self.score += 100
                else:
                    self.player.pos = Vector2(100, 400); self.player.vel = Vector2(0, 0); self.score = max(0, self.score - 50)
        # Coins
        for c in self.coins:
            if c['collected']: continue
            c['t'] += dt
            c['sprite'].position = Vector2(c['pos'].x, c['base_y'] + math.sin(c['t'] * 3) * 4)
            if self.player.pos.distance_to(c['pos']) < 24:
                c['collected'] = True; c['sprite'].visible = False; self.score += 10

    def on_render(self, r):
        # Tilemap
        ts = self.tile_size
        off = self.camera.position
        for (tx, ty) in self.solid_tiles:
            sp = self.camera.world_to_screen(Vector2(tx * ts, ty * ts))
            r.fill_rect(sp, Vector2(ts, ts), Color(80, 90, 110))
        # Player trail
        for i, p in enumerate(self.player.trail):
            t = i / max(1, len(self.player.trail))
            r.fill_circle(self.camera.world_to_screen(p), 8 - i * 0.5, Color(80, 180, 240, int(t * 80)))
        # Player
        self.player.sprite.render(r.surface, self.camera)
        # Enemies
        for e in self.enemies:
            if e['alive']: e['sprite'].render(r.surface, self.camera)
        # Coins
        for c in self.coins:
            if not c['collected']: c['sprite'].render(r.surface, self.camera)
        # Score text
        r.draw_text(Vector2(off.x + 20, off.y + 20), f"Score: {self.score}", color=Color(255, 255, 255))


game = Game(title="Lapia Studio Demo", size=(800, 576), fps=60)
game.run(PlatformerScene())
`;

const DEFAULT_CSS = `/* Lapia Studio — Game preview CSS
   Applies to elements wrapping the canvas preview.
   Use this to skin the preview container, decorations,
   overlays, etc. */

.lapia-preview-container {
  background: radial-gradient(circle at center, #1a1b1e 0%, #0d0e10 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.lapia-preview-container::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0) 0px,
      rgba(0, 0, 0, 0) 2px,
      rgba(0, 0, 0, 0.15) 3px,
      rgba(0, 0, 0, 0) 4px
    );
  pointer-events: none;
  z-index: 3;
  mix-blend-mode: overlay;
}

.lapia-preview-container::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    transparent 50%,
    rgba(0, 0, 0, 0.4) 100%
  );
  pointer-events: none;
  z-index: 4;
}

.lapia-preview-container canvas {
  position: relative;
  z-index: 2;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.05),
    0 8px 32px rgba(0, 0, 0, 0.6),
    0 0 80px rgba(59, 130, 246, 0.15);
  image-rendering: pixelated;
  border-radius: 2px;
}

.lapia-preview-container .preview-overlay-top {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 5;
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 4px 10px;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  border-radius: 4px;
  font-size: 11px;
  color: #c9ccd1;
  pointer-events: none;
  border: 1px solid rgba(255,255,255,0.05);
}

.lapia-preview-container .preview-overlay-bottom {
  position: absolute;
  bottom: 8px;
  right: 8px;
  z-index: 5;
  padding: 4px 10px;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  border-radius: 4px;
  font-size: 11px;
  color: #8a8d93;
  pointer-events: none;
  border: 1px solid rgba(255,255,255,0.05);
}
`;

const DEFAULT_FILES: Record<string, ProjectFile> = {
  "main.py": { path: "main.py", content: DEFAULT_PLAYER_PY, kind: "python" },
  "styles.css": { path: "styles.css", content: DEFAULT_CSS, kind: "css" },
  "README.md": {
    path: "README.md",
    content: `# Lapia Studio Project

This is a demo project that runs inside **Lapia Studio** — a Roblox Studio-style
web IDE for building 2D Python games.

## Files

- \`main.py\` — Your game's entry point. Edit this and click **Play** to run.
- \`styles.css\` — Styles the preview container around the canvas.
- \`README.md\` — You are here.

## How to run

1. Click the **Play** button in the top toolbar (▶).
2. Wait for Pyodide to load (first run takes ~3 seconds).
3. Your game runs in the right-hand preview pane.

## Controls (in the demo)

- Arrow keys / A,D — move
- Space / W / Up — jump (with coyote time + jump buffering)
- Click the preview to give it keyboard focus.

## Tips

- Press **Ctrl+S** to save your current file.
- Press **F1** to toggle the debug overlay (FPS, draw calls).
- The console (bottom panel) shows Python \`print()\` output and errors.
- The **Explorer** (left panel) lists all your project files.
- The **Properties** (right panel) shows scene entities and their properties.
`,
    kind: "text",
  },
};

const DEFAULT_SCENE_TREE: SceneEntity[] = [
  {
    id: "scene",
    name: "PlatformerScene",
    type: "Scene",
    parentId: null,
    expanded: true,
    icon: "scene",
    properties: {
      name: "PlatformerScene",
      bg_color: "#232430",
      gravity: { x: 0, y: 980 },
      time_scale: 1.0,
      paused: false,
    },
  },
  {
    id: "player",
    name: "Player",
    type: "Entity",
    parentId: "scene",
    icon: "player",
    expanded: false,
    properties: {
      position: { x: 100, y: 400 },
      size: { x: 28, y: 36 },
      color: "#50b4f0",
      max_speed: 220,
      jump_force: 480,
      coyote_time: 0.1,
      facing: 1,
    },
  },
  {
    id: "tilemap",
    name: "Tilemap",
    type: "Tilemap",
    parentId: "scene",
    icon: "tilemap",
    properties: {
      tile_size: 32,
      width: 40,
      height: 18,
      layers: ["ground", "collision", "decoration"],
      solid_count: 80,
    },
  },
  {
    id: "enemy1",
    name: "Enemy (Patrol)",
    type: "Enemy",
    parentId: "scene",
    icon: "enemy",
    properties: {
      position: { x: 300, y: 466 },
      speed: 60,
      patrol_range: 80,
      alive: true,
    },
  },
  {
    id: "enemy2",
    name: "Enemy (Patrol)",
    type: "Enemy",
    parentId: "scene",
    icon: "enemy",
    properties: {
      position: { x: 700, y: 466 },
      speed: 60,
      patrol_range: 120,
      alive: true,
    },
  },
  {
    id: "coins",
    name: "Coin Group",
    type: "Group",
    parentId: "scene",
    icon: "group",
    expanded: false,
    properties: { count: 15, value: 10 },
  },
  {
    id: "camera",
    name: "Camera",
    type: "Camera",
    parentId: "scene",
    icon: "camera",
    properties: {
      position: { x: 0, y: 0 },
      zoom: 1.0,
      follow_lerp: 0.1,
      deadzone: { x: 80, y: 60 },
    },
  },
];

export const useStudio = create<StudioState>()(
  persist(
    (set) => ({
      files: DEFAULT_FILES,
      activeFile: "main.py",
      openTabs: ["main.py", "styles.css"],

      sceneTree: DEFAULT_SCENE_TREE,
      selectedEntityId: "scene",

      consoleMessages: [
        {
          id: uid(),
          type: "system",
          text: "Lapia Studio v1.0.0 — Ready. Click ▶ Play to run your game.",
          timestamp: Date.now(),
        },
      ],

      runState: "idle",
      fps: 0,
      frameTime: 0,
      drawCalls: 0,
      entityCount: 0,

      showGrid: true,
      showProperties: true,
      showExplorer: true,
      showConsole: true,
      showDebug: false,
      showAssetPicker: true,
      showToolbox: true,
      previewScale: 1.0,

      selectedSpritePath: null,

      // Settings
      settingsOpen: false,
      theme: "dark",
      editorFontFamily: "JetBrains Mono, Consolas, monospace",
      editorFontSize: 13,
      editorWordWrap: false,
      showMinimap: true,
      enableSounds: true,
      uiSoundVolume: 0.6,
      enableCRT: true,
      autoSave: true,

      // Wizard
      wizardOpen: false,

      // Auth
      authOpen: false,
      user: null,

      // Engine + 3D studio
      engineKind: "pygame2d",
      studio3DOpen: false,
      avatarPickerOpen: false,
      avatar: "knight",
      avatarColor: "#3b82f6",
      avatarBodyType: "average",
      publishDialogOpen: false,
      instructionsOpen: false,

      pyodideReady: false,
      pyodideLoading: false,

      setFile: (path, content, kind) =>
        set((s) => {
          const existing = s.files[path];
          return {
            files: {
              ...s.files,
              [path]: { path, content, kind: kind ?? existing?.kind ?? "text" },
            },
          };
        }),

      createFile: (path, kind = "python") =>
        set((s) => ({
          files: { ...s.files, [path]: { path, content: "", kind } },
          activeFile: path,
          openTabs: s.openTabs.includes(path) ? s.openTabs : [...s.openTabs, path],
        })),

      deleteFile: (path) =>
        set((s) => {
          const next = { ...s.files };
          delete next[path];
          const nextTabs = s.openTabs.filter((p) => p !== path);
          return {
            files: next,
            openTabs: nextTabs,
            activeFile: s.activeFile === path ? (nextTabs[0] ?? null) : s.activeFile,
          };
        }),

      renameFile: (oldPath, newPath) =>
        set((s) => {
          const next = { ...s.files };
          const f = next[oldPath];
          if (!f) return s;
          delete next[oldPath];
          next[newPath] = { ...f, path: newPath };
          return {
            files: next,
            openTabs: s.openTabs.map((p) => (p === oldPath ? newPath : p)),
            activeFile: s.activeFile === oldPath ? newPath : s.activeFile,
          };
        }),

      openFile: (path) =>
        set((s) => ({
          activeFile: path,
          openTabs: s.openTabs.includes(path) ? s.openTabs : [...s.openTabs, path],
        })),

      closeTab: (path) =>
        set((s) => {
          const idx = s.openTabs.indexOf(path);
          const nextTabs = s.openTabs.filter((p) => p !== path);
          let nextActive = s.activeFile;
          if (s.activeFile === path) {
            nextActive = nextTabs[idx] ?? nextTabs[idx - 1] ?? nextTabs[0] ?? null;
          }
          return { openTabs: nextTabs, activeFile: nextActive };
        }),

      setActiveFile: (path) => set({ activeFile: path }),

      setSceneTree: (tree) => set({ sceneTree: tree }),
      selectEntity: (id) => set({ selectedEntityId: id }),
      toggleEntityExpanded: (id) =>
        set((s) => ({
          sceneTree: s.sceneTree.map((e) =>
            e.id === id ? { ...e, expanded: !e.expanded } : e
          ),
        })),
      updateEntityProperty: (id, key, value) =>
        set((s) => ({
          sceneTree: s.sceneTree.map((e) =>
            e.id === id
              ? { ...e, properties: { ...e.properties, [key]: value } }
              : e
          ),
        })),

      addConsole: (type, text, source) =>
        set((s) => ({
          consoleMessages: [
            ...s.consoleMessages.slice(-499),
            { id: uid(), type, text, timestamp: Date.now(), source },
          ],
        })),
      clearConsole: () => set({ consoleMessages: [] }),

      setRunState: (runState) => set({ runState }),
      setRuntimeStats: (s) =>
        set((st) => ({
          fps: s.fps ?? st.fps,
          frameTime: s.frameTime ?? st.frameTime,
          drawCalls: s.drawCalls ?? st.drawCalls,
          entityCount: s.entityCount ?? st.entityCount,
        })),

      toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
      toggleProperties: () => set((s) => ({ showProperties: !s.showProperties })),
      toggleExplorer: () => set((s) => ({ showExplorer: !s.showExplorer })),
      toggleConsole: () => set((s) => ({ showConsole: !s.showConsole })),
      toggleDebug: () => set((s) => ({ showDebug: !s.showDebug })),
      toggleAssetPicker: () => set((s) => ({ showAssetPicker: !s.showAssetPicker })),
      toggleToolbox: () => set((s) => ({ showToolbox: !s.showToolbox })),
      setPreviewScale: (previewScale) => set({ previewScale }),
      setSelectedSpritePath: (selectedSpritePath) => set({ selectedSpritePath }),

      setPyodideReady: (pyodideReady) => set({ pyodideReady }),
      setPyodideLoading: (pyodideLoading) => set({ pyodideLoading }),

      // Settings
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
      setTheme: (theme) => set({ theme }),
      setEditorFontFamily: (editorFontFamily) => set({ editorFontFamily }),
      setEditorFontSize: (editorFontSize) => set({ editorFontSize }),
      setEditorWordWrap: (editorWordWrap) => set({ editorWordWrap }),
      setShowMinimap: (showMinimap) => set({ showMinimap }),
      setEnableSounds: (enableSounds) => set({ enableSounds }),
      setUiSoundVolume: (uiSoundVolume) => set({ uiSoundVolume }),
      setEnableCRT: (enableCRT) => set({ enableCRT }),
      setAutoSave: (autoSave) => set({ autoSave }),

      // Wizard
      setWizardOpen: (wizardOpen) => set({ wizardOpen }),

      // Auth
      setAuthOpen: (authOpen) => set({ authOpen }),
      setUser: (user) => set({ user }),

      // Engine + 3D studio
      setEngineKind: (engineKind) => set({ engineKind }),
      setStudio3DOpen: (studio3DOpen) => set({ studio3DOpen }),
      setAvatarPickerOpen: (avatarPickerOpen) => set({ avatarPickerOpen }),
      setAvatar: (avatar) => set({ avatar }),
      setAvatarColor: (avatarColor) => set({ avatarColor }),
      setAvatarBodyType: (avatarBodyType) => set({ avatarBodyType }),
      setPublishDialogOpen: (publishDialogOpen) => set({ publishDialogOpen }),
      setInstructionsOpen: (instructionsOpen) => set({ instructionsOpen }),
    }),
    {
      name: "lapia-studio",
      partialize: (s) => ({
        files: s.files,
        openTabs: s.openTabs,
        activeFile: s.activeFile,
        showGrid: s.showGrid,
        showProperties: s.showProperties,
        showExplorer: s.showExplorer,
        showConsole: s.showConsole,
        showAssetPicker: s.showAssetPicker,
        showToolbox: s.showToolbox,
        previewScale: s.previewScale,
        theme: s.theme,
        editorFontFamily: s.editorFontFamily,
        editorFontSize: s.editorFontSize,
        editorWordWrap: s.editorWordWrap,
        showMinimap: s.showMinimap,
        enableSounds: s.enableSounds,
        enableCRT: s.enableCRT,
        autoSave: s.autoSave,
        user: s.user,
        engineKind: s.engineKind,
        avatar: s.avatar,
        avatarColor: s.avatarColor,
        avatarBodyType: s.avatarBodyType,
      }),
    }
  )
);
