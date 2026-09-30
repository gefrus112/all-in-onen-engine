// Lapia DevTools — the site's own real, working developer tools.
// Native browser DevTools are blocked by the Lapia Shield (see lib/devtools-guard.ts);
// F12 / Ctrl+Shift+I open THIS panel instead: Elements inspector (with live picker),
// Console, Page Source and Network tabs.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { installDevToolsGuard, type GuardBlockAction } from "../../lib/devtools-guard";
import ElementsPanel from "./ElementsPanel";
import ConsolePanel from "./ConsolePanel";
import SourcePanel from "./SourcePanel";
import NetworkPanel from "./NetworkPanel";

type Tab = "elements" | "console" | "source" | "network";

const PANEL_FLAG = "[data-lapia-devtools]";
const TABS: { id: Tab; label: string }[] = [
  { id: "elements", label: "Elements" },
  { id: "console", label: "Console" },
  { id: "source", label: "Source" },
  { id: "network", label: "Network" },
];

const BLOCK_TEXT: Partial<Record<GuardBlockAction, string>> = {
  contextmenu: "Right-click is disabled on this site",
  "view-source": "View-source is disabled — use the built-in Source tab (F12)",
  "save-page": "Saving / printing this page is disabled",
};

function labelFor(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : "";
  const cls = el.classList.length ? `.${Array.from(el.classList).slice(0, 2).join(".")}` : "";
  return `${tag}${id}${cls}`;
}

export default function LapiaDevTools() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("elements");
  const [pickerOn, setPickerOn] = useState(false);
  const [selected, setSelected] = useState<Element | null>(null);
  const [detected, setDetected] = useState(false);
  const [height, setHeight] = useState(420);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [viewport, setViewport] = useState("");

  const hlRef = useRef<HTMLDivElement>(null);
  const hlLabelRef = useRef<HTMLDivElement>(null);
  const hoverElRef = useRef<Element | null>(null);
  const toastTimer = useRef(0);
  const lastToast = useRef<{ text: string; at: number }>({ text: "", at: 0 });

  useEffect(() => {
    setMounted(true);
    const vp = () => setViewport(`${window.innerWidth} × ${window.innerHeight}`);
    vp();
    window.addEventListener("resize", vp);
    return () => window.removeEventListener("resize", vp);
  }, []);

  // ---------------- guard ----------------
  useEffect(() => {
    const showBlocked = (action: GuardBlockAction) => {
      const text = BLOCK_TEXT[action] || "This action is disabled on this site";
      const now = Date.now();
      if (lastToast.current.text === text && now - lastToast.current.at < 2500) return;
      lastToast.current = { text, at: now };
      setToast({ id: now, text });
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), 2200);
    };
    const uninstall = installDevToolsGuard({
      onDevToolsKey: (detail) => {
        if (detail.tab) setTab(detail.tab);
        setOpen((prev) => (detail.tab || detail.picker ? true : !prev));
        if (detail.picker) {
          setTab("elements");
          setPickerOn(true);
        }
      },
      onBlocked: showBlocked,
      onDetectionChange: setDetected,
    });
    return uninstall;
  }, []);

  // ---------------- Esc closes picker / panel ----------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const el = e.target instanceof Element ? e.target : null;
      const inInput =
        !!el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          (el as HTMLElement).isContentEditable === true);
      if (pickerOn) {
        setPickerOn(false);
        return;
      }
      if (open && !inInput) setOpen(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, pickerOn]);

  // ---------------- element picker ----------------
  const paintHighlight = useCallback(() => {
    const el = hoverElRef.current;
    const hl = hlRef.current;
    const label = hlLabelRef.current;
    if (!hl || !label) return;
    if (!el || !pickerOn) {
      hl.style.display = "none";
      label.style.display = "none";
      return;
    }
    const r = el.getBoundingClientRect();
    hl.style.display = "block";
    hl.style.left = `${r.left}px`;
    hl.style.top = `${r.top}px`;
    hl.style.width = `${r.width}px`;
    hl.style.height = `${r.height}px`;
    label.style.display = "block";
    label.style.left = `${Math.max(4, r.left)}px`;
    label.style.top = `${Math.max(4, r.top - 24)}px`;
    label.textContent = `${labelFor(el)} · ${Math.round(r.width)}×${Math.round(r.height)}`;
  }, [pickerOn]);

  useEffect(() => {
    if (!pickerOn) {
      hoverElRef.current = null;
      paintHighlight();
      return;
    }
    const onOver = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      if (!el || el.closest(PANEL_FLAG)) return;
      hoverElRef.current = el;
      paintHighlight();
    };
    const onClick = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      if (!el || el.closest(PANEL_FLAG)) return;
      e.preventDefault();
      e.stopPropagation();
      setSelected(el);
      setPickerOn(false);
      setTab("elements");
    };
    const onScroll = () => paintHighlight();
    window.addEventListener("mouseover", onOver, true);
    window.addEventListener("click", onClick, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("mouseover", onOver, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      hoverElRef.current = null;
      paintHighlight();
    };
  }, [pickerOn, paintHighlight]);

  // ---------------- resize drag ----------------
  const onResizeStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = height;
    const onMove = (ev: PointerEvent) => {
      const h = startH + (startY - ev.clientY);
      setHeight(Math.min(Math.max(h, 220), Math.round(window.innerHeight * 0.88)));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  if (!mounted) return null;

  return (
    <>
      {/* floating launcher */}
      {!open && (
        <button
          data-lapia-devtools
          className="ldev-launcher"
          title="Lapia DevTools (F12)"
          onClick={() => setOpen(true)}
        >
          {"</>"}
        </button>
      )}

      {/* element picker highlight */}
      <div ref={hlRef} className="ldev-picker-box" style={{ display: "none" }} />
      <div ref={hlLabelRef} className="ldev-picker-label" style={{ display: "none" }} />

      {/* shield overlay — native DevTools detected */}
      {detected && (
        <div className="ldev-shield" data-lapia-devtools>
          <div className="ldev-shield-card">
            <svg width="54" height="54" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 2L4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z"
                fill="rgba(74,222,128,.12)"
                stroke="#4ade80"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M8.5 12l2.4 2.4L15.5 9.8" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h2>Developer Tools Blocked</h2>
            <p>
              This website is protected. Native developer tools are disabled to prevent
              tampering with, modifying or stealing page content.
            </p>
            <p className="ldev-shield-hint">
              Close DevTools to continue browsing — or use the built-in Lapia DevTools instead.
            </p>
            <button
              className="ldev-shield-btn"
              onClick={() => {
                setTab("elements");
                setOpen(true);
              }}
            >
              Use Built-in DevTools (F12)
            </button>
            <span className="ldev-shield-brand">All In One Engine · Lapia Shield</span>
          </div>
        </div>
      )}

      {/* blocked-action toast */}
      {toast && (
        <div className="ldev-toast" key={toast.id} data-lapia-devtools>
          <span className="ldev-toast-dot" />
          {toast.text}
        </div>
      )}

      {/* the panel */}
      <div className={`ldev-root${open ? "" : " ldev-hidden"}`} data-lapia-devtools style={{ height }}>
        <div className="ldev-resize" onPointerDown={onResizeStart} title="Drag to resize" />

        <header className="ldev-header">
          <span className="ldev-brand">
            <span className="ldev-brand-dot" />
            Lapia DevTools
          </span>
          <nav className="ldev-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`ldev-tab${tab === t.id ? " ldev-tab-active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <span className="ldev-flex1" />
          <span className="ldev-shield-badge" title="Native DevTools are blocked on this site">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 2L4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z" stroke="#4ade80" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            Shield active
          </span>
          <button className="ldev-close" title="Close (Esc)" onClick={() => setOpen(false)}>
            ×
          </button>
        </header>

        <main className="ldev-main">
          <div className="ldev-tabpane" style={{ display: tab === "elements" ? "flex" : "none" }}>
            <ElementsPanel
              selected={selected}
              onSelect={setSelected}
              pickerOn={pickerOn}
              onTogglePicker={() => setPickerOn((v) => !v)}
            />
          </div>
          <div className="ldev-tabpane" style={{ display: tab === "console" ? "flex" : "none" }}>
            <ConsolePanel />
          </div>
          <div className="ldev-tabpane" style={{ display: tab === "source" ? "flex" : "none" }}>
            <SourcePanel />
          </div>
          <div className="ldev-tabpane" style={{ display: tab === "network" ? "flex" : "none" }}>
            <NetworkPanel />
          </div>
        </main>

        <footer className="ldev-status">
          <span className="ldev-status-item">
            {selected ? `› ${labelFor(selected)}` : "No selection — use ⌖ Select element"}
          </span>
          <span className="ldev-flex1" />
          <span className="ldev-status-item">{viewport}</span>
          <span className="ldev-status-item ldev-status-green">Protected</span>
        </footer>
      </div>
    </>
  );
}
