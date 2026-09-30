"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, GizmoHelper, GizmoViewport } from "@react-three/drei";
import * as THREE from "three";
import {
  Box as BoxIcon, Circle, Cylinder, Cone, Torus, Plane, Lightbulb, Move, RotateCw, Scale,
  Hand, Plus, Trash2, Copy, Play, Pause, Square, Search, User, Send, Sun, Github, Home,
  Upload, Settings, Eye, EyeOff, Lock, Unlock, Rocket, Code2, Palette, Bug,
  Boxes, Magnet, Camera as CameraIcon, Focus, Crosshair, Mountain, Layers, Gamepad2,
  FileCode2, Power, ChevronDown,
} from "lucide-react";
const ASSET_BASE = process.env.NEXT_PUBLIC_ASSET_BASE || "";

import { useStudio } from "../../lib/studio-store";
import { toast } from "sonner";
import { playTap, playClick, playPop, playSuccess } from "../../lib/ui-sounds";
import {
  ASSET_LIBRARY_3D, LIGHT_TYPES, PALETTE_SIZES, DEFAULT_WORLD, LIGHT_PRESETS, uid,
  defaultComponentsFor, type SceneObject3D, type SceneObjType, type LightSubtype,
  type CameraMode, type WorldSettings, type GUIElement, type DebugLogEntry, type PaletteSize,
  type ScriptBlock, DEFAULT_SCRIPT_TEMPLATE,
} from "./studio3d/types";
import { Object3DMesh, Avatar3D } from "./studio3d/meshes";
import { RpgRuntime, RpgHud, type RpgState, type PlayerRef } from "./studio3d/rpg";
import { ComponentsPanel, WorldPanel } from "./studio3d/panels";
import { WelcomeCard, CodePanel, GuiEditor, DebugConsole, TerrainEditor, ScriptEditor } from "./studio3d/overlays";
import { TEMPLATE_3D_SCENES } from "./studio3d/templates";
import {
  WorldEnvironment, PipelineSettings, ScreenshotRegistrar, PlayerController,
  GizmoProxy, FocusHandler, RigidBodySim, FollowGroup, ScriptRuntime,
} from "./studio3d/canvas";

export function Studio3D({ onExit }: { onExit: () => void }) {
  const {
    avatar, avatarColor, avatarBodyType,
    setAvatarPickerOpen, setPublishDialogOpen, setInstructionsOpen,
    user, setAuthOpen, setSettingsOpen,
  } = useStudio();

  // ---------- scene state ----------
  const [objects, setObjects] = useState<SceneObject3D[]>(() => [
    { id: uid(), name: "Floor", type: "plane", position: [0, 0, 0], rotation: [-Math.PI / 2, 0, 0], scale: [14, 14, 1], color: "#4c9a3f", visible: true, locked: false, components: defaultComponentsFor("plane") },
    { id: uid(), name: "Box 1", type: "box", position: [3, 0.5, 2], rotation: [0, 0, 0], scale: [1, 1, 1], color: "#3b82f6", visible: true, locked: false, components: defaultComponentsFor("box"), scripts: [
      { id: uid(), name: "SpinScript", enabled: true, code: DEFAULT_SCRIPT_TEMPLATE },
    ] },
    { id: uid(), name: "Sphere 1", type: "sphere", position: [-3, 0.5, 1], rotation: [0, 0, 0], scale: [1, 1, 1], color: "#ef4444", visible: true, locked: false, components: defaultComponentsFor("sphere") },
    { id: uid(), name: "Castle Tower", type: "castle-tower", position: [-7, 0, -5], rotation: [0, 0, 0], scale: [1, 1, 1], color: "#9aa0ab", visible: true, locked: false, components: defaultComponentsFor("castle-tower") },
    { id: uid(), name: "Sun Light", type: "light", lightSubtype: "directional", position: [5, 8, 5], rotation: [0, 0, 0], scale: [1, 1, 1], color: "#fff5e0", intensity: 1.2, visible: true, locked: false, components: defaultComponentsFor("light") },
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameMode, setGameMode] = useState<"sandbox" | "rpg">("sandbox");
  const [cameraMode, setCameraMode] = useState<CameraMode>("first-person");
  const [activeTool, setActiveTool] = useState<"move" | "rotate" | "scale" | "pan">("move");
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [focusCounter, setFocusCounter] = useState(0);
  const [world, setWorldState] = useState<WorldSettings>(DEFAULT_WORLD);
  const [rightTab, setRightTab] = useState<"components" | "world">("world");
  const [leftPanel, setLeftPanel] = useState<"explorer" | "assets" | "lights">("explorer");
  const [paletteSize, setPaletteSize] = useState<PaletteSize>("medium");
  const [search, setSearch] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);

  // undo / redo
  const [undoStack, setUndoStack] = useState<SceneObject3D[][]>([]);
  const [redoStack, setRedoStack] = useState<SceneObject3D[][]>([]);

  // panels / overlays
  const [codePanelOpen, setCodePanelOpen] = useState(false);
  const [codeTab, setCodeTab] = useState<"script" | "css" | "js">("script");
  const [scriptCode, setScriptCode] = useState(`// Zhitlow 3D Engine Script
// This code runs every frame during play-test

function update(dt) {
  const player = engine.getPlayer();
  if (player) {
    if (input.keyDown('w')) player.moveForward(5 * dt);
    if (input.keyDown('s')) player.moveBackward(5 * dt);
  }
}
`);
  const [cssCode, setCssCode] = useState(`/* Zhitlow 3D Engine — UI styles */
.hud { position: absolute; top: 20px; left: 20px; color: #fff; font-family: monospace; }
.crosshair { position: absolute; top: 50%; left: 50%; border: 2px solid #fff; border-radius: 50%; }
`);
  const [jsCode, setJsCode] = useState(`// Zhitlow 3D Engine — JavaScript logic
class PlayerController {
  constructor() { this.health = 100; this.speed = 5; }
  takeDamage(n) { this.health = Math.max(0, this.health - n); }
}
const player = new PlayerController();
engine.setPlayerController(player);
`);
  const [showGuiEditor, setShowGuiEditor] = useState(false);
  const [guiElements, setGuiElements] = useState<GUIElement[]>([]);
  const [selectedGuiId, setSelectedGuiId] = useState<string | null>(null);
  const [guiTool, setGuiTool] = useState<"select" | "button" | "text" | "panel" | "image" | "input" | "menu">("select");
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([
    { id: uid(), type: "info", text: "All In One 3D Studio v3.1 — debug console ready", timestamp: Date.now() },
  ]);
  const [showTerrainEditor, setShowTerrainEditor] = useState(false);
  const [terrainSize, setTerrainSize] = useState({ width: 40, depth: 40, height: 2 });
  const [waterLevel, setWaterLevel] = useState(0);

  // play-time runtime
  const containerRef = useRef<HTMLDivElement>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const interactRef = useRef(0);
  const attackRef = useRef(0);
  const pointerLockedRef = useRef(false);
  const [pointerLocked, setPointerLocked] = useState(false);
  const [lockLost, setLockLost] = useState(false);
  const camBackupRef = useRef<{ pos: THREE.Vector3; quat: THREE.Quaternion; target: THREE.Vector3 | null } | null>(null);

  const [rpgState, setRpgState] = useState<RpgState | null>(null);

  const selectedObj = objects.find((o) => o.id === selectedId) ?? null;
  const rpgEntities = useMemo(() => objects.filter((o) => o.rpgKind), [objects]);
  const staticObjects = useMemo(() => objects.filter((o) => !o.rpgKind), [objects]);

  // player runtime state — a real THREE.Vector3 so RPG logic can use distanceTo
  const playerStateRef = useRef<PlayerRef>({
    pos: new THREE.Vector3(0, 0, 15.5),
    yaw: 0, pitch: 0, vy: 0, onGround: true, moving: false,
  });

  const logDebug = useCallback((type: DebugLogEntry["type"], text: string) => {
    setDebugLogs((logs) => [...logs.slice(-99), { id: uid(), type, text, timestamp: Date.now() }]);
  }, []);

  // ---------- undo / redo ----------
  const pushUndo = useCallback(() => {
    setUndoStack((s) => [...s.slice(-19), [...objects]]);
    setRedoStack([]);
  }, [objects]);

  const undo = useCallback(() => {
    setUndoStack((s) => {
      if (s.length === 0) return s;
      const prev = s[s.length - 1];
      setRedoStack((r) => [...r, [...objects]]);
      setObjects(prev);
      return s.slice(0, -1);
    });
  }, [objects]);

  const redo = useCallback(() => {
    setRedoStack((s) => {
      if (s.length === 0) return s;
      const next = s[s.length - 1];
      setUndoStack((u) => [...u, [...objects]]);
      setObjects(next);
      return s.slice(0, -1);
    });
  }, [objects]);

  // ---------- object ops ----------
  const updateProp = useCallback((id: string, key: string, value: unknown) => {
    setObjects((os) => os.map((o) => (o.id === id ? { ...o, [key]: value } : o)));
  }, []);

  const addObject = (type: SceneObjType, color = "#3b82f6", name?: string) => {
    const compound = ["castle-tower", "fountain", "treasure-chest", "oak-tree", "cottage", "lamp-post", "npc-villager"].includes(type);
    const newObj: SceneObject3D = {
      id: uid(),
      name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} ${objects.length + 1}`,
      type,
      position: [0, compound ? 0 : type === "plane" ? 0 : 0.5, 0],
      rotation: type === "plane" ? [-Math.PI / 2, 0, 0] : [0, 0, 0],
      scale: [1, 1, 1],
      color,
      visible: true,
      locked: false,
      components: defaultComponentsFor(type),
    };
    if (type === "light") { newObj.lightSubtype = "point"; newObj.intensity = 1; }
    pushUndo();
    setObjects((os) => [...os, newObj]);
    setSelectedId(newObj.id);
    setRightTab("components");
    setPlusMenuFor(null);
    playPop();
    toast.success(`Added ${newObj.name}`);
  };

  const addLight = (subtype: LightSubtype) => {
    const newObj: SceneObject3D = {
      id: uid(),
      name: `${subtype.charAt(0).toUpperCase() + subtype.slice(1)} Light`,
      type: "light", lightSubtype: subtype,
      position: [0, 5, 0], rotation: [0, 0, 0], scale: [1, 1, 1],
      color: "#ffffff", intensity: 1, visible: true, locked: false,
      components: defaultComponentsFor("light"),
    };
    pushUndo();
    setObjects((os) => [...os, newObj]);
    setSelectedId(newObj.id);
    setRightTab("components");
    playPop();
    toast.success(`Added ${newObj.name}`);
  };

  const deleteObject = (id: string) => {
    pushUndo();
    setObjects((os) => os.filter((o) => o.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateObject = (id: string) => {
    const orig = objects.find((o) => o.id === id);
    if (!orig) return;
    pushUndo();
    const copy: SceneObject3D = { ...orig, id: uid(), name: `${orig.name} Copy`, position: [orig.position[0] + 1.2, orig.position[1], orig.position[2] + 1.2] };
    setObjects((os) => [...os, copy]);
    setSelectedId(copy.id);
  };

  const toggleVisible = (id: string) => setObjects((os) => os.map((o) => (o.id === id ? { ...o, visible: !o.visible } : o)));
  const toggleLock = (id: string) => setObjects((os) => os.map((o) => (o.id === id ? { ...o, locked: !o.locked } : o)));

  // ---------- script blocks (Roblox-style) ----------
  const [editingScript, setEditingScript] = useState<{ objId: string; scriptId: string } | null>(null);
  const [renamingScriptId, setRenamingScriptId] = useState<string | null>(null);
  const [plusMenuFor, setPlusMenuFor] = useState<string | null>(null); // obj id or "scene"

  const addScript = useCallback((objId: string) => {
    pushUndo();
    const script: ScriptBlock = {
      id: uid(),
      name: "Script",
      code: `// Runs every frame during play test\n// API: self · engine · input · print(...)\n\nfunction update(dt, self) {\n  self.rotation.y += dt * 1.5;\n}`,
      enabled: true,
    };
    setObjects((os) => os.map((o) => (o.id === objId ? { ...o, scripts: [...(o.scripts ?? []), script] } : o)));
    setEditingScript({ objId, scriptId: script.id });
    toast.success("Script added — it runs on Play");
    logDebug("success", "Script block added to object");
  }, [pushUndo, logDebug]);

  const mutateScript = useCallback((scriptId: string, fn: (s: ScriptBlock) => ScriptBlock) => {
    setObjects((os) => os.map((o) => ({ ...o, scripts: (o.scripts ?? []).map((s) => (s.id === scriptId ? fn(s) : s)) })));
  }, []);

  const renameScript = useCallback((scriptId: string, name: string) => mutateScript(scriptId, (s) => ({ ...s, name })), [mutateScript]);
  const setBlockCode = useCallback((scriptId: string, code: string) => mutateScript(scriptId, (s) => ({ ...s, code })), [mutateScript]);
  const toggleScriptEnabled = useCallback((scriptId: string) => mutateScript(scriptId, (s) => ({ ...s, enabled: !s.enabled })), [mutateScript]);

  const deleteScript = useCallback((objId: string, scriptId: string) => {
    pushUndo();
    setObjects((os) => os.map((o) => (o.id === objId ? { ...o, scripts: (o.scripts ?? []).filter((s) => s.id !== scriptId) } : o)));
    setEditingScript((cur) => (cur?.scriptId === scriptId ? null : cur));
  }, [pushUndo]);

  const editingTarget = useMemo(() => {
    if (!editingScript) return null;
    const obj = objects.find((o) => o.id === editingScript.objId);
    const script = obj?.scripts?.find((s) => s.id === editingScript.scriptId);
    return obj && script ? { obj, script } : null;
  }, [editingScript, objects]);

  const scriptCount = useMemo(() => objects.reduce((n, o) => n + (o.scripts?.length ?? 0), 0), [objects]);

  // baseplate half-extents (largest ground plane) + water level for the controller
  const baseHalf = useMemo<[number, number]>(() => {
    let hx = 7, hz = 7;
    objects.forEach((o) => {
      if (o.type === "plane" || o.type === "terrain") {
        hx = Math.max(hx, Math.abs(o.scale[0]) / 2);
        hz = Math.max(hz, Math.abs(o.type === "terrain" ? o.scale[2] : o.scale[1]) / 2);
      }
    });
    return [hx, hz];
  }, [objects]);
  const playWaterLevel = world.edgeWater ? world.edgeWaterLevel : null;

  const setWorld = (patch: Partial<WorldSettings>) => setWorldState((w) => ({ ...w, ...patch }));

  const onSelectObj = (id: string) => {
    if (isPlaying) return;
    setSelectedId(id);
    setRightTab("components");
  };

  // ---------- templates ----------
  const loadSceneJson = useCallback((json: string, name?: string) => {
    try {
      const data = JSON.parse(json) as { type?: string; gameMode?: string; objects?: Partial<SceneObject3D>[] };
      if (data.type !== "3d-scene" || !Array.isArray(data.objects)) throw new Error("bad format");
      pushUndo();
      const objs: SceneObject3D[] = data.objects.map((o) => ({
        id: typeof o.id === "string" && o.id ? o.id : uid(),
        name: o.name || "Object",
        type: o.type as SceneObjType,
        lightSubtype: o.lightSubtype,
        position: o.position ?? [0, 0.5, 0],
        rotation: o.rotation ?? [0, 0, 0],
        scale: o.scale ?? [1, 1, 1],
        color: o.color ?? "#3b82f6",
        intensity: o.intensity,
        visible: o.visible ?? true,
        locked: o.locked ?? false,
        rpgKind: o.rpgKind,
        components: defaultComponentsFor(o.type as SceneObjType),
      }));
      setObjects(objs);
      setSelectedId(null);
      setGameMode(data.gameMode === "rpg" ? "rpg" : "sandbox");
      setShowTemplates(false);
      toast.success(`Loaded ${name || "template"}`, { description: data.gameMode === "rpg" ? "Press Play — the RPG quest goes live" : "Press Play to test in first person" });
      logDebug("success", `Scene loaded: ${name || "template"} (${objs.length} objects · mode ${data.gameMode})`);
    } catch {
      toast.error("Failed to load scene");
    }
  }, [pushUndo, logDebug]);

  useEffect(() => {
    const onLoad = (e: Event) => {
      const detail = (e as CustomEvent).detail as { json?: string; name?: string } | undefined;
      if (detail?.json) loadSceneJson(detail.json, detail.name);
    };
    window.addEventListener("aioe-load-3d", onLoad);
    return () => window.removeEventListener("aioe-load-3d", onLoad);
  }, [loadSceneJson]);

  // ---------- play orchestration ----------
  const isPlayingRef = useRef(false);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const requestLock = () => {
    const el = containerRef.current;
    if (el && el.requestPointerLock) el.requestPointerLock();
  };

  const startPlay = () => {
    if (isPlaying) return;
    playerStateRef.current.pos.set(0, 0, gameMode === "rpg" ? 15.5 : 10);
    playerStateRef.current.yaw = 0;
    playerStateRef.current.pitch = 0;
    playerStateRef.current.vy = 0;
    playerStateRef.current.onGround = true;
    setIsPlaying(true);
    setLockLost(false);
    setRpgState(null);
    playSuccess();
    logDebug("success", `Play test started — ${cameraMode} camera · mode: ${gameMode}${scriptCount ? ` · ${scriptCount} script(s) running` : ""}`);
    toast.success(gameMode === "rpg" ? "RPG quest started — collect 8 coins!" : `Play test — ${cameraMode}`, {
      description: scriptCount ? `${scriptCount} script(s) attached and running` : undefined,
    });
    if (cameraMode !== "orbit") requestLock();
  };

  const stopPlay = useCallback(() => {
    if (document.pointerLockElement) document.exitPointerLock();
    setIsPlaying(false);
    setLockLost(false);
    setRpgState(null);
    playTap();
    logDebug("info", "Play test stopped — back to editing");
  }, [logDebug]);

  useEffect(() => {
    const onChange = () => {
      const locked = document.pointerLockElement === containerRef.current;
      setPointerLocked(locked);
      pointerLockedRef.current = locked;
      if (!locked && isPlayingRef.current && cameraMode !== "orbit") setLockLost(true);
      if (locked) setLockLost(false);
    };
    const onMove = (e: MouseEvent) => {
      if (!document.pointerLockElement) return;
      if (cameraMode === "orbit") return;
      const p = playerStateRef.current;
      p.yaw -= e.movementX * 0.0024;
      p.pitch = Math.max(-1.5, Math.min(1.5, p.pitch - e.movementY * 0.0024));
    };
    const onDown = (e: MouseEvent) => {
      if (isPlayingRef.current && document.pointerLockElement) {
        if (e.button === 0) attackRef.current += 1;
      }
    };
    document.addEventListener("pointerlockchange", onChange);
    document.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("pointerlockchange", onChange);
      document.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
    };
  }, [cameraMode]);

  // ---------- keyboard ----------
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      if (k === "shift") keysRef.current["shift"] = true;
      if ((e.ctrlKey || e.metaKey) && k === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((e.ctrlKey || e.metaKey) && (k === "y" || (k === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
      else if (isPlayingRef.current && k === "e") interactRef.current += 1;
      else if (!isPlayingRef.current && k === "f") setFocusCounter((c) => c + 1);
      else if (k === "escape" && isPlayingRef.current && !pointerLockedRef.current) stopPlay();
    };
    const up = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [undo, redo, stopPlay]);

  // playerRef handed to the canvas controller
  const canvasPlayerRef = playerStateRef;

  // ---------- asset filtering ----------
  const filteredAssets = ASSET_LIBRARY_3D.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) || a.type.toLowerCase().includes(search.toLowerCase()));
  const palCols = PALETTE_SIZES.find((p) => p.id === paletteSize)!;
  const palIcon = palCols.icon;

  // ---------- screenshot ----------
  const takeScreenshot = () => {
    const shot = (window as unknown as { __aioeShot?: () => void }).__aioeShot;
    if (shot) { shot(); toast.success("Screenshot saved"); logDebug("success", "Viewport screenshot saved (PNG)"); }
    else toast.error("Screenshot not ready yet");
  };

  // ---------- run script (debug) ----------
  const runScript = () => {
    const code = codeTab === "script" ? scriptCode : codeTab === "js" ? jsCode : "";
    logDebug("info", `Executing ${codeTab} (${code.length} chars)...`);
    try {
      if (codeTab === "js" && code) {
        // eslint-disable-next-line no-eval
        eval(code);
        logDebug("success", "Script executed successfully");
      } else {
        logDebug("warn", "Script execution requires the Zhitlow runtime (simulated in browser preview)");
      }
    } catch (e) {
      logDebug("error", `Runtime error: ${(e as Error).message}`);
    }
  };

  const statusLine = gameMode === "rpg" && rpgState ? `Quest stage ${Math.min(rpgState.stage + 1, 4)}/4` : gameMode === "rpg" ? "RPG quest ready" : "Sandbox";

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0b0e] text-white overflow-hidden">
      {/* ================= TOP BAR ================= */}
      <div className="flex items-center h-12 bg-[#14171e] border-b border-white/5 px-3 gap-2 shadow-[0_1px_0_rgba(34,211,238,0.15)]">
        {/* Logo + name */}
        <div className="flex items-center gap-2 pr-3 border-r border-white/5">
          <img src={`${ASSET_BASE}/icon.svg`} alt="All In One Engine" className="w-8 h-8 ae-drop-shadow" />
          <div>
            <div className="text-sm font-bold leading-tight bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">3D Studio</div>
            <div className="text-[10px] text-muted-foreground leading-tight">All In One Engine</div>
          </div>
        </div>

        {/* History */}
        <div className="flex items-center gap-0.5 px-1">
          <button onClick={undo} disabled={undoStack.length === 0} className="tool-btn" title="Undo (Ctrl+Z)">↶</button>
          <button onClick={redo} disabled={redoStack.length === 0} className="tool-btn" title="Redo (Ctrl+Y)">↷</button>
        </div>

        <div className="w-px h-5 bg-white/10" />

        {/* Transform tools (wired gizmos) */}
        <div className="flex items-center gap-0.5 px-1">
          {(["move", "rotate", "scale", "pan"] as const).map((tool) => (
            <button key={tool} onClick={() => setActiveTool(tool)} className={`tool-btn ${activeTool === tool ? "active" : ""}`} title={`${tool.charAt(0).toUpperCase() + tool.slice(1)} (gizmo)`}>
              {tool === "move" && <Move className="w-3.5 h-3.5" />}
              {tool === "rotate" && <RotateCw className="w-3.5 h-3.5" />}
              {tool === "scale" && <Scale className="w-3.5 h-3.5" />}
              {tool === "pan" && <Hand className="w-3.5 h-3.5" />}
            </button>
          ))}
          <button onClick={() => setSnapEnabled(!snapEnabled)} className={`tool-btn ${snapEnabled ? "active" : ""}`} title="Snap to grid (0.5 m)">
            <Magnet className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setFocusCounter((c) => c + 1)} className="tool-btn" title="Focus selection (F)">
            <Focus className="w-3.5 h-3.5" />
          </button>
          <button onClick={takeScreenshot} className="tool-btn" title="Screenshot viewport (PNG)">
            <CameraIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-px h-5 bg-white/10" />

        {/* Add objects */}
        <div className="flex items-center gap-0.5 px-1">
          <button className="tool-btn" onClick={() => addObject("box")} title="Add Box"><Plus className="w-3.5 h-3.5" /></button>
          <button className="tool-btn" onClick={() => addObject("sphere")} title="Add Sphere"><Circle className="w-3.5 h-3.5" /></button>
          <button className="tool-btn" onClick={() => addObject("cylinder")} title="Add Cylinder"><Cylinder className="w-3.5 h-3.5" /></button>
          <button className="tool-btn" onClick={() => addObject("cone")} title="Add Cone"><Cone className="w-3.5 h-3.5" /></button>
          <button className="tool-btn" onClick={() => addObject("torus")} title="Add Torus"><Torus className="w-3.5 h-3.5" /></button>
          <button className="tool-btn" onClick={() => addLight("point")} title="Add Light"><Lightbulb className="w-3.5 h-3.5" /></button>
          <button className="tool-btn" onClick={() => setShowTerrainEditor(!showTerrainEditor)} title="Terrain editor"><Mountain className="w-3.5 h-3.5" /></button>
        </div>

        <div className="w-px h-5 bg-white/10" />

        {/* Play controls */}
        <div className="flex items-center gap-0.5 px-1">
          <button onClick={startPlay} disabled={isPlaying} className={`tool-btn ${!isPlaying ? "active" : ""}`} title="Play test — locks first-person mouse look">
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
          <button onClick={() => setIsPlaying(false)} disabled={!isPlaying} className="tool-btn" title="Pause"><Pause className="w-3.5 h-3.5" /></button>
          <button onClick={stopPlay} className="tool-btn" title="Stop"><Square className="w-3.5 h-3.5 fill-current" /></button>
          <select
            value={cameraMode}
            onChange={(e) => setCameraMode(e.target.value as CameraMode)}
            className="bg-[#14171e] text-white text-[11px] px-1.5 py-1 rounded border border-white/10 outline-none ml-1"
            title="Play camera mode"
          >
            <option value="first-person">1st Person</option>
            <option value="third-person">3rd Person</option>
            <option value="orbit">Orbit</option>
          </select>
          {gameMode === "rpg" && (
            <span className="ml-1 flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/15 border border-amber-500/40 text-[10px] text-amber-300 font-semibold" title="RPG quest mode active">
              <Gamepad2 className="w-3 h-3" /> RPG
            </span>
          )}
        </div>

        <div className="flex-1" />

        {/* Editors */}
        <div className="flex items-center gap-0.5 px-1">
          <button onClick={() => setRightTab("world")} className={`tool-btn ${rightTab === "world" ? "active" : ""}`} title="World: lighting & rendering">
            <Sun className="w-3.5 h-3.5" /> World
          </button>
          <button onClick={() => setCodePanelOpen(!codePanelOpen)} className={`tool-btn ${codePanelOpen ? "active" : ""}`} title="Script/CSS/JS editor"><Code2 className="w-3.5 h-3.5" /> Code</button>
          <button onClick={() => setShowGuiEditor(!showGuiEditor)} className={`tool-btn ${showGuiEditor ? "active" : ""}`} title="GUI editor"><Palette className="w-3.5 h-3.5" /> GUI</button>
          <button onClick={() => setShowDebugConsole(!showDebugConsole)} className={`tool-btn ${showDebugConsole ? "active" : ""}`} title="Debug console"><Bug className="w-3.5 h-3.5" /> Debug</button>
          <div className="relative">
            <button onClick={() => setShowTemplates(!showTemplates)} className={`tool-btn ${showTemplates ? "active" : ""}`} title="Templates"><Rocket className="w-3.5 h-3.5" /></button>
            {showTemplates && (
              <div className="absolute right-0 top-full mt-1 w-72 rounded-lg bg-[#181c24] border border-white/10 shadow-xl z-50 overflow-hidden">
                <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-white/5">3D Templates</div>
                {TEMPLATE_3D_SCENES.map((t) => (
                  <button key={t.id} onClick={() => loadSceneJson(t.json, t.name)} className="w-full text-left px-3 py-2 hover:bg-cyan-500/15">
                    <div className="text-xs font-medium flex items-center gap-1.5">
                      {t.name}
                      {t.gameMode === "rpg" && <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300">RPG</span>}
                    </div>
                    <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{t.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-px h-5 bg-white/10" />

        {/* Right group */}
        <div className="flex items-center gap-0.5 px-1">
          <button onClick={() => setAvatarPickerOpen(true)} className="tool-btn" title="Pick avatar"><User className="w-3.5 h-3.5" /></button>
          <button
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file"; input.accept = ".glb,.gltf,.png,.jpg,.wav,.mp3"; input.multiple = true;
              input.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files) for (const f of Array.from(files)) { logDebug("success", `Imported: ${f.name} (${(f.size / 1024).toFixed(1)}KB)`); toast.success(`Imported ${f.name}`); }
              };
              input.click();
            }}
            className="tool-btn" title="Upload assets (.glb, .gltf, .png, .wav)"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setPublishDialogOpen(true)} className="tool-btn" title="Publish"><Send className="w-3.5 h-3.5" /></button>
          <button onClick={() => setInstructionsOpen(true)} className="tool-btn" title="Help"><Crosshair className="w-3.5 h-3.5" /></button>
          <button onClick={() => setSettingsOpen(true)} className="tool-btn" title="Settings"><Settings className="w-3.5 h-3.5" /></button>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <button onClick={() => setAuthOpen(true)} className="tool-btn" title={user ? `Signed in as @${user.githubLogin}` : "Sign in with GitHub"}>
            {user ? <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full" /> : <Github className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onExit} className="tool-btn" title="Back to website"><Home className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* ================= MAIN 3-PANE ================= */}
      <div className="flex-1 flex min-h-0">
        {/* LEFT */}
        <div className="w-64 bg-[#12151b] border-r border-white/5 flex flex-col">
          <div className="flex border-b border-white/5">
            {(["explorer", "assets", "lights"] as const).map((p) => (
              <button key={p} onClick={() => setLeftPanel(p)}
                className={`flex-1 px-3 py-2 text-xs font-medium capitalize ${leftPanel === p ? "text-white bg-white/5 border-b-2 border-cyan-500" : "text-muted-foreground hover:text-white"}`}>
                {p}
              </button>
            ))}
          </div>

          <div className="p-2 border-b border-white/5">
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-black/30">
              <Search className="w-3 h-3 text-muted-foreground" />
              <input className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {leftPanel === "explorer" && (
              <>
                <div className="px-2 py-1 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Scene ({objects.length}){scriptCount > 0 && <span className="text-cyan-400/80"> · {scriptCount} script{scriptCount > 1 ? "s" : ""}</span>}
                  </span>
                  <div className="relative">
                    <button
                      onClick={() => { setPlusMenuFor(plusMenuFor === "scene" ? null : "scene"); playClick(); }}
                      className="w-4 h-4 rounded flex items-center justify-center bg-white/5 hover:bg-cyan-500/30 hover:text-cyan-300"
                      title="Add object to scene"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    {plusMenuFor === "scene" && (
                      <div className="absolute right-0 top-full mt-1 w-40 rounded-lg bg-[#181c24] border border-white/10 shadow-xl z-30 overflow-hidden">
                        {([["box", "Box"], ["sphere", "Sphere"], ["cylinder", "Cylinder"], ["cone", "Cone"], ["torus", "Torus"]] as const).map(([t, label]) => (
                          <button key={t} onClick={() => addObject(t)} className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-cyan-500/15 flex items-center gap-2">
                            <Plus className="w-3 h-3 text-cyan-400" /> {label}
                          </button>
                        ))}
                        <button onClick={() => { addLight("point"); setPlusMenuFor(null); }} className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-cyan-500/15 flex items-center gap-2">
                          <Lightbulb className="w-3 h-3 text-yellow-400" /> Point Light
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {objects.map((obj) => (
                  <div key={obj.id}>
                    <div
                      className={`group flex items-center gap-1 px-2 py-1 text-xs cursor-pointer ${selectedId === obj.id ? "bg-cyan-500/20 text-white" : "hover:bg-white/5"}`}
                      onClick={() => onSelectObj(obj.id)}>
                      <span className="w-4 flex justify-center">
                        {obj.rpgKind === "coin" ? <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> :
                         obj.rpgKind === "slime" ? <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" /> :
                         obj.rpgKind === "npc" ? <User className="w-3 h-3 text-purple-400" /> :
                         obj.rpgKind === "chest" ? <Boxes className="w-3 h-3 text-amber-500" /> :
                         obj.type === "light" ? <Lightbulb className="w-3 h-3 text-yellow-400" /> :
                         obj.type === "box" ? <BoxIcon className="w-3 h-3 text-blue-400" /> :
                         obj.type === "sphere" ? <Circle className="w-3 h-3 text-green-400" /> :
                         obj.type === "cylinder" ? <Cylinder className="w-3 h-3 text-yellow-400" /> :
                         obj.type === "cone" ? <Cone className="w-3 h-3 text-red-400" /> :
                         obj.type === "torus" ? <Torus className="w-3 h-3 text-purple-400" /> :
                         ["castle-tower", "fountain", "treasure-chest", "oak-tree", "cottage", "lamp-post", "npc-villager"].includes(obj.type) ? <Boxes className="w-3 h-3 text-cyan-300" /> :
                         <Plane className="w-3 h-3 text-cyan-400" />}
                      </span>
                      <span className="flex-1 truncate">{obj.name}</span>
                      {obj.rpgKind && <span className="text-[8px] px-1 rounded bg-white/10 text-white/50 uppercase">{obj.rpgKind}</span>}
                      {/* Roblox-style + : add a script / child object */}
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setPlusMenuFor(plusMenuFor === obj.id ? null : obj.id); playClick(); }}
                          className="w-4 h-4 rounded items-center justify-center bg-white/5 hover:bg-cyan-500/30 hover:text-cyan-300 hidden group-hover:flex"
                          title="Add script or object"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        {plusMenuFor === obj.id && (
                          <div className="absolute left-0 top-full mt-1 w-36 rounded-lg bg-[#181c24] border border-white/10 shadow-xl z-30 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => { addScript(obj.id); setPlusMenuFor(null); }} className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-cyan-500/15 flex items-center gap-2">
                              <FileCode2 className="w-3 h-3 text-cyan-400" /> Script
                            </button>
                            <div className="px-3 py-1 text-[9px] uppercase tracking-wider text-muted-foreground border-t border-white/5">also add:</div>
                            <button onClick={() => addObject("box")} className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-cyan-500/15 flex items-center gap-2"><BoxIcon className="w-3 h-3 text-blue-400" /> Box</button>
                            <button onClick={() => addObject("sphere")} className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-cyan-500/15 flex items-center gap-2"><Circle className="w-3 h-3 text-green-400" /> Sphere</button>
                            <button onClick={() => { addLight("point"); setPlusMenuFor(null); }} className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-cyan-500/15 flex items-center gap-2"><Lightbulb className="w-3 h-3 text-yellow-400" /> Light</button>
                          </div>
                        )}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); toggleVisible(obj.id); }} className="opacity-50 hover:opacity-100">
                        {obj.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); toggleLock(obj.id); }} className="opacity-50 hover:opacity-100">
                        {obj.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); duplicateObject(obj.id); }} className="opacity-50 hover:opacity-100"><Copy className="w-3 h-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); deleteObject(obj.id); }} className="opacity-50 hover:opacity-100 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                    </div>

                    {/* script blocks nested under the object */}
                    {(obj.scripts ?? []).map((s) => (
                      <div key={s.id}
                        className={`flex items-center gap-1 pl-7 pr-2 py-0.5 text-[11px] cursor-pointer ${editingScript?.scriptId === s.id ? "bg-cyan-500/15 text-cyan-200" : "text-white/70 hover:bg-white/5"}`}
                        onClick={() => { if (renamingScriptId !== s.id) { setEditingScript({ objId: obj.id, scriptId: s.id }); playClick(); } }}
                        onDoubleClick={(e) => { e.stopPropagation(); setRenamingScriptId(s.id); }}>
                        <FileCode2 className={`w-3 h-3 flex-shrink-0 ${s.enabled ? "text-cyan-400" : "text-white/25"}`} />
                        {renamingScriptId === s.id ? (
                          <input
                            autoFocus
                            defaultValue={s.name}
                            onBlur={(e) => { renameScript(s.id, e.target.value.trim() || s.name); setRenamingScriptId(null); }}
                            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setRenamingScriptId(null); }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 min-w-0 bg-black/50 px-1 py-0.5 text-[11px] outline-none border border-cyan-500 rounded"
                            spellCheck={false}
                          />
                        ) : (
                          <span className="flex-1 truncate" title="Click to edit · double-click to rename">{s.name}</span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleScriptEnabled(s.id); playTap(); }}
                          className={`opacity-60 hover:opacity-100 ${s.enabled ? "text-green-400" : "text-white/25"}`}
                          title={s.enabled ? "Enabled — runs on Play (click to disable)" : "Disabled (click to enable)"}
                        >
                          <Power className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteScript(obj.id, s.id); }}
                          className="opacity-50 hover:opacity-100 hover:text-red-400"
                          title="Delete script"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="px-2 pt-2 pb-1 text-[9px] text-muted-foreground leading-relaxed border-t border-white/5 mt-1">
                  <span className="text-cyan-400">+ </span>on any object adds a script — scripts run every frame during Play. Click a script to edit it, double-click to rename.
                </div>
              </>
            )}

            {leftPanel === "assets" && (
              <>
                <div className="px-2 py-1 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Asset Library</span>
                  <div className="flex gap-0.5" title="Palette size">
                    {PALETTE_SIZES.map((p) => (
                      <button key={p.id} onClick={() => setPaletteSize(p.id)}
                        className={`w-6 h-5 rounded text-[9px] font-bold ${paletteSize === p.id ? "bg-cyan-500 text-white" : "bg-white/5 text-muted-foreground hover:text-white"}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={`grid gap-1 p-2 ${palCols.cols === 4 ? "grid-cols-4" : palCols.cols === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
                  {filteredAssets.map((asset) => (
                    <button key={asset.name}
                      onClick={() => addObject(asset.type, asset.color, asset.name)}
                      className="aspect-square p-1.5 rounded border border-white/5 hover:border-cyan-500/50 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-1"
                      title={asset.name}>
                      {asset.compound ? <Boxes className={palIcon} style={{ color: asset.color }} /> :
                       asset.type === "box" ? <BoxIcon className={palIcon} style={{ color: asset.color }} /> :
                       asset.type === "sphere" ? <Circle className={palIcon} style={{ color: asset.color }} /> :
                       asset.type === "cylinder" ? <Cylinder className={palIcon} style={{ color: asset.color }} /> :
                       asset.type === "cone" ? <Cone className={palIcon} style={{ color: asset.color }} /> :
                       asset.type === "torus" ? <Torus className={palIcon} style={{ color: asset.color }} /> :
                       asset.type === "plane" ? <Plane className={palIcon} style={{ color: asset.color }} /> :
                       asset.type === "light" ? <Lightbulb className={palIcon} style={{ color: asset.color }} /> :
                       <BoxIcon className={`${palIcon} rotate-45`} style={{ color: asset.color }} />}
                      {paletteSize !== "small" && <span className="text-[8px] text-center leading-tight truncate w-full">{asset.name}</span>}
                    </button>
                  ))}
                </div>
                <div className="p-2 mt-2 border-t border-white/5">
                  <button onClick={() => toast.info("Drag .glb/.gltf files here to import 3D models")}
                    className="w-full p-3 rounded border border-dashed border-white/10 hover:border-cyan-500/50 text-xs text-muted-foreground hover:text-white transition-all flex flex-col items-center gap-1">
                    <Upload className="w-4 h-4" /> Upload .glb / .gltf
                  </button>
                </div>
              </>
            )}

            {leftPanel === "lights" && (
              <>
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">Add Lights</div>
                {LIGHT_TYPES.map((lt) => (
                  <button key={lt} onClick={() => addLight(lt)} className="w-full flex items-center gap-2 px-3 py-2 text-xs capitalize hover:bg-white/5 transition-colors">
                    <Lightbulb className="w-3.5 h-3.5 text-yellow-400" /> {lt}
                  </button>
                ))}
                <div className="px-3 py-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Quick map lighting</div>
                  {LIGHT_PRESETS.map((p) => (
                    <button key={p.id} onClick={() => { setWorld({ ...p.apply, lightPreset: p.id }); setRightTab("world"); }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 text-left">
                      <span className="w-5 h-4 rounded border border-white/10" style={{ background: `linear-gradient(135deg, ${p.swatch[0]}, ${p.swatch[1]})` }} />
                      <span className="text-[11px]">{p.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* CENTER — viewport */}
        <div ref={containerRef} className="flex-1 relative bg-[#0d0e12]" style={{ cursor: isPlaying && pointerLocked ? "none" : "default" }}>
          <Canvas
            shadows={world.shadows}
            gl={{ preserveDrawingBuffer: true, antialias: true }}
            camera={{ position: [8, 6, 10], fov: world.fov }}
            dpr={[1, 2]}
            onClick={() => { if (!isPlaying) setSelectedId(null); }}
          >
            <PipelineSettings world={world} />
            <WorldEnvironment world={world} hideGrid={!world.showGrid || (isPlaying && gameMode === "rpg")} baseHalf={baseHalf} />

            {staticObjects.map((obj) => (
              <Object3DMesh key={obj.id} obj={obj} selected={selectedId === obj.id && !isPlaying} onSelect={() => onSelectObj(obj.id)} />
            ))}

            <RpgRuntime
              entities={rpgEntities}
              playerRef={canvasPlayerRef}
              interactRef={interactRef}
              attackRef={attackRef}
              active={isPlaying && gameMode === "rpg"}
              onState={setRpgState}
            />

            {isPlaying && cameraMode === "third-person" && (
              <FollowGroup playerRef={canvasPlayerRef}>
                <Avatar3D position={[0, 0, 0]} color={avatarColor} preset={avatar} bodyType={avatarBodyType} />
              </FollowGroup>
            )}

            <PlayerController
              isPlaying={isPlaying}
              cameraMode={cameraMode}
              playerRef={canvasPlayerRef}
              keysRef={keysRef}
              backupRef={camBackupRef}
              waterLevel={playWaterLevel}
              baseHalf={baseHalf}
            />
            <ScriptRuntime objects={objects} active={isPlaying} keysRef={keysRef} playerRef={canvasPlayerRef} logDebug={logDebug} />
            <GizmoProxy obj={selectedObj} tool={activeTool} snap={snapEnabled} enabled={!isPlaying} onUpdate={updateProp} onPushUndo={pushUndo} />
            <FocusHandler focusCounter={focusCounter} objects={objects} selectedId={selectedId} />
            <RigidBodySim objects={objects} active={isPlaying} />
            <ScreenshotRegistrar />

            {world.showGizmo && !isPlaying && (
              <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                <GizmoViewport axisColors={["#ef4444", "#10b981", "#3b82f6"]} labelColor="white" />
              </GizmoHelper>
            )}
            <OrbitControls makeDefault enabled={!isPlaying} />
          </Canvas>

          {/* viewport glow frame */}
          <div className="absolute inset-0 pointer-events-none rounded-[4px] shadow-[inset_0_0_0_1px_rgba(34,211,238,0.12),inset_0_0_60px_rgba(34,211,238,0.05)]" />

          {/* stats */}
          <div className="absolute top-2 left-2 px-3 py-1.5 rounded-md bg-black/60 backdrop-blur-sm text-xs flex items-center gap-2">
            <span className="text-cyan-400">●</span>
            <span>{objects.length} objects</span>
            <span className="text-muted-foreground">|</span>
            <span>{isPlaying ? "Playing" : "Editing"}</span>
            {gameMode === "rpg" && <span className="text-amber-400">| RPG</span>}
            {snapEnabled && <span className="text-violet-400">| SNAP</span>}
          </div>

          {/* tips */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-muted-foreground whitespace-nowrap">
            {isPlaying
              ? cameraMode === "orbit"
                ? "WASD to glide · Click Stop to exit"
                : "WASD move · Shift run · Space jump · E interact · Click attack · Esc releases the mouse"
              : "Click to select · Gizmo to move/rotate/scale · F focus · Play = first-person mouse look"}
          </div>

          {/* play badge */}
          {isPlaying && (
            <div className="absolute top-2 right-2 px-3 py-1.5 rounded-md bg-red-500/20 border border-red-500/50 text-xs flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full bg-red-500 ${pointerLocked ? "rec-dot" : ""}`} />
              {gameMode === "rpg" ? "RPG PLAYING" : "PLAY TESTING"}
            </div>
          )}

          {/* resume overlay */}
          {isPlaying && lockLost && cameraMode !== "orbit" && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 z-10" onClick={requestLock}>
              <div className="text-lg font-bold">Paused</div>
              <div className="text-xs text-white/60">Click anywhere to resume first-person play</div>
              <button onClick={(e) => { e.stopPropagation(); stopPlay(); }} className="mt-2 px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs">
                Stop play test
              </button>
            </div>
          )}

          {/* GUI elements preview during play */}
          {isPlaying && guiElements.filter((g) => g.visible).map((el) => (
            <div key={el.id} className="absolute pointer-events-none"
              style={{
                left: `${el.x}%`, top: `${el.y}%`,
                width: el.type === "text" ? "auto" : el.width, height: el.type === "text" ? "auto" : el.height,
                background: el.type === "button" ? el.color : el.type === "panel" ? `${el.color}40` : "transparent",
                color: el.type === "text" ? el.color : "#fff", fontSize: el.fontSize,
                padding: "2px 8px", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              {el.text || el.type}
            </div>
          ))}

          {/* RPG HUD */}
          {isPlaying && gameMode === "rpg" && rpgState && (
            <RpgHud state={rpgState} avatarName={avatar} />
          )}
        </div>

        {/* RIGHT — Components / World */}
        <div className="w-80 bg-[#12151b] border-l border-white/5 flex flex-col">
          <div className="flex border-b border-white/5">
            <button onClick={() => setRightTab("components")}
              className={`flex-1 px-3 py-2 text-xs font-medium ${rightTab === "components" ? "text-white bg-white/5 border-b-2 border-cyan-500" : "text-muted-foreground hover:text-white"}`}>
              Components
            </button>
            <button onClick={() => setRightTab("world")}
              className={`flex-1 px-3 py-2 text-xs font-medium ${rightTab === "world" ? "text-white bg-white/5 border-b-2 border-cyan-500" : "text-muted-foreground hover:text-white"}`}>
              World · Lighting
            </button>
          </div>

          {rightTab === "components" ? (
            selectedObj ? (
              <ComponentsPanel
                obj={selectedObj}
                onUpdate={updateProp}
                onPushUndo={pushUndo}
                onDeleteObject={deleteObject}
                onDuplicate={duplicateObject}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-xs text-muted-foreground p-6 text-center gap-3">
                <Layers className="w-8 h-8 opacity-30" />
                <div>Click an object in the viewport or Explorer to edit its components.</div>
                <div className="text-[10px] opacity-70">Blender-style: add Rigid Body, Script, Audio Source and more per object.</div>
                <button onClick={() => setRightTab("world")} className="mt-1 px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[11px]">
                  Open World settings instead
                </button>
              </div>
            )
          ) : (
            <WorldPanel world={world} setWorld={setWorld} />
          )}
        </div>
      </div>

      {/* ================= TIMELINE ================= */}
      <div className="h-20 bg-[#12151b] border-t border-white/5 flex items-center px-3 gap-2">
        <div className="flex items-center gap-1">
          <button className="tool-btn h-7 w-7 p-0" title="Play animation"><Play className="w-3 h-3" /></button>
          <button className="tool-btn h-7 w-7 p-0" title="Pause"><Pause className="w-3 h-3" /></button>
          <button className="tool-btn h-7 w-7 p-0" title="Stop"><Square className="w-3 h-3" /></button>
        </div>
        <div className="text-xs text-muted-foreground">Timeline</div>
        <div className="flex-1 relative h-10 bg-black/30 rounded">
          <div className="absolute inset-0 flex flex-col">
            {["Position", "Rotation", "Scale", "Color"].map((track) => (
              <div key={track} className="flex-1 border-b border-white/5 last:border-b-0 flex items-center px-2">
                <span className="text-[9px] text-muted-foreground w-16">{track}</span>
                <div className="flex-1 relative h-3 bg-white/5 rounded">
                  {[0.1, 0.3, 0.5, 0.7, 0.9].map((pos, j) => (
                    <div key={j} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-500 rounded-sm" style={{ left: `${pos * 100}%` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="absolute top-0 bottom-0 w-px bg-red-500" style={{ left: "30%" }} />
        </div>
        <div className="text-xs text-muted-foreground">0:00 / 5:00</div>
      </div>

      {/* ================= STATUS BAR ================= */}
      <div className="h-6 bg-gradient-to-r from-cyan-600 via-cyan-700 to-violet-700 text-white text-[11px] flex items-center px-3 gap-4">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? "bg-green-300" : "bg-white/60"}`} />
          <span>{isPlaying ? (gameMode === "rpg" ? "Playing RPG quest" : "Playing") : "Editing"}</span>
        </div>
        <span>|</span>
        <span>{objects.length} objects</span>
        <span>|</span>
        <span>Selected: {selectedObj?.name ?? "None"}</span>
        <span>|</span>
        <span>Tool: {activeTool}{snapEnabled ? " + snap" : ""}</span>
        <span>|</span>
        <span>{cameraMode}</span>
        <span>|</span>
        <span>{statusLine}</span>
        <div className="flex-1" />
        <span>Lighting: {LIGHT_PRESETS.find((p) => p.id === world.lightPreset)?.label ?? "Custom"}</span>
        <span>|</span>
        <span>Three.js r186 · WebGL 2.0</span>
      </div>

      {/* ================= OVERLAYS ================= */}
      {showWelcome && <WelcomeCard onClose={() => setShowWelcome(false)} />}

      {editingTarget && (
        <ScriptEditor
          objectName={editingTarget.obj.name}
          scriptName={editingTarget.script.name}
          code={editingTarget.script.code}
          onChange={(v) => setBlockCode(editingTarget.script.id, v)}
          onRename={(v) => renameScript(editingTarget.script.id, v)}
          onClose={() => { setEditingScript(null); playTap(); }}
        />
      )}

      {codePanelOpen && (
        <CodePanel
          codeTab={codeTab} setCodeTab={setCodeTab}
          scriptCode={scriptCode} cssCode={cssCode} jsCode={jsCode}
          setScriptCode={setScriptCode} setCssCode={setCssCode} setJsCode={setJsCode}
          onClose={() => setCodePanelOpen(false)}
        />
      )}

      {showGuiEditor && (
        <GuiEditor
          guiElements={guiElements} setGuiElements={setGuiElements as (fn: (gs: GUIElement[]) => GUIElement[]) => void}
          selectedGuiId={selectedGuiId} setSelectedGuiId={setSelectedGuiId}
          guiTool={guiTool} setGuiTool={setGuiTool}
          logDebug={logDebug} onClose={() => setShowGuiEditor(false)}
        />
      )}

      {showDebugConsole && (
        <DebugConsole
          debugLogs={debugLogs}
          onRun={runScript}
          onClear={() => setDebugLogs([])}
          onClose={() => setShowDebugConsole(false)}
          onCommand={(cmd) => logDebug("info", `> ${cmd}`)}
        />
      )}

      {showTerrainEditor && (
        <TerrainEditor
          terrainSize={terrainSize} setTerrainSize={setTerrainSize}
          waterLevel={waterLevel} setWaterLevel={setWaterLevel}
          onAddTerrain={() => {
            pushUndo();
            setObjects((os) => [...os, {
              id: uid(), name: "Terrain", type: "terrain",
              position: [0, 0, 0], rotation: [0, 0, 0], scale: [terrainSize.width, terrainSize.height, terrainSize.depth],
              color: "#4c9a3f", visible: true, locked: false, components: defaultComponentsFor("terrain"),
            }]);
            logDebug("success", `Terrain added (${terrainSize.width}x${terrainSize.depth})`);
            toast.success("Terrain added to scene");
          }}
          onAddWater={() => {
            pushUndo();
            setObjects((os) => [...os, {
              id: uid(), name: "Water", type: "water",
              position: [0, waterLevel, 0], rotation: [-Math.PI / 2, 0, 0], scale: [terrainSize.width, terrainSize.depth, 1],
              color: "#3b82f6", visible: true, locked: false, opacity: 0.6, transparent: true, components: defaultComponentsFor("water"),
            }]);
            logDebug("info", `Water plane added at y=${waterLevel}`);
            toast.success("Water added");
          }}
          onClose={() => setShowTerrainEditor(false)}
        />
      )}
    </div>
  );
}
