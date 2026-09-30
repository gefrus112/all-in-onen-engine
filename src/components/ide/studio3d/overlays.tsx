// All In One Engine — 3D Studio floating overlay panels
"use client";

import {
  X, Rocket, Code2, Palette, User, Play, Send, Sparkles, Boxes, FileCode2,
  Terminal, Trash2, Mountain, Waves, MousePointer2, Type, Layout, Menu,
  Square as SquareIcon, Sun,
} from "lucide-react";
import { useState } from "react";
import type { GUIElement, DebugLogEntry } from "./types";

const uid = () => Math.random().toString(36).slice(2, 10);

// ================= Welcome card =================
export function WelcomeCard({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"welcome" | "updates">("welcome");
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass rounded-2xl p-6 max-w-lg w-full relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded hover:bg-white/10"><X className="w-4 h-4" /></button>
        <div className="flex items-center gap-3 mb-5">
          <img src="/icon.svg" alt="All In One Engine" className="w-14 h-14" />
          <div>
            <h2 className="text-xl font-bold leading-tight">All In One 3D Studio</h2>
            <p className="text-xs text-cyan-400">v3.1 · First-person play test · Components · RPG template</p>
          </div>
        </div>
        <div className="flex border-b border-white/10 mb-4">
          {(["welcome", "updates"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-medium ${tab === t ? "text-white border-b-2 border-cyan-500" : "text-muted-foreground hover:text-white"}`}>
              {t === "welcome" ? "Welcome" : "What's New"}
            </button>
          ))}
        </div>
        {tab === "welcome" ? (
          <div className="space-y-2 mb-6">
            {[
              [<Rocket key="1" className="w-3.5 h-3.5 text-cyan-400" />, "Click objects to select — drag the gizmo to move, rotate, scale"],
              [<Play key="2" className="w-3.5 h-3.5 text-green-400" />, "Press Play: mouse is locked in first person — WASD + Shift to run, Space to jump"],
              [<Sparkles key="3" className="w-3.5 h-3.5 text-purple-400" />, "Add Components like Blender: Rigid Body, Script, Audio Source…"],
              [<Sun key="l" className="w-3.5 h-3.5 text-amber-400" />, "World tab: pick map lighting (Day, Golden Hour, Night…) and render settings"],
              [<Boxes key="4" className="w-3.5 h-3.5 text-pink-400" />, "New assets: Castle Tower, Fountain, Treasure Chest — palette size is adjustable"],
              [<User key="5" className="w-3.5 h-3.5 text-blue-400" />, "Load the RPG Village Quest template for a real playable RPG"],
            ].map(([icon, text], i) => (
              <div key={i} className="flex items-center gap-2 text-xs">{icon}<span>{text as string}</span></div>
            ))}
          </div>
        ) : (
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-yellow-400" /> Latest updates in v3.1
            </div>
            <ul className="space-y-1.5">
              {[
                "First-person play test with real pointer-lock mouse look (no more orbit)",
                "Esc exits play test; click the viewport to resume",
                "Blender-style Components panel — add/remove per-object components",
                "Map lighting presets: Daylight, Golden Hour, Night, Dawn, Underworld",
                "Rendering controls: shadows, shadow map size, tone mapping, exposure, FOV",
                "Real move / rotate / scale gizmos with optional grid snapping",
                "3 new compound assets: Castle Tower, Fountain, Treasure Chest",
                "Adjustable asset palette size (S / M / L)",
                "RPG Village Quest template — coins, chests, NPCs, slimes, a full quest",
                "New tools: focus selection (F), screenshot, snap toggle",
              ].map((u, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" /><span>{u}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <button onClick={onClose} className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-sm font-medium transition-all">
          Get Started
        </button>
      </div>
    </div>
  );
}
// ================= Code panel =================
export function CodePanel({ codeTab, setCodeTab, scriptCode, cssCode, jsCode, setScriptCode, setCssCode, setJsCode, onClose }: {
  codeTab: "script" | "css" | "js";
  setCodeTab: (t: "script" | "css" | "js") => void;
  scriptCode: string; cssCode: string; jsCode: string;
  setScriptCode: (v: string) => void; setCssCode: (v: string) => void; setJsCode: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed bottom-24 right-72 w-[480px] h-[400px] glass rounded-lg z-40 flex flex-col overflow-hidden">
      <div className="flex border-b border-white/5">
        {([["script", <Code2 key="a" className="w-3 h-3" />, "Script.zs"], ["css", <Palette key="b" className="w-3 h-3" />, "Styles.css"], ["js", <FileCode2 key="c" className="w-3 h-3" />, "Logic.js"]] as const).map(([id, icon, label]) => (
          <button key={id} onClick={() => setCodeTab(id as "script" | "css" | "js")}
            className={`flex items-center gap-1 px-3 py-2 text-xs ${codeTab === id ? "bg-white/5 text-white border-b-2 border-cyan-500" : "text-muted-foreground hover:text-white"}`}>
            {icon} {label}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={onClose} className="px-3 py-2 text-muted-foreground hover:text-white"><X className="w-3.5 h-3.5" /></button>
      </div>
      <textarea
        className="flex-1 bg-transparent p-3 text-xs font-mono text-white outline-none resize-none"
        value={codeTab === "script" ? scriptCode : codeTab === "css" ? cssCode : jsCode}
        onChange={(e) => { if (codeTab === "script") setScriptCode(e.target.value); else if (codeTab === "css") setCssCode(e.target.value); else setJsCode(e.target.value); }}
        spellCheck={false}
      />
      <div className="px-3 py-1.5 border-t border-white/5 text-[10px] text-muted-foreground flex items-center justify-between">
        <span>Line 1, Col 1 — UTF-8</span>
        <span>{codeTab === "script" ? "Zhitlow Script" : codeTab === "css" ? "CSS" : "JavaScript"}</span>
      </div>
    </div>
  );
}

// ================= GUI editor =================
export function GuiEditor({ guiElements, setGuiElements, selectedGuiId, setSelectedGuiId, guiTool, setGuiTool, logDebug, onClose }: {
  guiElements: GUIElement[];
  setGuiElements: (fn: (gs: GUIElement[]) => GUIElement[]) => void;
  selectedGuiId: string | null;
  setSelectedGuiId: (id: string | null) => void;
  guiTool: "select" | "button" | "text" | "panel" | "image" | "input" | "menu";
  setGuiTool: (t: "select" | "button" | "text" | "panel" | "image" | "input" | "menu") => void;
  logDebug: (type: DebugLogEntry["type"], text: string) => void;
  onClose: () => void;
}) {
  const TOOLS = [
    { id: "select" as const, icon: <MousePointer2 className="w-3.5 h-3.5" />, label: "Select" },
    { id: "button" as const, icon: <SquareIcon className="w-3.5 h-3.5" />, label: "Button" },
    { id: "text" as const, icon: <Type className="w-3.5 h-3.5" />, label: "Text" },
    { id: "panel" as const, icon: <Layout className="w-3.5 h-3.5" />, label: "Panel" },
    { id: "menu" as const, icon: <Menu className="w-3.5 h-3.5" />, label: "Menu" },
  ];
  return (
    <div className="fixed bottom-24 left-64 w-[420px] glass rounded-lg z-40 flex flex-col max-h-[70vh]">
      <div className="flex items-center justify-between p-3 border-b border-white/5">
        <h3 className="text-sm font-semibold flex items-center gap-1"><Palette className="w-3.5 h-3.5" /> GUI Editor</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-white"><X className="w-3.5 h-3.5" /></button>
      </div>
      <div className="flex gap-1 p-2 border-b border-white/5">
        {TOOLS.map((t) => (
          <button key={t.id} onClick={() => {
            setGuiTool(t.id);
            if (t.id !== "select") {
              const newEl: GUIElement = {
                id: uid(), type: t.id === "menu" ? "menu" : t.id as GUIElement["type"],
                name: `${t.label} ${guiElements.length + 1}`,
                x: 50, y: 50, width: t.id === "text" ? 100 : 120, height: t.id === "text" ? 20 : 30,
                text: t.id === "button" ? "Click Me" : t.id === "text" ? "Label" : t.id === "menu" ? "Menu" : "",
                color: "#3b82f6", fontSize: 14, visible: true,
              };
              setGuiElements((gs) => [...gs, newEl]);
              setSelectedGuiId(newEl.id);
              logDebug("info", `GUI ${t.label} added at (50, 50)`);
            }
          }} className={`tool-btn ${guiTool === t.id ? "active" : ""}`} title={t.label}>{t.icon}</button>
        ))}
      </div>
      <div className="relative bg-black/40 m-2 rounded overflow-hidden" style={{ aspectRatio: "4/3" }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        {guiElements.filter((e) => e.visible).map((el) => (
          <div key={el.id} onClick={() => setSelectedGuiId(el.id)}
            className={`absolute cursor-move border-2 ${selectedGuiId === el.id ? "border-cyan-500" : "border-transparent"}`}
            style={{
              left: `${el.x}%`, top: `${el.y}%`,
              width: el.type === "text" ? "auto" : `${el.width}px`,
              height: el.type === "text" ? "auto" : `${el.height}px`,
              background: el.type === "button" ? el.color : el.type === "panel" ? `${el.color}40` : "transparent",
              color: el.type === "text" ? el.color : "#fff",
              fontSize: `${el.fontSize}px`, padding: el.type === "text" ? "2px 4px" : "4px 8px",
              borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            {el.text || (el.type === "panel" ? "Panel" : "")}
          </div>
        ))}
        {guiElements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">Pick a tool above to add GUI elements</div>
        )}
      </div>
      {selectedGuiId && (() => {
        const el = guiElements.find((e) => e.id === selectedGuiId);
        if (!el) return null;
        return (
          <div className="p-2 border-t border-white/5 max-h-32 overflow-y-auto">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">GUI Properties</div>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <label className="flex items-center gap-1">X: <input type="number" value={el.x} onChange={(e) => setGuiElements((gs) => gs.map((g) => g.id === el.id ? { ...g, x: +e.target.value } : g))} className="w-12 bg-black/30 px-1 rounded" /></label>
              <label className="flex items-center gap-1">Y: <input type="number" value={el.y} onChange={(e) => setGuiElements((gs) => gs.map((g) => g.id === el.id ? { ...g, y: +e.target.value } : g))} className="w-12 bg-black/30 px-1 rounded" /></label>
              <label className="flex items-center gap-1">W: <input type="number" value={el.width} onChange={(e) => setGuiElements((gs) => gs.map((g) => g.id === el.id ? { ...g, width: +e.target.value } : g))} className="w-12 bg-black/30 px-1 rounded" /></label>
              <label className="flex items-center gap-1">H: <input type="number" value={el.height} onChange={(e) => setGuiElements((gs) => gs.map((g) => g.id === el.id ? { ...g, height: +e.target.value } : g))} className="w-12 bg-black/30 px-1 rounded" /></label>
              <label className="flex items-center gap-1 col-span-2">Text: <input value={el.text} onChange={(e) => setGuiElements((gs) => gs.map((g) => g.id === el.id ? { ...g, text: e.target.value } : g))} className="flex-1 bg-black/30 px-1 rounded" /></label>
              <label className="flex items-center gap-1">Color: <input type="color" value={el.color} onChange={(e) => setGuiElements((gs) => gs.map((g) => g.id === el.id ? { ...g, color: e.target.value } : g))} className="w-6 h-6" /></label>
              <label className="flex items-center gap-1">Size: <input type="number" value={el.fontSize} onChange={(e) => setGuiElements((gs) => gs.map((g) => g.id === el.id ? { ...g, fontSize: +e.target.value } : g))} className="w-12 bg-black/30 px-1 rounded" /></label>
            </div>
            <button onClick={() => { setGuiElements((gs) => gs.filter((g) => g.id !== el.id)); setSelectedGuiId(null); }}
              className="mt-1 w-full p-1 rounded bg-red-500/20 text-red-300 text-[10px] hover:bg-red-500/30">Delete element</button>
          </div>
        );
      })()}
    </div>
  );
}

// ================= Debug console =================
export function DebugConsole({ debugLogs, onRun, onClear, onClose, onCommand }: {
  debugLogs: DebugLogEntry[];
  onRun: () => void;
  onClear: () => void;
  onClose: () => void;
  onCommand: (cmd: string) => void;
}) {
  return (
    <div className="fixed bottom-24 right-72 w-[500px] h-[300px] glass rounded-lg z-40 flex flex-col">
      <div className="flex items-center justify-between p-2 border-b border-white/5">
        <h3 className="text-xs font-semibold flex items-center gap-1"><Terminal className="w-3.5 h-3.5 text-green-400" /> Debug Console</h3>
        <div className="flex items-center gap-1">
          <button onClick={onRun} className="tool-btn h-6 text-[10px] px-2" title="Run current script"><Play className="w-3 h-3 fill-current" /> Run</button>
          <button onClick={onClear} className="tool-btn h-6 w-6 p-0" title="Clear"><Trash2 className="w-3 h-3" /></button>
          <button onClick={onClose} className="text-muted-foreground hover:text-white"><X className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px] space-y-0.5">
        {debugLogs.map((log) => (
          <div key={log.id} className={`console-line ${log.type === "error" ? "text-red-400" : log.type === "warn" ? "text-yellow-400" : log.type === "success" ? "text-green-400" : "text-cyan-300"}`}>
            <span className="opacity-50 mr-1">[{new Date(log.timestamp).toLocaleTimeString(undefined, { hour12: false })}]</span>
            {log.text}
          </div>
        ))}
      </div>
      <div className="p-2 border-t border-white/5">
        <input placeholder="Type a command and press Enter..." className="w-full bg-black/30 px-2 py-1 text-xs outline-none border border-white/5 focus:border-cyan-500 rounded"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const val = (e.target as HTMLInputElement).value;
              if (val.trim()) onCommand(val);
              (e.target as HTMLInputElement).value = "";
            }
          }} />
      </div>
    </div>
  );
}

// ================= Terrain editor =================
export function TerrainEditor({ terrainSize, setTerrainSize, waterLevel, setWaterLevel, onAddTerrain, onAddWater, onClose }: {
  terrainSize: { width: number; depth: number; height: number };
  setTerrainSize: (fn: (t: { width: number; depth: number; height: number }) => { width: number; depth: number; height: number }) => void;
  waterLevel: number;
  setWaterLevel: (v: number) => void;
  onAddTerrain: () => void;
  onAddWater: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[440px] glass rounded-lg z-40 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-1"><Mountain className="w-3.5 h-3.5 text-green-400" /> Terrain Editor</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-white"><X className="w-3.5 h-3.5" /></button>
      </div>
      <div className="space-y-2">
        <div>
          <label className="text-[10px] text-muted-foreground">Terrain Width: {terrainSize.width}</label>
          <input type="range" min="10" max="100" value={terrainSize.width} onChange={(e) => setTerrainSize((t) => ({ ...t, width: +e.target.value }))} className="w-full" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">Terrain Depth: {terrainSize.depth}</label>
          <input type="range" min="10" max="100" value={terrainSize.depth} onChange={(e) => setTerrainSize((t) => ({ ...t, depth: +e.target.value }))} className="w-full" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">Max Height: {terrainSize.height}</label>
          <input type="range" min="0.5" max="10" step="0.5" value={terrainSize.height} onChange={(e) => setTerrainSize((t) => ({ ...t, height: +e.target.value }))} className="w-full" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">Water Level: {waterLevel.toFixed(1)}</label>
          <input type="range" min="-2" max="5" step="0.1" value={waterLevel} onChange={(e) => setWaterLevel(+e.target.value)} className="w-full" />
        </div>
        <div className="flex gap-1 pt-2">
          <button onClick={onAddTerrain} className="flex-1 p-2 rounded bg-green-500/20 text-green-300 text-xs hover:bg-green-500/30">
            <Mountain className="w-3 h-3 inline mr-1" /> Add Terrain
          </button>
          <button onClick={onAddWater} className="flex-1 p-2 rounded bg-blue-500/20 text-blue-300 text-xs hover:bg-blue-500/30">
            <Waves className="w-3 h-3 inline mr-1" /> Add Water
          </button>
        </div>
      </div>
    </div>
  );
}
