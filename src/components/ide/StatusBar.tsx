"use client";

import { useStudio } from "../../lib/studio-store";
import { GitBranch, Wifi, Cpu, Activity, Box, Check } from "lucide-react";

export function StatusBar() {
  const {
    fps,
    frameTime,
    drawCalls,
    entityCount,
    runState,
    pyodideReady,
    activeFile,
    files,
  } = useStudio();

  const statusColor =
    runState === "running" ? "var(--studio-success)" :
    runState === "loading" ? "var(--studio-warning)" :
    runState === "error" ? "var(--studio-error)" :
    "var(--studio-info)";

  return (
    <div className="flex items-center h-6 bg-[var(--studio-statusbar)] text-white text-[11px] px-2 gap-4 select-none">
      <div className="flex items-center gap-1.5">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: statusColor }}
        />
        <span className="capitalize">{runState}</span>
      </div>
      <div className="flex items-center gap-1">
        <Activity className="w-3 h-3" />
        <span>{fps.toFixed(0)} FPS</span>
      </div>
      <div className="flex items-center gap-1">
        <Cpu className="w-3 h-3" />
        <span>{frameTime.toFixed(1)} ms</span>
      </div>
      <div className="flex items-center gap-1">
        <Box className="w-3 h-3" />
        <span>{drawCalls} draws · {entityCount} entities</span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1">
        <Wifi className={`w-3 h-3 ${pyodideReady ? "text-white" : "text-white/40"}`} />
        <span>{pyodideReady ? "Pyodide ready" : "Pyodide not loaded"}</span>
      </div>
      <div className="flex items-center gap-1">
        <GitBranch className="w-3 h-3" />
        <span>main</span>
      </div>
      <div className="flex items-center gap-1">
        <Check className="w-3 h-3" />
        <span>UTF-8</span>
      </div>
      <div className="text-white/70">
        {activeFile ? files[activeFile]?.kind.toUpperCase() : "—"}
      </div>
      <div className="text-white/70">Python 3.12 (Pyodide)</div>
    </div>
  );
}
