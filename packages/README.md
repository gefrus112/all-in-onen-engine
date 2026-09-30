# 📦 Lapia Engine Packages

Official packages for the **All In One Engine** Pygame runtime.
Install them from the built-in **Terminal** in the studio:

```bash
pip install lapia-kit
pip install particles-kit
pip list
```

The browser registry lives at [`public/packages/registry.json`](../public/packages/registry.json)
and is what the studio terminal installs from. Desktop builds use plain
`pip` / `requirements.txt` from the repo root.

## Packages

| Package | Version | What it gives you |
|---------|---------|-------------------|
| `ally-kernel` | 5.0.3 | The **Ally-5** runtime kernel — the local game-generation model behind the AI assistant. Pre-installed. |
| `lapia-kit` | 1.2.0 | Core helpers: screen shake, timers, tweens, sprite pooling, camera utils. |
| `sfx-kit` | 0.9.1 | Synthesized sound effects (no audio files): jumps, coins, explosions, UI blips. |
| `sprite-kit` | 1.1.0 | Sprite-sheet slicing, animation state machines, pixel-perfect collisions. |
| `level-kit` | 0.8.0 | Tilemap loading + procedural generation: platformer caves, rooms, mazes. |
| `particles-kit` | 1.0.2 | Bursts, trails, confetti, explosions, weather. |

## Desktop engine modules (`lapia-engine/`)

Drop-in Python modules for the desktop Pygame engine — the same API the
browser shim mirrors, so code is portable both ways:

- `ally_engine.py` — bootstrap that wires Ally-5 into desktop projects
- `sprite_kit.py` — animated sprites from sprite sheets
- `sfx_kit.py` — synthesized sound (Web Audio parity on desktop via pygame.mixer)
- `level_kit.py` — tilemaps + procedural level generation
- `particles_kit.py` — particle systems

## Ally-5 knowledge base (`ally5-knowledge/`)

- `model-card.json` — the Ally-5 model card: architecture, training data, context windows, capabilities
- `training-corpus.json` — the intent/game-template corpus the model was trained on (v5.4: includes memory + context-window specs)
- `gamedev-knowledge.json` — **the full 25-article game-dev curriculum Ally answers from** (~4,500 words): code patterns (game loop, collision, state machines, entities, vectors, cameras), game feel (juice, screen shake, particles, animation, sound), design theory (difficulty, levels, color, scoring, bosses, RNG), genre recipes (platformer, shooter, top-down, roguelike), the engine API cheat sheet, and shipping topics (debugging, optimization, playtesting). Runtime retrieval is keyword-scored in `src/lib/ally5-knowledge.ts`; this JSON is the downloadable pack.
