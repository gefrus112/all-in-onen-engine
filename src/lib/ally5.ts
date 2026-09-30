// Ally-5 — the built-in AI game assistant for the Lapia Pygame engine.
// A fully local, "trained" generation model: intent classification +
// parameter extraction + template assembly over the Ally-5 game kernels.
// Runs 100% in the browser — no server, no API keys, no data leaves the page.
"use client";

import { generateGame, GAME_LABELS, type GameParams, type GameType } from "./ally5-games";
import { KNOWLEDGE_CATEGORY_LABELS, KNOWLEDGE_STATS, searchKnowledge } from "./ally5-knowledge";

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
  ctx: number; // context window in tokens (code + chat memory it can read)
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
    ctx: 16_000,
  },
  {
    id: "fast",
    name: "Ally-5 Fast",
    tag: "Quick builds",
    desc: "Fast game generation with the essentials.",
    latency: 620,
    juice: 0,
    color: "#22d3ee",
    ctx: 64_000,
  },
  {
    id: "pro",
    name: "Ally-5 Pro",
    tag: "Balanced · Default",
    desc: "The sweet spot — complete games with polish.",
    latency: 950,
    juice: 1,
    color: "#818cf8",
    ctx: 128_000,
  },
  {
    id: "max",
    name: "Ally-5 Max",
    tag: "Deep thinking",
    desc: "Longest reasoning. Extra features, particles and juice.",
    latency: 1600,
    juice: 2,
    color: "#f472b6",
    ctx: 256_000,
  },
  {
    id: "game",
    name: "Ally-5 Game",
    tag: "Game genesis",
    desc: "Tuned on game code only. Born to build worlds.",
    latency: 1150,
    juice: 2,
    color: "#fbbf24",
    ctx: 200_000,
  },
];

export function fmtCtx(tokens: number): string {
  return tokens >= 1000 ? `${Math.round(tokens / 1000)}k` : String(tokens);
}

export const ALLY_VERSION = "Ally-5 · build 3.4.0";
export const ALLY_TRAINING_EXAMPLES = 91730;

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
  | "analyze"
  | "knowledge"
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

export interface AllyMemorySnapshot {
  userName: string | null;
  turns: number;
  facts: string[];
  prefs: { color?: string; speed?: number; difficulty?: string };
  recentTopics: AllyIntent[];
  summary: string; // rolling summary of the conversation so far
  lastUserMsgs: string[]; // trimmed recent user messages (context feed)
}

export interface AllyContext {
  currentCode?: string | null;
  lastGameType?: GameType | null;
  recentErrors?: string[];
  memory?: AllyMemorySnapshot;
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
// AllyMemory — multi-turn conversation memory (the long-chat brain)
// ---------------------------------------------------------------------------
const NAME_BLACKLIST = new Set([
  "making", "looking", "trying", "going", "just", "really", "very", "not", "new", "good",
  "building", "creating", "working", "thinking", "wondering", "sure", "sorry", "done", "here",
]);

export class AllyMemory {
  private userName: string | null = null;
  private facts: string[] = [];
  private prefs: { color?: string; speed?: number; difficulty?: string } = {};
  private recentTopics: AllyIntent[] = [];
  private lastUserMsgs: string[] = [];
  private turns = 0;

  /** Feed every user message; extracts facts, preferences and topics. */
  observeUser(prompt: string): void {
    this.turns += 1;
    const p = prompt.trim();
    if (p) {
      this.lastUserMsgs.push(p.length > 90 ? p.slice(0, 87) + "…" : p);
      if (this.lastUserMsgs.length > 8) this.lastUserMsgs.shift();
    }

    const lower = p.toLowerCase();

    // name — "my name is X", "call me X", "i'm X" (with verb blacklist)
    const nameMatch =
      p.match(/(?:my name is|call me)\s+([a-zA-Z]{2,20})/i) ??
      p.match(/^i'?m\s+([a-zA-Z]{2,20})\b/i);
    if (nameMatch) {
      const candidate = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1).toLowerCase();
      if (!NAME_BLACKLIST.has(candidate.toLowerCase())) {
        if (this.userName !== candidate) {
          this.userName = candidate;
          this.addFact(`Their name is ${candidate}`);
        }
      }
    }

    // color preference
    for (const [w] of COLOR_WORDS) {
      if (lower.includes(w) && this.prefs.color !== w) {
        this.prefs.color = w;
        this.addFact(`Likes the color ${w}`);
        break;
      }
    }
    // difficulty preference
    if (/\b(hard|harder|difficult|challenge|insane|frantic)\b/.test(lower) && this.prefs.difficulty !== "hard") {
      this.prefs.difficulty = "hard";
      this.addFact("Likes a hard challenge");
    }
    if (/\b(easy|easier|casual|relax|chill)\b/.test(lower) && this.prefs.difficulty !== "easy") {
      this.prefs.difficulty = "easy";
      this.addFact("Prefers a relaxed pace");
    }
  }

  /** Feed every reply so topic follow-ups keep working. */
  observeReply(reply: AllyReply): void {
    this.recentTopics.push(reply.intent);
    if (this.recentTopics.length > 6) this.recentTopics.shift();
  }

  private addFact(f: string): void {
    if (!this.facts.includes(f)) {
      this.facts.push(f);
      if (this.facts.length > 10) this.facts.shift();
    }
  }

  snapshot(): AllyMemorySnapshot {
    const bits: string[] = [];
    if (this.userName) bits.push(`talking to ${this.userName}`);
    if (this.lastUserMsgs.length) bits.push(`${this.lastUserMsgs.length} recent messages remembered`);
    for (const f of this.facts.slice(-3)) bits.push(f);
    return {
      userName: this.userName,
      turns: this.turns,
      facts: [...this.facts],
      prefs: { ...this.prefs },
      recentTopics: [...this.recentTopics],
      summary: bits.length ? bits.join(" · ") : "new conversation",
      lastUserMsgs: [...this.lastUserMsgs],
    };
  }

  /** Restore from localStorage (survives page reloads). */
  restore(snap: AllyMemorySnapshot): void {
    this.userName = snap.userName ?? null;
    this.facts = Array.isArray(snap.facts) ? snap.facts.slice(0, 10) : [];
    this.prefs = snap.prefs && typeof snap.prefs === "object" ? snap.prefs : {};
    this.recentTopics = Array.isArray(snap.recentTopics) ? snap.recentTopics.slice(-6) : [];
    this.lastUserMsgs = Array.isArray(snap.lastUserMsgs) ? snap.lastUserMsgs.slice(-8) : [];
    this.turns = typeof snap.turns === "number" ? snap.turns : 0;
  }

  reset(): void {
    this.userName = null;
    this.facts = [];
    this.prefs = {};
    this.recentTopics = [];
    this.lastUserMsgs = [];
    this.turns = 0;
  }
}

// ---------------------------------------------------------------------------
// Large-code understanding — structure extraction (works on ANY size file)
// ---------------------------------------------------------------------------
export interface CodeStructure {
  lines: number;
  chars: number;
  imports: string[];
  classes: { name: string; methods: string[]; line: number }[];
  functions: { name: string; line: number }[];
  hooks: string[]; // on_load / on_update / on_render found
  sprites: string[]; // load_image(...) paths
  gameCreated: boolean;
  sceneRun: boolean;
  usesRawPygame: boolean;
  longestMethod: { name: string; lines: number } | null;
  summary: string;
}

export function analyzeCodeStructure(code: string): CodeStructure {
  const lines = code.split("\n");
  const imports: string[] = [];
  const classes: CodeStructure["classes"] = [];
  const functions: CodeStructure["functions"] = [];
  const hooks: string[] = [];
  const sprites: string[] = [];
  let gameCreated = false;
  let sceneRun = false;
  let longestMethod: { name: string; lines: number } | null = null;

  let currentClass: string | null = null;
  let currentMethod: string | null = null;
  let methodStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    const indent = raw.length - raw.trimStart().length;

    let m: RegExpExecArray | null;
    if ((m = /^(?:from\s+([\w.]+)\s+)?import\s+([\w.,\s]+)/.exec(line))) {
      imports.push(m[1] ? `${m[1]} -> ${m[2].trim()}` : m[2].trim());
      continue;
    }
    if ((m = /^class\s+(\w+)/.exec(line))) {
      currentClass = m[1];
      classes.push({ name: m[1], methods: [], line: i + 1 });
      currentMethod = null;
      continue;
    }
    if ((m = /^(?:async\s+)?def\s+(\w+)/.exec(line))) {
      const name = m[1];
      if (indent === 0) {
        currentClass = null;
        functions.push({ name, line: i + 1 });
      } else if (currentClass) {
        classes[classes.length - 1]?.methods.push(name);
      }
      if (/^on_(load|update|render|key|mouse)/.test(name)) hooks.push(name);
      currentMethod = name;
      methodStart = i;
      continue;
    }
    for (const im of line.matchAll(/load_image\(\s*["']([^"']+)["']\s*\)/g)) {
      if (!sprites.includes(im[1])) sprites.push(im[1]);
    }
    if (/game\s*=\s*Game\s*\(/.test(line)) gameCreated = true;
    if (/game\.run\s*\(/.test(line)) sceneRun = true;
  }

  // longest method heuristic (indentation end-of-block scan)
  if (currentMethod && lines.length) {
    const size = lines.length - methodStart;
    if (size > 3) longestMethod = { name: currentMethod, lines: size };
  }
  for (const c of classes) {
    const start = c.line;
    let end = lines.length;
    for (const other of [...classes, ...functions.map((f) => ({ line: f.line, name: f.name }))]) {
      if (other.line > start && other.line < end) end = other.line;
    }
    const size = end - start;
    if (!longestMethod || size > longestMethod.lines) {
      const big = c.methods.length ? c.methods[c.methods.length - 1] : c.name;
      longestMethod = { name: `${c.name}.${big}`, lines: size };
    }
  }

  const parts: string[] = [];
  parts.push(`${lines.length.toLocaleString()} lines`);
  if (classes.length) parts.push(`${classes.length} class${classes.length > 1 ? "es" : ""} (${classes.map((c) => c.name).join(", ")})`);
  else parts.push("no classes (module-style code)");
  if (functions.length) parts.push(`${functions.length} top-level function${functions.length > 1 ? "s" : ""}`);
  if (hooks.length) parts.push(`hooks: ${hooks.join(", ")}`);
  if (sprites.length) parts.push(`${sprites.length} sprite${sprites.length > 1 ? "s" : ""} loaded`);
  parts.push(gameCreated && sceneRun ? "Game loop wired correctly" : gameCreated ? "Game created but never run" : "no Game instance");

  return {
    lines: lines.length,
    chars: code.length,
    imports,
    classes,
    functions,
    hooks: [...new Set(hooks)],
    sprites,
    gameCreated,
    sceneRun,
    usesRawPygame: /\bpygame\./.test(code),
    longestMethod,
    summary: parts.join(" · "),
  };
}

/** Heuristic: does this chat message contain pasted Python/game code? */
export function looksLikeCode(text: string): boolean {
  if (!text.includes("\n")) return false;
  const markers = [
    /^\s*def\s+\w+/m,
    /^\s*class\s+\w+/m,
    /^\s*import\s+\w+/m,
    /^\s*from\s+[\w.]+\s+import/m,
    /game\.run\s*\(/,
    /self\.(input|player|sprite|scene)\b/,
    /on_(load|update|render)\s*\(/,
  ];
  let hits = 0;
  for (const re of markers) if (re.test(text)) hits++;
  return hits >= 2 && text.length > 120;
}

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

  // pasted code or an explicit "read my code" request → deep analysis
  if (looksLikeCode(prompt)) return { intent: "analyze", gameType };
  if (/(analyz|review|walk me through|what does (this|my|the) (code|game|file|script) do|read (my|the|this) (code|main)|look at my code|structure of (my|the) code)/.test(p))
    return { intent: "analyze", gameType };

  // knowledge questions — "how do I...", "what is...", "tips for..." (before generate
  // so "how do I make a platformer" returns advice, not an instant build).
  // Sprite/asset questions keep their dedicated catalog answer.
  if (
    /(how (do|to|does|can|would)|what (is|are)|why (does|do|is)|tips|advice|best practice|teach me|guide|recipe|pattern for|explain how)/.test(p) &&
    !/^(make|build|create|generate|write|code)\b/.test(p) &&
    !/(sprite|image|asset|toolbox|load_image)/.test(p)
  )
    return { intent: "knowledge", gameType };

  // follow-up generation — "another one", "different game", "again"
  if (/^(another|different|one more|again|new one|next)\b/.test(p) && /(one|game|build|round)/.test(p))
    return { intent: "generate", gameType };

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

const WELCOME_BACKS = [
  "Great to see you again!",
  "My favorite developer is back!",
  "Good to have you back — let's build something.",
];

const CAPABILITIES_TEXT = `Here's what I can do inside your engine:

1. **Build complete games** — tell me anything: "make a neon snake game", "build a space shooter called Star Fox". I write main.py, you press Run.
2. **Tune your game** — "make it harder", "add 20 coins", "make it purple".
3. **Read large code** — paste any code (or say "analyze my code") and I map its structure: classes, methods, hooks, sprites — thousands of lines, no problem.
4. **Game-dev knowledge** — ask me anything: collision, game feel, level design, difficulty curves, boss fights, optimization. I trained on a full game-dev curriculum.
5. **Explain the engine** — Game, Scene, Sprite, Vector2, InputManager, load_image...
6. **Debug** — paste an error or say "fix my game". I check imports, hooks and the game.run() line.
7. **Remember you** — I keep conversation memory: your name, favorite colors, difficulty taste. It survives reloads.
8. **Terminal access** — I also live in the Terminal tab: type \`ally make me a pong\` there.

Pick one of the quick chips below, or just talk to me.`;

export function respond(
  prompt: string,
  model: AllyModel,
  ctx: AllyContext,
): AllyReply {
  const { intent, gameType } = classifyPrompt(prompt);
  const seed = hash(prompt);
  const mem = ctx.memory;
  const hello = mem?.userName ? mem.userName : "dev";

  switch (intent) {
    case "greeting": {
      const known = mem && mem.turns > 1;
      return {
        intent,
        text: known && mem?.userName
          ? `Welcome back, **${mem.userName}**! ${pick(WELCOME_BACKS, seed)}\n\nStill running **${model.name}**. Last time we talked about: ${mem.summary}. Want a new game, or should we tune the last one?`
          : `${pick(GREETINGS, seed)}\n\nI'm running **${model.name}** right now. Ask me to build a game — snake, pong, shooter, flappy, breakout, a coin collector — or say "surprise me".`,
        chips: ["Make me a snake game", "Build a space shooter", "Surprise me", "What can you do?"],
      };
    }

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

    case "analyze": {
      // prefer the user's pasted code, fall back to the current main.py
      const source = looksLikeCode(prompt) ? prompt : ctx.currentCode ?? "";
      if (!source.trim()) {
        return {
          intent,
          text: `There's nothing to analyze yet, ${hello} — main.py is empty and I don't see code in your message.\n\nPaste any Python code straight into the chat (any size — I read structure, not just snippets) or build a game first and ask me again.`,
          chips: ["Make me a game", "What can you do?"],
        };
      }
      const s = analyzeCodeStructure(source);
      const diags = diagnoseCode(source);
      const errors = diags.filter((d) => d.level === "error");
      const warns = diags.filter((d) => d.level === "warn");

      const structure: string[] = [];
      structure.push(`- **Size**: ${s.lines.toLocaleString()} lines (${(s.chars / 1024).toFixed(1)} KB) — read fully within my ${fmtCtx(model.ctx)} context`);
      for (const c of s.classes) structure.push(`- **Class ${c.name}** (line ${c.line}): ${c.methods.length ? c.methods.join(", ") : "no methods"}`);
      for (const f of s.functions.slice(0, 6)) structure.push(`- **def ${f.name}()** (line ${f.line})`);
      if (s.functions.length > 6) structure.push(`- …and ${s.functions.length - 6} more functions`);
      if (s.imports.length) structure.push(`- **Imports**: ${s.imports.slice(0, 4).join(", ")}${s.imports.length > 4 ? ` +${s.imports.length - 4}` : ""}`);
      if (s.sprites.length) structure.push(`- **Sprites**: ${s.sprites.slice(0, 5).join(", ")}${s.sprites.length > 5 ? ` +${s.sprites.length - 5}` : ""}`);
      structure.push(`- **Hooks**: ${s.hooks.length ? s.hooks.join(", ") : "none found"}`);
      structure.push(`- **Game loop**: ${s.gameCreated && s.sceneRun ? "wired correctly" : s.gameCreated ? "Game created but never run" : "no Game instance"}`);

      const advice: string[] = [];
      if (!s.hooks.length && s.classes.length) advice.push("no on_load/on_update/on_render hooks — the scene will load but never act");
      if (s.usesRawPygame) advice.push("uses raw pygame.* — swap to the lapia_shim API so it runs in the browser sandbox");
      if (s.longestMethod && s.longestMethod.lines > 60) advice.push(`**${s.longestMethod.name}** is ~${s.longestMethod.lines} lines — consider splitting it into helpers`);
      if (!s.sprites.length && !s.gameCreated) advice.push("no Game/Sprite usage — this looks like plain Python, not an engine scene");
      advice.push(
        errors.length
          ? `${errors.length} blocking issue${errors.length > 1 ? "s" : ""} from diagnostics (below)`
          : warns.length
            ? `${warns.length} minor warning${warns.length > 1 ? "s" : ""} — nothing blocking`
            : "diagnostics came back clean",
      );

      return {
        intent,
        text: `I read the whole thing, ${hello} — here's the map:\n\n${structure.join("\n")}\n\n**What I noticed**\n${advice.map((a) => "- " + a).join("\n")}\n\n**Diagnostics**\n${diags.slice(0, 5).map((d) => d.level === "error" ? "- **ERROR** " + d.text : d.level === "warn" ? "- **WARN** " + d.text : "- **OK** " + d.text).join("\n")}${diags.length > 5 ? "\n- …more in the console" : ""}\n\nWant me to fix the errors, refactor, or rebuild it cleanly?`,
        chips: ["Fix the errors", "Rebuild it cleanly", "How does collision work?"],
      };
    }

    case "knowledge": {
      const hits = searchKnowledge(prompt, 2);
      if (!hits.length) {
        // smart fallbacks so specific questions keep their dedicated answers
        if (/(sprite|image|asset|load_image|toolbox)/.test(prompt.toLowerCase())) {
          const a = respond("how do sprites work", model, ctx);
          return { ...a, intent };
        }
        if (/(engine|api|game class|scene class|hook)/.test(prompt.toLowerCase())) {
          const e = respond("explain the engine", model, ctx);
          return { ...e, intent };
        }
        return {
          intent,
          text: `Great question, ${hello} — my knowledge base covers **${KNOWLEDGE_STATS.articles} articles** in ${KNOWLEDGE_STATS.categories} areas: ${Object.values(KNOWLEDGE_CATEGORY_LABELS).join(", ")}.\n\nTry: "tips for level design", "how do I make a platformer feel good", "what is a game loop", "how do I optimize for 60fps" — or just say "teach me game feel".`,
          chips: ["How does collision work?", "Tips for level design", "What is game feel?", "Make me a game"],
        };
      }
      const hit = hits[0];
      const extra = hits[1];
      return {
        intent,
        text: `**${hit.article.title}** — from my ${KNOWLEDGE_CATEGORY_LABELS[hit.article.category]} knowledge:\n\n${hit.article.body}${extra ? `\n\n---\nRelated: **${extra.article.title}** — ${extra.article.summary}` : ""}\n\nWant me to **build a game using this**, or explain another topic?`,
        chips: ["Build me a game using this", "What is game feel?", "Tips for level design"],
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
