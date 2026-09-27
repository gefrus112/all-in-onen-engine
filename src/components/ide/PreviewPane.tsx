"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Loader2, Monitor, Smartphone } from "lucide-react";
import { useStudio } from "@/lib/studio-store";
import {
  loadPyodide,
  startGame,
  type LapiaGameHandle,
} from "@/lib/pyodide-runner";

export function PreviewPane() {
  const {
    files,
    activeFile,
    runState,
    setRunState,
    addConsole,
    setPyodideReady,
    setPyodideLoading,
    pyodideReady,
    pyodideLoading,
    setRuntimeStats,
    fps,
    showGrid,
    showDebug,
    previewScale,
    setPreviewScale,
  } = useStudio();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<LapiaGameHandle | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  // Set up global input event listeners on the canvas so the game receives them.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ensureState = () => {
      if (!(window as any)._lapiaInputState) {
        (window as any)._lapiaInputState = {
          keys: new Set<number>(),
          mouseButtons: new Set<number>(),
          mouseX: 0,
          mouseY: 0,
        };
      }
      return (window as any)._lapiaInputState;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const st = ensureState();
      // Prevent default for game keys so the page doesn't scroll
      if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }
      st.keys.add(e.keyCode);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const st = ensureState();
      st.keys.delete(e.keyCode);
    };
    const onMouseMove = (e: MouseEvent) => {
      const st = ensureState();
      const rect = canvas.getBoundingClientRect();
      st.mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
      st.mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    };
    const onMouseDown = (e: MouseEvent) => {
      const st = ensureState();
      st.mouseButtons.add(e.button === 0 ? 1 : e.button === 2 ? 3 : 2);
      canvas.focus();
    };
    const onMouseUp = (e: MouseEvent) => {
      const st = ensureState();
      st.mouseButtons.delete(e.button === 0 ? 1 : e.button === 2 ? 3 : 2);
    };
    const onContextMenu = (e: Event) => e.preventDefault();
    const onBlur = () => {
      const st = ensureState();
      st.keys.clear();
      st.mouseButtons.clear();
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  // ---- Phase 1: Start the game when runState becomes "loading".
  // This effect ONLY runs startGame and transitions to "running" or "error".
  // It does NOT own the rAF loop.
  useEffect(() => {
    if (runState !== "loading") return;
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect */
    setError(null);

    const code = activeFile ? files[activeFile]?.content ?? "" : "";
    if (!code) {
      addConsole("error", "No code to run.");
      setRunState("error");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      setError("Canvas not available.");
      setRunState("error");
      return;
    }
    if (!(window as any)._lapiaInputState) {
      (window as any)._lapiaInputState = {
        keys: new Set<number>(),
        mouseButtons: new Set<number>(),
        mouseX: 0,
        mouseY: 0,
      };
    }

    (async () => {
      try {
        setPyodideLoading(true);
        const handle = await startGame(code, canvas, addConsole);
        if (cancelled) {
          handle.stop();
          return;
        }
        handleRef.current = handle;
        setPyodideReady(true);
        setPyodideLoading(false);
        setRunState("running");
        addConsole("success", "Game loop started.");
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? String(e));
          setRunState("error");
          setPyodideLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [runState]);

  // ---- Phase 2: Drive the rAF loop when runState is "running".
  // This effect owns the loop and stops it on cleanup.
  useEffect(() => {
    if (runState !== "running") return;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000.0);
      lastTimeRef.current = now;
      const handle = handleRef.current;
      if (!handle) {
        setRunState("idle");
        return;
      }
      let stillRunning = false;
      try {
        stillRunning = handle.runFrame(dt);
      } catch (e: any) {
        addConsole("error", `Runtime error: ${e?.message ?? e}`);
      }
      try {
        const game = handle.game;
        const fpsVal = game?.clock?.fps ?? 0;
        const dc = game?.scene?.renderer?.draw_calls ?? 0;
        setRuntimeStats({
          fps: fpsVal,
          frameTime: dt * 1000,
          drawCalls: dc,
          entityCount: 0,
        });
      } catch {}
      if (stillRunning) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        rafRef.current = null;
        setRunState("idle");
        addConsole("system", "Game loop ended.");
      }
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [runState]);

  // Stop the game when runState goes to idle/error
  useEffect(() => {
    if ((runState === "idle" || runState === "error") && handleRef.current) {
      try { handleRef.current.stop(); } catch {}
      handleRef.current = null;
      // Clear input state
      if ((window as any)._lapiaInputState) {
        (window as any)._lapiaInputState.keys.clear();
        (window as any)._lapiaInputState.mouseButtons.clear();
      }
    }
  }, [runState]);

  // Inject the user's CSS file (styles.css) into the preview container.
  useEffect(() => {
    const id = "lapia-preview-styles";
    let styleEl = document.getElementById(id) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = id;
      document.head.appendChild(styleEl);
    }
    const css = files["styles.css"]?.content ?? "";
    styleEl.textContent = css;
  }, [files]);

  const handlePlay = () => {
    setRunState("loading");
  };

  const isRunning = runState === "running";
  const isLoading = runState === "loading";

  return (
    <div className="flex flex-col h-full bg-card border-t border-border">
      <div className="flex items-center justify-between px-2 h-7 border-b border-border bg-[var(--studio-toolbar)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Preview
          </span>
          {isRunning && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 rec-dot" />
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            className={`tool-btn h-6 px-2 ${device === "desktop" ? "active" : ""}`}
            onClick={() => setDevice("desktop")}
            title="Desktop view"
          >
            <Monitor className="w-3 h-3" />
          </button>
          <button
            className={`tool-btn h-6 px-2 ${device === "mobile" ? "active" : ""}`}
            onClick={() => setDevice("mobile")}
            title="Mobile view"
          >
            <Smartphone className="w-3 h-3" />
          </button>
          <button
            className="tool-btn h-6 px-2"
            onClick={() => {
              const next = previewScale === 1 ? 1.5 : previewScale === 1.5 ? 2 : 1;
              setPreviewScale(next);
            }}
            title={`Scale: ${previewScale.toFixed(1)}x (click to cycle 1x → 1.5x → 2x)`}
          >
            {previewScale.toFixed(1)}x
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="lapia-preview-container flex-1 min-h-0"
        tabIndex={0}
      >
        <div className="preview-overlay-top">
          {isRunning ? `${fps.toFixed(0)} FPS` : isLoading ? "Loading Pyodide…" : "Idle"}
        </div>
        <div className="preview-overlay-bottom">
          {device === "desktop" ? "800 × 600" : "375 × 667"}
        </div>

        {!isRunning && !isLoading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 pointer-events-none">
            <button
              className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              onClick={handlePlay}
            >
              <Play className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">Run Game</span>
            </button>
            <p className="text-xs text-muted-foreground">
              Click to compile and start your Python game in Pyodide
            </p>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">
              {pyodideLoading ? "Loading Pyodide runtime…" : "Compiling Python…"}
            </p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
            <div className="max-w-md p-4 rounded border border-red-500/50 bg-red-500/10 text-red-200 text-xs font-mono whitespace-pre-wrap max-h-[80%] overflow-auto">
              {error}
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          tabIndex={0}
          className="outline-none"
          style={{
            imageRendering: previewScale > 1 ? "pixelated" : "auto",
            width: device === "desktop" ? "min(100%, 900px)" : "375px",
            height: device === "desktop" ? "auto" : "667px",
            aspectRatio: device === "desktop" ? "4 / 3" : undefined,
            transform: previewScale > 1 ? `scale(${previewScale})` : undefined,
            transformOrigin: "center",
          }}
        />
      </div>

      <div className="flex items-center justify-between px-2 h-6 border-t border-border bg-[var(--studio-toolbar)] text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Click preview to focus keyboard</span>
        </div>
        <div className="flex items-center gap-2">
          {showGrid && <span>Grid: ON</span>}
          {showDebug && <span>Debug: ON</span>}
        </div>
      </div>
    </div>
  );
}
