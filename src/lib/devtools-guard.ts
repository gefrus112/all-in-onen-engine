// All In One Engine — native DevTools guard ("Lapia Shield")
// Blocks browser developer tools / view-source shortcuts so visitors can't
// tamper with or scrape page content, detects when DevTools IS opened and
// reports it so the site can show a protection shield.
// The site ships its OWN working dev tools instead (LapiaDevTools component).
"use client";

export type GuardBlockAction =
  | "contextmenu"
  | "devtools-key"
  | "view-source"
  | "save-page";

export interface DevToolsGuardOptions {
  /** Called when the user presses a DevTools shortcut — the site's own dev tools should toggle. */
  onDevToolsKey?: (detail: { tab?: "elements" | "console" | "network"; picker?: boolean }) => void;
  /** Called when a protection shortcut / gesture was blocked (for the toast). */
  onBlocked?: (action: GuardBlockAction) => void;
  /** Called when native DevTools open/close detection changes. */
  onDetectionChange?: (detected: boolean) => void;
}

function targetElement(e: Event): Element | null {
  const t = e.target;
  return t instanceof Element ? t : null;
}

function insideOwnPanel(e: Event): boolean {
  const el = targetElement(e);
  return !!el && !!el.closest("[data-lapia-devtools]");
}

function isEditable(e: Event): boolean {
  const el = targetElement(e);
  return (
    !!el &&
    (el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      (el as HTMLElement).isContentEditable === true)
  );
}

export function installDevToolsGuard(opts: DevToolsGuardOptions = {}): () => void {
  const { onDevToolsKey, onBlocked, onDetectionChange } = opts;

  // ---------- keyboard ----------
  const onKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();

    // F12 is OUR dev tools key now — always toggles the built-in panel,
    // even when focus is inside it.
    if (k === "f12") {
      e.preventDefault();
      e.stopImmediatePropagation();
      onDevToolsKey?.({});
      return;
    }

    if (insideOwnPanel(e)) return; // our built-in tools stay fully usable

    // Ctrl/Cmd+Shift+I/J/C/K/E, Cmd+Opt+I/J/C (mac) → open OUR dev tools
    const devToolsCombo =
      ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c", "k", "e"].includes(k)) ||
      (e.metaKey && e.altKey && ["i", "j", "c"].includes(k));

    if (devToolsCombo) {
      e.preventDefault();
      e.stopImmediatePropagation();
      const detail =
        k === "f12" || k === "i"
          ? {}
          : k === "c"
            ? { picker: true }
            : { tab: "console" as const, ...(k === "e" ? { tab: "network" as const } : {}) };
      onDevToolsKey?.(detail);
      return;
    }

    // Ctrl/Cmd+U (view-source), Ctrl/Cmd+S (save page), Ctrl/Cmd+P (print to PDF)
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && ["u", "s", "p"].includes(k)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      onBlocked?.(k === "u" ? "view-source" : "save-page");
    }
  };

  // ---------- context menu ----------
  // Track right-button drags (e.g. 3D camera panning): block silently so
  // orbit-style gestures don't spam the protection toast.
  let rightDown: { x: number; y: number; moved: boolean } | null = null;
  const onPointerDown = (e: PointerEvent) => {
    if (e.button === 2) rightDown = { x: e.clientX, y: e.clientY, moved: false };
  };
  const onPointerMove = (e: PointerEvent) => {
    if (rightDown && (Math.abs(e.clientX - rightDown.x) > 6 || Math.abs(e.clientY - rightDown.y) > 6)) {
      rightDown.moved = true;
    }
  };
  const onContextMenu = (e: MouseEvent) => {
    if (insideOwnPanel(e)) return;
    if (isEditable(e)) return; // allow paste menus in inputs / script editor
    e.preventDefault();
    if (rightDown?.moved) return; // drag gesture — silent block
    onBlocked?.("contextmenu");
  };

  // ---------- drag-out of assets ----------
  const onDragStart = (e: DragEvent) => {
    if (insideOwnPanel(e)) return;
    const el = targetElement(e);
    if (el && (el.tagName === "IMG" || el.tagName === "VIDEO" || el.tagName === "CANVAS")) {
      e.preventDefault();
    }
  };

  // ---------- DevTools-open detection ----------
  let detected = false;
  // Baseline device pixel ratio: browser zoom changes dpr but docking DevTools does not,
  // so we ignore window-size deltas while dpr differs from baseline (kills zoom false-positives).
  const dprBase = window.devicePixelRatio || 1;
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;

  const setDetected = (v: boolean) => {
    if (v === detected) return;
    detected = v;
    onDetectionChange?.(v);
  };

  const probe = () => {
    if (document.hidden) return;

    // 1) Debugger timing: `debugger` is a no-op unless DevTools is attached.
    //    Built via Function() so the minifier can't strip the statement.
    let timing = false;
    try {
      const t0 = performance.now();
      // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
      Function("debugger")();
      timing = performance.now() - t0 > 120;
    } catch {
      timing = false;
    }

    // 2) Docked DevTools shrink the viewport by hundreds of px.
    let size = false;
    if (!coarsePointer && Math.abs((window.devicePixelRatio || 1) - dprBase) < 0.01) {
      const dw = window.outerWidth - window.innerWidth;
      const dh = window.outerHeight - window.innerHeight;
      size = dw > 220 || dh > 260;
    }

    setDetected(timing || size);
  };

  // ---------- console deterrent while DevTools is open ----------
  let deterred = false;
  const deterInterval = window.setInterval(() => {
    if (detected && !deterred) {
      deterred = true;
      try {
        console.clear();
        console.log(
          "%c🛡 Lapia Shield",
          "font-size:22px;font-weight:bold;color:#4ade80",
          "\nNative developer tools are disabled on this site.\nContent is protected by All In One Engine. Press F12 to use the built-in Lapia DevTools instead.",
        );
      } catch { /* noop */ }
    }
    if (!detected) deterred = false;
  }, 1500);

  const probeInterval = window.setInterval(probe, 2500);
  const t = window.setTimeout(probe, 800);

  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("contextmenu", onContextMenu);
  window.addEventListener("dragstart", onDragStart);
  window.addEventListener("pointerdown", onPointerDown, true);
  window.addEventListener("pointermove", onPointerMove, true);

  return () => {
    window.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("contextmenu", onContextMenu);
    window.removeEventListener("dragstart", onDragStart);
    window.removeEventListener("pointerdown", onPointerDown, true);
    window.removeEventListener("pointermove", onPointerMove, true);
    window.clearInterval(probeInterval);
    window.clearInterval(deterInterval);
    window.clearTimeout(t);
  };
}
