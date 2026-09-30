// Lapia DevTools — Network tab: records fetch() + XMLHttpRequest activity
// happening on the page while the panel is open.
"use client";

import { useEffect, useRef, useState } from "react";

interface NetEntry {
  id: number;
  method: string;
  url: string;
  status: number;
  statusText: string;
  type: string;
  size: number;
  ms: number;
  at: string;
}

let entryId = 1;
const MAX = 300;
const getWin = () => window as unknown as { __LAPIA_NET_INSTALLED__?: boolean };

function record(cb: (e: NetEntry) => void, partial: Omit<NetEntry, "id" | "at">) {
  cb({
    ...partial,
    id: entryId++,
    at: new Date().toLocaleTimeString([], { hour12: false }),
  });
}

export default function NetworkPanel() {
  const [entries, setEntries] = useState<NetEntry[]>([]);
  const buffer = useRef<NetEntry[]>([]);

  useEffect(() => {
    const win = getWin();
    const push = (e: NetEntry) => {
      buffer.current = [...buffer.current.slice(-(MAX - 1)), e];
      setEntries(buffer.current);
    };

    const feed = (e: NetEntry) => window.dispatchEvent(new CustomEvent("lapia-net", { detail: e }));
    const onFeed = (ev: Event) => push((ev as CustomEvent).detail as NetEntry);
    window.addEventListener("lapia-net", onFeed);

    if (!win.__LAPIA_NET_INSTALLED__) {
      win.__LAPIA_NET_INSTALLED__ = true;

      // ---- fetch ----
      const origFetch = window.fetch.bind(window);
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const t0 = performance.now();
        const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
        const url = input instanceof Request ? input.url : String(input);
        try {
          const res = await origFetch(input, init);
          record(feed, {
            method,
            url,
            status: res.status,
            statusText: res.statusText,
            type: res.headers.get("content-type")?.split(";")[0] || "unknown",
            size: Number(res.headers.get("content-length")) || 0,
            ms: Math.round(performance.now() - t0),
          });
          return res;
        } catch (err) {
          record(feed, {
            method,
            url,
            status: 0,
            statusText: "FAILED",
            type: "error",
            size: 0,
            ms: Math.round(performance.now() - t0),
          });
          throw err;
        }
      };

      // ---- XMLHttpRequest ----
      type Xtra = XMLHttpRequest & { __lapia_m?: string; __lapia_u?: string; __lapia_t0?: number };
      const proto = XMLHttpRequest.prototype as unknown as {
        open: (this: Xtra, m: string, u: string, ...rest: unknown[]) => void;
        send: (this: Xtra, body?: unknown) => void;
      };
      const origOpen = proto.open;
      const origSend = proto.send;
      proto.open = function (m, u, ...rest) {
        this.__lapia_m = m.toUpperCase();
        this.__lapia_u = u;
        return origOpen.call(this, m, u, ...rest);
      };
      proto.send = function (body) {
        this.__lapia_t0 = performance.now();
        this.addEventListener("load", function (this: Xtra) {
          const size =
            typeof this.response === "string"
              ? this.response.length
              : Number(this.getResponseHeader("content-length")) || 0;
          record(feed, {
            method: this.__lapia_m || "GET",
            url: this.__lapia_u || "",
            status: this.status,
            statusText: this.statusText,
            type: this.getResponseHeader("content-type")?.split(";")[0] || "unknown",
            size,
            ms: Math.round(performance.now() - (this.__lapia_t0 || performance.now())),
          });
        });
        return origSend.call(this, body);
      };
    }

    return () => window.removeEventListener("lapia-net", onFeed);
  }, []);

  return (
    <div className="ldev-network">
      <div className="ldev-console-toolbar">
        <span className="ldev-muted">{entries.length} request{entries.length === 1 ? "" : "s"} recorded</span>
        <span className="ldev-flex1" />
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
      <div className="ldev-net-table-wrap">
        <table className="ldev-net-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Status</th>
              <th>Type</th>
              <th>Size</th>
              <th>Time</th>
              <th>URL</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="ldev-muted ldev-net-empty">
                  Recording fetch / XHR activity… interact with the page to see requests here.
                </td>
              </tr>
            ) : (
              entries.slice().reverse().map((e) => (
                <tr key={e.id}>
                  <td className={`ldev-net-method ldev-net-${e.status >= 200 && e.status < 400 ? "ok" : e.status === 0 ? "fail" : "warn"}`}>
                    {e.method}
                  </td>
                  <td className={`ldev-net-${e.status >= 200 && e.status < 400 ? "ok" : e.status === 0 ? "fail" : "warn"}`}>
                    {e.status || "—"}
                  </td>
                  <td>{e.type}</td>
                  <td>{e.size ? `${(e.size / 1024).toFixed(1)} KB` : "—"}</td>
                  <td>{e.ms} ms</td>
                  <td className="ldev-net-url" title={e.url}>
                    {e.url.length > 90 ? e.url.slice(0, 90) + "…" : e.url}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
