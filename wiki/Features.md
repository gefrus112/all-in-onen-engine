# Features

## Complete Feature List

### Code Editor
- Monaco editor (same as VS Code)
- Python + JavaScript syntax highlighting
- Multi-tab editing
- Autosave to localStorage
- Ctrl+S to save, F5 to run
- Search across all properties

### 2D Studio (Pygame)
- Live preview at 60 FPS via Pyodide
- CRT scanline + glow effect on canvas
- Scale up to 900px
- 666+ properties per entity
- 134 sprite asset library (15 categories)
- Click sprites to copy Python code
- Multiplayer via socket.io relay
- Templates: Platformer, FPS Shooter, Castle, Multiplayer, Physics

### 3D Studio (Three.js + Zhitlow)
- Real interactive 3D viewport
- 6+ object types (box, sphere, cylinder, cone, torus, plane, light)
- 5 light types (ambient, directional, point, spot, hemisphere)
- OrbitControls + RGB axis gizmo
- Sky + Environment lighting + real-time shadows
- Infinite grid floor
- Animation timeline with keyframes
- Play-test with WASD camera + custom avatar
- 3 camera modes: Orbit, First-person, Third-person
- Undo/redo (Ctrl+Z / Ctrl+Y, 20-level stack)
- 180+ properties per object
- Terrain editor with water level
- GUI editor with 5 tools (Select, Button, Text, Panel, Menu)
- Debug console with Run button
- Script/CSS/JS code editor
- Real asset upload (.glb, .gltf, .png, .wav, .mp3)
- Welcome card with Welcome / What's New tabs

### Avatar Customizer
- 6 preset avatars: Knight, Mage, Archer, Rogue, Wizard, Robot
- Body type: Slim (85%), Average, Tall (130%)
- Color picker with 10 presets + custom color
- Live preview
- Avatar renders in 3D Studio during play-test

### Publishing
- One-click publish dialog
- 4 platforms: itch.io, Crazy Games, GitHub Pages, HTML5 Standalone
- "Build HTML5" button generates downloadable game.html
- Step-by-step instructions for each platform

### Native Builds
- Windows .exe (PyInstaller)
- Linux AppImage + .deb + .tar.gz
- macOS .dmg + .app
- Chromebook .deb (Crostini)

### Settings
- 5 themes: Dark, Midnight, Ocean, Purple, Sunset
- Font family picker (JetBrains Mono, Fira Code, Consolas, etc.)
- Font size slider
- Word wrap toggle
- Minimap toggle
- CRT effect toggle
- Audio toggle
- Autosave toggle

### Multiplayer
- Socket.io relay server (Bun + TypeScript)
- Up to 4 players per room
- Real-time position sync (20 Hz)
- Player join/leave notifications
- Auto-cleanup of stale players (5s timeout)

### Sprite Library (134 sprites)

| Category | Count |
|----------|-------|
| Player Characters | 6 |
| NPCs & Animals | 12 |
| Enemies | 10 |
| Buildings | 9 |
| Trees & Plants | 20 |
| Tiles | 9 |
| Coins & Gems | 7 |
| Power-ups | 8 |
| Props | 13 |
| Food | 9 |
| Weapons | 9 |
| Vehicles | 7 |
| Projectiles | 5 |
| Particles | 6 |
| UI Icons | 4 |
| **Total** | **134** |
