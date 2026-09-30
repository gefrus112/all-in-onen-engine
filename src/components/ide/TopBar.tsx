"use client";

import { useState } from "react";
import {
  Play,
  Square,
  Pause,
  Save,
  FileText,
  FolderPlus,
  Settings,
  Bug,
  PanelLeft,
  PanelRight,
  PanelBottom,
  Grid3x3,
  Boxes,
  Image as ImageIcon,
  RotateCcw,
  Github,
  ChevronDown,
  Rocket,
  Home,
  User,
  Sparkles,
  TerminalSquare,
} from "lucide-react";
import { useStudio } from "../../lib/studio-store";
import { toast } from "sonner";

interface MenuButtonProps {
  label: string;
  children?: React.ReactNode;
  menuKey?: string;
  menuOpen: string | null;
  setMenuOpen: (s: string | null) => void;
}

function MenuButton({ label, children, menuKey, menuOpen, setMenuOpen }: MenuButtonProps) {
  return (
    <button
      className="tool-btn"
      onClick={(e) => {
        e.stopPropagation();
        if (menuKey) setMenuOpen(menuOpen === menuKey ? null : menuKey);
      }}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

export function TopBar({ onExitToLanding }: { onExitToLanding?: () => void }) {
  const {
    files,
    activeFile,
    setFile,
    runState,
    setRunState,
    showExplorer,
    showProperties,
    showConsole,
    showDebug,
    showAssetPicker,
    showToolbox,
    showAlly,
    showTerminal,
    toggleAlly,
    toggleTerminal,
    toggleExplorer,
    toggleProperties,
    toggleConsole,
    toggleDebug,
    toggleAssetPicker,
    toggleToolbox,
    toggleGrid,
    showGrid,
    addConsole,
    pyodideLoading,
    setPyodideLoading,
    setSettingsOpen,
    setWizardOpen,
    setAuthOpen,
    user,
  } = useStudio();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const handlePlay = async () => {
    if (runState === "running") {
      addConsole("system", "Already running.");
      return;
    }
    if (!activeFile || !files[activeFile]) {
      toast.error("No active file to run.");
      return;
    }
    const file = files[activeFile];
    if (file.kind !== "python") {
      toast.error("Only Python files can be run.");
      return;
    }
    setRunState("loading");
    setPyodideLoading(true);
    addConsole("system", `Running ${activeFile}…`);
  };

  const handleStop = () => {
    setRunState("idle");
    addConsole("system", "Stopped.");
  };

  const handleSave = () => {
    toast.success("All files saved.");
    addConsole("success", "Files saved to local storage.");
  };

  const handleReset = () => {
    if (confirm("Reset project to the default demo? This will overwrite your changes.")) {
      localStorage.removeItem("lapia-studio");
      window.location.reload();
    }
  };

  return (
    <div className="flex items-stretch h-10 bg-[var(--studio-toolbar)] border-b border-border select-none">
      {/* Left: App brand */}
      <div className="flex items-center gap-2 px-3 border-r border-border">
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
          L
        </div>
        <div className="text-sm font-semibold tracking-tight">
          Lapia <span className="text-muted-foreground font-normal">Studio</span>
        </div>
      </div>

      {/* Menu items */}
      <div className="flex items-center gap-1 px-2">
        <MenuButton label="File" menuKey="file" menuOpen={menuOpen} setMenuOpen={setMenuOpen}>
          <FileText className="w-3.5 h-3.5" />
        </MenuButton>
        <MenuButton label="Edit" menuKey="edit" menuOpen={menuOpen} setMenuOpen={setMenuOpen}>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </MenuButton>
        <MenuButton label="View" menuKey="view" menuOpen={menuOpen} setMenuOpen={setMenuOpen}>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </MenuButton>
        <MenuButton label="Insert" menuKey="insert" menuOpen={menuOpen} setMenuOpen={setMenuOpen}>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </MenuButton>
        <MenuButton label="Help" menuKey="help" menuOpen={menuOpen} setMenuOpen={setMenuOpen}>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </MenuButton>
      </div>

      <div className="w-px h-full bg-border" />

      {/* Center: Play controls */}
      <div className="flex items-center gap-1 px-3 flex-1 justify-center">
        <button
          className={`tool-btn ${runState === "running" ? "" : "active"}`}
          onClick={handlePlay}
          disabled={runState === "loading"}
          title="Run game (F5)"
        >
          {runState === "running" ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 rec-dot" />
              Running
            </span>
          ) : runState === "loading" ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Loading…
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              Play
            </>
          )}
        </button>
        <button
          className="tool-btn"
          onClick={handleStop}
          disabled={runState === "idle"}
          title="Stop"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          Stop
        </button>
        <button
          className="tool-btn"
          onClick={() => addConsole("system", "Paused.")}
          disabled={runState !== "running"}
          title="Pause"
        >
          <Pause className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button className="tool-btn" onClick={handleSave} title="Save (Ctrl+S)">
          <Save className="w-3.5 h-3.5" />
        </button>
        <button
          className="tool-btn"
          onClick={() => setWizardOpen(true)}
          title="New project wizard"
        >
          <Rocket className="w-3.5 h-3.5" />
        </button>
        <button
          className="tool-btn"
          onClick={() => {
            const name = prompt("New file path:", "new_file.py");
            if (name) {
              useStudio.getState().createFile(name, name.endsWith(".py") ? "python" : name.endsWith(".css") ? "css" : "text");
              toast.success(`Created ${name}`);
            }
          }}
          title="New file"
        >
          <FolderPlus className="w-3.5 h-3.5" />
        </button>
        <button className="tool-btn" onClick={handleReset} title="Reset project">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="w-px h-full bg-border" />

      {/* Right: Panel toggles + GitHub */}
      <div className="flex items-center gap-1 px-2">
        <button
          className={`ally-topbar-btn ${showAlly ? "active" : ""}`}
          onClick={toggleAlly}
          title="Ally-5 AI assistant (built into your engine)"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ally</span>
        </button>
        <button
          className={`tool-btn ${showTerminal ? "active" : ""}`}
          onClick={toggleTerminal}
          title="Toggle Terminal (pip, ally, python main.py)"
        >
          <TerminalSquare className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button
          className={`tool-btn ${showExplorer ? "active" : ""}`}
          onClick={toggleExplorer}
          title="Toggle Explorer"
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>
        <button
          className={`tool-btn ${showToolbox ? "active" : ""}`}
          onClick={toggleToolbox}
          title="Toggle Toolbox (Assets + Templates)"
        >
          <Boxes className="w-3.5 h-3.5" />
        </button>
        <button
          className={`tool-btn ${showAssetPicker ? "active" : ""}`}
          onClick={toggleAssetPicker}
          title="Toggle Asset Picker"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>
        <button
          className={`tool-btn ${showProperties ? "active" : ""}`}
          onClick={toggleProperties}
          title="Toggle Properties"
        >
          <PanelRight className="w-3.5 h-3.5" />
        </button>
        <button
          className={`tool-btn ${showConsole ? "active" : ""}`}
          onClick={toggleConsole}
          title="Toggle Console"
        >
          <PanelBottom className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button
          className={`tool-btn ${showGrid ? "active" : ""}`}
          onClick={toggleGrid}
          title="Toggle grid"
        >
          <Grid3x3 className="w-3.5 h-3.5" />
        </button>
        <button
          className={`tool-btn ${showDebug ? "active" : ""}`}
          onClick={toggleDebug}
          title="Toggle debug overlay"
        >
          <Bug className="w-3.5 h-3.5" />
        </button>
        <button
          className="tool-btn"
          onClick={() => addConsole("info", "Settings: coming soon")}
          title="Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button
          className="tool-btn"
          onClick={() => setAuthOpen(true)}
          title={user ? `Signed in as @${user.githubLogin}` : "Sign in with GitHub"}
        >
          {user ? (
            <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full" />
          ) : (
            <User className="w-3.5 h-3.5" />
          )}
        </button>
        <button
          className="tool-btn"
          onClick={() => setSettingsOpen(true)}
          title="Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        {onExitToLanding && (
          <button
            className="tool-btn"
            onClick={onExitToLanding}
            title="Back to landing page"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
        )}
        <a
          className="tool-btn"
          href="https://github.com/gefrus112/all-in-onen-engine"
          target="_blank"
          rel="noreferrer"
          title="Open GitHub repo"
        >
          <Github className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
