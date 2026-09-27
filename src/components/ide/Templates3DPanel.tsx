"use client";

import { Boxes, FileCode2, Users, Gamepad2, Target, Zap, Castle } from "lucide-react";
import { useStudio } from "../../lib/studio-store";
import { toast } from "sonner";
import { useState } from "react";

interface Template3D {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  file: string;
  content: string;
  engine: "3d" | "2d";
}

const TEMPLATES_3D: Template3D[] = [
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
  {
    id: "3d-sandbox",
    name: "3D Sandbox",
    description: "Walk around a 3D world with WASD + mouse look (3D Studio)",
    icon: <Boxes className="w-4 h-4 text-cyan-400" />,
    engine: "3d",
    file: "3d_sandbox.json",
    content: `{"type":"3d-scene","objects":[{"id":"floor","name":"Floor","type":"plane","position":[0,0,0],"rotation":[-1.5708,0,0],"scale":[20,20,1],"color":"#16a34a"},{"id":"box1","name":"Box 1","type":"box","position":[3,1,0],"rotation":[0,0,0],"scale":[2,2,2],"color":"#3b82f6"},{"id":"sphere1","name":"Sphere 1","type":"sphere","position":[-3,1,0],"rotation":[0,0,0],"scale":[1,1,1],"color":"#ef4444"},{"id":"cylinder1","name":"Pillar","type":"cylinder","position":[0,1,3],"rotation":[0,0,0],"scale":[0.5,2,0.5],"color":"#9ca3af"},{"id":"light1","name":"Sun","type":"light","lightSubtype":"directional","position":[5,8,5],"rotation":[0,0,0],"scale":[1,1,1],"color":"#fff5e0","intensity":1.5}]}`,
  },
  {
    id: "3d-fps",
    name: "3D FPS Arena",
    description: "3D first-person arena with targets to shoot (3D Studio)",
    icon: <Target className="w-4 h-4 text-orange-400" />,
    engine: "3d",
    file: "3d_fps_arena.json",
    content: `{"type":"3d-scene","objects":[{"id":"floor","name":"Floor","type":"plane","position":[0,0,0],"rotation":[-1.5708,0,0],"scale":[30,30,1],"color":"#1f2937"},{"id":"wall1","name":"Wall North","type":"box","position":[0,2,-15],"rotation":[0,0,0],"scale":[30,4,1],"color":"#374151"},{"id":"wall2","name":"Wall South","type":"box","position":[0,2,15],"rotation":[0,0,0],"scale":[30,4,1],"color":"#374151"},{"id":"wall3","name":"Wall East","type":"box","position":[15,2,0],"rotation":[0,0,0],"scale":[1,4,30],"color":"#374151"},{"id":"wall4","name":"Wall West","type":"box","position":[-15,2,0],"rotation":[0,0,0],"scale":[1,4,30],"color":"#374151"},{"id":"target1","name":"Target 1","type":"sphere","position":[5,1,-5],"rotation":[0,0,0],"scale":[1,1,1],"color":"#ef4444"},{"id":"target2","name":"Target 2","type":"sphere","position":[-5,1,5],"rotation":[0,0,0],"scale":[1,1,1],"color":"#ef4444"},{"id":"target3","name":"Target 3","type":"sphere","position":[8,1,8],"rotation":[0,0,0],"scale":[1,1,1],"color":"#fbbf24"},{"id":"cover1","name":"Cover 1","type":"box","position":[3,1,3],"rotation":[0,0,0],"scale":[2,2,1],"color":"#6b7280"},{"id":"cover2","name":"Cover 2","type":"box","position":[-3,1,-3],"rotation":[0,0,0],"scale":[2,2,1],"color":"#6b7280"},{"id":"light1","name":"Sun","type":"light","lightSubtype":"directional","position":[10,15,10],"rotation":[0,0,0],"scale":[1,1,1],"color":"#fff5e0","intensity":2}]}`,
  },
  {
    id: "3d-castle",
    name: "3D Castle",
    description: "A real 3D castle with towers, walls, courtyard (3D Studio)",
    icon: <Castle className="w-4 h-4 text-purple-400" />,
    engine: "3d",
    file: "3d_castle.json",
    content: `{"type":"3d-scene","objects":[{"id":"floor","name":"Courtyard","type":"plane","position":[0,0,0],"rotation":[-1.5708,0,0],"scale":[20,20,1],"color":"#16a34a"},{"id":"keep","name":"Keep","type":"box","position":[0,3,0],"rotation":[0,0,0],"scale":[4,6,4],"color":"#9ca3af"},{"id":"tower1","name":"Tower NW","type":"cylinder","position":[-5,4,-5],"rotation":[0,0,0],"scale":[1.5,8,1.5],"color":"#6b7280"},{"id":"tower2","name":"Tower NE","type":"cylinder","position":[5,4,-5],"rotation":[0,0,0],"scale":[1.5,8,1.5],"color":"#6b7280"},{"id":"tower3","name":"Tower SW","type":"cylinder","position":[-5,4,5],"rotation":[0,0,0],"scale":[1.5,8,1.5],"color":"#6b7280"},{"id":"tower4","name":"Tower SE","type":"cylinder","position":[5,4,5],"rotation":[0,0,0],"scale":[1.5,8,1.5],"color":"#6b7280"},{"id":"wall_n","name":"Wall North","type":"box","position":[0,2,-5],"rotation":[0,0,0],"scale":[10,4,0.5],"color":"#71717a"},{"id":"wall_s","name":"Wall South","type":"box","position":[0,2,5],"rotation":[0,0,0],"scale":[10,4,0.5],"color":"#71717a"},{"id":"wall_e","name":"Wall East","type":"box","position":[5,2,0],"rotation":[0,0,0],"scale":[0.5,4,10],"color":"#71717a"},{"id":"wall_w","name":"Wall West","type":"box","position":[-5,2,0],"rotation":[0,0,0],"scale":[0.5,4,10],"color":"#71717a"},{"id":"gate","name":"Gate","type":"box","position":[0,1,-5],"rotation":[0,0,0],"scale":[3,2,0.6],"color":"#92400e"},{"id":"flag_pole","name":"Flag Pole","type":"cylinder","position":[0,7,0],"rotation":[0,0,0],"scale":[0.1,4,0.1],"color":"#92400e"},{"id":"flag","name":"Flag","type":"plane","position":[0.5,8,0],"rotation":[0,1.5708,0],"scale":[1,0.6,1],"color":"#dc2626"},{"id":"light1","name":"Sun","type":"light","lightSubtype":"directional","position":[10,15,10],"rotation":[0,0,0],"scale":[1,1,1],"color":"#fff5e0","intensity":1.5}]}`,
  },
  {
    id: "multiplayer-3d",
    name: "3D Multiplayer Arena",
    description: "3D arena for 2-4 players via socket.io (3D Studio)",
    icon: <Users className="w-4 h-4 text-pink-400" />,
    engine: "3d",
    file: "3d_multiplayer.json",
    content: `{"type":"3d-scene","objects":[{"id":"floor","name":"Arena Floor","type":"plane","position":[0,0,0],"rotation":[-1.5708,0,0],"scale":[25,25,1],"color":"#1e293b"},{"id":"spawn1","name":"Spawn 1","type":"box","position":[-8,0.5,-8],"rotation":[0,0,0],"scale":[1,1,1],"color":"#3b82f6"},{"id":"spawn2","name":"Spawn 2","type":"box","position":[8,0.5,-8],"rotation":[0,0,0],"scale":[1,1,1],"color":"#8b5cf6"},{"id":"spawn3","name":"Spawn 3","type":"box","position":[-8,0.5,8],"rotation":[0,0,0],"scale":[1,1,1],"color":"#fbbf24"},{"id":"spawn4","name":"Spawn 4","type":"box","position":[8,0.5,8],"rotation":[0,0,0],"scale":[1,1,1],"color":"#ef4444"},{"id":"cover1","name":"Cover 1","type":"box","position":[0,1,0],"rotation":[0,0,0],"scale":[3,2,1],"color":"#475569"},{"id":"cover2","name":"Cover 2","type":"box","position":[4,1,-4],"rotation":[0,0.785,0],"scale":[2,2,1],"color":"#475569"},{"id":"cover3","name":"Cover 3","type":"box","position":[-4,1,4],"rotation":[0,0.785,0],"scale":[2,2,1],"color":"#475569"},{"id":"light1","name":"Sun","type":"light","lightSubtype":"directional","position":[10,15,10],"rotation":[0,0,0],"scale":[1,1,1],"color":"#fff5e0","intensity":1.5},{"id":"light2","name":"Arena Light","type":"light","lightSubtype":"point","position":[0,8,0],"rotation":[0,0,0],"scale":[1,1,1],"color":"#3b82f6","intensity":1}]}`,
  },
];

export function Templates3DPanel() {
  const { createFile, openFile, setFile, addConsole } = useStudio();
  const [activeEngine, setActiveEngine] = useState<"all" | "2d" | "3d">("all");

  const handleUse = (tpl: Template3D) => {
    createFile(tpl.file, tpl.engine === "3d" ? "text" : "python");
    useStudio.getState().setFile(tpl.file, tpl.content, tpl.engine === "3d" ? "text" : "python");
    openFile(tpl.file);
    toast.success(`Loaded template: ${tpl.name}`, {
      description: tpl.description,
    });
    addConsole("success", `Template loaded: ${tpl.name} (${tpl.engine.toUpperCase()})`);
  };

  const filtered = activeEngine === "all" ? TEMPLATES_3D : TEMPLATES_3D.filter(t => t.engine === activeEngine);

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
