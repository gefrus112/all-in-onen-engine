// Lapia DevTools — Source tab: view the page source (what view-source shows)
// or the current rendered DOM. Copy / download included.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Mode = "original" | "rendered";
const MAX_LINES = 4000;

export default function SourcePanel() {
  const [mode, setMode] = useState<Mode>("original");
  const [content, setContent] = useState("");
  const [meta, setMeta] = useState<{ bytes: number; ms: number; status: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef("");

  const load = useCallback(async (m: Mode) => {
    setLoading(true);
    setCopied(false);
    try {
      const t0 = performance.now();
      let text = "";
      let status = "rendered DOM";
      let bytes = 0;
      if (m === "original") {
        const res = await fetch(window.location.href, { cache: "no-store" });
        text = await res.text();
        status = `HTTP ${res.status}`;
      } else {
        text = `<!DOCTYPE html>\n${document.documentElement.outerHTML}`;
        status = "live DOM";
      }
      const ms = Math.round(performance.now() - t0);
      bytes = new Blob([text]).size;
      contentRef.current = text;
      setContent(text);
      setMeta({ bytes, ms, status });
    } catch (err) {
      contentRef.current = "";
      setContent(`Failed to load source: ${String(err)}`);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(mode);
  }, [mode, load]);

  const lines = content ? content.split("\n") : [];
  const truncated = lines.length > MAX_LINES;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contentRef.current);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };

  const download = () => {
    const blob = new Blob([contentRef.current], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "original" ? "page-source.html" : "rendered-dom.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const kb = meta ? (meta.bytes / 1024).toFixed(1) : "0";

  return (
    <div className="ldev-source">
      <div className="ldev-console-toolbar">
        <button
          className={`ldev-chip${mode === "original" ? " ldev-chip-active" : ""}`}
          onClick={() => setMode("original")}
        >
          Page source
        </button>
        <button
          className={`ldev-chip${mode === "rendered" ? " ldev-chip-active" : ""}`}
          onClick={() => setMode("rendered")}
        >
          Rendered DOM
        </button>
        <button className="ldev-chip" onClick={() => void load(mode)}>{loading ? "Loading…" : "Refresh"}</button>
        <span className="ldev-flex1" />
        {meta ? (
          <span className="ldev-source-meta">
            {meta.status} · {lines.length.toLocaleString()} lines · {kb} KB · {meta.ms} ms
          </span>
        ) : null}
        <button className="ldev-chip" onClick={() => void copy()}>{copied ? "Copied ✓" : "Copy"}</button>
        <button className="ldev-chip" onClick={download}>Download</button>
      </div>

      <div className="ldev-source-body">
        {truncated ? (
          <div className="ldev-source-truncated">
            Showing first {MAX_LINES.toLocaleString()} of {lines.length.toLocaleString()} lines — use Download for the full source.
          </div>
        ) : null}
        <table className="ldev-code">
          <tbody>
            {lines.slice(0, MAX_LINES).map((line, i) => (
              <tr key={i}>
                <td className="ldev-ln">{i + 1}</td>
                <td className="ldev-cl">{line || " "}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
