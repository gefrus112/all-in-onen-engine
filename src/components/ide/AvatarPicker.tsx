"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStudio, AvatarPreset } from "@/lib/studio-store";
import { User, Check } from "lucide-react";

const AVATAR_PRESETS: { id: AvatarPreset; name: string; sprite: string; defaultColor: string }[] = [
  { id: "knight", name: "Knight", sprite: "/sprites/player/knight.png", defaultColor: "#3b82f6" },
  { id: "mage", name: "Mage", sprite: "/sprites/player/mage.png", defaultColor: "#8b5cf6" },
  { id: "archer", name: "Archer", sprite: "/sprites/player/archer.png", defaultColor: "#10b981" },
  { id: "rogue", name: "Rogue", sprite: "/sprites/player/rogue.png", defaultColor: "#1f2937" },
  { id: "wizard", name: "Wizard", sprite: "/sprites/player/wizard.png", defaultColor: "#1e3a8a" },
  { id: "robot", name: "Robot", sprite: "/sprites/player/robot.png", defaultColor: "#06b6d4" },
];

const COLOR_OPTIONS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#fbbf24", "#84cc16", "#10b981", "#06b6d4", "#64748b",
];

const BODY_TYPES = [
  { id: "slim" as const, name: "Slim", description: "Smaller frame, 85% size" },
  { id: "average" as const, name: "Average", description: "Default size" },
  { id: "tall" as const, name: "Tall", description: "Taller, 130% size" },
];

export function AvatarPicker() {
  const {
    avatarPickerOpen, setAvatarPickerOpen,
    avatar, setAvatar,
    avatarColor, setAvatarColor,
    avatarBodyType, setAvatarBodyType,
  } = useStudio();

  return (
    <Dialog open={avatarPickerOpen} onOpenChange={setAvatarPickerOpen}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Play-Test Avatar
          </DialogTitle>
          <DialogDescription>
            Pick a preset avatar or customize your own. This avatar will appear when you hit Play in the 3D Studio.
          </DialogDescription>
        </DialogHeader>

        {/* Preset picker */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Presets</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
            {AVATAR_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => { setAvatar(p.id); setAvatarColor(p.defaultColor); }}
                className={`aspect-square p-2 rounded-lg border-2 transition-all ${avatar === p.id ? "border-cyan-500 bg-cyan-500/10" : "border-border hover:border-muted-foreground"}`}
              >
                <img src={p.sprite} alt={p.name} className="w-full h-full object-contain" style={{ imageRendering: "pixelated" }} />
                <div className="text-[10px] mt-1">{p.name}</div>
                {avatar === p.id && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Customizer */}
        <div className="space-y-4 border-t border-border pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customize</h3>

          {/* Body type */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Body Type</label>
            <div className="grid grid-cols-3 gap-2">
              {BODY_TYPES.map((bt) => (
                <button
                  key={bt.id}
                  onClick={() => setAvatarBodyType(bt.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${avatarBodyType === bt.id ? "border-cyan-500 bg-cyan-500/10" : "border-border hover:border-muted-foreground"}`}
                >
                  <div className="text-sm font-medium">{bt.name}</div>
                  <div className="text-[10px] text-muted-foreground">{bt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Body Color</label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="color"
                value={avatarColor}
                onChange={(e) => setAvatarColor(e.target.value)}
                className="w-10 h-10 rounded border border-border cursor-pointer"
              />
              <input
                value={avatarColor}
                onChange={(e) => setAvatarColor(e.target.value)}
                className="flex-1 bg-transparent px-2 py-1 text-xs outline-none border border-border focus:border-cyan-500 rounded"
              />
            </div>
            <div className="grid grid-cols-10 gap-1">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setAvatarColor(c)}
                  className={`aspect-square rounded border-2 transition-all ${avatarColor === c ? "border-white scale-110" : "border-transparent hover:scale-105"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg bg-black/40 border border-border p-4">
            <div className="text-xs text-muted-foreground mb-2">Preview</div>
            <div className="flex items-center gap-3">
              <img
                src={AVATAR_PRESETS.find(p => p.id === avatar)?.sprite}
                alt={avatar}
                className="w-16 h-16 object-contain"
                style={{ imageRendering: "pixelated" }}
              />
              <div className="flex-1">
                <div className="text-sm font-medium capitalize">{avatar}</div>
                <div className="text-xs text-muted-foreground">Body: {avatarBodyType}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-4 h-4 rounded" style={{ background: avatarColor }} />
                  <span className="text-xs">{avatarColor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => setAvatarPickerOpen(false)}>
            <Check className="w-4 h-4 mr-1" />
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
