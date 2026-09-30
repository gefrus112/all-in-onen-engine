"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";
import { Slider } from "../../components/ui/slider";
import { useStudio, StudioTheme } from "../../lib/studio-store";
import { Palette, Settings2, Type, Volume2, Monitor, Sparkles, Play } from "lucide-react";
import { playTap, playPop, playToggle, playSuccess, playCoin } from "../../lib/ui-sounds";

const THEMES: { id: StudioTheme; name: string; preview: string; colors: string[] }[] = [
  { id: "dark", name: "Studio Dark", preview: "Default", colors: ["#1e1f22", "#25262b", "#3b82f6"] },
  { id: "midnight", name: "Midnight", preview: "Deep blue-black", colors: ["#0a0e1a", "#131826", "#1e3a8a"] },
  { id: "ocean", name: "Ocean", preview: "Cool teal", colors: ["#0c1a1f", "#13262c", "#0891b2"] },
  { id: "purple", name: "Royal Purple", preview: "Violet dream", colors: ["#1a0d24", "#2a1840", "#9333ea"] },
  { id: "sunset", name: "Sunset", preview: "Warm orange", colors: ["#1f1410", "#2c1d18", "#ea580c"] },
];

export function SettingsDialog() {
  const {
    settingsOpen,
    setSettingsOpen,
    theme,
    setTheme,
    editorFontFamily,
    setEditorFontFamily,
    editorFontSize,
    setEditorFontSize,
    editorWordWrap,
    setEditorWordWrap,
    showMinimap,
    setShowMinimap,
    enableSounds,
    setEnableSounds,
    uiSoundVolume,
    setUiSoundVolume,
    enableCRT,
    setEnableCRT,
    autoSave,
    setAutoSave,
  } = useStudio();

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Customize All In One Engine to your taste. Changes are saved automatically.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="appearance" className="text-xs">
              <Palette className="w-3 h-3 mr-1" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="editor" className="text-xs">
              <Type className="w-3 h-3 mr-1" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs">
              <Monitor className="w-3 h-3 mr-1" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="sound" className="text-xs">
              <Volume2 className="w-3 h-3 mr-1" />
              Audio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); playPop(); }}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all ${theme === t.id ? "border-blue-500 scale-105" : "border-border hover:border-muted-foreground"}`}
                >
                  <div className="aspect-[4/3] relative" style={{ background: t.colors[0] }}>
                    <div className="absolute inset-x-2 top-2 h-6 rounded" style={{ background: t.colors[1] }} />
                    <div className="absolute left-2 top-4 w-12 h-2 rounded" style={{ background: t.colors[2] }} />
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[9px] rounded" style={{ background: t.colors[2] }}>
                      {theme === t.id ? "Active" : ""}
                    </div>
                  </div>
                  <div className="p-2 text-left">
                    <div className="text-xs font-medium">{t.name}</div>
                    <div className="text-[10px] text-muted-foreground">{t.preview}</div>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Themes restyle the interface panels, dialogs and the 2D Studio. The 3D viewport keeps its own cinematic look.
            </p>
          </TabsContent>

          <TabsContent value="editor" className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label className="text-xs">Font Family</Label>
              <select
                value={editorFontFamily}
                onChange={(e) => { setEditorFontFamily(e.target.value); playTap(); }}
                className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs"
              >
                <option value="JetBrains Mono, Consolas, monospace">JetBrains Mono</option>
                <option value="Fira Code, Consolas, monospace">Fira Code</option>
                <option value="Consolas, monospace">Consolas</option>
                <option value="Menlo, monospace">Menlo</option>
                <option value="Courier New, monospace">Courier New</option>
                <option value="ui-monospace, monospace">System Mono</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Font Size</Label>
                <span className="text-xs text-muted-foreground">{editorFontSize}px</span>
              </div>
              <Slider
                value={[editorFontSize]}
                onValueChange={([v]) => setEditorFontSize(v)}
                min={10}
                max={22}
                step={1}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <Label htmlFor="wordwrap" className="text-xs">Word Wrap</Label>
              <Switch id="wordwrap" checked={editorWordWrap} onCheckedChange={(v) => { setEditorWordWrap(v); playToggle(v); }} />
            </div>

            <div className="flex items-center justify-between py-2">
              <Label htmlFor="minimap" className="text-xs">Show Minimap</Label>
              <Switch id="minimap" checked={showMinimap} onCheckedChange={(v) => { setShowMinimap(v); playToggle(v); }} />
            </div>

            <div className="flex items-center justify-between py-2">
              <Label htmlFor="autosave" className="text-xs">Auto-save to localStorage</Label>
              <Switch id="autosave" checked={autoSave} onCheckedChange={(v) => { setAutoSave(v); playToggle(v); }} />
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-xs">CRT Scanline Effect</Label>
                <p className="text-[10px] text-muted-foreground">Retro scanlines + glow around preview canvas</p>
              </div>
              <Switch checked={enableCRT} onCheckedChange={(v) => { setEnableCRT(v); playToggle(v); }} />
            </div>
            <div className="rounded-md p-3 bg-background/40 border border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Sparkles className="w-3 h-3" />
                Preview customization coming soon: scale, device frame, performance overlay
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sound" className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-xs">Enable UI Sounds</Label>
                <p className="text-[10px] text-muted-foreground">Satisfying taps, clicks, pops and success chimes across the studio</p>
              </div>
              <Switch checked={enableSounds} onCheckedChange={(v) => { setEnableSounds(v); if (v) setTimeout(() => playSuccess(), 30); }} />
            </div>

            <div className="space-y-2 py-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">UI Sound Volume</Label>
                <span className="text-xs text-muted-foreground">{Math.round(uiSoundVolume * 100)}%</span>
              </div>
              <Slider
                value={[uiSoundVolume]}
                onValueChange={([v]) => setUiSoundVolume(v)}
                min={0}
                max={1}
                step={0.05}
                disabled={!enableSounds}
              />
            </div>

            <div className="rounded-md p-3 bg-background/40 border border-border">
              <div className="text-[10px] text-muted-foreground mb-2.5">Preview the sounds:</div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => playTap()} disabled={!enableSounds} className="px-2.5 py-1 rounded-md border border-border text-[11px] hover:bg-accent flex items-center gap-1.5"><Play className="w-3 h-3" /> Tap</button>
                <button onClick={() => playPop()} disabled={!enableSounds} className="px-2.5 py-1 rounded-md border border-border text-[11px] hover:bg-accent flex items-center gap-1.5"><Play className="w-3 h-3" /> Pop</button>
                <button onClick={() => playToggle(true)} disabled={!enableSounds} className="px-2.5 py-1 rounded-md border border-border text-[11px] hover:bg-accent flex items-center gap-1.5"><Play className="w-3 h-3" /> Toggle</button>
                <button onClick={() => playSuccess()} disabled={!enableSounds} className="px-2.5 py-1 rounded-md border border-border text-[11px] hover:bg-accent flex items-center gap-1.5"><Play className="w-3 h-3" /> Success</button>
                <button onClick={() => playCoin()} disabled={!enableSounds} className="px-2.5 py-1 rounded-md border border-border text-[11px] hover:bg-accent flex items-center gap-1.5"><Play className="w-3 h-3" /> Coin</button>
              </div>
            </div>

            <div className="rounded-md p-3 bg-background/40 border border-border">
              <p className="text-[10px] text-muted-foreground">
                Game audio (from your Python code via <code className="text-blue-400">AudioMixer</code>) is always on.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
