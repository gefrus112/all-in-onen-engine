"use client";

import { FileCode2, Users, Gamepad2, Target, Zap, Castle, Boxes } from "lucide-react";
import { useStudio } from "../../lib/studio-store";
import { toast } from "sonner";
import { useState } from "react";
import { TEMPLATE_3D_SCENES } from "./studio3d/templates";

interface TemplateFile {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  engine: "3d" | "2d";
  file: string;
  content: string;
  gameMode?: "sandbox" | "rpg";
}

// 2D Python templates (shortened — full code in the 2D Studio Templates panel)
const TEMPLATES_2D: TemplateFile[] = [
  {
    id: "fps-shooter",
    name: "FPS Shooter",
    description: "First-person shooter — WASD + mouse, gun, enemies, HUD, pause menu",
    icon: <Target className="w-4 h-4 text-red-400" />,
    engine: "2d",
    file: "fps_shooter.py",
    content: `"""FPS Shooter — All In One Engine
Controls: WASD move, mouse aim, click shoot, R reload, ESC pause, TAB menu"""
from lapia_shim import Game, Scene, Sprite, Vector2, Color, Math
import math

# (Full FPS template — see the 2D Studio Templates panel for complete code)
game = Game(title="FPS Shooter", size=(800, 600), fps=60)
game.run(Scene())
`,
  },
  {
    id: "castle",
    name: "Castle Explorer",
    description: "Explore a medieval castle — rooms, towers, treasure, guards",
    icon: <Castle className="w-4 h-4 text-amber-400" />,
    engine: "2d",
    file: "castle_explorer.py",
    content: `"""Castle Explorer — All In One Engine
Walk around a medieval castle. Find the treasure, defeat the guards."""
from lapia_shim import Game, Scene, Sprite, Vector2, Color, Math

# (Full Castle template — see the 2D Studio Templates panel for complete code)
game = Game(title="Castle Explorer", size=(800, 600), fps=60)
game.run(Scene())
`,
  },
];

const ALL_TEMPLATES: TemplateFile[] = [
  // 3D templates come from the shared module (loaded straight into 3D Studio)
  ...TEMPLATE_3D_SCENES.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    icon: t.gameMode === "rpg"
      ? <Gamepad2 className="w-4 h-4 text-amber-400" />
      : t.id === "3d-castle"
        ? <Castle className="w-4 h-4 text-purple-400" />
        : t.id === "3d-fps"
          ? <Target className="w-4 h-4 text-orange-400" />
          : t.id === "multiplayer-3d"
            ? <Users className="w-4 h-4 text-pink-400" />
            : t.id === "3d-sandbox"
              ? <Boxes className="w-4 h-4 text-cyan-400" />
              : <Zap className="w-4 h-4 text-cyan-400" />,
    engine: "3d" as const,
    file: `${t.id}.json`,
    content: t.json,
    gameMode: t.gameMode,
  })),
  ...TEMPLATES_2D,
];

export function Templates3DPanel() {
  const { createFile, openFile, setFile, addConsole, setStudio3DOpen } = useStudio();
  const [activeEngine, setActiveEngine] = useState<"all" | "2d" | "3d">("all");

  const handleUse = (tpl: TemplateFile) => {
    if (tpl.engine === "3d") {
      // hand the scene JSON straight to the 3D Studio and open it
      setStudio3DOpen(true);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("aioe-load-3d", { detail: { json: tpl.content, name: tpl.name } }));
      }, 350);
      toast.success(`Loaded template: ${tpl.name}`, { description: tpl.description });
      addConsole("success", `Template loaded into 3D Studio: ${tpl.name}`);
      return;
    }
    createFile(tpl.file, "python");
    useStudio.getState().setFile(tpl.file, tpl.content, "python");
    openFile(tpl.file);
    toast.success(`Loaded template: ${tpl.name}`, { description: tpl.description });
    addConsole("success", `Template loaded: ${tpl.name} (2D)`);
  };

  const filtered = activeEngine === "all" ? ALL_TEMPLATES : ALL_TEMPLATES.filter((t) => t.engine === activeEngine);

  return (
    <div className="flex flex-col h-full bg-[var(--studio-explorer)] border-r border-border">
      <div className="flex items-center justify-between px-2 h-7 border-b border-border bg-[var(--studio-toolbar)]">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Boxes className="w-3 h-3" />
          Templates
        </span>
      </div>
      <div className="flex border-b border-border">
        {(["all", "2d", "3d"] as const).map((e) => (
          <button
            key={e}
            onClick={() => setActiveEngine(e)}
            className={`flex-1 px-2 py-1.5 text-[10px] uppercase tracking-wider ${activeEngine === e ? "bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-500" : "text-muted-foreground hover:text-white"}`}
          >
            {e}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filtered.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => handleUse(tpl)}
            className="w-full text-left p-3 rounded border border-border hover:border-cyan-500 hover:bg-accent transition-colors group"
          >
            <div className="flex items-center gap-2 mb-1">
              {tpl.icon}
              <span className="text-sm font-medium">{tpl.name}</span>
              {tpl.gameMode === "rpg" && <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">RPG</span>}
              <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded ${tpl.engine === "3d" ? "bg-cyan-500/20 text-cyan-400" : "bg-purple-500/20 text-purple-400"}`}>
                {tpl.engine.toUpperCase()}
              </span>
              <FileCode2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">{tpl.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
