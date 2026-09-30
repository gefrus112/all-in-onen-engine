// Ally-5 knowledge base — a curated game-development curriculum fed to the
// Ally-5 model family. Every article is retrievable at runtime by keyword
// scoring (see searchKnowledge), so Ally can answer "how do I..." questions
// about patterns, game feel, design, genres, the engine API and shipping.
// Mirrored as a downloadable pack at packages/ally5-knowledge/gamedev-knowledge.json.

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: "patterns" | "game-feel" | "design" | "genres" | "engine" | "ship";
  keywords: string[];
  summary: string;
  body: string;
}

export const KNOWLEDGE_CATEGORY_LABELS: Record<KnowledgeArticle["category"], string> = {
  patterns: "Code patterns",
  "game-feel": "Game feel & juice",
  design: "Design theory",
  genres: "Genre recipes",
  engine: "Engine API",
  ship: "Polish & shipping",
};

export const GAMEDEV_KNOWLEDGE: KnowledgeArticle[] = [
  {
    id: "game-loop",
    title: "The Game Loop & Delta Time",
    category: "patterns",
    keywords: ["game loop", "delta time", "dt", "frame rate", "fps", "update", "tick", "frame independent", "speed per second"],
    summary: "Why every movement must be multiplied by dt, and how the engine loop is structured.",
    body: `Every game is a loop: read input → update the world → draw a frame, dozens of times per second. The single most important rule: **never move things by a fixed amount per frame**. A monitor at 144 FPS would run your game 2.4x faster than one at 60 FPS.

The engine hands you \`dt\` — the elapsed seconds since the previous frame — in \`on_update(self, dt)\`. Multiply all movement by it:

\`\`\`python
def on_update(self, dt):
    self.speed = 220.0  # pixels per SECOND
    self.player.position.x += self.speed * dt
\`\`\`

Mental model: positions are in pixels, velocities in **pixels per second**, and \`dt\` converts seconds into "this frame's share". Timers work the same way: \`self.timer -= dt\` then compare to 0. A good habit is clamping dt (\`dt = Math.min / min(dt, 0.05)\`) so a background tab pause doesn't teleport everything — the engine already does this for you.

Debug tip: if your game feels "framey", log dt for a few frames. If it jumps around wildly, you're doing heavy work (allocations, image loads) inside on_update — move it to on_load or a spawn timer.`,
  },
  {
    id: "collision",
    title: "Collision Detection — AABB & Circles",
    category: "patterns",
    keywords: ["collision", "collide", "hit", "aabb", "overlap", "intersect", "bounding box", "circle collision", "hitbox", "touching"],
    summary: "Two classic shapes cover 95% of 2D games: axis-aligned boxes and circles.",
    body: `**AABB (axis-aligned bounding box)** — rectangles that never rotate. Two boxes overlap when all four axes overlap:

\`\`\`python
def rects_overlap(a_pos, a_size, b_pos, b_size):
    return (a_pos.x < b_pos.x + b_size.width and
            a_pos.x + a_size.width > b_pos.x and
            a_pos.y < b_pos.y + b_size.height and
            a_pos.y + a_size.height > b_pos.y)
\`\`\`

**Circles** — perfect for coins, bullets, explosions. Compare the distance between centers against the sum of radii, using squared distance to skip the sqrt:

\`\`\`python
d = a.position.distance_to(b.position)
if d < a_radius + b_radius:  # hit!
\`\`\`

Practical rules: make hitboxes **smaller** than the sprite (players forgive unfair hits, not generous-looking misses); check collisions in one pass after moving everything (no double-processing); and respond by *type* — player vs coin collects, player vs enemy damages. For walls, resolve on the axis of smallest penetration so sliding along surfaces feels smooth.`,
  },
  {
    id: "state-machine",
    title: "Game State Machines",
    category: "patterns",
    keywords: ["state machine", "game state", "menu", "pause", "game over", "screens", "states", "flow", "title screen"],
    summary: "Structure menu / playing / paused / game-over cleanly so screens never fight each other.",
    body: `Bugs love tangled games: "the enemy still moves while paused", "the game-over screen restarts twice". The cure is a **state machine** — one variable that says what the game is doing, and every update path checks it first:

\`\`\`python
def on_update(self, dt):
    if self.state == "menu":
        if self.input.key_pressed("space"):
            self.state = "playing"
    elif self.state == "playing":
        self.move_player(dt)
        if self.lives <= 0:
            self.state = "game_over"
    elif self.state == "game_over":
        if self.input.key_pressed("r"):
            self.reset()  # rebuild positions, score, lives
            self.state = "playing"
    # paused: nothing updates — that's the point
\`\`\`

Rules that keep it clean: only **one** place changes state per transition; the render step draws different things per state; and "game over" should freeze the world (stop updates, keep rendering) so the death feels readable. Restart by resetting data, not by hoping old values fix themselves.`,
  },
  {
    id: "entities",
    title: "Entity Lists, Spawning & Object Pools",
    category: "patterns",
    keywords: ["entities", "entity", "spawn", "spawner", "pool", "object pooling", "many enemies", "bullets", "lists", "remove", "arrays"],
    summary: "How to manage hundreds of bullets, enemies and coins without frame drops or ghost objects.",
    body: `Never hand-code \`self.enemy1, self.enemy2...\` — keep entities in a **list** and loop it:

\`\`\`python
def on_update(self, dt):
    self.spawn_timer -= dt
    if self.spawn_timer <= 0:
        self.spawn_timer = 1.2
        self.enemies.append(self.make_enemy())

    for e in self.enemies:
        e.position.x += e.velocity.x * dt

    # remove dead ones AFTER the loop — never remove while iterating
    self.enemies = [e for e in self.enemies if e.alive]
\`\`\`

Three professional habits: (1) **spawn timers** instead of "every frame random" — players read rhythm as fairness; (2) **object pooling** — for bullets, recycle dead ones instead of creating new Sprites constantly, which keeps the GC quiet; (3) tag entities with a \`kind\` field so collision response is a lookup, not a pile of isinstance checks. Cap the list (\`if len(self.bullets) < 200\`) as a safety valve.`,
  },
  {
    id: "vector-math",
    title: "Vector Math You Actually Need",
    category: "patterns",
    keywords: ["vector", "vector2", "normalize", "direction", "distance", "angle", "aim", "atan2", "velocity", "movement math"],
    summary: "Direction, normalization, distance and aiming — the four vector moves behind every 2D game.",
    body: `Four operations cover almost everything:

**1. Direction to a target** (enemy chasing player):
\`\`\`python
to_player = self.player.position - self.enemy.position
self.enemy.position += to_player.normalized * self.chase_speed * dt
\`\`\`
Normalizing turns the difference into a pure direction of length 1 — multiply by speed to get a velocity that's identical at any distance.

**2. Distance checks** — \`a.distance_to(b)\` for aggro ranges, pickup radii, "is the boss close enough".

**3. Aim angle** for turret sprites: rotate toward \`Math.atan2(to.y, to.x)\`.

**4. Velocity with drag** for floaty movement:
\`\`\`python
self.vel = self.vel * 0.92 + input_dir * self.accel * dt
self.pos += self.vel * dt
\`\`\`
Small caveat: \`normalized\` on a zero vector is undefined — guard with "if length > 0.001" when the target sits exactly on top of the mover.`,
  },
  {
    id: "camera",
    title: "Camera Systems — Follow, Deadzone, Lookahead",
    category: "patterns",
    keywords: ["camera", "follow", "scroll", "view", "lookahead", "deadzone", "smooth camera", "parallax", "viewport"],
    summary: "Make a camera that follows smoothly without making players seasick.",
    body: `The naive camera (center exactly on the player every frame) feels robotic and jitters with tiny movements. Two upgrades:

**Smoothing** — move a fraction toward the target each frame:
\`\`\`python
self.cam += (self.player.position - self.cam) * min(1, 5 * dt)
\`\`\`
The \`min(1, 5*dt)\` keeps it frame-rate independent; 5 is "snappiness" — 3 is cinematic, 10 is tight.

**Deadzone** — only move the camera when the player leaves a small centered box, so idle wiggling doesn't scroll the world.

**Lookahead** — offset the target a few dozen pixels toward the player's facing/velocity. Players subconsciously want to see where they're going.

For big worlds, also consider **parallax**: draw background layers at 0.2–0.5x camera movement for instant depth. And when the camera must shake (see the screen-shake article), shake a separate offset — never the smoothed position itself, or the shake never ends.`,
  },
  {
    id: "game-feel",
    title: "Juice — Making Games Feel Good",
    category: "game-feel",
    keywords: ["juice", "game feel", "feel", "polish", "satisfying", "impact", "feedback", "punchy", "responsive"],
    summary: "The 12 layers of feedback that turn a tech demo into a game players can't put down.",
    body: `"Juice" is layers of feedback stacked on every important event. The checklist, cheapest first:

1. **Sound** — even a synthesized blip makes an action feel real.
2. **Flash** — tint the sprite white for 60ms on hit.
3. **Squash & stretch** — scale the sprite briefly (jump: stretch 1.2x tall; land: squash 0.8x).
4. **Particles** — 6-10 small squares/circles burst on impact.
5. **Screen shake** — small (2-4px) on hits, big on explosions.
6. **Hit-stop** — freeze the whole game 40-80ms on big hits. Feels incredible.
7. **Number popups** — damage/score floats up and fades.
8. **Trail** — previous positions drawn fading behind fast objects.
9. **Screen flash** — full-screen white/red at 10% alpha for 50ms on deaths.
10. **Easing everywhere** — menus, health bars, and pickups should slide, never teleport.

The golden rule: **every player action gets a response within 100ms**. Press a button and nothing visibly happens for 200ms? The game feels broken even when the logic is perfect. Add juice one event at a time — the jump, then the hit, then the pickup — and playtest after each.`,
  },
  {
    id: "screen-shake",
    title: "Screen Shake Done Right",
    category: "game-feel",
    keywords: ["screen shake", "shake", "camera shake", "rumble", "impact", "trauma", "explosion"],
    summary: "Trauma-based screen shake: the industry-standard pattern for readable, non-nauseating shake.",
    body: `Random per-frame shaking at full power feels like a glitch. The standard is **trauma-based shake**:

\`\`\`python
def add_shake(self, amount):
    self.trauma = min(1.0, self.trauma + amount)

def on_update(self, dt):
    self.trauma = max(0, self.trauma - 1.6 * dt)   # decays
    shake = self.trauma * self.trauma               # squared = quiet until big hits
    ox = (random.random() * 2 - 1) * 8 * shake
    oy = (random.random() * 2 - 1) * 8 * shake
\`\`\`

Why it works: trauma **accumulates** (three quick hits shake more than one), the **square** keeps small hits subtle, and decay ends it cleanly. Tune max offset to your screen: 6-10px at 800x600.

Etiquette: shake on player-caused impacts and explosions, not on UI clicks; never shake menus; and combine with hit-stop for the money moment — 60ms freeze + 0.4 trauma reads as "that HURT". If you have a camera object, add the offset at draw time only.`,
  },
  {
    id: "particles",
    title: "Particle Systems",
    category: "game-feel",
    keywords: ["particles", "particle", "explosion", "sparks", "confetti", "effects", "burst", "emitter", "dust"],
    summary: "One tiny particle struct + one burst function = explosions, dust, sparks, confetti, trails.",
    body: `A particle is just: position, velocity, life, color, size. One system covers explosions, dust, sparks, rain, confetti:

\`\`\`python
def burst(self, pos, color, count=10, speed=120):
    for _ in range(count):
        a = random.random() * 6.283
        s = speed * (0.3 + random.random() * 0.7)
        self.particles.append({
            "pos": [pos.x, pos.y],
            "vel": [Math.cos(a) * s, Math.sin(a) * s],
            "life": 0.5 + random.random() * 0.4,
            "color": color, "size": 3 + random.random() * 3,
        })

def update_particles(self, dt):
    for p in self.particles:
        p["vel"][1] += 260 * dt          # gravity pulls sparks down
        p["pos"][0] += p["vel"][0] * dt
        p["pos"][1] += p["vel"][1] * dt
        p["life"] -= dt
    self.particles = [p for p in self.particles if p["life"] > 0]
\`\`\`

Render with \`fill_rect\` or \`fill_circle\`, alpha tied to life. Variety rules: random angle + random speed + random size is what separates "effect" from "5 identical squares". Emit on: jumps (dust at feet), hits (sparks), deaths (big burst), pickups (rising sparkle). Cap the pool at ~300.`,
  },
  {
    id: "sprite-animation",
    title: "Sprite Animation & Squash-and-Stretch",
    category: "game-feel",
    keywords: ["animation", "sprite animation", "frames", "squash", "stretch", "scale", "walk cycle", "flip", "facing", "animate"],
    summary: "Frame timers, flip-by-direction, and scaling tricks that make flat sprites feel alive.",
    body: `**Frame animation** is a timer + an index:
\`\`\`python
self.anim_t += dt
if self.anim_t > 0.12:            # 8 fps
    self.anim_t = 0
    self.frame = (self.frame + 1) % len(self.frames)
\`\`\`
Pick frame duration by personality: 0.08-0.12s is energetic, 0.2s is lazy/heavy. Two frames are enough for a bounce cycle if the extremes are far apart.

**Squash & stretch** without art: scale the sprite — jump = \`scale(0.8, 1.25)\` (stretch), land = \`scale(1.25, 0.75)\` (squash), then ease back to 1.0 over ~0.15s. Volume should roughly stay constant: if X grows, Y shrinks.

**Facing**: flip horizontally by velocity sign, \`if vx > 0: face_right\` — never let a sprite moonwalk.

**Idle shouldn't be still**: a tiny scale pulse (1.0 → 1.03, 2s loop) or 1px bob keeps characters alive. Pro trick — animate the *most important* thing more: the player gets 4 frames, coins get 2, background props get a color pulse.`,
  },
  {
    id: "sound-design",
    title: "Sound Design on a Zero Budget",
    category: "game-feel",
    keywords: ["sound", "sfx", "audio", "beep", "music", "noise", "synthesized", "web audio", "sfx_kit", "play_sfx"],
    summary: "Synthesized blips, noise bursts and pitch tricks — full SFX with zero audio files.",
    body: `You don't need audio files. Synthesized sounds are generated from waveforms and read as "game" instantly:

- **Coin/pickup**: two quick square-wave notes up (C6 → E6, 60ms each). Rising = reward.
- **Jump**: sine sweep 220→660Hz over 120ms. The sweep IS the "boing".
- **Explosion**: white noise burst with a lowpass filter closing 400→80Hz, 300ms.
- **Hit**: square wave 110Hz, 60ms + a noise click.
- **UI tap**: 25ms sine blip at 880Hz.

In engine games, \`sfx_kit\` provides these ready-made (\`play_sfx("coin")\`-style helpers), and the browser IDE wires Web Audio automatically.

Three mixing rules: (1) **pitch variation** ±5% on repeats so 50 coins don't drone; (2) **layer** — impact = click + body + tail feels pro; (3) **silence is a tool** — muting music for 100ms on a big hit adds punch (a "audio hit-stop"). Loop music at ~60% volume so SFX cut through.`,
  },
  {
    id: "difficulty",
    title: "Difficulty Curves & Dynamic Difficulty",
    category: "design",
    keywords: ["difficulty", "harder", "easier", "balance", "curve", "dynamic difficulty", "dda", "challenge", "pacing", "difficulty spike"],
    summary: "Ramp challenge in steps, breathe between spikes, and let weak players quietly catch a break.",
    body: `A difficulty curve is **steps, not a ramp**: 20-40 seconds of rising tension, then a breather, then a bigger step. Continuous escalation numbs players; spikes without recovery rage-quit them.

Tools, in order of subtlety:
1. **Enemy speed/HP multipliers** per stage: 1.0 → 1.15 → 1.3.
2. **Spawn interval**: 1.2s → 1.0s → 0.8s (rhythm beats raw speed).
3. **New mechanics**, not more of the same: introduce a new enemy type instead of 3 extra clones.
4. **Checkpoints/save dots** before spikes, so retries are cheap.

**Dynamic difficulty adjustment (DDA)** — the invisible safety net: track deaths silently. If the player died 3+ times on the same section, drop spawn rate 10% or drop an extra health pickup ("pity drop"). If they're untouched, bump speed 5%. Never announce it — players who feel the game pitying them feel insulted; players who feel the game fighting them quit.

Playtest rule: watch ONE new player silently. Where they die twice in a row is where your curve lies.`,
  },
  {
    id: "level-design",
    title: "Level Design 101",
    category: "design",
    keywords: ["level design", "levels", "layout", "pacing", "guide the player", "breadcrumbs", "flow", "level structure", "rooms"],
    summary: "Teach by doing, guide with light and geometry, breathe between challenges.",
    body: `Great levels are conversations. The core principles:

**Teach by doing, not saying.** First introduce a mechanic in a safe space with an obvious solution — one gap, one jump. Later, combine it with the previous mechanic. If the player can die while *learning* something new, the level failed, not the player.

**Guide the eye.** Players walk toward: light, contrast, open space, and upward slopes. Place a coin trail or a brighter tile where you want them to go — no arrow signs needed. This is "breadcrumbing".

**Breathe.** Alternate tension/release: fight → treasure room → fight. Corridor → arena → corridor. A 10-second calm room before a boss doubles the boss's impact.

**Design the back door.** For any puzzle/arena, decide what happens when the player fails: respawn close, keep progress. Punish with time (30s), not progress (30 minutes).

The mirror test: play your level backwards. If getting back to the start is miserable, add a shortcut loop.`,
  },
  {
    id: "color-theory",
    title: "Color Theory for Readable Games",
    category: "design",
    keywords: ["color", "colors", "palette", "contrast", "readability", "colorblind", "hue", "theme", "background color", "accent"],
    summary: "Player = highest contrast, hazards = warm, rewards = bright — and test the whole scene in grayscale.",
    body: `Color is information before it is decoration. The hierarchy that never fails:

- **Player**: highest contrast in the scene — brightest or most saturated color, always.
- **Hazards/enemies**: warm hues (red, orange, magenta) — humans read warm as danger.
- **Rewards**: bright accents (gold, cyan sparkle) that shimmer or pulse so they pop.
- **Background**: low-saturation, darker version of your theme. If the background competes with the player, everything feels muddy.

Pick palettes fast: choose one base hue, then rotate ~150° for the accent (teal ↔ coral, indigo ↔ amber). Tools like coolors.co give instant pro sets — grab 4-5 swatches max.

Contrast sanity check: screenshot your game and squint (or desaturate). If the player disappears, fix contrast, not brightness alone.

Accessibility: never encode meaning in color alone — spikes get a shape (triangles), pickups get a shape (circles) and usually motion. ~8% of players see color differently; shape-coding costs nothing and saves everyone.`,
  },
  {
    id: "score-design",
    title: "Scoring, Combos & Reward Feedback",
    category: "design",
    keywords: ["score", "scoring", "combo", "multiplier", "high score", "reward", "points", "feedback loop", "gratification"],
    summary: "Scores are psychology: reward risk, escalate multipliers, and make the number itself feel good.",
    body: `A score counter is a reward system, and rewards need three properties:

**Immediate**: the number changes the exact frame of pickup + a popup ("+10" floats up) + a blip. Delay kills the loop.

**Escalating**: combos/multipliers turn "I did the thing" into "I did it WELL":
\`\`\`python
if self.time_since_last_coin < 2.0:
    self.combo += 1
else:
    self.combo = 1
gain = 10 * self.combo   # 10, 20, 30... chained coins feel amazing
\`\`\`
Reset the chain on damage — now avoiding hits has a price tag, and greedy players self-optimize into excitement.

**Legible**: end-of-run screens ("Score 3,450 · Best 5,200 · Coins 38/40") let players set their own next goal. Best score should always be visible somewhere — beating *yourself* is the strongest retention loop ever found.

Small craft notes: big numbers get separators (1,000 not 1000); rate-limit +1 ticks into +10s so the counter moves satisfyingly; and never let score reset to 0 silently — deaths show the final score for 2+ seconds.`,
  },
  {
    id: "boss-design",
    title: "Boss Fight Design",
    category: "design",
    keywords: ["boss", "boss fight", "phases", "boss battle", "health bar", "final boss", "patterns", "telegraph"],
    summary: "A boss is a dance: telegraphed patterns, phase escalation, and a health bar that tells the story.",
    body: `A boss is not a big enemy — it's a **structured duel**:

**1. Telegraph everything.** Every attack has a wind-up: the eye glows, the arm raises, a laser charges 0.4s before firing. Telegraph → attack → recover is the rhythm; the recover window is when players deal damage. Unfair bosses skip the telegraph; boring ones skip the recover.

**2. Phases tell a story.** 2-3 phases, each a new pattern at higher tempo: 100-66% single attacks, 66-33% combos, 33-0% desperation mode (faster + arena hazard). Phase transitions get their own moment — flash, roar, brief pause.

**3. The health bar is pacing.** Segmented bars ("!!!" marks) tell players a phase is coming. Reveal it dramatically when the fight starts.

**4. Give players a plan-shaped arena**: clear floor, visible full boss, maybe one cover object. Dodging INTO position should always be possible.

Budget rule: a boss costs as much work as 5 normal enemies. Ship one great boss instead of three mushy ones — and playtest the fight 5 times yourself before calling it done.`,
  },
  {
    id: "rng",
    title: "RNG & Procedural Content",
    category: "design",
    keywords: ["random", "rng", "procedural", "seed", "generation", "spawn randomness", "shuffle", "variance", "luck"],
    summary: "Controlled randomness: seeded runs, shuffled bags instead of dice, and clamping bad luck.",
    body: `Raw randomness feels unfair. Pro techniques:

**Seeded runs** — \`seed = hash(input_string)\`, then derive all spawns from it. Same seed = same world: players share seeds, speedrunners rejoice, and bug reports become reproducible.

**Shuffle bags** — instead of "1 in 4 chance" per draw (which streaks painfully), put 1 of each outcome in a bag, shuffle, draw all 4, refill. Guarantees fairness over short windows — the feel of luck without the cruelty.

**Clamp the tails**: cap consecutive misses (pity system), cap max coins off-screen, never let two spawns overlap the player. Generate, then *validate*.

**Structured random** for levels: pick room *shapes* from a curated set, randomize contents/connections — "random rooms, authored layout" reads as designed while staying fresh.

Decimal trap: \`random.random() < 0.3\` is NOT "3 of every 10" — it's a coin with no memory, streaks included. Whenever players would *notice* the streak, switch to a shuffle bag. Whenever they wouldn't, enjoy the cheap dice.`,
  },
  {
    id: "genre-platformer",
    title: "Platformer Recipe — Coyote Time & Jump Buffering",
    category: "genres",
    keywords: ["platformer", "jump", "coyote time", "jump buffering", "gravity", "variable jump", "mario like", "running", "ground"],
    summary: "The four invisible systems that make jumping feel fair: coyote time, buffering, variable height, and tuned gravity.",
    body: `Player jumps feel bad for invisible reasons. Fix with the sacred four:

**Coyote time** — allow jumping ~0.1s after walking off a ledge. Humans press jump *late*; forgive them:
\`\`\`python
if self.on_ground: self.coyote = 0.1
else: self.coyote -= dt
can_jump = self.coyote > 0
\`\`\`

**Jump buffering** — if jump is pressed 0.1s *before* landing, trigger it on landing. Combined, these two kill 90% of "the controls ate my input" complaints.

**Variable jump height** — releasing jump early cuts upward velocity (multiply by 0.45). Tap = hop, hold = full jump. One line, huge feel.

**Asymmetric gravity** — fall faster than rise (gravity × 1.6 on the way down). Floaty up, snappy down is the platformer sweet spot.

Then level design in this order: flat ground → gaps → platforms → moving platforms → hazards. Introduce each with a freebie. Movement speed 180-260 px/s and jump height ~3 tiles are proven starting numbers.`,
  },
  {
    id: "genre-shooter",
    title: "Shooter Recipe — Waves & Bullet Patterns",
    category: "genres",
    keywords: ["shooter", "shoot", "waves", "bullet", "bullet pattern", "aim", "fire rate", "space shooter", "enemies", "projectile"],
    summary: "Wave structure, readable bullet patterns, and fire-rate feel for space shooters.",
    body: `**Waves beat chaos.** Structure as: wave intro (1s, "WAVE 3") → spawn pattern → clear check → breather (2s) → next. Every 3rd wave introduces ONE new enemy type; every 5th is a mini-boss. Players learn a vocabulary of threats instead of drowning in noise.

**Bullet patterns** from one function (aim, spread, count):
- **Aimed shot**: angle at player.
- **Fan**: aim ± spread*(i - (n-1)/2) for i in range(n) — 5 bullets, 40° fan.
- **Ring**: 360/n * i regardless of player.
- **Spiral**: ring whose base angle rotates 30°/shot — the classic hypnotic danmaku.

Readability rules: enemy bullets are the most saturated thing on screen (usually magenta/yellow), player bullets modest; max ~60 bullets on screen for casual play; bullets spawn slightly OUTSIDE the enemy sprite so the muzzle never clips.

**Fire-rate feel**: 6-8 shots/sec feels powerful; add 1-frame muzzle flash + 1px weapon recoil + tiny screen kick (0.5px) and the same rate feels twice as good. Powerups follow the 3-S rule: Shotgun (spread), Speed (rate), Shield (forgiveness).`,
  },
  {
    id: "genre-topdown",
    title: "Top-Down & Collector Recipe",
    category: "genres",
    keywords: ["top-down", "topdown", "collector", "zelda", "rpg", "coins", "items", "pickup", "overworld", "dungeon"],
    summary: "8-directional movement, pickup placement theory, and NPC/quest loops for top-down worlds.",
    body: `**Movement**: 8-directional with normalized diagonals (otherwise diagonal = 1.41x faster — the classic top-down bug):
\`\`\`python
d = Vector2(ix, iy)
if d.length() > 0: d = d.normalized
self.pos += d * self.speed * dt
\`\`\`

**Pickup placement is level design**: line pickups teach routes, arcs mark hidden paths, circles reward room centers. Never random-scatter — placement density IS the difficulty. 10 coins in open field = tutorial; 10 coins guarded by slimes = challenge.

**The collection loop** that always works: goal (10 coins) → obstacle (enemies/gaps) → reward (door opens / shop / next area) → bigger goal. Track completion % visibly — "38/40" is a finish line.

**NPCs & quests** for RPG flavor: 3 lines max per NPC; quests are fetch (item X), kill (N slimes), or reach (location). Quest state is one enum per NPC. Talk prompt = floating "!" or a bounce when the player is near — silent NPCs read as broken.

Camera: follow with lookahead; rooms transition with a 0.3s fade — instant cuts make players lose orientation.`,
  },
  {
    id: "genre-roguelike",
    title: "Roguelike Recipe",
    category: "genres",
    keywords: ["roguelike", "roguelite", "permadeath", "runs", "meta progression", "rooms", "hades", "isaac", "unlock"],
    summary: "Run structure, meaningful choice rooms, and meta-progression that makes death fun.",
    body: `Roguelikes sell one promise: **death is progress**. Structure:

**The run**: 3-5 minutes per floor, 3-5 floors per run. Every room offers a choice — fight room / treasure room / shop. Choice (even fake choice) is the entire genre: 2 doors with visible rewards beats 1 correct door.

**In-run power curve**: the player should end a run 5-10x stronger than they started. Items synergize or they're filler — "+10% damage" is boring, "bullets pierce" + "bullets ricochet" is a build.

**Meta-progression** (the death insurance): currency persists (gems), unlocks persist (new weapons/characters), skill persists (you learned the enemies). Even a 3-minute failure should buy something — a permanent +1% or a glimpse of a locked room.

**Forgiveness systems**: first floor is unlosable, health refills between floors, and cap floors so runs END (a run with no end has no drama).

Content budget: 4 enemy types × 3 behaviors × random rooms = hundreds of perceived encounters. Variance in *combination*, not in asset count.`,
  },
  {
    id: "engine-api",
    title: "Lapia Engine API Cheat Sheet",
    category: "engine",
    keywords: ["engine", "api", "lapia_shim", "game", "scene", "sprite", "vector2", "color", "renderer", "load_image", "input", "hooks", "on_load", "on_update", "on_render"],
    summary: "Every class and hook the engine offers, with copy-paste signatures.",
    body: `The full mental model — four classes, three hooks:

\`\`\`python
from lapia_shim import Game, Scene, Sprite, Vector2, Color, load_image

class MyScene(Scene):
    def on_load(self):          # setup — runs once
        self.player = Sprite(color=Color(80, 180, 240), size=(32, 32))
        self.player.position = Vector2(100, 100)
        self.coin = Sprite(image=load_image("sprites/coins/coin_gold.png"), size=(22, 22))
        self.add(self.player); self.add(self.coin)

    def on_update(self, dt):    # logic — every frame
        if self.input.key_down("left"):   self.player.position.x -= 200 * dt
        if self.input.key_pressed("space"): self.jump()
        mx, my = self.input.mouse_position

    def on_render(self, r):     # drawing — every frame
        r.fill_rect(Vector2(0, 560), Vector2(800, 40), Color(60, 60, 80))
        r.fill_circle(Vector2(400, 300), 24, Color(255, 205, 95))
        r.draw_text(Vector2(12, 10), "SCORE 120", color=Color(255,255,255), size=18)

game = Game(title="My Game", size=(800, 600), fps=60)
game.run(MyScene())
\`\`\`

Golden rules: \`import pygame\` does not exist here — lapia_shim is the same API, canvas-powered; hooks are named \`on_*\`; \`Vector2\` does the math (add, subtract, \`.normalized\`, \`.distance_to\`); sprites are added to the scene with \`self.add(...)\` or they won't draw; \`load_image\` paths come from the Toolbox.`,
  },
  {
    id: "debug-workflow",
    title: "Debugging Games Methodically",
    category: "ship",
    keywords: ["debug", "debugging", "bug", "fix", "error", "traceback", "console", "print", "broken", "not working", "crash"],
    summary: "A calm 5-step method for finding any bug, plus the engine's most common error patterns.",
    body: `When (not if) it breaks, run the method:

1. **Read the actual error.** The console's last line names the type and line. NameError = typo or missing import; TypeError = wrong type passed; AttributeError = the object doesn't have that property (did you rename it?).
2. **Reproduce on demand.** Find the exact steps. A bug you can trigger in 10 seconds is half-fixed.
3. **Bisect.** Comment out half the update logic. Still broken? The bug is in the other half. Three rounds of this finds any line.
4. **Print the state, not the vibes** — \`print(self.player.position, self.vel)\` at the top of on_update tells you more than 5 minutes of staring. Watch one variable per run.
5. **Rubber-duck it.** Explain the expected flow out loud, step by step: "sprite spawns → moves down → should bounce". The step where your explanation gets vague is the bug's home.

Engine-specific classics: missing \`game.run(MyScene())\` (window opens then nothing), \`update\` instead of \`on_update\` (scene loads but never moves), raw \`pygame.*\` calls (NameError — use lapia_shim), and \`K_LEFT\` constants (\`key_down('left')\` takes strings).`,
  },
  {
    id: "optimization",
    title: "60 FPS Optimization Budget",
    category: "ship",
    keywords: ["optimization", "performance", "fps", "lag", "slow", "frame budget", "gc", "pooling", "profiling", "stutter"],
    summary: "The 16.6ms frame budget, where it leaks, and the pool/recycle habits that keep games smooth.",
    body: `60 FPS = **16.6ms per frame**. Everything — update, collisions, drawing — must fit. The usual leaks, ranked:

1. **Creating objects every frame.** \`Sprite(...)\` inside on_update spawns garbage the GC must sweep → stutter. Create in on_load; mutate position/size instead.
2. **Loading images at runtime.** \`load_image\` in on_update re-decodes constantly. Cache it: \`self.tex = load_image(...)\` once in on_load.
3. **O(n²) collision checks.** 200 bullets × 200 enemies = 40,000 checks. Only compare pairs that can interact (player bullets vs enemies, not bullets vs bullets), or early-out by distance.
4. **Unbounded lists.** Particles/bullets without caps grow forever. Hard caps: 300 particles, 200 bullets.
5. **Heavy drawing off-screen.** Skip rendering anything outside the viewport — cheap "if x < -50 or x > 850: continue".

Profile by subtraction: set a variable to zero (particles, then enemies, then bullets) and watch FPS. Whoever you zeroed and it jumped — that's your culprit. A stable 60 with modest content beats a stuttering 120 with fancy content, every time.`,
  },
  {
    id: "playtesting",
    title: "Playtesting Like a Pro",
    category: "ship",
    keywords: ["playtest", "playtesting", "test", "players", "feedback", "watch", "iterate", "demo", "shipping", "polish pass"],
    summary: "Watch silently, count deaths, fix the first 30 seconds — the checklist that polishes games fast.",
    body: `You cannot playtest your own game fairly — you know the controls, the goals, the tricks. So:

**Watch one new player, silently.** No helping, no explaining. Where they hesitate, get lost, or die twice in a row IS your bug list — confusion is a design error, not a player error. Write down timestamps of every stumble.

**The first 30 seconds decide everything.** Player must: understand the goal, feel a control, and get one reward — before 30s. If your game needs a paragraph of text first, the design isn't self-explanatory yet.

**Instrument what you can**: count deaths per section (the spike tells you where the curve lies), time-to-first-fun, quit points.

**The polish pass checklist** before shipping: game over shows final score · restart works from every state · pause works · sounds on every key action · no silent buttons · title screen explains the game in one line · best score persists.

Ship small and often: a finished 2-minute game teaches you more than a shelved 20-minute one — and every playtest's confusion list is your next iteration's roadmap.`,
  },
];

// ---------------------------------------------------------------------------
// Retrieval — lightweight keyword scoring (no server, no embeddings)
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "do", "does", "how", "what", "why", "when", "to", "of", "in", "on", "for",
  "and", "or", "i", "my", "me", "you", "can", "should", "with", "it", "be", "best", "good", "make", "game",
  "games", "ally", "please", "tell", "about", "some", "any", "there", "that", "this", "help", "need", "want",
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export interface KnowledgeHit {
  article: KnowledgeArticle;
  score: number;
}

/** Score every article against a free-text query; return best matches. */
export function searchKnowledge(query: string, limit = 2): KnowledgeHit[] {
  const q = query.toLowerCase();
  const tokens = new Set(tokenize(query));
  const hits: KnowledgeHit[] = [];

  for (const article of GAMEDEV_KNOWLEDGE) {
    let score = 0;
    for (const kw of article.keywords) {
      if (q.includes(kw)) score += kw.includes(" ") ? 6 : 4;
      else {
        const parts = kw.split(/\s+/);
        if (parts.length > 1 && parts.every((p) => tokens.has(p))) score += 4;
      }
    }
    for (const t of tokens) {
      if (article.title.toLowerCase().includes(t)) score += 2;
      if (article.keywords.some((k) => k.includes(t))) score += 1;
      if (article.summary.toLowerCase().includes(t)) score += 1;
    }
    if (score > 0) hits.push({ article, score });
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

export const KNOWLEDGE_STATS = {
  articles: GAMEDEV_KNOWLEDGE.length,
  categories: Object.keys(KNOWLEDGE_CATEGORY_LABELS).length,
  approxWords: Math.round(
    GAMEDEV_KNOWLEDGE.reduce((n, a) => n + (a.body.length + a.summary.length) / 6, 0) / 10,
  ) * 10,
};

