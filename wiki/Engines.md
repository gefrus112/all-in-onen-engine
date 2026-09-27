# Engines

All In One Engine includes three game engines, each with its own custom-drawn SVG icon.

---

## Pygame 2D Engine

![Pygame Icon](https://raw.githubusercontent.com/gefrus112/all-in-onen-engine/main/public/engine-pygame.svg)

| Property | Value |
|----------|-------|
| Version | v1.0.0 |
| Language | Python 3.12 (via Pyodide) |
| Rendering | Canvas 2D |
| FPS | 60 |
| Multiplayer | Yes (socket.io) |
| Templates | Platformer, FPS Shooter, Castle, Multiplayer, Physics |

**Features:**
- Write Python, see it run live in the browser via Pyodide
- 134 sprite asset library across 15 categories
- CRT scanline preview with glow effect
- Monaco code editor with syntax highlighting
- Multi-tab editing with autosave to localStorage
- Ctrl+S to save, F5 to run

**Updates in v1.0.0:**
- Pyodide 0.26 (Python 3.12) runtime
- 134 sprite asset library across 15 categories
- Multiplayer relay via socket.io
- CRT scanline preview with glow effect
- PyInstaller .exe / Linux AppImage / Mac .dmg build scripts

---

## Three.js 3D Engine

![Three.js Icon](https://raw.githubusercontent.com/gefrus112/all-in-onen-engine/main/public/engine-threejs.svg)

| Property | Value |
|----------|-------|
| Version | v1.0.0 |
| Library | Three.js r186 + @react-three/fiber + drei |
| Rendering | WebGL 2.0 |
| Shadows | Yes (real-time) |
| Camera | Orbit / First-person / Third-person |
| Physics | 100 properties per object |

**Features:**
- Real interactive 3D viewport with orbit/pan/zoom
- Place boxes, spheres, cylinders, cones, torus, planes, lights
- 5 light types: ambient, directional, point, spot, hemisphere
- Sky + Environment (sunset preset) + real-time shadows
- OrbitControls + RGB axis gizmo
- Animation timeline with Position/Rotation/Scale/Color tracks
- Play-test mode with WASD camera + custom avatar
- 180+ properties per object (physics, PBR, camera, rendering)

**Updates in v1.0.0:**
- Three.js r186 with @react-three/fiber + drei
- Real-time shadows + Sky + Environment lighting
- OrbitControls + RGB axis gizmo
- Animation timeline with keyframes
- Play-test mode with WASD camera + custom avatar

---

## Zhitlow 3D Engine

![Zhitlow Icon](https://raw.githubusercontent.com/gefrus112/all-in-onen-engine/main/public/engine-zhitlow.svg)

| Property | Value |
|----------|-------|
| Version | v0.9.0 (beta) |
| Rendering | WebGL (deferred, experimental) |
| PBR Materials | Yes (20 properties) |
| Physics | Yes (100 properties) |
| Scripting | Zhitlow Script + CSS + JS |
| Status | Experimental / Beta |

**Features:**
- Experimental custom 3D engine with deferred rendering
- PBR materials (roughness, metalness, clearcoat, transmission, IOR, sheen)
- 100 physics properties per object (joints, buoyancy, CCD, constraints)
- Script/CSS/JS code editor with Zhitlow Script language
- GUI editor overlay (HUD, crosshair, health bar, buttons, text, panels, menus)
- Terrain editor with water level
- Debug console with Run button (executes JavaScript)
- Undo/redo system (Ctrl+Z / Ctrl+Y, 20-level stack)
- Closable welcome card with Welcome / What's New tabs

**Updates in v0.9.0:**
- 100 physics properties per object (joints, buoyancy, CCD)
- 20 PBR material properties (clearcoat, transmission, IOR, sheen)
- Script/CSS/JS code editor with Zhitlow Script language
- GUI editor overlay (HUD, crosshair, health bar)
- Closable welcome card with quick-start guide
