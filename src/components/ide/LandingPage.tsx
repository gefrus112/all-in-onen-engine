"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, Download, Github, Sparkles, Code2, Gamepad2, Users,
  Zap, Palette, Play, ChevronDown, Star, Boxes, Terminal,
  Layers, MousePointerClick, Wand2, Rocket, Check, Image as ImageIcon,
  Box, Monitor, Apple, Chrome, BookOpen, Upload, Music, Send,
  Cpu, Globe, TrendingUp, Heart,
} from "lucide-react";
import { useStudio, EngineKind } from "@/lib/studio-store";
import { toast } from "sonner";

const ENGINES: {
  id: EngineKind; name: string; tagline: string; description: string;
  iconSrc: string; gradient: string; tags: string[];
  version: string; lastUpdate: string; updates: string[];
}[] = [
  {
    id: "pygame2d",
    name: "Pygame 2D Engine",
    tagline: "Python in your browser",
    description: "Write Python, see it run live in the browser via Pyodide at 60 FPS. Sprite-based 2D games with full physics, ECS, AI, multiplayer.",
    iconSrc: "/engine-pygame.svg",
    gradient: "linear-gradient(135deg, #3b82f6, #1e40af)",
    tags: ["Python", "Pyodide", "2D", "Sprite-based"],
    version: "v1.0.0",
    lastUpdate: "2026-09-27",
    updates: [
      "Pyodide 0.26 (Python 3.12) runtime",
      "134 sprite asset library across 15 categories",
      "Multiplayer relay via socket.io",
      "CRT scanline preview with glow effect",
      "PyInstaller .exe / Linux AppImage / Mac .dmg build scripts",
    ],
  },
  {
    id: "threejs3d",
    name: "Three.js 3D Engine",
    tagline: "Real 3D in the browser",
    description: "Build 3D games with a live Three.js viewport. Place meshes, lights, cameras. Full Roblox Studio-style editor with explorer, properties, timeline.",
    iconSrc: "/engine-threejs.svg",
    gradient: "linear-gradient(135deg, #8b5cf6, #4c1d95)",
    tags: ["Three.js", "WebGL", "3D", "Real-time"],
    version: "v1.0.0",
    lastUpdate: "2026-09-27",
    updates: [
      "Three.js r186 with @react-three/fiber + drei",
      "Real-time shadows + Sky + Environment lighting",
      "OrbitControls + RGB axis gizmo",
      "Animation timeline with keyframes",
      "Play-test mode with WASD camera + custom avatar",
    ],
  },
  {
    id: "zhitlow3d",
    name: "Zhitlow 3D Engine",
    tagline: "Experimental high-perf 3D",
    description: "Our experimental custom 3D engine with deferred rendering, PBR materials, and built-in networking. Optimized for large open-world games.",
    iconSrc: "/engine-zhitlow.svg",
    gradient: "linear-gradient(135deg, #06b6d4, #0e7490)",
    tags: ["Experimental", "PBR", "Deferred", "Open-world"],
    version: "v0.9.0 (beta)",
    lastUpdate: "2026-09-27",
    updates: [
      "100 physics properties per object (joints, buoyancy, CCD)",
      "20 PBR material properties (clearcoat, transmission, IOR, sheen)",
      "Script/CSS/JS code editor with Zhitlow Script language",
      "GUI editor overlay (HUD, crosshair, health bar)",
      "Closable welcome card with quick-start guide",
    ],
  },
];

const FEATURES = [
  {
    icon: Code2,
    title: "Monaco Code Editor",
    description: "Full Python + JavaScript syntax highlighting, multi-tab editing, autosave, Ctrl+S/F5 hotkeys. Same editor that powers VS Code.",
    tags: ["Python", "JavaScript", "Multi-tab", "Autosave"],
  },
  {
    icon: Box,
    title: "3D Studio with Three.js",
    description: "Real interactive 3D viewport. Place cubes, spheres, lights, cameras. Orbit, pan, zoom. Full scene hierarchy with drag-and-drop.",
    tags: ["Three.js", "WebGL", "Real-time 3D", "Orbit camera"],
  },
  {
    icon: Users,
    title: "Multiplayer via Socket.io",
    description: "Built-in relay server (Bun + socket.io). Multiplayer Arena template included — 2-4 players, real-time position sync.",
    tags: ["Socket.io", "Real-time", "Up to 4 players", "Bun"],
  },
  {
    icon: Boxes,
    title: "134+ Sprite Asset Library",
    description: "Players, enemies, tiles, structures, nature, props, food, weapons, vehicles — all pixel-art, all free, all MIT-licensed.",
    tags: ["Pixel art", "15 categories", "Drag to copy", "MIT"],
  },
  {
    icon: Upload,
    title: "Upload Your Own Assets",
    description: "Drag-and-drop 3D models (.glb, .gltf), audio (.wav, .mp3), images (.png, .jpg). Auto-imported into your project's asset library.",
    tags: [".glb", ".gltf", ".wav", ".mp3", ".png"],
  },
  {
    icon: Music,
    title: "Built-in Audio Editor",
    description: "Visual waveform editor with multi-track support. Trim, fade, loop, mix. Export to your game's audio mixer.",
    tags: ["Waveform", "Multi-track", "Trim", "Fade"],
  },
  {
    icon: Palette,
    title: "Custom Play-Test Avatar",
    description: "Pick from 6 preset avatars (knight, mage, archer, rogue, wizard, robot) or build your own with body type, color, accessories.",
    tags: ["6 presets", "Customizer", "Body type", "Color"],
  },
  {
    icon: Send,
    title: "Publish Everywhere",
    description: "One-click publish to itch.io, Crazy Games, GitHub Pages, or HTML5 web export. Step-by-step instructions included.",
    tags: ["itch.io", "Crazy Games", "GitHub Pages", "HTML5"],
  },
  {
    icon: Layers,
    title: "666+ Properties Panel",
    description: "Massive Roblox Studio-style inspector with 666+ properties per entity. Collapsible groups, searchable, type-aware editors.",
    tags: ["666+ props", "Collapsible", "Searchable", "Type-aware"],
  },
];

const TEMPLATES = [
  { name: "Platformer", icon: Gamepad2, gradient: "linear-gradient(135deg, #3b82f6, #1e40af)", description: "Player movement, gravity, jumping, tilemap collision" },
  { name: "Top-Down Shooter", icon: Zap, gradient: "linear-gradient(135deg, #ef4444, #7f1d1d)", description: "Player rotation, shooting, enemy spawning, particles" },
  { name: "Multiplayer Arena", icon: Users, gradient: "linear-gradient(135deg, #8b5cf6, #4c1d95)", description: "2-4 player online arena via socket.io relay" },
  { name: "3D Sandbox", icon: Box, gradient: "linear-gradient(135deg, #06b6d4, #0e7490)", description: "Walk around a 3D world with WASD + mouse look" },
];

const DOWNLOAD_TARGETS = [
  {
    id: "linux", name: "Linux", icon: Monitor, color: "#fbbf24",
    description: "Universal .AppImage + .deb + .tar.gz",
    filename: "all-in-one-engine-linux.AppImage",
    instructions: `# Build All In One Engine for Linux
# Run on a Linux machine (Ubuntu 20.04+ recommended)

# 1. Install dependencies
sudo apt update
sudo apt install -y python3 python3-pip nodejs npm

# 2. Clone the repo
git clone https://github.com/gefrus112/lapia-ai-agent.git
cd lapia-ai-agent

# 3. Build the AppImage
chmod +x build_linux.sh
./build_linux.sh

# 4. Run
./dist/AllInOneEngine-linux-x86_64.AppImage`,
  },
  {
    id: "mac", name: "macOS", icon: Apple, color: "#94a3b8",
    description: "Universal .dmg for Intel + Apple Silicon",
    filename: "all-in-one-engine-mac.dmg",
    instructions: `# Build All In One Engine for macOS
# Run on a Mac (macOS 11+ recommended)

# 1. Install Homebrew + dependencies
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install python@3.12 node bun

# 2. Clone the repo
git clone https://github.com/gefrus112/lapia-ai-agent.git
cd lapia-ai-agent

# 3. Build the .dmg
chmod +x build_mac.sh
./build_mac.sh

# 4. Install
open dist/AllInOneEngine.dmg
# Drag AllInOneEngine.app to Applications`,
  },
  {
    id: "chromebook", name: "Chromebook", icon: Chrome, color: "#22c55e",
    description: "Linux container (.deb) for Chrome OS",
    filename: "all-in-one-engine-chromebook.deb",
    instructions: `# Build All In One Engine for Chromebook
# Run on a Chromebook with Linux (Crostini) enabled

# 1. Enable Linux: Settings > Developers > Linux development environment
# 2. Open Terminal

# 3. Install dependencies
sudo apt update
sudo apt install -y python3 python3-pip nodejs npm git

# 4. Clone the repo
git clone https://github.com/gefrus112/lapia-ai-agent.git
cd lapia-ai-agent

# 5. Build the .deb
chmod +x build_chromebook.sh
./build_chromebook.sh

# 6. Install
sudo dpkg -i dist/all-in-one-engine-chromebook.deb

# 7. Launch from your Chromebook app launcher`,
  },
];

const PUBLISH_TARGETS = [
  {
    id: "itchio", name: "itch.io", icon: Gamepad2, color: "#fa5c5c",
    description: "Free indie game hosting. Best for game jams and indie releases.",
    steps: [
      "Build your game as HTML5: click the Build HTML button in Studio",
      "Download the resulting .zip file",
      "Go to itch.io and click 'Upload new project'",
      "Set kind to 'HTML' and upload your .zip",
      "Configure viewport dimensions and click 'Save & view'"
    ],
    url: "https://itch.io/upload",
  },
  {
    id: "crazygames", name: "Crazy Games", icon: Zap, color: "#fb923c",
    description: "Web game portal with revenue share. Reach millions of players.",
    steps: [
      "Build your game as HTML5 (same as itch.io)",
      "Go to developer.crazygames.com and sign up",
      "Click 'Submit a Game' and fill in details",
      "Upload your .zip and add screenshots",
      "Wait for review (typically 2-5 business days)"
    ],
    url: "https://developer.crazygames.com",
  },
  {
    id: "github", name: "GitHub Pages", icon: Github, color: "#94a3b8",
    description: "Free hosting from your GitHub repo. Great for sharing with collaborators.",
    steps: [
      "Build your game as HTML5",
      "Commit the build/ folder to a gh-pages branch in your repo",
      "Go to repo Settings > Pages",
      "Set source to 'gh-pages branch'",
      "Your game is live at username.github.io/repo-name"
    ],
    url: "https://github.com/gefrus112/lapia-ai-agent/settings/pages",
  },
  {
    id: "html5", name: "HTML5 Standalone", icon: Globe, color: "#3b82f6",
    description: "Self-contained .zip you can host anywhere — your own server, S3, Netlify, etc.",
    steps: [
      "Click the 'Build HTML5' button in Studio",
      "A single index.html + game files are generated",
      "Test locally by opening index.html in a browser",
      "Upload the folder to any static host (Netlify, Vercel, S3, etc.)",
      "Share the URL with players"
    ],
    url: "#",
  },
];

const INSTRUCTIONS = [
  {
    title: "1. Launch the Studio",
    icon: Rocket,
    content: "Click 'Launch Studio' on the homepage. You'll be asked to pick an engine: Pygame 2D, Three.js 3D, or Zhitlow 3D. Pick the one that matches your game idea.",
  },
  {
    title: "2. Pick a Template",
    icon: Wand2,
    content: "On the Templates panel (bottom-left), click one of the 4 starter templates: Platformer, Top-Down Shooter, Multiplayer Arena, or 3D Sandbox. The code is loaded into your editor.",
  },
  {
    title: "3. Edit Your Game",
    icon: Code2,
    content: "Modify the Python or JavaScript code in the Monaco editor. Press Ctrl+S to save. Press F5 or click Play to compile and run your game in the live preview pane at 60 FPS.",
  },
  {
    title: "4. Add Assets",
    icon: Upload,
    content: "Drag sprites from the Toolbox (left panel) — they auto-copy as Python code to your clipboard. Or click Upload in the asset panel to bring your own .glb / .wav / .png files.",
  },
  {
    title: "5. Pick Your Avatar",
    icon: Users,
    content: "Click the avatar button in the toolbar. Pick from 6 presets or use the customizer to choose body type, color, and accessories. Your avatar appears in play-test mode.",
  },
  {
    title: "6. Test with Multiplayer",
    icon: Users,
    content: "Run ./start-multiplayer.sh in a terminal to start the socket.io relay. Open the IDE in 2 browser tabs, load the Multiplayer Arena template in each, hit Play — both avatars will appear in real-time.",
  },
  {
    title: "7. Publish Your Game",
    icon: Send,
    content: "When your game is ready, click the Publish button. Pick a platform: itch.io, Crazy Games, GitHub Pages, or standalone HTML5. Follow the step-by-step instructions in the dialog.",
  },
  {
    title: "8. Build an .exe (Optional)",
    icon: Package,
    content: "Want a Windows .exe, Linux AppImage, or macOS .dmg? Run the build scripts in /build_exe.sh, /build_linux.sh, /build_mac.sh, or /build_chromebook.sh. Outputs go to dist/.",
  },
];

function Package({ className }: { className?: string }) {
  return <Boxes className={className} />;
}

const SPRITE_LIST = [
  "/sprites/player/knight.png", "/sprites/player/mage.png", "/sprites/player/archer.png",
  "/sprites/enemies/slime_green.png", "/sprites/enemies/bat_black.png", "/sprites/enemies/ghost_white.png",
  "/sprites/tiles/grass.png", "/sprites/tiles/stone.png", "/sprites/tiles/water.png", "/sprites/tiles/lava.png",
  "/sprites/coins/coin_gold.png", "/sprites/coins/gem_emerald.png", "/sprites/coins/gem_ruby.png", "/sprites/ui/star.png",
  "/sprites/structures/house_red.png", "/sprites/structures/castle.png", "/sprites/structures/tent.png",
  "/sprites/nature/tree_oak.png", "/sprites/nature/tree_pine.png", "/sprites/nature/flower_red.png",
  "/sprites/props/chest.png", "/sprites/props/barrel.png", "/sprites/props/portal.png",
  "/sprites/food/apple.png", "/sprites/food/pizza.png", "/sprites/food/burger.png",
  "/sprites/weapons/sword_iron.png", "/sprites/weapons/bow.png", "/sprites/weapons/staff.png",
  "/sprites/characters/cat_orange.png", "/sprites/characters/npc_villager.png",
  "/sprites/powerups/heart.png", "/sprites/powerups/shield.png",
];

export function LandingPage({
  onLaunchIDE,
  onLaunch3DStudio,
}: {
  onLaunchIDE: () => void;
  onLaunch3DStudio: () => void;
}) {
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "features" | "download" | "instructions" | "publish">("home");
  const [showEnginePicker, setShowEnginePicker] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const i = setInterval(() => setActiveFeature((f) => (f + 1) % FEATURES.length), 4000);
    return () => clearInterval(i);
  }, []);

  const handleLaunchClick = () => setShowEnginePicker(true);

  const handlePickEngine = (engine: EngineKind) => {
    useStudio.getState().setEngineKind(engine);
    setShowEnginePicker(false);
    if (engine === "pygame2d") {
      onLaunchIDE();
    } else {
      onLaunch3DStudio();
    }
    toast.success(`Launched ${ENGINES.find(e => e.id === engine)?.name}`, {
      description: ENGINES.find(e => e.id === engine)?.tagline,
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-white" style={{ overflowX: "hidden" }}>
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
        @keyframes rotate-slow {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slide-up-fade {
          0% { transform: translateY(40px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.6), 0 0 60px rgba(139, 92, 246, 0.3); }
        }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        .animate-pulse-slow-delayed { animation: pulse-slow-delayed 10s ease-in-out infinite; }
        .animate-float-up { animation: float-up 0.8s ease-out forwards; }
        .animate-bounce-in { animation: bounce-in 0.6s ease-out forwards; }
        .animate-slide-up-fade { animation: slide-up-fade 0.8s ease-out forwards; }
        .animate-glow-pulse { animation: glow-pulse 3s ease-in-out infinite; }
        .gradient-text {
          background: linear-gradient(90deg, #06b6d4, #3b82f6, #8b5cf6, #06b6d4);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: gradient-shift 6s linear infinite;
        }
        .scroll-track {
          animation: scroll-x 30s linear infinite;
        }
        .glass {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .rotate-slow { animation: rotate-slow 20s linear infinite; transform-style: preserve-3d; }
      `}</style>

      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse-slow-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[80px] animate-pulse-slow" />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "glass py-2" : "py-4"}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="All In One Engine" className="w-9 h-9" />
            <div>
              <div className="font-bold text-base leading-tight">All In One <span className="text-muted-foreground font-normal">Engine</span></div>
              <div className="text-[10px] text-muted-foreground leading-tight">2D · 3D · Multiplayer</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <button onClick={() => setActiveTab("home")} className={`hover:text-white transition-colors ${activeTab === "home" ? "text-white" : ""}`}>Home</button>
            <button onClick={() => setActiveTab("features")} className={`hover:text-white transition-colors ${activeTab === "features" ? "text-white" : ""}`}>Features</button>
            <button onClick={() => setActiveTab("download")} className={`hover:text-white transition-colors ${activeTab === "download" ? "text-white" : ""}`}>Download</button>
            <button onClick={() => setActiveTab("instructions")} className={`hover:text-white transition-colors ${activeTab === "instructions" ? "text-white" : ""}`}>Instructions</button>
            <button onClick={() => setActiveTab("publish")} className={`hover:text-white transition-colors ${activeTab === "publish" ? "text-white" : ""}`}>Publish</button>
          </div>
          <div className="flex items-center gap-2">
            <a href="https://github.com/gefrus112/lapia-ai-agent" target="_blank" rel="noreferrer"
               className="p-2 rounded-md hover:bg-white/10 transition-colors">
              <Github className="w-4 h-4" />
            </a>
            <button
              onClick={handleLaunchClick}
              className="px-4 py-2 rounded-md bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-sm font-medium transition-all hover:scale-105 animate-glow-pulse"
            >
              Launch Studio
            </button>
          </div>
        </div>
      </nav>

      {/* HOME TAB */}
      {activeTab === "home" && (
        <>
          {/* Hero */}
          <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
            <div className="max-w-6xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-8 animate-float-up">
                <Sparkles className="w-3 h-3 text-yellow-400" />
                v3.0 — Now with 3D Studio + Avatar Customizer + Publishing
                <ArrowRight className="w-3 h-3" />
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 animate-float-up" style={{ animationDelay: "0.1s" }}>
                Build 2D & 3D games
                <br />
                <span className="gradient-text">all in one engine</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-float-up" style={{ animationDelay: "0.2s" }}>
                All In One Engine is the Roblox Studio-style IDE for Python and JavaScript game development.
                Write code, see it run live in the browser at 60 FPS. 2D Pygame, 3D Three.js, and experimental Zhitlow 3D — pick your engine.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-float-up" style={{ animationDelay: "0.3s" }}>
                <button
                  onClick={handleLaunchClick}
                  className="group flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 font-medium transition-all hover:scale-105 shadow-lg shadow-blue-500/30 animate-glow-pulse"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Launch Studio
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => setActiveTab("download")}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg glass hover:bg-white/10 font-medium transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => setActiveTab("instructions")}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg glass hover:bg-white/10 font-medium transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  Instructions
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto animate-float-up" style={{ animationDelay: "0.4s" }}>
                {[
                  { label: "Sprites", value: "134", icon: <Boxes className="w-4 h-4" /> },
                  { label: "Engine systems", value: "50+", icon: <Layers className="w-4 h-4" /> },
                  { label: "Properties/entity", value: "666", icon: <Cpu className="w-4 h-4" /> },
                  { label: "FPS in browser", value: "60", icon: <Zap className="w-4 h-4" /> },
                ].map((s) => (
                  <div key={s.label} className="glass rounded-xl p-4">
                    <div className="flex items-center justify-center gap-2 text-cyan-400 mb-1">{s.icon}</div>
                    <div className="text-3xl font-bold">{s.value}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </div>
          </section>

          {/* Three engines highlight */}
          <section className="py-20 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-4">
                  <Wand2 className="w-3 h-3 text-purple-400" />
                  Three engines, one IDE
                </div>
                <h2 className="text-3xl md:text-5xl font-bold mb-3">Pick your engine on launch</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  When you click Launch Studio, you choose: 2D Pygame, 3D Three.js, or experimental Zhitlow 3D.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {ENGINES.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => handlePickEngine(e.id)}
                    className="text-left glass rounded-2xl p-6 hover:border-cyan-500/50 transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <img src={e.iconSrc} alt={e.name} className="w-14 h-14" />
                      <div>
                        <h3 className="text-xl font-semibold leading-tight">{e.name}</h3>
                        <p className="text-xs text-cyan-400">{e.tagline}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{e.description}</p>
                    <div className="flex items-center gap-2 mb-4 text-[10px] text-muted-foreground">
                      <span className="px-1.5 py-0.5 rounded bg-white/5">{e.version}</span>
                      <span>·</span>
                      <span>Updated {e.lastUpdate}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {e.tags.map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">{t}</span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MousePointerClick className="w-3 h-3" />
                      Click to launch
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Sprite showcase marquee */}
          <section className="py-20 relative">
            <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
              <h2 className="text-3xl md:text-5xl font-bold mb-3">134 sprites, ready to drag in</h2>
              <p className="text-muted-foreground">From knights to crystals to castles — all yours, all free, all MIT-licensed.</p>
            </div>
            <div className="relative overflow-hidden py-4">
              <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0a0b0e] to-transparent z-10" />
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0a0b0e] to-transparent z-10" />
              <div className="flex gap-2 scroll-track" style={{ width: "max-content" }}>
                {[...SPRITE_LIST, ...SPRITE_LIST].map((s, i) => (
                  <div key={i} className="w-16 h-16 glass rounded-lg p-2 hover:scale-110 hover:border-cyan-500 transition-all cursor-pointer flex-shrink-0">
                    <img src={s} alt="" className="w-full h-full object-contain" style={{ imageRendering: "pixelated" }} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* FEATURES TAB */}
      {activeTab === "features" && (
        <section className="py-32 px-6 min-h-screen">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-4">
                <Star className="w-3 h-3 text-yellow-400" />
                Features
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-3">Everything you need to ship</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A complete 2D + 3D game development platform — engine, editor, asset library, multiplayer, publishing, and packaging.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  onMouseEnter={() => setActiveFeature(i)}
                  className={`glass rounded-2xl p-6 transition-all duration-300 cursor-pointer ${activeFeature === i ? "border-cyan-500/50 scale-[1.02]" : ""}`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all ${activeFeature === i ? "bg-gradient-to-br from-cyan-500 to-purple-600 scale-110" : "bg-white/5"}`}>
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

            {/* Templates */}
            <div className="mt-20">
              <div className="text-center mb-12">
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
                  <div key={t.name} className="glass rounded-xl p-5 hover:border-cyan-500/50 transition-all group cursor-pointer">
                    <div className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center" style={{ background: t.gradient }}>
                      <t.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1">{t.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{t.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* DOWNLOAD TAB */}
      {activeTab === "download" && (
        <section className="py-32 px-6 min-h-screen">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-4">
                <Download className="w-3 h-3 text-green-400" />
                Get All In One Engine
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-3">Free. Open source. Cross-platform.</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-10">
                Download for Linux, macOS, or Chromebook. Or run in your browser right now — no install needed.
              </p>
            </div>

            {/* Run in browser */}
            <div className="glass rounded-2xl p-6 mb-8 text-center">
              <Rocket className="w-10 h-10 text-cyan-400 mb-3 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">Run in Browser (Recommended)</h3>
              <p className="text-sm text-muted-foreground mb-4">Launch the IDE right now. No install needed. Works on any modern browser.</p>
              <button
                onClick={handleLaunchClick}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 font-medium transition-all hover:scale-105"
              >
                Launch Web Studio
              </button>
            </div>

            {/* Platform downloads */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {DOWNLOAD_TARGETS.map((target) => (
                <div key={target.id} className="glass rounded-xl p-6">
                  <target.icon className="w-10 h-10 mb-3" style={{ color: target.color }} />
                  <h3 className="font-semibold mb-1">{target.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4">{target.description}</p>
                  <button
                    onClick={() => {
                      const blob = new Blob([target.instructions], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `build-${target.id}.sh`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success(`Downloaded build-${target.id}.sh`, {
                        description: "Run this script on your target platform to build the installer.",
                      });
                    }}
                    className="w-full px-3 py-2 rounded-md glass hover:bg-white/10 text-xs font-medium transition-all"
                  >
                    <Download className="w-3 h-3 inline mr-1" />
                    Build Script
                  </button>
                </div>
              ))}
            </div>

            {/* GitHub */}
            <div className="glass rounded-xl p-6 text-center">
              <Github className="w-10 h-10 text-white mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Clone from GitHub</h3>
              <p className="text-xs text-muted-foreground mb-4">Get the full source code. MIT-licensed. Contribute back!</p>
              <a
                href="https://github.com/gefrus112/lapia-ai-agent"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md glass hover:bg-white/10 text-sm font-medium transition-all"
              >
                <Github className="w-4 h-4" />
                View on GitHub
              </a>
            </div>

            {/* Quick start code */}
            <div className="glass rounded-xl p-6 text-left mt-8">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-green-400" />
                Quick start (any platform)
              </h3>
              <pre className="text-xs font-mono bg-black/40 p-4 rounded-lg overflow-x-auto"><code>{`# 1. Clone the repo
git clone https://github.com/gefrus112/lapia-ai-agent.git
cd lapia-ai-agent

# 2. Install dependencies
bun install   # or: npm install

# 3. (Optional) Start multiplayer relay
./start-multiplayer.sh

# 4. Launch the IDE
bun run dev

# 5. Open http://localhost:3000`}</code></pre>
            </div>
          </div>
        </section>
      )}

      {/* INSTRUCTIONS TAB */}
      {activeTab === "instructions" && (
        <section className="py-32 px-6 min-h-screen">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-4">
                <BookOpen className="w-3 h-3 text-cyan-400" />
                Instructions
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-3">From zero to published in 8 steps</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Follow these steps to build and publish your first game with All In One Engine.
              </p>
            </div>

            <div className="space-y-4">
              {INSTRUCTIONS.map((step, i) => (
                <div
                  key={i}
                  className="glass rounded-xl p-6 flex gap-4 hover:border-cyan-500/30 transition-all"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <step.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PUBLISH TAB */}
      {activeTab === "publish" && (
        <section className="py-32 px-6 min-h-screen">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-4">
                <Send className="w-3 h-3 text-pink-400" />
                Publish Your Game
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-3">Publish everywhere</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Build your game once, publish to itch.io, Crazy Games, GitHub Pages, or standalone HTML5.
                Step-by-step instructions for each platform below.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {PUBLISH_TARGETS.map((target) => (
                <div key={target.id} className="glass rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${target.color}30` }}>
                      <target.icon className="w-5 h-5" style={{ color: target.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{target.name}</h3>
                      <p className="text-xs text-muted-foreground">{target.description}</p>
                    </div>
                  </div>
                  <ol className="space-y-2 mb-4">
                    {target.steps.map((step, i) => (
                      <li key={i} className="flex gap-2 text-xs">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-medium">
                          {i + 1}
                        </span>
                        <span className="text-muted-foreground pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                  {target.url !== "#" && (
                    <a
                      href={target.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                    >
                      Open {target.name} <ArrowRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>

            <div className="glass rounded-xl p-6 mt-8">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Tips for getting featured
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><Check className="w-4 h-4 text-green-400 flex-shrink-0" /> Add screenshots and a gameplay video to your store listing</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-green-400 flex-shrink-0" /> Write a clear description and tag your game well</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-green-400 flex-shrink-0" /> Test on multiple browsers before publishing</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-green-400 flex-shrink-0" /> Add mobile touch controls for broader reach</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-green-400 flex-shrink-0" /> Share on social media with #AllInOneEngine</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="All In One Engine" className="w-6 h-6" />
            <span className="text-sm text-muted-foreground">All In One Engine — MIT License · 2D + 3D + Multiplayer</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <button onClick={() => setActiveTab("home")} className="hover:text-white">Home</button>
            <button onClick={() => setActiveTab("features")} className="hover:text-white">Features</button>
            <button onClick={() => setActiveTab("download")} className="hover:text-white">Download</button>
            <button onClick={() => setActiveTab("instructions")} className="hover:text-white">Instructions</button>
            <button onClick={() => setActiveTab("publish")} className="hover:text-white">Publish</button>
            <a href="https://github.com/gefrus112/lapia-ai-agent" target="_blank" rel="noreferrer" className="hover:text-white">GitHub</a>
          </div>
        </div>
      </footer>

      {/* Engine Picker Modal */}
      {showEnginePicker && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-bounce-in"
          onClick={() => setShowEnginePicker(false)}
        >
          <div
            className="glass rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Pick your engine</h2>
              <p className="text-sm text-muted-foreground">Choose which engine to launch. You can switch later. Each card shows the latest updates.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {ENGINES.map((e) => (
                <button
                  key={e.id}
                  onClick={() => handlePickEngine(e.id)}
                  className="text-left glass rounded-xl p-5 hover:border-cyan-500/50 hover:scale-[1.03] transition-all"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <img src={e.iconSrc} alt={e.name} className="w-12 h-12" />
                    <div>
                      <h3 className="font-semibold leading-tight">{e.name}</h3>
                      <p className="text-xs text-cyan-400">{e.tagline}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{e.description}</p>
                  {/* Updates tab */}
                  <div className="rounded-md bg-black/30 border border-white/5 p-2 mb-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-3 h-3 text-yellow-400" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Updates</span>
                      <span className="text-[9px] text-muted-foreground ml-auto">{e.version}</span>
                    </div>
                    <ul className="space-y-1">
                      {e.updates.map((u, i) => (
                        <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
                          <Check className="w-2.5 h-2.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <span>{u}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {e.tags.map((t) => (
                      <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowEnginePicker(false)}
              className="mt-6 w-full px-4 py-2 rounded-md glass hover:bg-white/10 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
