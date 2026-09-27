"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useStudio } from "@/lib/studio-store";
import {
  Rocket, Wand2, Code2, Upload, Users, Send, Package, BookOpen,
} from "lucide-react";

const STEPS = [
  {
    title: "1. Launch the Studio",
    icon: Rocket,
    content: "Click 'Launch Studio' on the homepage. You'll be asked to pick an engine: Pygame 2D, Three.js 3D, or Zhitlow 3D. Pick the one that matches your game idea.",
  },
  {
    title: "2. Pick a Template",
    icon: Wand2,
    content: "On the Templates panel (bottom-left of 2D Studio, or click any preset in 3D Studio), click a starter template. The code/scene is loaded automatically.",
  },
  {
    title: "3. Edit Your Game",
    icon: Code2,
    content: "In 2D: modify Python code in the Monaco editor. In 3D: click objects to select, drag the gizmo to move/rotate/scale. Press Play to test in both.",
  },
  {
    title: "4. Add Assets",
    icon: Upload,
    content: "2D: drag sprites from the Toolbox — they auto-copy as Python code. 3D: click the Assets tab, drag a preset into the scene, or upload your own .glb/.gltf files.",
  },
  {
    title: "5. Pick Your Avatar",
    icon: Users,
    content: "Click the avatar button in the toolbar. Pick from 6 presets or use the customizer to choose body type, color. Your avatar appears in 3D play-test mode.",
  },
  {
    title: "6. Test with Multiplayer",
    icon: Users,
    content: "Run ./start-multiplayer.sh in a terminal. Open the IDE in 2 browser tabs, load the Multiplayer Arena template, hit Play — both avatars will appear in real-time.",
  },
  {
    title: "7. Publish Your Game",
    icon: Send,
    content: "When ready, click Publish. Pick a platform (itch.io, Crazy Games, GitHub Pages, or HTML5). Build the HTML5 file, then follow the platform-specific steps.",
  },
  {
    title: "8. Build Native Installers",
    icon: Package,
    content: "Want a Windows .exe, Linux AppImage, macOS .dmg, or Chromebook .deb? Run the build scripts in /build_exe.sh, /build_linux.sh, /build_mac.sh, or /build_chromebook.sh. Outputs go to dist/.",
  },
];

export function InstructionsDialog() {
  const { instructionsOpen, setInstructionsOpen } = useStudio();

  return (
    <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            How to Use All In One Engine
          </DialogTitle>
          <DialogDescription>
            From zero to published in 8 steps. Click each step to expand.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg bg-background/40 border border-border">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <step.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1 text-sm">{step.title}</h3>
                <p className="text-xs text-muted-foreground">{step.content}</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
