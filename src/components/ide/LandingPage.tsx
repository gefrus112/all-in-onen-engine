"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, ArrowUpRight, Download, Github, Sparkles, Code2, Gamepad2, Users,
  Zap, Palette, Play, ChevronDown, Star, Boxes,
  Layers, MousePointerClick, Wand2, Rocket, Check, Package,
  Box, Monitor, Apple, Chrome, BookOpen, Upload, Music, Send,
  Cpu, Globe, TrendingUp,
} from "lucide-react";
import { useStudio, EngineKind } from "../../lib/studio-store";
import { toast } from "sonner";
import { AllyAvatar } from "./AllyAvatar";

const ASSET_BASE = process.env.NEXT_PUBLIC_ASSET_BASE || "";
const A = (p: string) => `${ASSET_BASE}${p}`;

const GITHUB_URL = "https://github.com/gefrus112/all-in-onen-engine";
const LIVE_URL = "https://gefrus112.github.io/all-in-onen-engine/";

const ENGINES: {
  id: EngineKind; name: string; tagline: string; description: string;
  iconSrc: string; gradient: string; glow: string; tags: string[];
  version: string; lastUpdate: string; updates: string[];
}[] = [
  {
    id: "pygame2d",
    name: "Pygame 2D",
    tagline: "Python in your browser",
    description: "Write Python, see it run live in the browser via Pyodide at 60 FPS. Sprite-based 2D games with full physics, ECS, AI and multiplayer.",
    iconSrc: A("/engine-pygame.svg"),
    gradient: "linear-gradient(135deg, #3b82f6, #1e40af)",
    glow: "59,130,246",
    tags: ["Python", "Pyodide", "2D", "Sprite-based"],
    version: "v1.0.0",
    lastUpdate: "2026-09-27",
    updates: [
      "NEW: Ally-5 avatar + 25-article game-dev knowledge + 256k context",
      "NEW: Ally-5 AI assistant — builds games from a prompt",
      "NEW: Terminal with pip packages + `ally` command",
      "Real sprite loading: load_image() in games",
      "Pyodide 0.26 (Python 3.12) runtime",
      "134 sprite asset library across 15 categories",
      "Multiplayer relay via socket.io",
    ],
  },
  {
    id: "threejs3d",
    name: "Three.js 3D",
    tagline: "Real 3D in the browser",
    description: "Build 3D games with a live Three.js viewport. Place meshes, lights, cameras. Full Roblox Studio-style editor with explorer, properties and timeline.",
    iconSrc: A("/engine-threejs.svg"),
    gradient: "linear-gradient(135deg, #8b5cf6, #4c1d95)",
    glow: "139,92,246",
    tags: ["Three.js", "WebGL", "3D", "Real-time"],
    version: "v3.1.0",
    lastUpdate: "2026-09-30",
    updates: [
      "First-person play test with pointer-lock mouse look",
      "Blender-style Components panel (Rigid Body, Script, Audio…)",
      "Map lighting presets + rendering settings (shadows, tone map)",
      "3 new assets: Castle Tower, Fountain, Treasure Chest",
      "Playable RPG Village Quest template with quests and combat",
    ],
  },
  {
    id: "zhitlow3d",
    name: "Zhitlow 3D",
    tagline: "Experimental high-perf 3D",
    description: "Our experimental custom 3D engine with deferred rendering, PBR materials and built-in networking. Optimized for large open-world games.",
    iconSrc: A("/engine-zhitlow.svg"),
    gradient: "linear-gradient(135deg, #06b6d4, #0e7490)",
    glow: "6,182,212",
    tags: ["Experimental", "PBR", "Deferred", "Open-world"],
    version: "v3.1.0 (beta)",
    lastUpdate: "2026-09-30",
    updates: [
      "Real move / rotate / scale gizmos with grid snapping",
      "Adjustable asset palette size (S / M / L)",
      "Screenshot tool, focus selection (F), snap toggle",
      "GUI editor overlay (HUD, crosshair, health bar)",
      "Wired material properties — roughness, metalness, emissive",
    ],
  },
];

const FEATURES = [
  {
    icon: Code2,
    title: "Monaco Code Editor",
    description: "Full Python + JavaScript syntax highlighting, multi-tab editing, autosave, Ctrl+S / F5 hotkeys. The same editor that powers VS Code.",
    tags: ["Python", "JavaScript", "Multi-tab", "Autosave"],
    span: "big",
  },
  {
    icon: Box,
    title: "3D Studio with Three.js",
    description: "Real interactive 3D viewport. Place cubes, spheres, lights, cameras. Orbit, pan, zoom. Full scene hierarchy with drag-and-drop.",
    tags: ["Three.js", "WebGL", "Orbit camera"],
    span: "tall",
  },
  {
    icon: Users,
    title: "Multiplayer via Socket.io",
    description: "Built-in relay server. Arena template included — 2-4 players, real-time position sync.",
    tags: ["Socket.io", "Up to 4 players"],
    span: "normal",
  },
  {
    icon: Boxes,
    title: "134+ Sprite Library",
    description: "Players, enemies, tiles, weapons, vehicles — all pixel art, all free, all MIT-licensed.",
    tags: ["Pixel art", "15 categories"],
    span: "normal",
  },
  {
    icon: Upload,
    title: "Upload Your Own Assets",
    description: "Drag-and-drop 3D models, audio and images. Auto-imported into your project.",
    tags: [".glb", ".wav", ".png"],
    span: "normal",
  },
  {
    icon: Music,
    title: "Built-in Audio Editor",
    description: "Visual waveform editor with multi-track support. Trim, fade, loop, mix.",
    tags: ["Waveform", "Multi-track"],
    span: "normal",
  },
  {
    icon: Palette,
    title: "Custom Play-Test Avatar",
    description: "6 presets or build your own with body type, color and accessories.",
    tags: ["6 presets", "Customizer"],
    span: "normal",
  },
  {
    icon: Send,
    title: "Publish Everywhere",
    description: "One-click publish to itch.io, Crazy Games, GitHub Pages, or HTML5 web export.",
    tags: ["itch.io", "Crazy Games", "GitHub Pages"],
    span: "normal",
  },
  {
    icon: Layers,
    title: "666+ Properties Panel",
    description: "Massive Roblox Studio-style inspector. Collapsible groups, searchable, type-aware editors.",
    tags: ["666+ props", "Searchable", "Type-aware"],
    span: "wide",
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
    instructions: `# Build All In One Engine for Linux
# Run on a Linux machine (Ubuntu 20.04+ recommended)

# 1. Install dependencies
sudo apt update
sudo apt install -y python3 python3-pip nodejs npm

# 2. Clone the repo
git clone ${GITHUB_URL}.git
cd all-in-onen-engine

# 3. Build the AppImage
chmod +x build_linux.sh
./build_linux.sh

# 4. Run
./dist/AllInOneEngine-linux-x86_64.AppImage`,
  },
  {
    id: "mac", name: "macOS", icon: Apple, color: "#94a3b8",
    description: "Universal .dmg for Intel + Apple Silicon",
    instructions: `# Build All In One Engine for macOS
# Run on a Mac (macOS 11+ recommended)

# 1. Install Homebrew + dependencies
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install python@3.12 node bun

# 2. Clone the repo
git clone ${GITHUB_URL}.git
cd all-in-onen-engine

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
    instructions: `# Build All In One Engine for Chromebook
# Run on a Chromebook with Linux (Crostini) enabled

# 1. Enable Linux: Settings > Developers > Linux development environment
# 2. Open Terminal

# 3. Install dependencies
sudo apt update
sudo apt install -y python3 python3-pip nodejs npm git

# 4. Clone the repo
git clone ${GITHUB_URL}.git
cd all-in-onen-engine

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
      "Configure viewport dimensions and click 'Save & view'",
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
      "Wait for review (typically 2-5 business days)",
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
      "Your game is live at username.github.io/repo-name",
    ],
    url: `${GITHUB_URL}/settings/pages`,
  },
  {
    id: "html5", name: "HTML5 Standalone", icon: Globe, color: "#3b82f6",
    description: "Self-contained .zip you can host anywhere — your own server, S3, Netlify, etc.",
    steps: [
      "Click the 'Build HTML5' button in Studio",
      "A single index.html + game files are generated",
      "Test locally by opening index.html in a browser",
      "Upload the folder to any static host (Netlify, Vercel, S3, etc.)",
      "Share the URL with players",
    ],
    url: "#",
  },
];

const STEPS = [
  { title: "Launch the Studio", icon: Rocket, content: "Click 'Launch Studio' and pick an engine: Pygame 2D, Three.js 3D, or Zhitlow 3D." },
  { title: "Pick a Template", icon: Wand2, content: "Load one of 4 starter templates — Platformer, Shooter, Arena or 3D Sandbox — with one click." },
  { title: "Edit Your Game", icon: Code2, content: "Modify the code in Monaco. Ctrl+S to save, F5 to run at 60 FPS in the live preview." },
  { title: "Add Assets", icon: Upload, content: "Drag sprites from the Toolbox, or upload your own .glb / .wav / .png files." },
  { title: "Pick Your Avatar", icon: Palette, content: "Choose from 6 presets or customize body, color and accessories for play-test mode." },
  { title: "Test Multiplayer", icon: Users, content: "Run ./start-multiplayer.sh, open 2 tabs, load the Arena template — both avatars sync live." },
  { title: "Publish Your Game", icon: Send, content: "Hit Publish and choose itch.io, Crazy Games, GitHub Pages, or standalone HTML5." },
  { title: "Build an .exe", icon: Package, content: "Optionally run the build scripts for Windows, Linux, macOS or Chromebook installers." },
];

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
].map(A);

const NAV_SECTIONS = [
  { id: "home", label: "Home" },
  { id: "engines", label: "Engines" },
  { id: "showreel", label: "Showreel" },
  { id: "features", label: "Features" },
  { id: "how", label: "How it works" },
  { id: "download", label: "Download" },
  { id: "publish", label: "Publish" },
];

export function LandingPage({
  onLaunchIDE,
  onLaunch3DStudio,
}: {
  onLaunchIDE: () => void;
  onLaunch3DStudio: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [showEnginePicker, setShowEnginePicker] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      const ids = NAV_SECTIONS.map((s) => s.id);
      let current = "home";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 140) current = id;
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Reveal-on-scroll
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".reveal"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleLaunchClick = () => setShowEnginePicker(true);

  const handlePickEngine = (engine: EngineKind) => {
    useStudio.getState().setEngineKind(engine);
    setShowEnginePicker(false);
    if (engine === "pygame2d") {
      onLaunchIDE();
    } else {
      onLaunch3DStudio();
    }
    toast.success(`Launched ${ENGINES.find((e) => e.id === engine)?.name}`, {
      description: ENGINES.find((e) => e.id === engine)?.tagline,
    });
  };

  return (
    <div className="min-h-screen text-white ae-page" style={{ overflowX: "hidden" }}>
      <style jsx global>{`
        html { scroll-behavior: smooth; }
        .ae-page {
          background: #06060a;
          font-family: var(--font-geist-sans), sans-serif;
        }
        ::selection { background: rgba(217, 70, 239, 0.4); }

        /* ---------- ambient background ---------- */
        .ae-grid-overlay {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse 90% 60% at 50% 0%, black 30%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 90% 60% at 50% 0%, black 30%, transparent 100%);
        }
        .ae-aurora {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          overflow: hidden;
        }
        .ae-blob { position: absolute; border-radius: 9999px; filter: blur(110px); }
        .ae-blob-1 { width: 640px; height: 640px; top: -220px; left: -140px;
          background: radial-gradient(circle, rgba(139,92,246,0.22), transparent 65%);
          animation: ae-drift 16s ease-in-out infinite; }
        .ae-blob-2 { width: 560px; height: 560px; top: -160px; right: -120px;
          background: radial-gradient(circle, rgba(249,115,22,0.16), transparent 65%);
          animation: ae-drift 19s ease-in-out infinite reverse; }
        .ae-blob-3 { width: 520px; height: 520px; top: 34%; left: 38%;
          background: radial-gradient(circle, rgba(217,70,239,0.12), transparent 65%);
          animation: ae-drift 23s ease-in-out infinite; }
        @keyframes ae-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, 36px) scale(1.08); }
        }
        .ae-scanlines {
          position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.35;
          background: repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 3px);
        }

        /* ---------- glass + cards ---------- */
        .ae-glass {
          background: rgba(255,255,255,0.028);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .ae-card {
          position: relative;
          background: linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015));
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.35s, box-shadow 0.35s;
        }
        .ae-card:hover {
          transform: translateY(-4px);
          border-color: rgba(217,70,239,0.45);
          box-shadow: 0 24px 60px -24px rgba(139,92,246,0.45), 0 0 0 1px rgba(217,70,239,0.15) inset;
        }
        .ae-card-engine:hover { border-color: rgba(255,255,255,0.18); }
        .ae-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-geist-mono), monospace;
          font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 9999px; padding: 6px 14px;
          background: rgba(255,255,255,0.03);
        }
        .ae-gradient-text {
          background: linear-gradient(92deg, #a78bfa 0%, #e879f9 45%, #fb923c 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .ae-btn-primary {
          position: relative;
          background: linear-gradient(92deg, #8b5cf6, #d946ef, #f97316);
          background-size: 180% 100%;
          transition: background-position 0.5s, transform 0.25s, box-shadow 0.35s;
          box-shadow: 0 10px 34px -8px rgba(217,70,239,0.55);
        }
        .ae-btn-primary:hover {
          background-position: 100% 0;
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 16px 44px -8px rgba(217,70,239,0.7);
        }
        .ae-btn-ghost {
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.03);
          transition: background 0.25s, border-color 0.25s, transform 0.25s;
        }
        .ae-btn-ghost:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.25);
          transform: translateY(-2px);
        }

        /* ---------- hero pixel sprites ---------- */
        .ae-pixel { image-rendering: pixelated; }
        .ae-float { animation: ae-float 6s ease-in-out infinite; }
        @keyframes ae-float {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-16px) rotate(3deg); }
        }
        .ae-float-2 { animation: ae-float-b 7.5s ease-in-out infinite; }
        @keyframes ae-float-b {
          0%, 100% { transform: translateY(0) rotate(4deg); }
          50% { transform: translateY(-20px) rotate(-4deg); }
        }

        /* ---------- marquee ---------- */
        .ae-marquee-track { animation: ae-marquee 36s linear infinite; }
        .ae-marquee-track:hover { animation-play-state: paused; }
        @keyframes ae-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* ---------- reveal on scroll ---------- */
        .reveal {
          opacity: 0; transform: translateY(28px);
          transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .reveal.is-visible { opacity: 1; transform: translateY(0); }

        /* ---------- bento ---------- */
        .ae-bento { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (min-width: 1024px) {
          .ae-bento { grid-template-columns: repeat(6, 1fr); }
          .ae-bento .span-big { grid-column: span 4; grid-row: span 2; }
          .ae-bento .span-tall { grid-column: span 2; grid-row: span 2; }
          .ae-bento .span-wide { grid-column: span 6; }
          .ae-bento .span-normal { grid-column: span 2; }
        }
        @media (max-width: 1023px) {
          .ae-bento .span-big, .ae-bento .span-tall, .ae-bento .span-wide, .ae-bento .span-normal { grid-column: span 3; }
        }

        /* ---------- steps connector ---------- */
        .ae-step-num {
          font-family: var(--font-geist-mono), monospace;
          font-size: 44px; font-weight: 700; line-height: 1;
          color: transparent;
          -webkit-text-stroke: 1.5px rgba(217,70,239,0.55);
        }

        /* ---------- nav ---------- */
        .ae-nav-link {
          position: relative; color: rgba(255,255,255,0.55);
          transition: color 0.25s;
        }
        .ae-nav-link:hover { color: #fff; }
        .ae-nav-link.active { color: #fff; }
        .ae-nav-link.active::after {
          content: ""; position: absolute; left: 0; right: 0; bottom: -6px; height: 2px;
          border-radius: 2px;
          background: linear-gradient(90deg, #8b5cf6, #d946ef, #f97316);
        }

        /* ---------- glow ring for engine icons ---------- */
        .ae-engine-glow { position: relative; }
        .ae-engine-glow::before {
          content: ""; position: absolute; inset: -14px; border-radius: 9999px;
          background: radial-gradient(circle, rgba(var(--glow-rgb), 0.35), transparent 70%);
          opacity: 0; transition: opacity 0.4s;
        }
        .ae-engine-card:hover .ae-engine-glow::before { opacity: 1; }
      `}</style>

      {/* Ambient background */}
      <div className="ae-grid-overlay" />
      <div className="ae-aurora">
        <div className="ae-blob ae-blob-1" />
        <div className="ae-blob ae-blob-2" />
        <div className="ae-blob ae-blob-3" />
      </div>
      <div className="ae-scanlines" />

      {/* ============ NAV ============ */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "ae-glass" : ""}`} style={{ padding: scrolled ? "10px 0" : "18px 0" }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <button onClick={() => scrollTo("home")} className="flex items-center gap-2.5 group">
            <img src={A("/icon.svg")} alt="All In One Engine" className="w-9 h-9 group-hover:rotate-12 transition-transform duration-300 ae-drop-shadow" />
            <div className="text-left">
              <div className="font-bold text-[15px] leading-tight tracking-tight">
                All In One <span className="ae-gradient-text">Engine</span>
              </div>
              <div className="text-[10px] text-white/40 leading-tight font-mono tracking-widest uppercase">2D · 3D · MULTIPLAYER</div>
            </div>
          </button>
          <div className="hidden lg:flex items-center gap-7 text-[13px] font-medium">
            {NAV_SECTIONS.map((s) => (
              <button key={s.id} onClick={() => scrollTo(s.id)} className={`ae-nav-link ${activeSection === s.id ? "active" : ""}`}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="p-2 rounded-lg ae-btn-ghost" aria-label="GitHub">
              <Github className="w-4 h-4" />
            </a>
            <button onClick={handleLaunchClick} className="px-4 py-2 rounded-lg ae-btn-primary text-sm font-semibold">
              Launch Studio
            </button>
          </div>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section id="home" className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-28 pb-16">
        {/* background video: someone building an RPG with the engine */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <video
            className="absolute inset-0 w-full h-full object-cover ae-hero-video"
            autoPlay muted loop playsInline preload="auto"
            poster={A("/videos/rpg-poster.jpg")}
          >
            <source src={A("/videos/rpg-build.mp4")} type="video/mp4" />
          </video>
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 42%, rgba(10,11,14,0.55) 0%, rgba(10,11,14,0.82) 62%, #0a0b0e 100%)" }} />
          <div className="absolute inset-x-0 bottom-0 h-40" style={{ background: "linear-gradient(to bottom, transparent, #0a0b0e)" }} />
        </div>

        <div ref={heroRef} className="max-w-6xl mx-auto text-center relative">
          {/* floating pixel sprites */}
          <div className="hidden md:block absolute -left-24 top-10 ae-float opacity-90 pointer-events-none">
            <img src={A("/sprites/player/knight.png")} alt="" className="w-20 h-20 ae-pixel" style={{ imageRendering: "pixelated" }} />
          </div>
          <div className="hidden md:block absolute -right-20 top-24 ae-float-2 opacity-90 pointer-events-none">
            <img src={A("/sprites/enemies/slime_purple.png")} alt="" className="w-16 h-16 ae-pixel" style={{ imageRendering: "pixelated" }} />
          </div>
          <div className="hidden lg:block absolute left-10 bottom-24 ae-float-2 opacity-70 pointer-events-none">
            <img src={A("/sprites/props/portal.png")} alt="" className="w-14 h-14 ae-pixel" style={{ imageRendering: "pixelated" }} />
          </div>
          <div className="hidden lg:block absolute right-16 bottom-40 ae-float opacity-70 pointer-events-none">
            <img src={A("/sprites/coins/coin_gold.png")} alt="" className="w-12 h-12 ae-pixel" style={{ imageRendering: "pixelated" }} />
          </div>

          <div className="ae-eyebrow mb-8">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            v3.1 — RPG Template · First-Person Play Test · Blender-style Components
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[86px] font-bold tracking-tight leading-[1.02] mb-6">
            Build 2D &amp; 3D games
            <br />
            <span className="ae-gradient-text">all in one engine.</span>
          </h1>

          <p className="text-base md:text-lg text-white/55 max-w-2xl mx-auto mb-10 leading-relaxed">
            A Roblox Studio-style IDE that lives in your browser. Write Python or JavaScript,
            hit <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-[0.8em] font-mono">Play</kbd> and get locked into first person at 60 FPS.
            Three engines, 134 sprites, a playable RPG template, multiplayer, publishing — zero installs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
            <button onClick={handleLaunchClick} className="group flex items-center gap-2 px-7 py-3.5 rounded-xl ae-btn-primary font-semibold text-[15px]">
              <Play className="w-4 h-4 fill-current" />
              Launch Studio
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => scrollTo("download")} className="flex items-center gap-2 px-7 py-3.5 rounded-xl ae-btn-ghost font-semibold text-[15px]">
              <Download className="w-4 h-4" />
              Download Desktop
            </button>
            <a href={LIVE_URL} target="_blank" rel="noreferrer" className="hidden sm:flex items-center gap-2 px-6 py-3.5 rounded-xl ae-btn-ghost font-semibold text-[15px] text-white/80">
              <Globe className="w-4 h-4" />
              Live Site
            </a>
          </div>

          {/* stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[
              { label: "Sprites included", value: "134", icon: <Boxes className="w-3.5 h-3.5" /> },
              { label: "Engine systems", value: "50+", icon: <Layers className="w-3.5 h-3.5" /> },
              { label: "Properties / entity", value: "666", icon: <Cpu className="w-3.5 h-3.5" /> },
              { label: "FPS in browser", value: "60", icon: <Zap className="w-3.5 h-3.5" /> },
            ].map((s) => (
              <div key={s.label} className="ae-glass rounded-2xl px-4 py-4">
                <div className="flex items-center justify-center gap-1.5 text-fuchsia-400 mb-1.5">{s.icon}</div>
                <div className="text-3xl font-bold tracking-tight">{s.value}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-[0.18em] font-mono mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => scrollTo("engines")} className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce text-white/30 hover:text-white/70 transition-colors" aria-label="Scroll down">
          <ChevronDown className="w-6 h-6" />
        </button>
      </section>

      {/* ============ SHOWREEL ============ */}
      <section id="showreel" className="relative z-10 py-24 px-6 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 reveal">
            <div className="ae-eyebrow mb-5">
              <Play className="w-3.5 h-3.5 text-cyan-400" />
              Showreel — recorded inside 3D Studio
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Watch an RPG get built <span className="ae-gradient-text">with the engine</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              This is a real capture of the 3D Studio workflow: placing assets from the palette,
              pressing Play, and running the RPG Village Quest template in first person —
              collecting coins, opening chests and fighting slimes.
            </p>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-white/10 ae-video-glow reveal">
            <video
              className="w-full aspect-video object-cover bg-black"
              controls preload="metadata"
              poster={A("/videos/rpg-poster.jpg")}
            >
              <source src={A("/videos/rpg-build.mp4")} type="video/mp4" />
              Your browser does not support HTML5 video.
            </video>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-6 reveal">
            {[
              "RPG Village Quest template",
              "Asset palette: Castle Tower · Fountain · Treasure Chest",
              "First-person play test with pointer lock",
              "Quest: 8 coins · 2 chests · Elder Rowan · 3 slimes",
            ].map((chip) => (
              <span key={chip} className="text-[11px] px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/55">{chip}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ENGINES ============ */}
      <section id="engines" className="relative z-10 py-24 px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14 reveal">
            <div className="ae-eyebrow mb-5">
              <Wand2 className="w-3.5 h-3.5 text-violet-400" />
              Three engines, one IDE
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Pick your engine <span className="ae-gradient-text">on launch</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              2D Pygame, 3D Three.js, or experimental Zhitlow 3D — every engine launches from the same studio, and you can switch anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {ENGINES.map((e, i) => (
              <button
                key={e.id}
                onClick={() => handlePickEngine(e.id)}
                className={`ae-card ae-card-engine text-left p-7 group reveal ${i === 1 ? "md:-translate-y-3" : ""}`}
                style={{ transitionDelay: `${i * 90}ms` }}
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className="ae-engine-glow" style={{ "--glow-rgb": e.glow } as React.CSSProperties}>
                    <img src={e.iconSrc} alt={e.name} className="w-14 h-14 relative z-10" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold leading-tight">{e.name}</h3>
                    <p className="text-xs text-fuchsia-400 font-mono mt-0.5">{e.tagline}</p>
                  </div>
                </div>
                <p className="text-sm text-white/55 mb-5 leading-relaxed">{e.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {e.tags.map((t) => (
                    <span key={t} className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 border border-white/8 text-white/55 font-medium">{t}</span>
                  ))}
                </div>
                <div className="rounded-xl bg-black/40 border border-white/5 p-3.5 mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 font-mono">Latest updates</span>
                    <span className="text-[9px] text-white/30 ml-auto font-mono">{e.version} · {e.lastUpdate}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {e.updates.map((u, j) => (
                      <li key={j} className="text-[11px] text-white/50 flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-fuchsia-400 flex-shrink-0 mt-0.5" />
                        <span>{u}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-fuchsia-400 font-semibold">
                  <MousePointerClick className="w-3.5 h-3.5" />
                  Click to launch this engine
                  <ArrowRight className="w-3.5 h-3.5 ml-auto group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURES (BENTO) ============ */}
      <section id="features" className="relative z-10 py-24 px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14 reveal">
            <div className="ae-eyebrow mb-5">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              Everything you need to ship
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              One studio. <span className="ae-gradient-text">Every tool.</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Engine, editor, asset library, multiplayer, publishing and packaging — a complete 2D + 3D game dev platform.
            </p>
          </div>

          <div className="ae-bento">
            {FEATURES.map((f) => (
              <div key={f.title} className={`ae-card p-6 reveal span-${f.span}`}>
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 border border-white/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-fuchsia-300" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed mb-4">{f.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-auto">
                  {f.tags.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-white/45 font-mono">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Templates */}
          <div className="mt-24 reveal">
            <div className="text-center mb-10">
              <div className="ae-eyebrow mb-5">
                <Wand2 className="w-3.5 h-3.5 text-violet-400" />
                Starter templates
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Start in seconds, <span className="ae-gradient-text">ship in hours</span>
              </h2>
              <p className="text-white/50 max-w-2xl mx-auto">
                Load a complete, working game with one click — then customize it into your own.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {TEMPLATES.map((t, i) => (
                <div key={t.name} className="ae-card p-5 group reveal" style={{ transitionDelay: `${i * 70}ms` }}>
                  <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform" style={{ background: t.gradient }}>
                    <t.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold mb-1">{t.name}</h3>
                  <p className="text-xs text-white/45 leading-relaxed">{t.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ SPRITE MARQUEE ============ */}
      <section className="relative z-10 py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-10 text-center reveal">
          <div className="ae-eyebrow mb-5">
            <Boxes className="w-3.5 h-3.5 text-fuchsia-400" />
            134 sprites included
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Drag them straight <span className="ae-gradient-text">into your game</span>
          </h2>
          <p className="text-white/50">From knights to crystals to castles — all yours, all free, all MIT-licensed.</p>
        </div>
        <div className="relative reveal">
          <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-[#06060a] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-[#06060a] to-transparent z-10" />
          <div className="flex gap-3 ae-marquee-track" style={{ width: "max-content" }}>
            {[...SPRITE_LIST, ...SPRITE_LIST].map((s, i) => (
              <div key={i} className="w-16 h-16 ae-glass rounded-xl p-2.5 hover:scale-110 hover:border-fuchsia-500/60 hover:shadow-lg hover:shadow-fuchsia-500/20 transition-all cursor-pointer flex-shrink-0">
                <img src={s} alt="" className="w-full h-full object-contain" style={{ imageRendering: "pixelated" }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" className="relative z-10 py-24 px-6 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 reveal">
            <div className="ae-eyebrow mb-5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              How it works
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              From zero to published <span className="ae-gradient-text">in 8 steps</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Follow the flow — most people ship their first playable game in under an hour.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {STEPS.map((step, i) => (
              <div key={i} className="ae-card p-6 flex gap-5 items-start reveal" style={{ transitionDelay: `${(i % 2) * 80}ms` }}>
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <span className="ae-step-num">{String(i + 1).padStart(2, "0")}</span>
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 border border-white/10 flex items-center justify-center">
                    <step.icon className="w-4 h-4 text-fuchsia-300" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold mb-1.5">{step.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{step.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ DOWNLOAD ============ */}
      <section id="download" className="relative z-10 py-24 px-6 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 reveal">
            <div className="ae-eyebrow mb-5">
              <Download className="w-3.5 h-3.5 text-green-400" />
              Get All In One Engine
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Free. Open source. <span className="ae-gradient-text">Cross-platform.</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Run it in your browser right now, or build a native installer for Linux, macOS or Chromebook.
            </p>
          </div>

          {/* Run in browser — hero CTA */}
          <div className="ae-card p-10 text-center mb-6 reveal" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.14), rgba(217,70,239,0.08) 50%, rgba(249,115,22,0.1))" }}>
            <Rocket className="w-11 h-11 text-fuchsia-400 mb-4 mx-auto" />
            <h3 className="text-2xl font-bold mb-2">Run in Browser — Recommended</h3>
            <p className="text-sm text-white/55 mb-6 max-w-md mx-auto">Launch the IDE right now. No install, no account. Works in any modern browser on any OS.</p>
            <button onClick={handleLaunchClick} className="px-8 py-3.5 rounded-xl ae-btn-primary font-semibold inline-flex items-center gap-2">
              <Play className="w-4 h-4 fill-current" />
              Launch Web Studio
            </button>
          </div>

          {/* Platform downloads */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {DOWNLOAD_TARGETS.map((target, i) => (
              <div key={target.id} className="ae-card p-6 reveal" style={{ transitionDelay: `${i * 70}ms` }}>
                <target.icon className="w-9 h-9 mb-4" style={{ color: target.color }} />
                <h3 className="font-bold mb-1">{target.name}</h3>
                <p className="text-xs text-white/45 mb-5">{target.description}</p>
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
                  className="w-full px-3 py-2.5 rounded-lg ae-btn-ghost text-xs font-semibold transition-all"
                >
                  <Download className="w-3.5 h-3.5 inline mr-1.5" />
                  Download Build Script
                </button>
              </div>
            ))}
          </div>

          {/* Quick start terminal */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="ae-card p-0 overflow-hidden reveal">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/8 bg-black/30">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                <span className="text-[10px] font-mono text-white/35 ml-2">quick-start.sh</span>
              </div>
              <pre className="text-xs font-mono p-5 leading-relaxed overflow-x-auto text-white/70"><code>{`# 1. Clone the repo
git clone ${GITHUB_URL}.git
cd all-in-onen-engine

# 2. Install dependencies
bun install   # or: npm install

# 3. (Optional) Start multiplayer relay
./start-multiplayer.sh

# 4. Launch the IDE
bun run dev   # → http://localhost:3000`}</code></pre>
            </div>
            <div className="ae-card p-8 flex flex-col items-center justify-center text-center reveal" style={{ transitionDelay: "80ms" }}>
              <Github className="w-10 h-10 text-white/80 mb-4" />
              <h3 className="font-bold mb-1.5">Clone from GitHub</h3>
              <p className="text-xs text-white/45 mb-5 max-w-xs">Get the full source code. MIT-licensed. Contributions welcome!</p>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg ae-btn-ghost text-sm font-semibold">
                <Github className="w-4 h-4" />
                View on GitHub
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PUBLISH ============ */}
      <section id="publish" className="relative z-10 py-24 px-6 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 reveal">
            <div className="ae-eyebrow mb-5">
              <Send className="w-3.5 h-3.5 text-pink-400" />
              Publish your game
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Build once. <span className="ae-gradient-text">Publish everywhere.</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Ship to itch.io, Crazy Games, GitHub Pages or standalone HTML5 — step-by-step instructions included for each.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {PUBLISH_TARGETS.map((target, i) => (
              <div key={target.id} className="ae-card p-6 reveal" style={{ transitionDelay: `${(i % 2) * 80}ms` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center border border-white/10" style={{ background: `${target.color}22` }}>
                    <target.icon className="w-5 h-5" style={{ color: target.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold">{target.name}</h3>
                    <p className="text-xs text-white/45">{target.description}</p>
                  </div>
                </div>
                <ol className="space-y-2.5 mb-4">
                  {target.steps.map((step, j) => (
                    <li key={j} className="flex gap-2.5 text-xs">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-violet-500/40 to-fuchsia-500/30 border border-white/10 flex items-center justify-center text-[10px] font-bold font-mono">
                        {j + 1}
                      </span>
                      <span className="text-white/50 pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
                {target.url !== "#" && (
                  <a href={target.url} target="_blank" rel="noreferrer" className="text-xs text-fuchsia-400 hover:text-fuchsia-300 inline-flex items-center gap-1 font-semibold">
                    Open {target.name} <ArrowRight className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="ae-card p-6 reveal">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Tips for getting featured
            </h3>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
              {[
                "Add screenshots and a gameplay video to your store listing",
                "Write a clear description and tag your game well",
                "Test on multiple browsers before publishing",
                "Add mobile touch controls for broader reach",
                "Price it free for your first release to build an audience",
                "Share on social media with #AllInOneEngine",
              ].map((tip) => (
                <div key={tip} className="flex gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/50">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ ALLY-5 — AI GAME ASSISTANT ============ */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto reveal">
          <div className="text-center mb-14">
            <div className="flex justify-center mb-6">
              <div className="ally-av-ring" style={{ width: 84, height: 84 }}>
                <AllyAvatar size={72} />
              </div>
            </div>
            <div className="ae-eyebrow mb-5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              New face · new brain · ships in every Pygame studio
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-5">
              Meet <span className="ae-gradient-text">Ally-5</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              A real AI game developer built into the engine — now with her own smiling face, a 25-article game-dev
              brain, and deep context for huge code and long chats. Describe any game in one sentence and Ally-5
              writes a complete, playable <span className="text-emerald-300 font-mono text-[13px]">main.py</span> — then runs it. Five models. Zero setup. 100% in your browser.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-5">
            {/* Mock chat — spans 3 */}
            <div className="lg:col-span-3 ae-card p-0 overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                <AllyAvatar size={30} />
                <div>
                  <div className="text-[13px] font-bold text-white">Ally</div>
                  <div className="text-[9.5px] font-mono text-white/35 uppercase tracking-widest">Ally-5 Pro · ctx 128k · in your engine</div>
                </div>
                <div className="flex-1" />
                <span className="text-[9.5px] font-mono px-2 py-1 rounded-full border border-emerald-400/30 text-emerald-300">online</span>
              </div>
              <div className="p-4 md:p-5 space-y-3 bg-[#0b0d16]">
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-[13px] bg-gradient-to-br from-indigo-500/40 to-cyan-500/25 border border-indigo-400/30 text-indigo-50">
                    make me a neon snake game called Voltage
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[88%] rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[13px] bg-white/[0.04] border border-white/10 text-white/80 space-y-2">
                    <p>Done — I designed <b className="text-white">Voltage</b> (Snake) and wrote <code className="px-1 py-0.5 rounded bg-black/40 text-emerald-300 text-[11px] font-mono">main.py</code> with neon grid, glow trail and speed ramp.</p>
                    <pre className="rounded-lg bg-black/50 border border-emerald-400/20 p-2.5 text-[10.5px] font-mono text-emerald-200/85 overflow-hidden">{`from lapia_shim import Game, Scene, Vector2, Color

class SnakeScene(Scene):
    def on_load(self):
        self.snake = [Vector2(6, 9), Vector2(5, 9)]
        ...`}</pre>
                    <p className="text-[11.5px] text-white/45">Press Run ▶ to play — 24×18 grid, best-score tracking, game-over flow.</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-[13px] bg-gradient-to-br from-indigo-500/40 to-cyan-500/25 border border-indigo-400/30 text-indigo-50">
                    make it harder ⚡
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[88%] rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[13px] bg-white/[0.04] border border-white/10 text-white/80">
                    Speed bumped to <b className="text-emerald-300">140%</b>, step interval tightens as you score. main.py rewritten — hit Run ▶.
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: models + abilities */}
            <div className="lg:col-span-2 space-y-5">
              <div className="ae-card p-5">
                <h3 className="font-bold text-[15px] mb-1">The Ally-5 model family</h3>
                <p className="text-[11px] text-white/35 font-mono uppercase tracking-widest mb-4">5 models · one switch</p>
                <div className="space-y-2.5">
                  {[
                    ["#4ade80", "Ally-5 Nano", "instant answers · ctx 16k"],
                    ["#22d3ee", "Ally-5 Fast", "quick builds · ctx 64k"],
                    ["#818cf8", "Ally-5 Pro", "balanced default · ctx 128k"],
                    ["#f472b6", "Ally-5 Max", "deep thinking · ctx 256k"],
                    ["#fbbf24", "Ally-5 Game", "game genesis · ctx 200k"],
                  ].map(([c, n, d]) => (
                    <div key={n} className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c as string, boxShadow: `0 0 8px ${c}` }} />
                      <span className="text-[12.5px] font-semibold text-white/85 w-24">{n}</span>
                      <span className="text-[11px] text-white/40">{d}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ae-card p-5">
                <h3 className="font-bold text-[15px] mb-4">Also on board</h3>
                <div className="space-y-2.5">
                  {[
                    "Writes complete games from any prompt",
                    "Reads huge code — paste it, get a structure map",
                    "Game-dev brain: 25 articles (collision, game feel, level design…)",
                    "Remembers you — name, colors, difficulty taste",
                    "Terminal access — `ally make me a pong`",
                    "Explains the engine, line by line",
                    "Diagnoses errors before you hit Run",
                    "Knows all 134 toolbox sprites",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-xs">
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="text-white/55">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-10">
            <button onClick={handleLaunchClick} className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-xl ae-btn-primary font-bold">
              <Sparkles className="w-5 h-5" />
              Launch the studio &amp; meet Ally
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </button>
            <p className="text-[11px] text-white/30 font-mono mt-4">runs 100% locally in your browser — no API keys, no accounts, nothing leaves your machine</p>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center reveal">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-5">
            Ready to make <span className="ae-gradient-text">something?</span>
          </h2>
          <p className="text-white/50 max-w-lg mx-auto mb-9">
            Your next game is one click away. No installs, no signups — just open the studio and press Play.
          </p>
          <button onClick={handleLaunchClick} className="group inline-flex items-center gap-2.5 px-9 py-4 rounded-xl ae-btn-primary font-bold text-lg">
            <Play className="w-5 h-5 fill-current" />
            Launch Studio — it's free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <img src={A("/icon.svg")} alt="All In One Engine" className="w-7 h-7 ae-drop-shadow" />
              <div>
                <div className="text-sm font-bold">All In One <span className="ae-gradient-text">Engine</span></div>
                <div className="text-[10px] text-white/35 font-mono">MIT License · 2D + 3D + Multiplayer</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-white/45">
              {NAV_SECTIONS.map((s) => (
                <button key={s.id} onClick={() => scrollTo(s.id)} className="hover:text-white transition-colors">
                  {s.label}
                </button>
              ))}
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-white transition-colors">
                <Github className="w-3.5 h-3.5" /> GitHub
              </a>
            </div>
          </div>
          <div className="text-center text-[11px] text-white/25 mt-8 font-mono">
            © {new Date().getFullYear()} All In One Engine — made for people who want to make games
          </div>
        </div>
      </footer>

      {/* ============ ENGINE PICKER MODAL ============ */}
      {showEnginePicker && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          onClick={() => setShowEnginePicker(false)}
        >
          <div
            className="ae-glass rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "rgba(13,13,20,0.92)" }}
          >
            <div className="text-center mb-7">
              <div className="ae-eyebrow mb-4">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Choose your engine
              </div>
              <h2 className="text-2xl font-bold mb-2">Pick an engine to launch</h2>
              <p className="text-sm text-white/45">You can switch later. Each card shows the latest updates.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {ENGINES.map((e) => (
                <button
                  key={e.id}
                  onClick={() => handlePickEngine(e.id)}
                  className="ae-card ae-card-engine text-left p-5 hover:scale-[1.03] transition-all"
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <img src={e.iconSrc} alt={e.name} className="w-11 h-11" />
                    <div>
                      <h3 className="font-bold leading-tight">{e.name}</h3>
                      <p className="text-[11px] text-fuchsia-400 font-mono">{e.tagline}</p>
                    </div>
                  </div>
                  <p className="text-xs text-white/50 mb-3 leading-relaxed">{e.description}</p>
                  <div className="rounded-lg bg-black/40 border border-white/5 p-2.5 mb-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40 font-mono">Updates</span>
                      <span className="text-[9px] text-white/30 ml-auto font-mono">{e.version}</span>
                    </div>
                    <ul className="space-y-1">
                      {e.updates.map((u, i) => (
                        <li key={i} className="text-[10px] text-white/50 flex items-start gap-1">
                          <Check className="w-2.5 h-2.5 text-fuchsia-400 flex-shrink-0 mt-0.5" />
                          <span>{u}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {e.tags.map((t) => (
                      <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/8 text-white/45 font-mono">{t}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setShowEnginePicker(false)} className="mt-6 w-full px-4 py-2.5 rounded-lg ae-btn-ghost text-sm font-semibold">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

