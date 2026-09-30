// All In One Engine — 3D Studio panels: Components (Blender-style) + World (lighting & rendering)
"use client";

import { useState } from "react";
import {
  ChevronDown, ChevronRight, Plus, X, Move, Box, Lightbulb, Code2, Music,
  Sparkles, Globe, Frame, Tag, Zap, Sun, Eye, Copy, Trash2,
} from "lucide-react";
import type { SceneObject3D, WorldSettings } from "./types";
import { RPG_COMPONENTS, LIGHT_PRESETS, COMPONENT_ICONS } from "./types";

// ---------- small building blocks ----------
function Section({ title, icon, defaultOpen = true, onRemove, children }: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  onRemove?: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/5">
      <div className="flex items-center gap-1.5 px-3 py-2 cursor-pointer hover:bg-white/[0.03]" onClick={() => setOpen(!open)}>
        {open ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80">{title}</span>
        {onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="ml-auto text-muted-foreground hover:text-red-400"
            title={`Remove ${title}`}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      {open && <div className="px-3 pb-2.5">{children}</div>}
    </div>
  );
}

function NumRow({ label, value, step = 0.1, onChange }: { label: string; value: number; step?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-[10px] text-muted-foreground w-24 truncate">{label}</span>
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="flex-1 bg-black/30 px-2 py-0.5 text-[11px] outline-none border border-transparent focus:border-cyan-500 rounded"
      />
    </div>
  );
}

function SliderRow({ label, value, min, max, step = 0.05, onChange, fmt }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; fmt?: (v: number) => string;
}) {
  return (
    <div className="mb-1.5">
      <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
        <span>{label}</span>
        <span className="font-mono text-white/60">{fmt ? fmt(value) : value.toFixed(2)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full accent-cyan-500" />
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <span className="text-[11px] text-white/70">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-9 h-4.5 rounded-full relative transition-colors ${value ? "bg-cyan-500" : "bg-white/15"}`}
        style={{ height: 18 }}
      >
        <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all ${value ? "left-[18px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-[11px] text-muted-foreground w-24">{label}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-7 h-7 rounded border border-white/10 cursor-pointer bg-transparent" />
      <input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 bg-black/30 px-2 py-0.5 text-[11px] font-mono outline-none border border-transparent focus:border-cyan-500 rounded" />
    </div>
  );
}

const compIcon = (name: string, cls = "w-3.5 h-3.5 text-cyan-400") => {
  switch (COMPONENT_ICONS[name]) {
    case "move": return <Move className={cls} />;
    case "box": return <Box className={cls} />;
    case "lightbulb": return <Lightbulb className={cls} />;
    case "gravity": return <Zap className={cls} />;
    case "frame": return <Frame className={cls} />;
    case "music": return <Music className={cls} />;
    case "code": return <Code2 className={cls} />;
    case "sparkles": return <Sparkles className={cls} />;
    case "globe": return <Globe className={cls} />;
    case "tag": return <Tag className={cls} />;
    default: return <Box className={cls} />;
  }
};

// ---------- Components panel (Blender-style) ----------
export function ComponentsPanel({ obj, onUpdate, onPushUndo, onDeleteObject, onDuplicate }: {
  obj: SceneObject3D;
  onUpdate: (id: string, key: string, value: unknown) => void;
  onPushUndo: () => void;
  onDeleteObject: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const components = obj.components ?? ["Transform", obj.type === "light" ? "Light" : "Mesh Renderer"];
  const isMesh = obj.type !== "light";
  const isLight = obj.type === "light";

  const addComponent = (name: string) => {
    onPushUndo();
    onUpdate(obj.id, "components", [...components, name]);
    setAddOpen(false);
  };
  const removeComponent = (name: string) => {
    onPushUndo();
    onUpdate(obj.id, "components", components.filter((c) => c !== name));
  };

  const available = RPG_COMPONENTS.filter((c) => !components.includes(c));

  return (
    <div className="flex-1 overflow-y-auto">
      {/* object name */}
      <div className="p-3 border-b border-white/5">
        <div className="text-[10px] text-muted-foreground mb-1">Active Object</div>
        <input
          className="w-full bg-transparent text-sm font-semibold outline-none border-b border-transparent focus:border-cyan-500"
          value={obj.name}
          onChange={(e) => onUpdate(obj.id, "name", e.target.value)}
        />
        <div className="flex gap-1.5 mt-2">
          <button onClick={() => onDuplicate(obj.id)} className="flex-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] flex items-center justify-center gap-1"><Copy className="w-3 h-3" /> Duplicate</button>
          <button onClick={() => onDeleteObject(obj.id)} className="flex-1 px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-[10px] text-red-300 flex items-center justify-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
        </div>
      </div>

      {/* Transform component (always) */}
      <Section title="Transform" icon={compIcon("Transform")}>
        {(["x", "y", "z"] as const).map((axis, i) => (
          <div key={axis} className="flex items-center gap-1.5 mb-1">
            <span className={`text-[10px] font-bold w-3 ${i === 0 ? "text-red-400" : i === 1 ? "text-green-400" : "text-blue-400"}`}>{axis.toUpperCase()}</span>
            <span className="text-[9px] text-muted-foreground w-8">Pos</span>
            <input type="number" step="0.1" value={obj.position[i]}
              onChange={(e) => { const p = [...obj.position] as [number, number, number]; p[i] = parseFloat(e.target.value) || 0; onUpdate(obj.id, "position", p); }}
              className="flex-1 min-w-0 bg-black/30 px-1.5 py-0.5 text-[10px] outline-none border border-transparent focus:border-cyan-500 rounded" />
            <span className="text-[9px] text-muted-foreground w-7">Rot</span>
            <input type="number" step="0.1" value={parseFloat(obj.rotation[i].toFixed(2))}
              onChange={(e) => { const r = [...obj.rotation] as [number, number, number]; r[i] = parseFloat(e.target.value) || 0; onUpdate(obj.id, "rotation", r); }}
              className="flex-1 min-w-0 bg-black/30 px-1.5 py-0.5 text-[10px] outline-none border border-transparent focus:border-cyan-500 rounded" />
            <span className="text-[9px] text-muted-foreground w-8">Scl</span>
            <input type="number" step="0.1" value={parseFloat(obj.scale[i].toFixed(2))}
              onChange={(e) => { const s = [...obj.scale] as [number, number, number]; s[i] = parseFloat(e.target.value) || 0.1; onUpdate(obj.id, "scale", s); }}
              className="flex-1 min-w-0 bg-black/30 px-1.5 py-0.5 text-[10px] outline-none border border-transparent focus:border-cyan-500 rounded" />
          </div>
        ))}
      </Section>

      {/* Mesh Renderer */}
      {isMesh && components.includes("Mesh Renderer") && (
        <Section title="Mesh Renderer" icon={compIcon("Mesh Renderer")} onRemove={isLight ? undefined : () => removeComponent("Mesh Renderer")}>
          <ColorRow label="Color" value={obj.color} onChange={(v) => onUpdate(obj.id, "color", v)} />
          <SliderRow label="Roughness" value={obj.roughness ?? 0.5} min={0} max={1} onChange={(v) => onUpdate(obj.id, "roughness", v)} />
          <SliderRow label="Metalness" value={obj.metalness ?? 0.1} min={0} max={1} onChange={(v) => onUpdate(obj.id, "metalness", v)} />
          <ColorRow label="Emissive" value={obj.emissive ?? "#000000"} onChange={(v) => onUpdate(obj.id, "emissive", v)} />
          <SliderRow label="Emissive Int." value={obj.emissiveIntensity ?? 0} min={0} max={3} onChange={(v) => onUpdate(obj.id, "emissiveIntensity", v)} />
          <SliderRow label="Opacity" value={obj.opacity ?? 1} min={0.05} max={1} onChange={(v) => { onUpdate(obj.id, "opacity", v); onUpdate(obj.id, "transparent", v < 1); }} />
          <ToggleRow label="Wireframe" value={obj.wireframe ?? false} onChange={(v) => onUpdate(obj.id, "wireframe", v)} />
          <ToggleRow label="Flat Shading" value={obj.flatShading ?? false} onChange={(v) => onUpdate(obj.id, "flatShading", v)} />
          <ToggleRow label="Cast Shadow" value={obj.castShadow !== false} onChange={(v) => onUpdate(obj.id, "castShadow", v)} />
          <ToggleRow label="Receive Shadow" value={obj.receiveShadow !== false} onChange={(v) => onUpdate(obj.id, "receiveShadow", v)} />
        </Section>
      )}

      {/* Light */}
      {isLight && components.includes("Light") && (
        <Section title="Light" icon={compIcon("Light")}>
          <ColorRow label="Color" value={obj.color} onChange={(v) => onUpdate(obj.id, "color", v)} />
          <SliderRow label="Intensity" value={obj.intensity ?? 1} min={0} max={5} step={0.1} onChange={(v) => onUpdate(obj.id, "intensity", v)} />
        </Section>
      )}

      {/* Rigid Body */}
      {components.includes("Rigid Body") && (
        <Section title="Rigid Body" icon={compIcon("Rigid Body")} onRemove={() => removeComponent("Rigid Body")}>
          <ToggleRow label="Kinematic (static)" value={obj.isKinematic ?? false} onChange={(v) => onUpdate(obj.id, "isKinematic", v)} />
          {!obj.isKinematic && (
            <>
              <NumRow label="Mass" value={obj.mass ?? 1} onChange={(v) => onUpdate(obj.id, "mass", v)} />
              <SliderRow label="Gravity Scale" value={obj.gravityScale ?? 1} min={-2} max={3} onChange={(v) => onUpdate(obj.id, "gravityScale", v)} />
              <SliderRow label="Bounciness" value={obj.bounciness ?? 0} min={0} max={1} onChange={(v) => onUpdate(obj.id, "bounciness", v)} />
            </>
          )}
          <ToggleRow label="Is Trigger" value={obj.isTrigger ?? false} onChange={(v) => onUpdate(obj.id, "isTrigger", v)} />
          <div className="text-[9px] text-muted-foreground mt-1">Non-kinematic bodies fall with gravity during play test.</div>
        </Section>
      )}

      {/* Box Collider */}
      {components.includes("Box Collider") && (
        <Section title="Box Collider" icon={compIcon("Box Collider")} defaultOpen={false} onRemove={() => removeComponent("Box Collider")}>
          <div className="text-[9px] text-muted-foreground mb-1.5">Size auto-fits the object bounds (scale x size).</div>
          <ToggleRow label="Is Trigger" value={obj.isTrigger ?? false} onChange={(v) => onUpdate(obj.id, "isTrigger", v)} />
        </Section>
      )}

      {/* Audio Source */}
      {components.includes("Audio Source") && (
        <Section title="Audio Source" icon={compIcon("Audio Source")} defaultOpen={false} onRemove={() => removeComponent("Audio Source")}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] text-muted-foreground w-24">Clip</span>
            <input value={obj.audioClip ?? ""} placeholder="e.g. coin_pickup.wav" onChange={(e) => onUpdate(obj.id, "audioClip", e.target.value)}
              className="flex-1 bg-black/30 px-2 py-0.5 text-[11px] outline-none border border-transparent focus:border-cyan-500 rounded" />
          </div>
          <SliderRow label="Volume" value={obj.audioVolume ?? 1} min={0} max={1} onChange={(v) => onUpdate(obj.id, "audioVolume", v)} />
          <ToggleRow label="Loop" value={obj.audioLoop ?? false} onChange={(v) => onUpdate(obj.id, "audioLoop", v)} />
          <ToggleRow label="Play On Awake" value={obj.audioPlayOnAwake ?? false} onChange={(v) => onUpdate(obj.id, "audioPlayOnAwake", v)} />
        </Section>
      )}

      {/* Script */}
      {components.includes("Script") && (
        <Section title="Script" icon={compIcon("Script")} onRemove={() => removeComponent("Script")}>
          <textarea
            value={obj.script ?? "// runs every frame during play test\nfunction update(dt, self) {\n  \n}"}
            onChange={(e) => onUpdate(obj.id, "script", e.target.value)}
            spellCheck={false}
            className="w-full h-28 bg-black/40 p-2 text-[10px] font-mono text-cyan-100 outline-none border border-white/10 focus:border-cyan-500 rounded resize-none"
          />
        </Section>
      )}

      {/* Particle Emitter */}
      {components.includes("Particle Emitter") && (
        <Section title="Particle Emitter" icon={compIcon("Particle Emitter")} defaultOpen={false} onRemove={() => removeComponent("Particle Emitter")}>
          <div className="text-[9px] text-muted-foreground mb-1.5">Emits a soft sparkle column above the object during play test.</div>
          <ColorRow label="Tint" value={obj.emissive ?? "#22d3ee"} onChange={(v) => onUpdate(obj.id, "emissive", v)} />
          <SliderRow label="Strength" value={obj.emissiveIntensity ?? 0.5} min={0} max={3} onChange={(v) => onUpdate(obj.id, "emissiveIntensity", v)} />
        </Section>
      )}

      {/* Network Sync */}
      {components.includes("Network Sync") && (
        <Section title="Network Sync" icon={compIcon("Network Sync")} defaultOpen={false} onRemove={() => removeComponent("Network Sync")}>
          <ToggleRow label="Networked" value={obj.networked ?? false} onChange={(v) => onUpdate(obj.id, "networked", v)} />
          <NumRow label="Owner Id" value={0} onChange={() => {}} />
          <div className="text-[9px] text-muted-foreground mt-1">Syncs transform at 10 Hz over socket.io in multiplayer sessions.</div>
        </Section>
      )}

      {/* Tag & Layer */}
      <Section title="Tag & Layer" icon={compIcon("Tag & Layer")} defaultOpen={false}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] text-muted-foreground w-12">Tag</span>
          <input value={obj.tag ?? ""} onChange={(e) => onUpdate(obj.id, "tag", e.target.value)}
            className="flex-1 bg-black/30 px-2 py-0.5 text-[11px] outline-none border border-transparent focus:border-cyan-500 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-12">Layer</span>
          <select value={obj.layer ?? "Default"} onChange={(e) => onUpdate(obj.id, "layer", e.target.value)}
            className="flex-1 bg-black/30 px-2 py-0.5 text-[11px] outline-none border border-white/10 rounded">
            {["Default", "TransparentFX", "Ignore Raycast", "Water", "UI", "Player", "Enemy", "Interactable"].map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
      </Section>

      {/* Add component */}
      <div className="p-3 relative">
        <button
          onClick={() => setAddOpen(!addOpen)}
          className="w-full py-1.5 rounded-lg border border-dashed border-cyan-500/40 hover:border-cyan-500 hover:bg-cyan-500/10 text-[11px] text-cyan-400 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Component
        </button>
        {addOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-1 rounded-lg bg-[#181c24] border border-white/10 shadow-xl z-20 overflow-hidden">
            {available.length === 0 && <div className="px-3 py-2 text-[10px] text-muted-foreground">All components added</div>}
            {available.map((c) => (
              <button key={c} onClick={() => addComponent(c)} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-cyan-500/15 text-left">
                {compIcon(c, "w-3.5 h-3.5 text-muted-foreground")}
                {c}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- World panel: lighting + rendering ----------
export function WorldPanel({ world, setWorld }: {
  world: WorldSettings;
  setWorld: (patch: Partial<WorldSettings>) => void;
}) {
  const [tab, setTab] = useState<"lighting" | "rendering">("lighting");
  const sunX = Math.cos((world.sunAzimuth * Math.PI) / 180);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex border-b border-white/5">
        {(["lighting", "rendering"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider ${tab === t ? "text-white bg-white/5 border-b-2 border-cyan-500" : "text-muted-foreground hover:text-white"}`}>
            {t === "lighting" ? "Lighting" : "Rendering"}
          </button>
        ))}
      </div>

      {tab === "lighting" ? (
        <>
          <div className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Map Lighting Presets</div>
          <div className="px-3 pb-2 space-y-1">
            {LIGHT_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setWorld({ ...p.apply, lightPreset: p.id })}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border text-left transition-all ${world.lightPreset === p.id ? "border-cyan-500/60 bg-cyan-500/10" : "border-white/5 hover:border-white/20 hover:bg-white/5"}`}
              >
                <span className="w-8 h-6 rounded-md border border-white/10 flex-shrink-0" style={{ background: `linear-gradient(135deg, ${p.swatch[0]}, ${p.swatch[1]})` }} />
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold text-white/90">{p.label}</span>
                  <span className="block text-[9px] text-muted-foreground truncate">{p.description}</span>
                </span>
                {world.lightPreset === p.id && <Sun className="w-3.5 h-3.5 text-amber-400 ml-auto" />}
              </button>
            ))}
          </div>

          <Section title="Sun" icon={<Sun className="w-3.5 h-3.5 text-amber-400" />}>
            <SliderRow label="Intensity" value={world.sunIntensity} min={0} max={5} step={0.05} onChange={(v) => setWorld({ sunIntensity: v })} />
            <SliderRow label="Elevation" value={world.sunElevation} min={5} max={85} step={1} onChange={(v) => setWorld({ sunElevation: v })} fmt={(v) => `${Math.round(v)}°`} />
            <SliderRow label="Azimuth" value={world.sunAzimuth} min={0} max={360} step={1} onChange={(v) => setWorld({ sunAzimuth: v })} fmt={(v) => `${Math.round(v)}°`} />
            <ColorRow label="Sun Color" value={world.sunColor} onChange={(v) => setWorld({ sunColor: v })} />
          </Section>

          <Section title="Ambience & Fog" icon={<Eye className="w-3.5 h-3.5 text-cyan-400" />}>
            <SliderRow label="Ambient Light" value={world.ambientIntensity} min={0} max={1.5} onChange={(v) => setWorld({ ambientIntensity: v })} />
            <ColorRow label="Ambient" value={world.ambientColor} onChange={(v) => setWorld({ ambientColor: v })} />
            <ColorRow label="Sky" value={world.skyColor} onChange={(v) => setWorld({ skyColor: v })} />
            <ToggleRow label="Fog" value={world.fogEnabled} onChange={(v) => setWorld({ fogEnabled: v })} />
            {world.fogEnabled && (
              <>
                <SliderRow label="Fog Density" value={world.fogDensity} min={0.02} max={0.8} onChange={(v) => setWorld({ fogDensity: v })} />
                <ColorRow label="Fog Color" value={world.fogColor} onChange={(v) => setWorld({ fogColor: v })} />
              </>
            )}
          </Section>
        </>
      ) : (
        <>
          <Section title="Shadows" icon={<Sparkles className="w-3.5 h-3.5 text-purple-400" />}>
            <ToggleRow label="Enable Shadows" value={world.shadows} onChange={(v) => setWorld({ shadows: v })} />
            {world.shadows && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-muted-foreground w-24">Shadow Map</span>
                <select value={world.shadowMapSize} onChange={(e) => setWorld({ shadowMapSize: parseInt(e.target.value) as WorldSettings["shadowMapSize"] })}
                  className="flex-1 bg-black/30 px-2 py-0.5 text-[11px] outline-none border border-white/10 rounded">
                  {[512, 1024, 2048, 4096].map((s) => <option key={s} value={s}>{s} px</option>)}
                </select>
              </div>
            )}
          </Section>

          <Section title="Color & Tone" icon={<Sun className="w-3.5 h-3.5 text-pink-400" />}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] text-muted-foreground w-24">Tone Mapping</span>
              <select value={world.toneMapping} onChange={(e) => setWorld({ toneMapping: e.target.value as WorldSettings["toneMapping"] })}
                className="flex-1 bg-black/30 px-2 py-0.5 text-[11px] outline-none border border-white/10 rounded">
                <option value="aces">ACES Filmic</option>
                <option value="linear">Linear</option>
                <option value="reinhard">Reinhard</option>
                <option value="none">None</option>
              </select>
            </div>
            <SliderRow label="Exposure" value={world.exposure} min={0.3} max={2.5} onChange={(v) => setWorld({ exposure: v })} />
          </Section>

          <Section title="Viewport" icon={<Eye className="w-3.5 h-3.5 text-green-400" />}>
            <SliderRow label="Field of View" value={world.fov} min={30} max={100} step={1} onChange={(v) => setWorld({ fov: v })} fmt={(v) => `${Math.round(v)}°`} />
            <ToggleRow label="Grid" value={world.showGrid} onChange={(v) => setWorld({ showGrid: v })} />
            <ToggleRow label="Axis Gizmo" value={world.showGizmo} onChange={(v) => setWorld({ showGizmo: v })} />
          </Section>

          <div className="px-3 py-3 text-[10px] text-muted-foreground leading-relaxed">
            Rendering settings apply to the editor viewport and play test. Tone mapping + exposure use the same pipeline as the published game.
          </div>
        </>
      )}
    </div>
  );
}
