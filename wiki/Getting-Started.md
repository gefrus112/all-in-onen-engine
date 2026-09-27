# Getting Started

> **[Launch the Studio](https://gefrus112.github.io/all-in-onen-engine/)**

## 1. Launch the Studio

Click **Launch Studio** on the [homepage](https://gefrus112.github.io/all-in-onen-engine/). You'll see a modal asking you to pick an engine:

- **Pygame 2D Engine** — Write Python, see it run live via Pyodide at 60 FPS
- **Three.js 3D Engine** — Real 3D viewport with meshes, lights, cameras
- **Zhitlow 3D Engine** — Experimental high-perf 3D with PBR materials

Pick the one that matches your game idea.

## 2. Pick a Template

On the **Templates** panel (left side), click one of the starter templates:

| Template | Description |
|----------|-------------|
| Platformer | Player movement, gravity, jumping, tilemap collision |
| FPS Shooter | First-person, WASD + mouse, gun, enemies, HUD, menu |
| Castle Explorer | Medieval castle with rooms, towers, treasure, guards |
| Multiplayer Arena | 2-4 player online via socket.io relay |
| Physics Sandbox | Bouncing balls, gravity, walls, ball-ball collisions |

## 3. Edit Your Game

- **2D Studio**: Modify Python code in the Monaco editor. Press Ctrl+S to save. Press F5 or click Play to run.
- **3D Studio**: Click objects to select, drag the gizmo to move/rotate/scale. Use the toolbar to add new objects.

## 4. Add Assets

- **2D**: Drag sprites from the Toolbox panel — they auto-copy Python code to your clipboard
- **3D**: Click the Upload button in the toolbar to import .glb, .gltf, .png, .wav files

## 5. Pick Your Avatar

Click the **Avatar** button in the toolbar. Pick from 6 presets (Knight, Mage, Archer, Rogue, Wizard, Robot) or use the customizer to choose body type and color.

## 6. Test with Multiplayer

```bash
./start-multiplayer.sh
```

Open the IDE in 2 browser tabs, load the Multiplayer Arena template in each, hit Play — both avatars appear in real-time.

## 7. Publish

Click **Publish** in the toolbar. Pick a platform (itch.io, Crazy Games, GitHub Pages, or HTML5). Click "Build HTML5" to generate a downloadable game.html file.

## 8. Build Native Installers

```bash
./build_exe.sh        # Windows .exe (via PyInstaller)
./build_linux.sh      # Linux AppImage + .deb + .tar.gz
./build_mac.sh        # macOS .dmg + .app
./build_chromebook.sh # Chromebook .deb (Crostini)
```
