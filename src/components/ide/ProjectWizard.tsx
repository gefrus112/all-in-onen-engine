"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useStudio } from "../../lib/studio-store";
import { toast } from "sonner";
import {
  Rocket, Folder, Package, FileCode2, ChevronRight, ChevronLeft, Check,
} from "lucide-react";

const TEMPLATES = [
  { id: "platformer", name: "Platformer", desc: "Player movement, gravity, jumping" },
  { id: "shooter", name: "Top-Down Shooter", desc: "Aim with mouse, shoot enemies" },
  { id: "multiplayer", name: "Multiplayer Arena", desc: "2-4 player online via socket.io" },
  { id: "physics", name: "Physics Sandbox", desc: "Bouncing balls, gravity, walls" },
  { id: "blank", name: "Blank Project", desc: "Empty Python file with basic setup" },
];

const OUTPUT_TYPES = [
  { id: "folder", name: "Project Folder", desc: "Save as a folder with main.py + assets", icon: Folder },
  { id: "exe", name: "Windows .exe", desc: "Generate PyInstaller spec + build script", icon: Package },
  { id: "html", name: "HTML Web Build", desc: "Standalone HTML file with Pyodide", icon: FileCode2 },
];

const PLATFORMER_BOILERPLATE = `"""${'{PROJECT_NAME}'} — A Lapia Studio project"""
from lapia_shim import Game, Scene, Sprite, Vector2, Color, Math


class MainScene(Scene):
    def on_load(self):
        self.player = Sprite(color=Color(80, 180, 240), size=(32, 32), layer='player')
        self.player.position = Vector2(400, 300)
        self.bg_color = Color(30, 32, 40)

    def on_update(self, dt):
        speed = 200
        if self.input.key_down('left') or self.input.key_down('a'):
            self.player.x -= speed * dt
        if self.input.key_down('right') or self.input.key_down('d'):
            self.player.x += speed * dt
        if self.input.key_down('up') or self.input.key_down('w'):
            self.player.y -= speed * dt
        if self.input.key_down('down') or self.input.key_down('s'):
            self.player.y += speed * dt

    def on_render(self, r):
        self.player.sprite.render(r.surface, self.camera) if hasattr(self.player, 'sprite') else r.fill_circle(self.player.position, 16, Color(80, 180, 240))


game = Game(title="${'{PROJECT_NAME}'}", size=(800, 600), fps=60)
game.run(MainScene())
`;

export function ProjectWizard() {
  const { wizardOpen, setWizardOpen, createFile, setFile, openFile, addConsole } = useStudio();
  const [step, setStep] = useState(0);
  const [projectName, setProjectName] = useState("My Awesome Game");
  const [templateId, setTemplateId] = useState("platformer");
  const [outputType, setOutputType] = useState("folder");

  const reset = () => {
    setStep(0);
    setProjectName("My Awesome Game");
    setTemplateId("platformer");
    setOutputType("folder");
  };

  const handleFinish = () => {
    const filename = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.py`;

    if (outputType === "folder" || outputType === "html") {
      const code = PLATFORMER_BOILERPLATE.replace(/\{PROJECT_NAME\}/g, projectName);
      createFile(filename, "python");
      setFile(filename, code, "python");
      openFile(filename);
      toast.success(`Project "${projectName}" created!`);
      addConsole("success", `New project created: ${filename}`);
    } else if (outputType === "exe") {
      // Generate PyInstaller spec + build script + main.py
      const code = PLATFORMER_BOILERPLATE.replace(/\{PROJECT_NAME\}/g, projectName);
      createFile(filename, "python");
      setFile(filename, code, "python");

      const specFile = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.spec`;
      const specContent = `# PyInstaller spec for ${projectName}
# Build: pyinstaller ${specFile}
# Output: dist/${projectName}/${projectName}.exe

block_cipher = None

a = Analysis(
    ['${filename}'],
    pathex=['engine'],
    binaries=[],
    datas=[],
    hiddenimports=[
        'lapia', 'lapia.core', 'lapia.rendering', 'lapia.physics',
        'lapia.input', 'lapia.audio', 'lapia.scene', 'lapia.ai',
        'lapia.network', 'lapia.ui', 'lapia.tools', 'lapia.engine',
    ],
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    cipher=block_cipher,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz, a.scripts, a.binaries, a.zipfiles, a.datas,
    name='${projectName.replace(/'/g, "")}',
    debug=False,
    strip=False,
    upx=True,
    console=False,
    icon='public/logo.svg',
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    name='${projectName.replace(/'/g, "")}',
)
`;
      createFile(specFile, "text");
      setFile(specFile, specContent, "text");

      const buildScript = `build_${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.sh`;
      const buildContent = `#!/bin/bash
# Build script for ${projectName}
# Run: bash ${buildScript}
# Output: dist/${projectName}/${projectName}.exe (on Windows)

set -e
echo "Building ${projectName}..."
pip install pyinstaller
pyinstaller ${specFile}
echo ""
echo "Build complete!"
echo "Find your executable in: dist/${projectName}/"
echo "On Windows: dist\\\\${projectName}\\\\${projectName}.exe"
`;
      createFile(buildScript, "text");
      setFile(buildScript, buildContent, "text");

      openFile(filename);
      toast.success(`Project "${projectName}" created with EXE build scripts!`, {
        description: `Generated ${filename}, ${specFile}, ${buildScript}`,
      });
      addConsole("success", `EXE project created. Run "bash ${buildScript}" to build the executable.`);
    }

    setWizardOpen(false);
    reset();
  };

  const next = () => setStep((s) => Math.min(2, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  return (
    <Dialog open={wizardOpen} onOpenChange={(o) => { setWizardOpen(o); if (!o) reset(); }}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="w-4 h-4" />
            New Project Wizard
          </DialogTitle>
          <DialogDescription>
            Step {step + 1} of 3 — Create a new Lapia Studio project
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-4">
          {["Name", "Template", "Output"].map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className={`text-xs ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
              {i < 2 && <div className={`h-px flex-1 ${i < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {/* Step 0: Name */}
        {step === 0 && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="proj-name">Project Name</Label>
              <Input
                id="proj-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Awesome Game"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                This will be used as the filename and game title. Special characters will be replaced with underscores.
              </p>
            </div>
            <div className="rounded-md p-3 bg-primary/5 border border-primary/20">
              <p className="text-xs">
                <span className="font-medium">File will be created:</span>{" "}
                <code className="text-blue-400">{projectName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.py</code>
              </p>
            </div>
          </div>
        )}

        {/* Step 1: Template */}
        {step === 1 && (
          <div className="space-y-3 py-4 max-h-[50vh] overflow-y-auto">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplateId(t.id)}
                className={`w-full text-left p-3 rounded-md border-2 transition-all ${templateId === t.id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.desc}</div>
                  </div>
                  {templateId === t.id && <Check className="w-4 h-4 text-primary" />}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Output */}
        {step === 2 && (
          <div className="space-y-3 py-4">
            <p className="text-xs text-muted-foreground mb-2">Choose how you want to save your project:</p>
            {OUTPUT_TYPES.map((o) => (
              <button
                key={o.id}
                onClick={() => setOutputType(o.id)}
                className={`w-full text-left p-3 rounded-md border-2 transition-all ${outputType === o.id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <o.icon className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-sm font-medium">{o.name}</div>
                      <div className="text-xs text-muted-foreground">{o.desc}</div>
                    </div>
                  </div>
                  {outputType === o.id && <Check className="w-4 h-4 text-primary" />}
                </div>
              </button>
            ))}
            {outputType === "exe" && (
              <div className="rounded-md p-3 bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                <strong>Note:</strong> The actual .exe must be built locally on Windows.
                We&apos;ll generate the PyInstaller spec + build script. Run{" "}
                <code className="text-amber-300">bash build_*.sh</code> on your machine to produce the .exe.
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={prev} disabled={step === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          {step < 2 ? (
            <Button size="sm" onClick={next} disabled={step === 0 && !projectName.trim()}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleFinish}>
              <Rocket className="w-4 h-4 mr-1" />
              Create Project
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
