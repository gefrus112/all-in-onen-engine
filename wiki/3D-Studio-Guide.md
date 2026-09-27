# 3D Studio Guide

## Toolbar

The toolbar is organized into 6 groups:

### Group 1: History
- **Undo** (Ctrl+Z) — 20-level undo stack
- **Redo** (Ctrl+Y) — Redo previously undone actions

### Group 2: Transform Tools
- **Move** — Click and drag objects to reposition
- **Rotate** — Rotate selected object
- **Scale** — Resize selected object
- **Pan** — Pan the camera view

### Group 3: Add Objects
- **Box** — Add a cube
- **Sphere** — Add a sphere
- **Cylinder** — Add a cylinder
- **Cone** — Add a cone
- **Torus** — Add a torus (donut)
- **Light** — Add a point light
- **Terrain** — Open the terrain editor

### Group 4: Play Controls
- **Play** — Start play-test (avatar spawns in scene)
- **Pause** — Pause the simulation
- **Stop** — Stop and return to edit mode
- **Camera Mode** dropdown — Orbit / 1st Person / 3rd Person

### Group 5: Editors
- **Code** — Script/CSS/JS editor (Zhitlow Script, Styles.css, Logic.js)
- **GUI** — GUI editor with 5 tools (Select, Button, Text, Panel, Menu)
- **Debug** — Debug console with Run button and log output
- **Templates** — Quick access to template loader

### Group 6: Account
- **Avatar** — Pick/customize your play-test avatar
- **Upload** — Import .glb, .gltf, .png, .wav, .mp3 files
- **Publish** — Open the publish dialog
- **Help** — Open the instructions dialog
- **Settings** — Open the settings dialog
- **GitHub** — Sign in with GitHub
- **Home** — Back to the website

## Camera Modes

| Mode | Description |
|------|-------------|
| Orbit | Default editor view — drag to orbit, scroll to zoom, right-drag to pan |
| First-person | WASD to move, mouse to look (during play-test) |
| Third-person | Avatar follows camera (during play-test) |

## Terrain Editor

Click the **Mountain** icon in the toolbar to open the terrain editor:

- **Width** slider (10-100)
- **Depth** slider (10-100)
- **Max Height** slider (0.5-10)
- **Water Level** slider (-2 to 5)
- **Add Terrain** button — creates a green ground plane
- **Add Water** button — creates a transparent blue water plane

## GUI Editor

Click the **GUI** button in the toolbar. The GUI editor has 5 tools:

1. **Select** — Click to select existing GUI elements
2. **Button** — Add a clickable button
3. **Text** — Add a text label with custom font size
4. **Panel** — Add a semi-transparent panel
5. **Menu** — Add a menu screen element

Each GUI element has properties: X, Y, Width, Height, Text, Color, Font Size.

## Debug Console

Click the **Debug** button in the toolbar:

- Logs info / warn / error / success messages with timestamps
- **Run** button executes JavaScript code from the Code editor
- **Clear** button clears all logs
- Command input at the bottom (type + Enter)
- Auto-logs: play test start, asset imports, terrain changes

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+Shift+Z | Redo (alternative) |
| F5 | Run game (in 2D Studio) |
| Ctrl+S | Save file (in 2D Studio) |
