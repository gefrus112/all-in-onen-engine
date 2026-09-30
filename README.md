<div align="center">

<img src="public/icon.svg" alt="All In One Engine" width="88" />

# All In One Engine

### **Build 2D & 3D games — all in one engine.**

A **Roblox Studio-style IDE** that runs entirely in your browser.
Write **Python** or **JavaScript**, hit **Play**, and see your game run live at **60 FPS**.

[![Live Site](https://img.shields.io/badge/▶_LIVE_SITE-gefrus112.github.io-8b5cf6?style=for-the-badge&labelColor=0a0a12)](https://gefrus112.github.io/all-in-onen-engine/)

[![License: Modified MIT](https://img.shields.io/badge/License-Modified%20MIT%20%2B%20Showcase%20Clause-4ade80?style=flat-square&labelColor=0a0a12)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js&labelColor=0a0a12)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.12-3776ab?style=flat-square&logo=python&logoColor=white&labelColor=0a0a12)](https://www.python.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r186-white?style=flat-square&logo=threedotjs&labelColor=0a0a12)](https://threejs.org/)
[![Pyodide](https://img.shields.io/badge/Pyodide-0.26-8b5cf6?style=flat-square&labelColor=0a0a12)](https://pyodide.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-f97316?style=flat-square&labelColor=0a0a12)](CONTRIBUTING.md)

**[🌐 Launch the IDE](https://gefrus112.github.io/all-in-onen-engine/)** · **[📖 Wiki](https://github.com/gefrus112/all-in-onen-engine/wiki)** · **[📦 Releases](https://github.com/gefrus112/all-in-onen-engine/releases)** · **[🐛 Report Bug](https://github.com/gefrus112/all-in-onen-engine/issues)**

</div>

<br />

[![All In One Engine — 3D Studio](download/studio-3d.png)](https://gefrus112.github.io/all-in-onen-engine/)

[![🎬 Watch: building an RPG with the engine](public/videos/rpg-poster.jpg)](https://github.com/gefrus112/all-in-onen-engine/raw/main/public/videos/rpg-build.mp4)

<p align="center"><i>🎬 <b>Showreel</b> — building and playing the RPG Village Quest inside 3D Studio (click to watch) · <a href="public/demo/rpg-build-demo.html">interactive demo</a></i></p>

<br />

## 🆕 What's new in v3.1

- **First-person play test** — the Play button now locks your mouse into the game, true FPS-style. WASD + Shift to run, Space to jump, <kbd>Esc</kbd> releases the cursor. No more orbiting while you play-test.
- **Blender-style Components** — every object gets a component stack: Transform, Mesh Renderer, Rigid Body, Box Collider, Audio Source, Script, Particle Emitter, Network Sync. Add and remove them per object.
- **Map lighting presets** — one click switches the whole map: Daylight, Golden Hour, Night, Dawn or Underworld. Fine-tune sun elevation/azimuth, ambient color and fog.
- **Rendering settings** — shadows on/off, shadow map size, tone mapping (ACES/Linear/Reinhard), exposure, FOV, grid and gizmo toggles.
- **Real gizmos + new tools** — move/rotate/scale actually move objects now, with optional grid snapping, focus selection (<kbd>F</kbd>) and a one-click viewport screenshot.
- **3 new compound assets** — 🏰 Castle Tower, ⛲ Fountain, 💎 Treasure Chest (multi-part meshes, used across the RPG template).
- **Adjustable palette size** — the asset palette now resizes: S / M / L icon densities.
- **RPG Village Quest template** — a real, playable RPG built from the assets: collect 8 coins, open chests, talk to Elder Rowan, defeat 3 slimes. Quest HUD, health bar, dialogue boxes and sword combat included.

## 💡 What is this?

All In One Engine is a complete game development platform in a single browser tab. No installs, no accounts, no setup — click the link, pick an engine, and start building. It bundles **three game engines**, a **full code editor**, a **134-sprite asset library**, **multiplayer networking**, and **one-click publishing** behind one Roblox Studio-inspired interface.

It ships in four parts:

| | Part | What it is |
|---|---|---|
| 🎨 | **Lapia Studio IDE** (`/src`) | The web IDE — Monaco editor, live preview, 3D viewport, properties inspector |
| ⚙️ | **Lapia Engine** (`/engine`) | A MIT-licensed 2D game engine for Python with ~50 core systems |
| 🌐 | **Multiplayer Relay** (`/mini-services`) | A socket.io relay server for real-time multiplayer |
| 📦 | **Build Scripts** (`/build_*.sh`) | Native installers: Linux AppImage, macOS .dmg, Chromebook .deb |

---

## 🎮 Three engines, one IDE

Pick your engine when you launch — or switch anytime:

| | 🔵 **Pygame 2D** | 🟣 **Three.js 3D** | 🟢 **Zhitlow 3D** *(beta)* |
|---|---|---|---|
| **Language** | Python 3.12 | JavaScript | Zhitlow Script |
| **Runtime** | Pyodide (WASM) | WebGL / Three.js r186 | Custom renderer |
| **Best for** | Sprite games, platformers, shooters | 3D worlds, meshes, lighting | Experimental open worlds |
| **Status** | ✅ Stable | ✅ Stable | 🧪 Experimental |
| **Highlights** | 134 sprites · physics · ECS · AI · CRT preview | FPS play-test · components · lighting presets · RPG template | Real gizmos · PBR materials · GUI editor |

---

## ✨ Everything you need to ship

| | Feature | Details |
|---|---|---|
| ✍️ | **Monaco Code Editor** | Python + JS syntax highlighting, multi-tab, autosave, Ctrl+S / F5 |
| 👁️ | **Live Preview** | Runs your Python game in-browser via Pyodide at 60 FPS with real input |
| 🧊 | **3D Studio** | Interactive Three.js viewport — gizmos, components, lighting presets, first-person play test, playable RPG template |
| 👥 | **Multiplayer** | Socket.io relay included — 2-4 players, real-time position sync |
| 🖼️ | **134+ Sprite Library** | 15 categories of pixel art — players, enemies, tiles, props, weapons |
| 📤 | **Asset Upload** | Drag in your own `.glb` `.gltf` `.wav` `.mp3` `.png` files |
| 🎵 | **Audio Editor** | Visual waveform editor — trim, fade, loop, mix |
| 🧍 | **Avatar Customizer** | 6 presets or build your own for play-test mode |
| 🔍 | **666+ Properties Panel** | Roblox Studio-style inspector with searchable, type-aware editors |
| 🚀 | **Publish Everywhere** | One-click export to itch.io, Crazy Games, GitHub Pages, or HTML5 |
| 🖥️ | **Native Builds** | Linux AppImage, macOS .dmg, Chromebook .deb, Windows .exe |

<details>
<summary><b>🎨 Sprite Library — 134 sprites across 15 categories</b></summary>

![All Sprites](download/sprites-overview.png)

| | | |
|---|---|---|
| ![Player](download/sprites-player.png) | ![Characters](download/sprites-characters.png) | ![Enemies](download/sprites-enemies.png) |
| ![Structures](download/sprites-structures.png) | ![Nature](download/sprites-nature.png) | ![Tiles](download/sprites-tiles.png) |
| ![Coins](download/sprites-coins.png) | ![Power-ups](download/sprites-powerups.png) | ![Props](download/sprites-props.png) |
| ![Food](download/sprites-food.png) | ![Weapons](download/sprites-weapons.png) | ![Vehicles](download/sprites-vehicles.png) |

</details>

---

## 🚀 Quick start

### Option A — Run in your browser (zero install)

> **[▶ Launch the IDE now](https://gefrus112.github.io/all-in-onen-engine/)**

That's it. Pick an engine, load a template, hit **Play**.

### Option B — Run locally

```bash
# 1. Clone
git clone https://github.com/gefrus112/all-in-onen-engine.git
cd all-in-onen-engine

# 2. Install dependencies
bun install          # or: npm install

# 3. (Optional) start the multiplayer relay on :3001
./start-multiplayer.sh

# 4. Launch the IDE
bun run dev          # → http://localhost:3000
```

### Run the Python engine standalone

```bash
cd engine
pip install -e .
python -m examples.platformer
```

<details>
<summary><b>⌨️ Demo controls</b></summary>

| Key | Action |
|---|---|
| `←` `→` / `A` `D` | Move |
| `Space` / `W` / `↑` | Jump |
| `F1` | Toggle debug overlay |
| `F2` | Toggle sprite bounds |
| `F3` | Toggle grid |
| `` ` `` | Open dev console |

</details>

---

## 🧰 Under the hood

<details>
<summary><b>⚙️ Lapia Engine — ~50 core systems (click to expand)</b></summary>

- **Rendering** — Sprite, Animation, Animator, Tilemap, ParticleSystem, Camera (follow / deadzone / shake / zoom), Text, primitives, LayerManager, software shaders (grayscale, vignette), 2D lighting
- **Physics** — fixed-timestep PhysicsWorld, RigidBody (static / kinematic / dynamic), AABB + circle colliders, friction + restitution, raycasting, distance & spring joints, sleeping bodies
- **Input** — Keyboard / Mouse / Gamepad / Touch with action bindings (`"jump"` → `[Space, W, Gamepad A]`) and just-pressed deltas
- **Audio** — AudioMixer with master / SFX / music channels, positional audio, programmatic sound generation, reverb / low-pass effects
- **Scene / ECS** — Scene lifecycle, Entity parent-child hierarchy, Components (Transform, Sprite, RigidBody, Script, Lifetime, Tag), stack-based scene navigation, JSON serialization
- **AI** — A* pathfinding with smoothing, flow fields, FSMs, behavior trees, Reynolds steering, boid flocking
- **Network** — TCP client / server, message protocol, state sync with interpolation, leaderboard
- **UI** — Widgets (Button, Label, Panel, Image, Slider, ProgressBar, Checkbox), layout helpers, themes
- **Tooling** — Frame profiler, debug overlay, dev console, asset manager, runtime inspector

📖 Full docs: [engine/README.md](engine/README.md)

</details>

<details>
<summary><b>🏗️ Architecture (click to expand)</b></summary>

```text
all-in-onen-engine/
├── engine/                    # Python/Pygame engine
│   ├── lapia/
│   │   ├── core.py            # Vector2/3, Color, Math, Clock, EventBus, Config
│   │   ├── rendering.py       # Sprite, Animation, Tilemap, Particles, Camera
│   │   ├── physics.py         # PhysicsWorld, RigidBody, Collider, Joints
│   │   ├── input.py           # InputManager (keyboard/mouse/gamepad/touch)
│   │   ├── audio.py           # AudioMixer, Sound, Music
│   │   ├── scene.py           # Scene, Entity, Component, ECS
│   │   ├── ai.py              # Pathfinder, FSM, BehaviorTree, Steering
│   │   ├── network.py         # NetworkClient/Server, StateSync, Leaderboard
│   │   ├── ui.py              # Widgets, Layout, Theme
│   │   ├── tools.py           # Profiler, DebugOverlay, Console, AssetManager
│   │   └── engine.py          # Game class (main loop)
│   ├── examples/platformer.py
│   └── tests/test_core.py
│
├── src/                       # Next.js Studio IDE
│   ├── app/                   # App Router (page.tsx, layout.tsx, globals.css)
│   ├── components/ide/        # TopBar, FileExplorer, SceneHierarchy,
│   │                          # PropertiesPanel, CodeEditor, PreviewPane,
│   │                          # Console, StatusBar, LandingPage, Studio3D
│   │   └── studio3d/          # 3D Studio modules: types, meshes, rpg runtime,
│   │                          # components/world panels, templates, canvas
│   └── lib/
│       ├── studio-store.ts    # Zustand store
│       └── pyodide-runner.ts  # Pyodide loader + lapia_shim module
│
├── mini-services/             # socket.io multiplayer relay (Bun)
├── public/                    # sprites, logos, videos (showreel), demo page
├── prisma/                    # DB schema (reserved)
└── build_*.sh                 # native installer build scripts
```

</details>

<details>
<summary><b>🔮 How the live preview works (click to expand)</b></summary>

The IDE ships a Python module called `lapia_shim` that mirrors the real `lapia` engine API. When you hit **Play**:

1. Pyodide (Python 3.12 compiled to WebAssembly) loads from CDN
2. The `lapia_shim` module is injected into Pyodide's virtual filesystem
3. Your `main.py` is executed via `exec()`
4. Your `Game(...)` instance registers globally so the JS host can drive it
5. Each `requestAnimationFrame`, the host calls `game.run_frame(dt)` — advancing the simulation and rendering to an HTML `<canvas>` via JS bridge calls

Because `lapia_shim` mirrors the real engine API, your code is **portable**: download `main.py`, drop it in `engine/examples/`, and run `python -m examples.your_file` locally.

</details>

---

## 🧪 Tech stack

| Layer | Tech |
|---|---|
| Framework | **Next.js 16** (App Router, TypeScript) |
| Styling | **Tailwind CSS 4** + **shadcn/ui** |
| Editor | **Monaco** (the editor behind VS Code) |
| Python runtime | **Pyodide 0.26** (CPython 3.12 → WebAssembly) |
| 3D | **Three.js r186** + @react-three/fiber + drei |
| State | **Zustand** (with persistence) |
| Layout | **react-resizable-panels** |
| Relay | **Bun + socket.io** |
| Icons | **lucide-react** |

## 🗺️ Roadmap

- [x] Pygame 2D engine + live browser preview
- [x] Three.js 3D Studio with keyframe timeline
- [x] First-person play test + Blender-style components
- [x] Map lighting presets + rendering settings
- [x] Playable RPG Village Quest template + showreel video
- [x] Multiplayer relay + arena template
- [x] Avatar customizer + publish dialog
- [x] Native build scripts (Linux / macOS / Chromebook)
- [ ] 🤖 **AI Game Assistant** — code generation, debugging, level generation *(in development)*
- [ ] Zhitlow 3D out of beta
- [ ] Mobile touch editor

## 🤝 Contributing

1. **Fork** the repo
2. Create a feature branch — `git checkout -b feature/my-feature`
3. Commit — `git commit -am 'Add my feature'`
4. Push — `git push origin feature/my-feature`
5. Open a **Pull Request** 🎉

## 📄 License

**Modified MIT License (Lapia Studio Public License)** — see [LICENSE](LICENSE).

In short:

- ✅ **Free to use** — build, modify, and ship games with the engine, including commercial games. **Games you make are 100% yours.**
- ✅ **Free to learn** — read the source, learn from it, contribute improvements back.
- ❌ **No showcase / portfolio reuse** — you may **not** copy this code and present the engine (or a lightly-modified copy) as your own work in a portfolio, demo reel, school/job submission, or a rebranded "my own engine" project. Full clause in [LICENSE](LICENSE) → *Part 2, §1*.
- 📌 **Attribution required** — public uses must credit: *"Powered by All In One Engine — github.com/gefrus112/all-in-onen-engine"*.

The Lapia engine (`/engine`) ships under the same [license](engine/LICENSE).

## 🔗 Links

| Resource | URL |
|----------|-----|
| 🌐 **Live Website** | [gefrus112.github.io/all-in-onen-engine](https://gefrus112.github.io/all-in-onen-engine/) |
| 💻 **GitHub Repo** | [github.com/gefrus112/all-in-onen-engine](https://github.com/gefrus112/all-in-onen-engine) |
| 📦 **Releases** | [github.com/gefrus112/all-in-onen-engine/releases](https://github.com/gefrus112/all-in-onen-engine/releases) |
| 📖 **Wiki** | [github.com/gefrus112/all-in-onen-engine/wiki](https://github.com/gefrus112/all-in-onen-engine/wiki) |
| 🐛 **Issues** | [github.com/gefrus112/all-in-onen-engine/issues](https://github.com/gefrus112/all-in-onen-engine/issues) |

<div align="center">
<br />

**Made for people who want to make games.**

⭐ Star this repo if it helped you ship something!

</div>
