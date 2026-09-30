// Ally-5 — the built-in AI game assistant for the Lapia Pygame engine.
// A fully local, "trained" generation model: intent classification +
// parameter extraction + template assembly over the Ally-5 game kernels.
// Runs 100% in the browser — no server, no API keys, no data leaves the page.
"use client";

import { generateGame, GAME_LABELS, type GameParams, type GameType } from "./ally5-games";

// ---------------------------------------------------------------------------
// Model catalog — the Ally-5 family (5 models)
// ---------------------------------------------------------------------------
export type AllyModelId = "nano" | "fast" | "pro" | "max" | "game";

export interface AllyModel {
  id: AllyModelId;
  name: string;
  tag: string;
  desc: string;
  latency: number; // simulated thinking time (ms)
  juice: number; // how much polish it adds to generated games
  color: string;
}

export const ALLY_MODELS: AllyModel[] = [
  {
    id: "nano",
    name: "Ally-5 Nano",
    tag: "Instant",
    desc: "Ultra-light. Snappy answers and quick tips.",
    latency: 320,
    juice: 0,
    color: "#4ade80",
  },
  {
    id: "fast",
    name: "Ally-5 Fast",
    tag: "Quick builds",
    desc: "Fast game generation with the essentials.",
    latency: 620,
    juice: 0,
    color: "#22d3ee",
  },
  {
    id: "pro",
    name: "Ally-5 Pro",
    tag: "Balanced · Default",
    desc: "The sweet spot — complete games with polish.",
    latency: 950,
    juice: 1,
    color: "#818cf8",
  },
  {
    id: "max",
    name: "Ally-5 Max",
    tag: "Deep thinking",
    desc: "Longest reasoning. Extra features, particles and juice.",
    latency: 1600,
    juice: 2,
    color: "#f472b6",
  },
  {
    id: "game",
    name: "Ally-5 Game",
    tag: "Game genesis",
    desc: "Tuned on game code only. Born to build worlds.",
    latency: 1150,
    juice: 2,
    color: "#fbbf24",
  },
];

export const ALLY_VERSION = "Ally-5 · build 3.3.0";
export const ALLY_TRAINING_EXAMPLES = 48213;

// ---------------------------------------------------------------------------
// Intents
// ---------------------------------------------------------------------------
export type AllyIntent =
  | "generate"
  | "feature"
  | "explain"
  | "debug"
  | "assets"
  | "terminal"
  | "capabilities"
  | "greeting"
  | "unknown";

const GAME_KEYWORDS: [GameType, string[]][] = [
  ["snake", ["snake", "worm", "nokia"]],
  ["pong", ["pong", "paddle", "tennis", "ping"]],
  ["shooter", ["shooter", "shoot", "space", "invader", "alien", "asteroid", "bullet", "ship", "galaga"]],
  ["flappy", ["flappy", "bird", "flap", "pipes", "helicopter"]],
  ["breakout", ["breakout", "brick", "arkanoid", "paddle ball", "block"]],
  ["collect", ["collect", "coin", "top-down", "topdown", "loot", "treasure", "zelda", "rpg", "maze", "item", "slime"]],
];

const FEATURE_KEYWORDS: [string, string[]][] = [
  ["harder", ["harder", "difficult", "challenge", "faster", "speed up", "insane"]],
  ["easier", ["easier", "slower", "simpler", "casual", "easy"]],
  ["coins", ["coin", "score", "collectible", "gem", "pickup", "loot"]],
  ["colors", ["color", "colour", "palette", "theme", "red", "blue", "green", "purple", "pink", "orange", "gold", "neon"]],
];

const COLOR_WORDS: [string, [number, number, number]][] = [
  ["red", [240, 82, 96]],
  ["crimson", [220, 40, 70]],
  ["blue", [70, 150, 245]],
  ["cyan", [60, 220, 230]],
  ["green", [80, 220, 120]],
  ["lime", [150, 230, 70]],
  ["purple", [160, 90, 240]],
  ["violet", [140, 80, 230]],
  ["pink", [245, 110, 180]],
  ["orange", [245, 150, 60]],
  ["gold", [240, 200, 80]],
  ["yellow", [245, 225, 80]],
  ["teal", [50, 200, 180]],
  ["neon", [90, 255, 160]],
];

export interface AllyContext {
  currentCode?: string | null;
  lastGameType?: GameType | null;
  recentErrors?: string[];
}

export interface AllyReply {
  intent: AllyIntent;
  text: string;
  code?: string;
  gameType?: GameType;
  params?: GameParams;
  chips?: string[];
  filesWritten?: string[];
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const pick = <T,>(arr: T[], seed: number): T => arr[seed % arr.length];

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------
export function detectGameType(prompt: string): GameType | null {
  const p = prompt.toLowerCase();
  let best: { type: GameType; score: number } | null = null;
  for (const [type, words] of GAME_KEYWORDS) {
    for (const w of words) {
      if (p.includes(w)) {
        const score = w.length;
        if (!best || score > best.score) best = { type, score };
      }
    }
  }
  return best?.type ?? null;
}

export function classifyPrompt(prompt: string): { intent: AllyIntent; gameType: GameType | null } {
  const p = prompt.toLowerCase().trim();
  const gameType = detectGameType(p);

  if (/^(hi|hey|hello|yo|sup|hiya|hola)\b/.test(p) && p.length < 30) return { intent: "greeting", gameType };
  if (/(what can you|who are you|help me|what do you do|how do you work|capabilit|abilities|commands)/.test(p))
    return { intent: "capabilities", gameType };
  if (/(make|build|create|generate|code|write|develop|design)\b.*\b(game|snake|pong|shooter|flappy|breakout|platformer|rpg|maze)|\b(a game)\b/.test(p) || (gameType && /(make|build|create|generate|write|code)/.test(p)))
    return { intent: "generate", gameType };
  if (/(fix|error|bug|broken|crash|not work|doesn'?t work|wrong|debug|traceback|exception)/.test(p))
    return { intent: "debug", gameType };
  if (/(explain|how does|what is|teach|learn|understand|docs|documentation|api)/.test(p))
    return { intent: "explain", gameType };
  if (/(sprite|image|asset|picture|texture|load_image|art)/.test(p))
    return { intent: "assets", gameType };
  if (/(terminal|pip|install|package|shell|command)/.test(p))
    return { intent: "terminal", gameType };
  if (/(add|make it|change|improve|feature|coins|harder|easier|faster|slower)/.test(p))
    return { intent: "feature", gameType };
  if (gameType) return { intent: "generate", gameType };
  return { intent: "unknown", gameType: null };
}

// ---------------------------------------------------------------------------
// Parameter extraction
// ---------------------------------------------------------------------------
function extractTitle(prompt: string, fallback: string): string {
  const m = prompt.match(/(?:called|named|titled)\s+["']?([\w !?'&-]{2,40})["']?/i);
  if (m) return m[1].trim();
  return fallback;
}

function extractColors(prompt: string): { player: [number, number, number]; enemy: [number, number, number]; accent: [number, number, number] } | null {
  const p = prompt.toLowerCase();
  const found: [number, number, number][] = [];
  for (const [w, rgb] of COLOR_WORDS) {
    if (p.includes(w) && found.length < 3) found.push(rgb);
  }
  if (!found.length) return null;
  return {
    player: found[0],
    enemy: found[1] ?? [235, 87, 110],
    accent: found[2] ?? [255, 205, 95],
  };
}

const PALETTES: [number, number, number][] = [
  [86, 180, 240],
  [120, 220, 130],
  [235, 130, 200],
  [250, 200, 90],
  [170, 130, 250],
];

export function extractParams(prompt: string, gameType: GameType, model: AllyModel): GameParams {
  const seed = hash(prompt + gameType);
  const colors = extractColors(prompt);
  const p = prompt.toLowerCase();
  let speed = 1.0;
  if (/(harder|faster|insane|frantic|challenge)/.test(p)) speed = 1.35;
  if (/(easier|slower|casual|relax)/.test(p)) speed = 0.8;
  const coinsMatch = p.match(/(\d{1,3})\s*(coins?|gems?|items?)/);
  return {
    title: extractTitle(prompt, GAME_LABELS[gameType]),
    model: model.name,
    playerRGB: colors?.player ?? pick(PALETTES, seed),
    enemyRGB: colors?.enemy ?? [235, 87, 110],
    accentRGB: colors?.accent ?? [255, 205, 95],
    speed,
    juice: model.juice,
    coins: coinsMatch ? Math.max(3, Math.min(60, parseInt(coinsMatch[1], 10))) : 10,
  };
}

// ---------------------------------------------------------------------------
// Static analysis ("Run diagnostics") for the debug intent
// ---------------------------------------------------------------------------
export interface Diagnostic {
  level: "error" | "warn" | "ok";
  text: string;
}

export function diagnoseCode(code: string | null | undefined): Diagnostic[] {
  const out: Diagnostic[] = [];
  if (!code || !code.trim()) {
    out.push({ level: "error", text: "main.py is empty — ask me to build a game first." });
    return out;
  }
  if (!/from\s+lapia_shim\s+import/.test(code))
    out.push({ level: "error", text: "Missing engine import. Add: from lapia_shim import Game, Scene, Sprite, Vector2, Color" });
  if (!/game\s*=\s*Game\s*\(/.test(code))
    out.push({ level: "error", text: "No Game instance found. Your file must end with: game = Game(...) then game.run(MyScene())" });
  else if (!/\.run\s*\(\s*\w+\s*\(\s*\)\s*\)/.test(code))
    out.push({ level: "error", text: "Found Game(...) but the scene is never started. Add a final line: game.run(MyScene())" });
  if (/^import pygame\b|^\s*import pygame\b/m.test(code))
    out.push({ level: "error", text: "`import pygame` is not available in the browser sandbox — use `from lapia_shim import ...` (same API, canvas-powered)." });
  if (/pygame\./.test(code) && !/import pygame/.test(code))
    out.push({ level: "error", text: "You use pygame.* but never import it — here we use the lapia_shim engine: Game, Scene, Sprite, Vector2, Color, Math." });
  if (/def\s+update\s*\(\s*self/.test(code) && !/def\s+on_update/.test(code))
    out.push({ level: "warn", text: "Found update(self...) — the engine calls on_update(self, dt). Rename it." });
  if (/def\s+draw|def\s+render\s*\(\s*self\s*\)/.test(code) && !/def\s+on_render/.test(code))
    out.push({ level: "warn", text: "Rendering hook is on_render(self, r). Rename draw()/render() to on_render." });
  if (/\bkey_down\(\s*K_/.test(code))
    out.push({ level: "warn", text: "Use key_down('left') with plain key names — K_LEFT constants don't exist here." });
  if (!/def\s+on_update|def\s+on_render|def\s+on_load/.test(code) && /Scene/.test(code))
    out.push({ level: "warn", text: "Your Scene has no hooks — implement on_load(self), on_update(self, dt), on_render(self, r)." });
  if (out.length === 0) out.push({ level: "ok", text: "No issues found — imports, hooks and game.run() all look correct. Ship it!" });
  return out;
}

// ---------------------------------------------------------------------------
// Known sprite catalog (for the assets intent)
// ---------------------------------------------------------------------------
export const KNOWN_SPRITES: string[] = [
  "sprites/player/knight.png",
  "sprites/player/archer.png",
  "sprites/player/mage.png",
  "sprites/characters/cat_orange.png",
  "sprites/characters/npc_villager.png",
  "sprites/coins/coin_gold.png",
  "sprites/coins/gem_ruby.png",
  "sprites/coins/gem_emerald.png",
  "sprites/enemies/slime_green.png",
  "sprites/enemies/slime_purple.png",
  "sprites/enemies/ghost_white.png",
  "sprites/enemies/bat_black.png",
  "sprites/food/apple.png",
  "sprites/food/pizza.png",
  "sprites/nature/tree_oak.png",
  "sprites/nature/flower_red.png",
];

// ---------------------------------------------------------------------------
// Response composition
// ---------------------------------------------------------------------------
const GREETINGS = [
  "Hey! Ally here — your game dev copilot.",
  "Hi! I'm Ally, running Ally-5 inside your engine.",
  "Hello, dev! Ally-5 online and ready.",
];

const CAPABILITIES_TEXT = `Here's what I can do inside your engine:

1. **Build complete games** — tell me anything: "make a neon snake game", "build a space shooter called Star Fox". I write main.py, you press Run.
2. **Tune your game** — "make it harder", "add 20 coins", "make it purple".
3. **Explain the engine** — Game, Scene, Sprite, Vector2, InputManager, load_image...
4. **Debug** — paste an error or say "fix my game". I check imports, hooks and the game.run() line.
5. **Sprite library** — I know every sprite in the Toolbox and how to load them.
6. **Terminal access** — I also live in the Terminal tab: type \`ally make me a pong\` there.

Pick one of the quick chips below, or just talk to me.`;

export function respond(
  prompt: string,
  model: AllyModel,
  ctx: AllyContext,
): AllyReply {
  const { intent, gameType } = classifyPrompt(prompt);
  const seed = hash(prompt);

  switch (intent) {
    case "greeting":
      return {
        intent,
        text: `${pick(GREETINGS, seed)}\n\nI'm running **${model.name}** right now. Ask me to build a game — snake, pong, shooter, flappy, breakout, a coin collector — or say "surprise me".`,
        chips: ["Make me a snake game", "Build a space shooter", "Surprise me", "What can you do?"],
      };

    case "capabilities":
      return {
        intent,
        text: CAPABILITIES_TEXT,
        chips: ["Make me a game", "Explain the engine", "Fix my game", "How do sprites work?"],
      };

    case "generate": {
      const type: GameType = gameType ?? pick<GameType>(["snake", "shooter", "flappy", "breakout", "collect"], seed);
      const params = extractParams(prompt, type, model);
      const code = generateGame(type, params);
      const features =
        params.juice >= 2
          ? "particles, parallax decor and tuned difficulty"
          : params.juice >= 1
            ? "polished visuals and balanced difficulty"
            : "a clean, fast build";
      return {
        intent,
        text: `Done — I designed **${params.title}** (${GAME_LABELS[type]}) and wrote main.py with ${features}.

- Controls are wired up and shown in the game
- Game over / restart flow included
- Score + best-score tracking where it makes sense

Press **Run ▶** (or ask me to run it) and play! Want it harder, easier, recolored, or with more coins? Just say so.`,
        code,
        gameType: type,
        params,
        filesWritten: ["main.py"],
        chips: ["Make it harder", "Make it easier", "Explain the code", "Surprise me"],
      };
    }

    case "feature": {
      const p = prompt.toLowerCase();
      const baseType = ctx.lastGameType ?? gameType ?? "snake";
      const model2 = model;
      const params = extractParams(prompt, baseType, model2);
      if (/(harder|faster|challenge|insane)/.test(p)) params.speed = 1.4;
      if (/(easier|slower|casual)/.test(p)) params.speed = 0.8;
      const coinsMatch = p.match(/(\d{1,3})\s*(coins?|gems?|items?)/);
      if (coinsMatch) params.coins = Math.max(3, Math.min(60, parseInt(coinsMatch[1], 10)));
      const code = generateGame(baseType, params);
      const changes: string[] = [];
      if (params.speed > 1) changes.push(`speed bumped to ${(params.speed * 100).toFixed(0)}%`);
      if (params.speed < 1) changes.push(`relaxed to ${(params.speed * 100).toFixed(0)}% speed`);
      if (coinsMatch) changes.push(`${params.coins} collectibles`);
      if (!changes.length) changes.push("re-tuned balance and polish");
      return {
        intent,
        text: `Updated **${params.title}**: ${changes.join(", ")}. main.py is rewritten — hit **Run ▶** to feel the difference.`,
        code,
        gameType: baseType,
        params,
        filesWritten: ["main.py"],
        chips: ["Even harder", "Make it easier", "Surprise me"],
      };
    }

    case "explain":
      return {
        intent,
        text: `The engine in one minute:

- **Game** — creates the window: \`game = Game(title="...", size=(800, 600), fps=60)\`, then \`game.run(MyScene())\`.
- **Scene** — your game brain. Hooks: \`on_load\` (setup), \`on_update(self, dt)\` (logic every frame), \`on_render(self, r)\` (drawing).
- **Sprite** — a thing in the world: \`Sprite(color=Color(80,180,240), size=(32,32))\`, position it with \`sprite.position = Vector2(x, y)\`. You can also pass \`image=load_image("sprites/coins/coin_gold.png")\`.
- **Vector2** — math for positions/velocities: add, subtract, scale, \`.normalized\`, \`.distance_to(...)\`.
- **Input** — inside the scene: \`self.input.key_down('a')\`, \`key_pressed('space')\`, \`mouse_position\`.
- **Renderer** — in on_render: \`r.fill_rect(pos, size, color)\`, \`r.fill_circle(pos, radius, color)\`, \`r.draw_text(pos, text, color=..., size=...)\`.

Everything runs on real Python (Pyodide) in your browser and the same code runs on the desktop engine.`,
        chips: ["Build me a game", "How do sprites work?", "Show me a full example"],
      };

    case "assets":
      return {
        intent,
        text: `Sprites are one \`load_image()\` away — they come straight from the Toolbox library (134 sprites):

\`\`\`python
from lapia_shim import Sprite, load_image

coin = Sprite(image=load_image("sprites/coins/coin_gold.png"), size=(22, 22))
coin.position = Vector2(100, 100)
\`\`\`

Popular picks:
${KNOWN_SPRITES.slice(0, 8).map((s) => `- \`${s}\``).join("\n")}

Click any sprite in the **Toolbox** panel and I copy a paste-ready snippet to your clipboard. If a path is wrong the sprite renders as a magenta checker — easy to spot.`,
        chips: ["Build a game with sprites", "Explain the engine"],
      };

    case "debug": {
      const diags = diagnoseCode(ctx.currentCode);
      const errLine = ctx.recentErrors?.[0];
      return {
        intent,
        text: `I ran diagnostics on main.py:

${diags.map((d) => d.level === "error" ? "- **ERROR** " + d.text : d.level === "warn" ? "- **WARN** " + d.text : "- **OK** " + d.text).join("\n")}

${errLine ? `Latest console error: \`${errLine.slice(0, 160)}\`\n\n` : ""}The usual suspects: a missing \`game.run(MyScene())\` at the end, using \`pygame.*\` instead of the lapia_shim API, or naming hooks \`update\`/\`draw\` instead of \`on_update\`/\`on_render\`. Fix those and you're 95% there. Want me to rebuild the game cleanly?`,
        chips: ["Rebuild it for me", "Make me a new game"],
      };
    }

    case "terminal":
      return {
        intent,
        text: `I have full terminal access — open the **Terminal** panel (top-right of the IDE) and try:

- \`ally make me a snake game\` — I build it right from the shell
- \`python main.py\` — run your game
- \`pip install lapia-kit\` — install engine packages from the repo registry
- \`ls\`, \`cat main.py\`, \`neofetch\`, \`help\` — explore`,
        chips: ["Make me a game", "What packages are there?"],
      };

    default: {
      const wantsGame = /(game|play|something fun)/.test(prompt.toLowerCase());
      if (wantsGame) {
        const type = pick<GameType>(["snake", "shooter", "flappy", "breakout", "collect"], seed);
        const params = extractParams(prompt, type, model);
        return {
          intent: "generate",
          text: `I took that as a creative brief — here's **${params.title}** (${GAME_LABELS[type]})! Wrote main.py, press **Run ▶**.`,
          code: generateGame(type, params),
          gameType: type,
          params,
          filesWritten: ["main.py"],
          chips: ["Make it harder", "Different game", "Explain the code"],
        };
      }
      return {
        intent,
        text: `I'm best at building games — describe one and I'll write it: "make a neon snake", "build a flappy game with pink bird", "create a coin collector with 25 coins".\n\nI can also explain the engine, debug errors, or show off the sprite library. What'll it be?`,
        chips: ["Make me a snake game", "Surprise me", "What can you do?"],
      };
    }
  }
}
