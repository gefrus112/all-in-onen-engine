"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, Download, Github, Sparkles, Code2, Gamepad2, Users,
  Zap, Palette, Play, ChevronDown, Star, Boxes, Terminal,
  Layers, MousePointerClick, Wand2, Rocket, Check, Image as ImageIcon,
} from "lucide-react";
import { useStudio } from "@/lib/studio-store";
import { toast } from "sonner";

export function LandingPage({ onLaunchIDE }: { onLaunchIDE: () => void }) {
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const i = setInterval(() => setActiveFeature((f) => (f + 1) % FEATURES.length), 4000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-white" style={{ overflowX: "hidden" }}>
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse-slow-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[80px] animate-pulse-slow" />
      </div>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        @keyframes pulse-slow-delayed {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.15); }
        }
        @keyframes float-up {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes scroll-x {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        .animate-pulse-slow-delayed { animation: pulse-slow-delayed 10s ease-in-out infinite; }
        .animate-float-up { animation: float-up 0.8s ease-out forwards; }
        .gradient-text {
          background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: gradient-shift 6s linear infinite;
        }
        .shimmer-bg {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }
        .scroll-track {
          animation: scroll-x 30s linear infinite;
        }
        .glass {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
        }
      `}</style>

      {/* Navigation */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "glass py-2" : "py-4"}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Lapia" className="w-8 h-8" />
            <span className="font-bold text-lg">Lapia <span className="text-muted-foreground font-normal">Studio</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#sprites" className="hover:text-white transition-colors">Assets</a>
            <a href="#templates" className="hover:text-white transition-colors">Templates</a>
            <a href="#download" className="hover:text-white transition-colors">Download</a>
            <a href="#docs" className="hover:text-white transition-colors">Docs</a>
          </div>
          <div className="flex items-center gap-2">
            <a href="https://github.com/gefrus112/lapia-ai-agent" target="_blank" rel="noreferrer"
               className="p-2 rounded-md hover:bg-white/10 transition-colors">
              <Github className="w-4 h-4" />
            </a>
            <button
              onClick={onLaunchIDE}
              className="px-4 py-2 rounded-md bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-sm font-medium transition-all hover:scale-105"
            >
              Launch IDE
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-8 animate-float-up">
            <Sparkles className="w-3 h-3 text-yellow-400" />
            v2.0 — Now with 134 sprites + multiplayer
            <ArrowRight className="w-3 h-3" />
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 animate-float-up" style={{ animationDelay: "0.1s" }}>
            Build 2D games
            <br />
            <span className="gradient-text">in your browser</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-float-up" style={{ animationDelay: "0.2s" }}>
            Lapia Studio is a Roblox Studio-style IDE for Python game development.
            Write Python, see it run live in the browser at 60 FPS via Pyodide.
            No install. No setup. Just play.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-float-up" style={{ animationDelay: "0.3s" }}>
            <button
              onClick={onLaunchIDE}
              className="group flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 font-medium transition-all hover:scale-105 shadow-lg shadow-blue-500/30"
            >
              <Play className="w-4 h-4 fill-current" />
              Launch Studio
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#download"
              className="flex items-center gap-2 px-6 py-3 rounded-lg glass hover:bg-white/10 font-medium transition-all"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto animate-float-up" style={{ animationDelay: "0.4s" }}>
            {[
              { label: "Sprites", value: "134", icon: <Boxes className="w-4 h-4" /> },
              { label: "Engine systems", value: "50+", icon: <Layers className="w-4 h-4" /> },
              { label: "Templates", value: "4", icon: <Code2 className="w-4 h-4" /> },
              { label: "FPS in browser", value: "60", icon: <Zap className="w-4 h-4" /> },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl p-4">
                <div className="flex items-center justify-center gap-2 text-blue-400 mb-1">{s.icon}</div>
                <div className="text-3xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </div>
      </section>

      {/* Sprite showcase marquee */}
      <section id="sprites" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-3">134 sprites, ready to drag in</h2>
          <p className="text-muted-foreground">From knights to crystals to castles — all yours, all free, all MIT-licensed.</p>
        </div>
        <div className="relative overflow-hidden py-4">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0a0b0e] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0a0b0e] to-transparent z-10" />
          <div className="flex gap-2 scroll-track" style={{ width: "max-content" }}>
            {[...SPRITE_LIST, ...SPRITE_LIST].map((s, i) => (
              <div key={i} className="w-16 h-16 glass rounded-lg p-2 hover:scale-110 hover:border-blue-500 transition-all cursor-pointer flex-shrink-0">
                <img src={s} alt="" className="w-full h-full object-contain" style={{ imageRendering: "pixelated" }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-4">
              <Star className="w-3 h-3 text-yellow-400" />
              Features
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-3">Everything you need to ship</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete 2D game development platform — engine, editor, asset library, multiplayer, and packaging.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                onMouseEnter={() => setActiveFeature(i)}
                className={`glass rounded-2xl p-6 transition-all duration-300 cursor-pointer ${activeFeature === i ? "border-blue-500/50 scale-[1.02]" : ""}`}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all ${activeFeature === i ? "bg-gradient-to-br from-blue-500 to-purple-600 scale-110" : "bg-white/5"}`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{f.description}</p>
                <div className="flex flex-wrap gap-1">
                  {f.tags.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-4">
              <Wand2 className="w-3 h-3 text-purple-400" />
              Starter Templates
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-3">Start in seconds, ship in hours</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Load a complete template, hit Play, start customizing. Four templates included.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMPLATES.map((t) => (
              <div key={t.name} className="glass rounded-xl p-5 hover:border-blue-500/50 transition-all group cursor-pointer">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br mb-4 flex items-center justify-center" style={{ background: t.gradient }}>
                  <t.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1">{t.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{t.description}</p>
                <div className="flex items-center gap-1 text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MousePointerClick className="w-3 h-3" />
                  Click to use
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download */}
      <section id="download" className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-4">
            <Download className="w-3 h-3 text-green-400" />
            Get Lapia Studio
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-3">Free. Open source. Yours.</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-10">
            Clone the repo, run <code className="px-2 py-0.5 rounded bg-white/10 text-blue-300">bun install && bun run dev</code>, and you&apos;re building games. Or grab the PyInstaller scripts and ship a real .exe.
          </p>

          <div className="grid md:grid-cols-3 gap-4 mb-10">
            <div className="glass rounded-xl p-6">
              <Rocket className="w-8 h-8 text-blue-400 mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Run in Browser</h3>
              <p className="text-xs text-muted-foreground mb-4">Launch the IDE right now. No install needed.</p>
              <button
                onClick={onLaunchIDE}
                className="w-full px-4 py-2 rounded-md bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-sm font-medium transition-all"
              >
                Launch Web IDE
              </button>
            </div>
            <div className="glass rounded-xl p-6">
              <Terminal className="w-8 h-8 text-green-400 mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Clone & Run</h3>
              <p className="text-xs text-muted-foreground mb-4">Get the source from GitHub.</p>
              <a
                href="https://github.com/gefrus112/lapia-ai-agent"
                target="_blank"
                rel="noreferrer"
                className="block w-full px-4 py-2 rounded-md glass hover:bg-white/10 text-sm font-medium transition-all"
              >
                <Github className="w-4 h-4 inline mr-2" />
                View on GitHub
              </a>
            </div>
            <div className="glass rounded-xl p-6">
              <Download className="w-8 h-8 text-purple-400 mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Build .exe</h3>
              <p className="text-xs text-muted-foreground mb-4">PyInstaller scripts included. Package as Windows executable.</p>
              <button
                onClick={() => {
                  const spec = `# Lapia Studio - PyInstaller spec
# Build: pyinstaller lapia.spec
import sys
block_cipher = None
a = Analysis(['engine/examples/platformer.py'],
    pathex=['engine'],
    binaries=[],
    datas=[],
    hiddenimports=['lapia', 'lapia.core', 'lapia.rendering', 'lapia.physics',
                   'lapia.input', 'lapia.audio', 'lapia.scene', 'lapia.ai',
                   'lapia.network', 'lapia.ui', 'lapia.tools', 'lapia.engine'],
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    cipher=block_cipher)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)
exe = EXE(pyz, a.scripts, a.binaries, a.zipfiles, a.datas,
    name='LapiaGame', debug=False, strip=False, upx=True,
    console=False, icon='public/logo.svg')
`;
                  const blob = new Blob([spec], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "lapia.spec";
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Downloaded lapia.spec — run `pyinstaller lapia.spec` to build your .exe");
                }}
                className="w-full px-4 py-2 rounded-md glass hover:bg-white/10 text-sm font-medium transition-all"
              >
                Download .spec
              </button>
            </div>
          </div>

          <div className="glass rounded-xl p-6 text-left">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-green-400" />
              Quick start
            </h3>
            <pre className="text-xs font-mono bg-black/40 p-4 rounded-lg overflow-x-auto"><code>{`# 1. Clone the repo
git clone https://github.com/gefrus112/lapia-ai-agent.git
cd lapia-ai-agent

# 2. Install dependencies
bun install

# 3. (Optional) Start multiplayer relay
./start-multiplayer.sh

# 4. Launch the IDE
bun run dev

# 5. Open http://localhost:3000`}</code></pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Lapia" className="w-6 h-6" />
            <span className="text-sm text-muted-foreground">Lapia Studio — MIT License</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="https://github.com/gefrus112/lapia-ai-agent" target="_blank" rel="noreferrer" className="hover:text-white">GitHub</a>
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#download" className="hover:text-white">Download</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    icon: Code2,
    title: "Monaco Code Editor",
    description: "Full Python syntax highlighting, multi-tab editing, autosave, Ctrl+S/F5 hotkeys. Same editor that powers VS Code.",
    tags: ["Python", "CSS", "Multi-tab", "Autosave"],
  },
  {
    icon: Play,
    title: "Live Preview at 60 FPS",
    description: "Your Python compiles to WebAssembly via Pyodide and runs in real-time on an HTML canvas. Edit, refresh, play.",
    tags: ["Pyodide", "Canvas", "60 FPS", "CRT effect"],
  },
  {
    icon: Boxes,
    title: "134 Sprite Asset Library",
    description: "Players, enemies, tiles, structures, nature, props, food, weapons, vehicles — all pixel-art, all free, all MIT-licensed.",
    tags: ["Pixel art", "15 categories", "Drag to copy", "MIT"],
  },
  {
    icon: Users,
    title: "Multiplayer via Socket.io",
    description: "Built-in relay server (Bun + socket.io). Multiplayer Arena template included — 2-4 players, real-time position sync.",
    tags: ["Socket.io", "Real-time", "Up to 4 players", "Bun"],
  },
  {
    icon: Layers,
    title: "50+ Engine Systems",
    description: "Rendering, physics, ECS, AI pathfinding, FSM, behavior trees, steering, networking, UI, audio — all in pure Python.",
    tags: ["Rendering", "Physics", "ECS", "AI", "Audio"],
  },
  {
    icon: Palette,
    title: "Themes & Settings",
    description: "Multiple themes (dark, midnight, ocean, purple, sunset). Customizable fonts, panel sizes, key bindings.",
    tags: ["5 themes", "Custom fonts", "Resizable panels"],
  },
];

const TEMPLATES = [
  { name: "Platformer", icon: Gamepad2, gradient: "linear-gradient(135deg, #3b82f6, #1e40af)", description: "Player movement, gravity, jumping, tilemap collision" },
  { name: "Top-Down Shooter", icon: Zap, gradient: "linear-gradient(135deg, #ef4444, #7f1d1d)", description: "Player rotation, shooting, enemy spawning, particles" },
  { name: "Multiplayer Arena", icon: Users, gradient: "linear-gradient(135deg, #8b5cf6, #4c1d95)", description: "2-4 player online arena via socket.io relay" },
  { name: "Physics Sandbox", icon: Palette, gradient: "linear-gradient(135deg, #10b981, #064e3b)", description: "Bouncing balls with gravity, walls, ball-ball collisions" },
];

const SPRITE_LIST = [
  "/sprites/player/knight.png", "/sprites/player/mage.png", "/sprites/player/archer.png",
  "/sprites/enemies/slime_green.png", "/sprites/enemies/bat_black.png", "/sprites/enemies/ghost_white.png",
  "/sprites/tiles/grass.png", "/sprites/tiles/stone.png", "/sprites/tiles/water.png", "/sprites/tiles/lava.png",
  "/sprites/coins/coin_gold.png", "/sprites/coins/gem_emerald.png", "/sprites/coins/gem_ruby.png", "/sprites/coins/star.png",
  "/sprites/structures/house_red.png", "/sprites/structures/castle.png", "/sprites/structures/tent.png",
  "/sprites/nature/tree_oak.png", "/sprites/nature/tree_pine.png", "/sprites/nature/flower_red.png",
  "/sprites/props/chest.png", "/sprites/props/barrel.png", "/sprites/props/portal.png",
  "/sprites/food/apple.png", "/sprites/food/pizza.png", "/sprites/food/burger.png",
  "/sprites/weapons/sword_iron.png", "/sprites/weapons/bow.png", "/sprites/weapons/staff.png",
  "/sprites/characters/cat_orange.png", "/sprites/characters/npc_villager.png",
  "/sprites/powerups/heart.png", "/sprites/powerups/shield.png",
];
