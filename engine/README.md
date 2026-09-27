# Lapia Engine

A batteries-included, MIT-licensed **2D game engine** for Python, built on top of Pygame.

Lapia provides rendering, physics, input, audio, scene management, ECS, AI,
networking, UI, and developer tooling — all in one coherent package.

## Features

### Rendering
- Sprite system with transforms, scale, rotation, flip, color tinting, alpha
- Frame-based sprite animation with named clips
- Tilemap rendering with multiple layers
- Particle system (burst + continuous emission)
- 2D camera with follow, deadzone, shake, zoom, bounds
- Software post-processing shaders (grayscale, vignette)
- 2D lighting with additive blending
- Text rendering with shadow, outline, alignment
- Primitive drawing helpers (line, rect, circle, polygon, arc)
- Layer-based render ordering

### Physics
- Custom rigidbody physics (static / kinematic / dynamic)
- AABB and circle colliders
- Collision detection with penetration resolution
- Friction and restitution
- Fixed timestep accumulator
- Raycasting (slab method for AABB, ray-circle)
- Joints (distance, spring)
- Sleeping bodies for performance

### Input
- Keyboard (down/pressed/released/just_pressed/just_released)
- Mouse (position, delta, wheel, multi-button, double-click)
- Gamepad (axes, buttons, left/right sticks with deadzone)
- Touch input (multi-touch)
- Action bindings ("jump" → [Space, W, Gamepad A])
- Text input mode
- Cursor visibility / lock control

### Audio
- Sound effects with volume, pitch, looping
- Music streaming
- Master/SFX/Music volume channels
- Positional audio (distance-based attenuation)
- Programmatic sound generation (beep, noise)
- Audio effects (reverb, low-pass filter stubs)

### Scene / ECS
- Scene with full lifecycle (load/unload/enter/exit/update/render)
- Entity with parent-child hierarchy and components
- Component lifecycle (attach, detach, update, render, collision)
- Built-in components: Transform, Sprite, RigidBody, Script, Lifetime, Tag
- Scene manager with stack-based navigation (push/pop/switch)
- Serialization to JSON
- Scene graph alternative (Node)

### AI
- A* pathfinding (manhattan, euclidean, chebyshev heuristics)
- Path smoothing with line-of-sight
- Flow field pathfinding for crowd navigation
- Finite state machine (State + StateMachine)
- Behavior tree (Sequence, Selector, Action, Condition, Wait, Inverter, Repeat)
- Reynolds steering behaviors (seek, flee, arrive, wander, pursue, evade, separation, cohesion, alignment)
- Boid flocking

### Network (stubs)
- TCP client and server
- Message protocol with serialization
- Broadcast and direct messaging
- State synchronization with interpolation buffer
- In-memory leaderboard

### UI
- Widget system (Label, Button, Panel, Image, Slider, ProgressBar, Checkbox)
- Layout helpers (vertical, horizontal, grid)
- Themable color system
- Mouse interaction (hover, click)

### Tools
- Frame profiler (per-section timing)
- On-screen debug overlay (FPS, draw calls, entity count)
- Dev console with command registration and history
- Asset manager (images, sounds, fonts, JSON, sprite atlases)
- Runtime object inspector

## Quickstart

```python
from lapia import Game, Scene, Sprite, Vector2, Color

class MyScene(Scene):
    def on_load(self):
        self.player = Sprite(color=Color(80, 180, 240), size=(32, 32))
        self.player.position = Vector2(100, 100)
        self.add(self.player)

    def on_update(self, dt):
        if self.input.key_down('right'):
            self.player.x += 200 * dt

game = Game(title='My Game', size=(800, 600))
game.run(MyScene())
```

## Installation

```bash
cd engine
pip install -e .
```

## Running the Demo Platformer

```bash
cd engine
python -m examples.platformer
```

Controls:
- **Arrow keys / A,D** — move
- **Space / W / Up** — jump (with coyote time + jump buffering)
- **F1** — toggle debug overlay
- **F2** — toggle sprite bounds
- **F3** — toggle grid
- **`** (backtick) — open dev console

## Project Structure

```
engine/
├── lapia/
│   ├── __init__.py     # Public API exports
│   ├── core.py         # Vector2/3, Color, Math, Clock, EventBus, Config
│   ├── rendering.py    # Sprite, Animation, Tilemap, Particles, Camera, ...
│   ├── physics.py      # PhysicsWorld, RigidBody, Collider, Joints
│   ├── input.py        # InputManager (keyboard/mouse/gamepad/touch)
│   ├── audio.py        # AudioMixer, Sound, Music
│   ├── scene.py        # Scene, Entity, Component, ECS
│   ├── ai.py           # Pathfinder, FSM, BehaviorTree, Steering
│   ├── network.py      # NetworkClient/Server, StateSync, Leaderboard
│   ├── ui.py           # Widgets, Layout, Theme
│   ├── tools.py        # Profiler, DebugOverlay, Console, AssetManager
│   └── engine.py       # Game class (main loop)
├── examples/
│   └── platformer.py
├── tests/
├── setup.py
├── pyproject.toml
├── LICENSE
└── README.md
```

## License

MIT — see [LICENSE](LICENSE).
