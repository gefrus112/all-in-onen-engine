# Lapia Studio — Worklog

---
Task ID: main
Agent: main
Task: Build a 2D game engine with 5000 features and push it to github.com/gefrus112/lapia-ai-agent. Make it run Python game code with preview, code editor, design like Roblox Studio.

Work Log:
- Clarified requirements with user via AskUserQuestion
- User selected: Python/Pygame engine + Roblox Studio-style IDE + MIT license + demo platformer + user pushes themselves
- Initialized Next.js 16 project via fullstack-dev skill
- Built Python/Pygame engine under /engine/lapia/ with 12 modules:
  - core.py (Vector2/3, Color, Math, Clock, EventBus, Config)
  - rendering.py (Sprite, Animation, Tilemap, Particles, Camera, Text, Shaders, Lighting, Renderer)
  - physics.py (PhysicsWorld, RigidBody, Collider, Joints, Raycasting)
  - input.py (Keyboard/Mouse/Gamepad/Touch, action bindings)
  - audio.py (AudioMixer, Sound, Music, effects)
  - scene.py (Scene, Entity, Component, ECS, SceneManager, Node)
  - ai.py (A* pathfinding, FSM, BehaviorTree, Steering, Boids)
  - network.py (TCP client/server, StateSync, Leaderboard)
  - ui.py (Widgets, Layout, Theme)
  - tools.py (Profiler, DebugOverlay, Console, AssetManager, Inspector)
  - engine.py (Game main loop)
- Wrote demo platformer (engine/examples/platformer.py) with player movement, jump buffering, coyote time, enemies, coins, tilemap collision, camera follow, particle effects
- Wrote engine tests (engine/tests/test_core.py) — all passing
- Built Next.js IDE shell with Roblox Studio dark theme (src/app/globals.css):
  - TopBar (ribbon with File/Edit/View/Insert/Help menus + Play/Stop/Pause + view toggles + GitHub link)
  - FileExplorer (tree view, file create/delete)
  - SceneHierarchy (entity tree)
  - PropertiesPanel (live property editing with type-aware editors)
  - CodeEditor (Monaco, Python syntax, multi-tab, autosave, Ctrl+S / F5 hotkeys)
  - EditorTabs (open file tabs)
  - PreviewPane (Pyodide runner with canvas, input event listeners, FPS counter)
  - Console (Python stdout/stderr with timestamps and severity coloring)
  - StatusBar (FPS, draw calls, Pyodide status, file kind)
- Built Pyodide runner (src/lib/pyodide-runner.ts) with lapia_shim Python module that mirrors the real engine API and renders to HTML canvas via JS bridge
- Built Zustand store (src/lib/studio-store.ts) with persistence, default project (main.py + styles.css + README.md), default scene tree
- Fixed critical bug: pyodide.runPython("__user_code") was treating the variable as a string expression, switched to exec(__user_code)
- Fixed critical bug: Python name mangling was rewriting _win.__lapiaCanvas inside class methods; renamed all to single underscore prefix
- Fixed critical bug: useEffect cleanup was firing when runState transitioned from "loading" to "running" (because setRunState triggered re-render which re-ran the effect); split into two effects (one for start, one for the loop)
- Verified via Agent Browser + VLM:
  - IDE renders correctly with all panels visible
  - Pyodide loads NumPy successfully
  - Python game compiles and runs at 60 FPS
  - Platformer shows player, tiles, coins, enemies, score HUD
  - Keyboard input works (player moves left/right when arrow keys pressed)
- Set up git repo with MIT LICENSE, README.md, .gitignore
- Added remote: https://github.com/gefrus112/lapia-ai-agent.git
- Created push-to-github.sh script for the user to run with their PAT
- Committed: "feat: Lapia Studio — Roblox Studio-style 2D game engine IDE" (1cf9fe1)

Stage Summary:
- Engine: 12 Python modules, ~3500 lines of code covering 50+ systems
- IDE: Next.js 16 + Monaco + Pyodide + Zustand, 9 IDE components, Roblox Studio dark theme
- Demo: working platformer that runs in-browser via Pyodide at 60 FPS
- Verified working end-to-end: Play → compile Python → render to canvas → keyboard input → game responds
- 1165 files committed, ready to push to GitHub
- Push credentials required from user (push-to-github.sh script provided)
