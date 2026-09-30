// Lapia DevTools — Console tab: captures console.* output + runtime errors,
// and evaluates JavaScript against the live page (like real dev tools).
"use client";

import { useEffect, useRef, useState } from "react";

type EntryType = "log" | "info" | "warn" | "error" | "debug" | "input" | "result" | "system";
interface Entry {
  id: number;
  type: EntryType;
  text: string;
  time: string;
}

let entryId = 1;

function fmt(v: unknown, depth = 0): string {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  const t = typeof v;
  if (t === "string") return depth === 0 ? (v as string) : JSON.stringify(v);
  if (t === "number" || t === "boolean" || t === "bigint") return String(v);
  if (t === "function") return `ƒ ${(v as { name?: string }).name || "anonymous"}()`;
  if (t === "symbol") return String(v);
  if (v instanceof Error) return `${v.name}: ${v.message}`;
  if (typeof Element !== "undefined" && v instanceof Element) {
    const s = v.outerHTML.replace(/\s+/g, " ");
    return s.length > 120 ? s.slice(0, 120) + "…" : s;
  }
  if (depth >= 2) return Array.isArray(v) ? "[…]" : "{…}";
  if (Array.isArray(v)) {
    const head = v.slice(0, 20).map((x) => fmt(x, depth + 1)).join(", ");
    return `[${head}${v.length > 20 ? `, … +${v.length - 20}` : ""}]`;
  }
  try {
    const obj = v as Record<string, unknown>;
    const keys = Object.keys(obj).slice(0, 20);
    const body = keys.map((k) => `${k}: ${fmt(obj[k], depth + 1)}`).join(", ");
    return `{ ${body}${Object.keys(obj).length > 20 ? ", …" : ""} }`;
  } catch {
    return String(v);
  }
}

const getWin = () => window as unknown as { __LAPIA_CONSOLE_INSTALLED__?: boolean };

export default function ConsolePanel() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<"all" | "warn" | "error">("all");
  const [paused, setPaused] = useState(false);
  const buffer = useRef<Entry[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<string[]>([]);
  const histPos = useRef(-1);
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  const push = (type: EntryType, text: string) => {
    if (pausedRef.current) return;
    const e: Entry = {
      id: entryId++,
      type,
      text,
      time: new Date().toLocaleTimeString([], { hour12: false }),
    };
    buffer.current = [...buffer.current.slice(-499), e];
    setEntries(buffer.current);
  };

  useEffect(() => {
    const win = getWin();
    if (!win.__LAPIA_CONSOLE_INSTALLED__) {
      win.__LAPIA_CONSOLE_INSTALLED__ = true;
      // shared feed — survives component remounts, delivered through a custom event
      const feed = (type: EntryType, text: string) => {
        window.dispatchEvent(new CustomEvent("lapia-console", { detail: { type, text } }));
      };
      (["log", "info", "warn", "error", "debug"] as const).forEach((m) => {
        const orig = console[m].bind(console);
        console[m] = (...args: unknown[]) => {
          feed(m, args.map((a) => fmt(a)).join(" "));
          orig(...args);
        };
      });
      window.addEventListener("error", (ev) => feed("error", `Uncaught ${fmt(ev.error || ev.message)}`));
      window.addEventListener("unhandledrejection", (ev) =>
        feed("error", `Unhandled rejection: ${fmt((ev as PromiseRejectionEvent).reason)}`),
      );
    }
    const onFeed = (ev: Event) => {
      const d = (ev as CustomEvent).detail as { type: EntryType; text: string };
      push(d.type, d.text);
    };
    window.addEventListener("lapia-console", onFeed);
    push("system", "Lapia Console ready — JavaScript runs against the live page.");
    return () => window.removeEventListener("lapia-console", onFeed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto-scroll
  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);

  const run = () => {
    const code = input.trim();
    if (!code) return;
    push("input", `› ${code}`);
    historyRef.current.push(code);
    histPos.current = historyRef.current.length;
    try {
      // eslint-disable-next-line no-eval
      const result = (0, eval)(code);
      push("result", fmt(result));
    } catch (err) {
      push("error", fmt(err));
    }
    setInput("");
  };

  const visible = entries.filter((e) =>
    filter === "all" ? true : filter === "error" ? e.type === "error" : e.type === "warn" || e.type === "error",
  );

  return (
    <div className="ldev-console">
      <div className="ldev-console-toolbar">
        {(["all", "warn", "error"] as const).map((f) => (
          <button
            key={f}
            className={`ldev-chip${filter === f ? " ldev-chip-active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f === "warn" ? "Warnings" : "Errors"}
          </button>
        ))}
        <span className="ldev-flex1" />
        <button
          className={`ldev-chip${paused ? " ldev-chip-active" : ""}`}
          onClick={() => setPaused((v) => !v)}
        >
          {paused ? "Resume" : "Pause"}
        </button>
        <button
          className="ldev-chip"
          onClick={() => {
            buffer.current = [];
            setEntries([]);
          }}
        >
          Clear
        </button>
      </div>

      <div className="ldev-feed" ref={feedRef}>
        {visible.map((e) => (
          <div key={e.id} className={`ldev-entry ldev-entry-${e.type}`}>
            <span className="ldev-entry-time">{e.time}</span>
            <span className="ldev-entry-text">{e.text}</span>
          </div>
        ))}
      </div>

      <div className="ldev-console-input">
        <span className="ldev-prompt">›</span>
        <input
          value={input}
          placeholder="Run JavaScript on this page… (↑ / ↓ for history)"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") run();
            else if (e.key === "ArrowUp") {
              e.preventDefault();
              if (historyRef.current.length) {
                histPos.current = Math.max(0, histPos.current - 1);
                setInput(historyRef.current[histPos.current] ?? "");
              }
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              histPos.current = Math.min(historyRef.current.length, histPos.current + 1);
              setInput(historyRef.current[histPos.current] ?? "");
            }
          }}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
}
