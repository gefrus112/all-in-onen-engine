// Lapia Studio — in-IDE terminal for the Pygame engine.
// Simulated shell with project commands, pip (repo package registry),
// and direct access to the Ally-5 assistant (`ally make me a game`).
"use client";

import { useEffect, useRef, useState } from "react";
import { TerminalSquare, Trash2 } from "lucide-react";
import { useStudio } from "../../lib/studio-store";
import { ALLY_MODELS, respond, ALLY_VERSION, fmtCtx } from "../../lib/ally5";
import { playTap, playSuccess } from "../../lib/ui-sounds";

const ASSET_BASE = process.env.NEXT_PUBLIC_ASSET_BASE || "";

interface Line {
  id: number;
  text: string;
  kind: "cmd" | "out" | "ok" | "err" | "ally" | "dim";
}

let lineId = 1;

const HELP = `Available commands:
  help                 show this help
  ls                   list project files
  cat <file>           print a file's contents
  python main.py       run your game (opens the preview)
  pip install <pkg>    install an engine package from the repo registry
  pip list             list installed packages
  ally <message>       chat with the Ally-5 AI assistant
  model                show the Ally-5 model family
  neofetch             engine + system info
  whoami · date · echo · clear · about`;

const BANNER = `LapiaOS 3.3 (Pyodide shell) — type 'help' for commands, 'ally make me a game' for magic.`;

export function Terminal() {
  const { files, requestRun, setFile, openFile, addConsole } = useStudio();
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [histPos, setHistPos] = useState(-1);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const installedRef = useRef<Set<string>>(new Set(["ally-kernel"]));

  const push = (text: string, kind: Line["kind"] = "out") =>
    setLines((prev) => [...prev.slice(-400), { id: lineId++, text, kind }]);

  useEffect(() => {
    push(BANNER, "dim");
    push("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines, busy]);

  const printlns = (text: string, kind: Line["kind"] = "out") => {
    text.split("\n").forEach((l) => push(l, kind));
  };

  const runPipInstall = async (pkg: string) => {
    try {
      const res = await fetch(`${ASSET_BASE}/packages/registry.json`);
      const reg = await res.json();
      const entry = reg.packages?.find((x: { name: string }) => x.name === pkg);
      if (!entry) {
        push(`ERROR: No matching distribution found for '${pkg}'`, "err");
        push(`Try: ${reg.packages?.map((x: { name: string }) => x.name).join(", ")}`, "dim");
        return;
      }
      setBusy(true);
      printlns(`Collecting ${entry.name}`, "dim");
      await new Promise((r) => window.setTimeout(r, 350));
      printlns(`  Downloading ${entry.name}-${entry.version}-py3-none-any.whl (${entry.size_kb ?? 42} kB)`, "dim");
      await new Promise((r) => window.setTimeout(r, 450));
      printlns(`Installing collected packages: ${entry.name}`, "dim");
      await new Promise((r) => window.setTimeout(r, 300));
      installedRef.current.add(entry.name);
      printlns(`Successfully installed ${entry.name}-${entry.version}`, "ok");
      push(`→ ${entry.description}`, "dim");
      playSuccess();
      addConsole("info", `[pip] installed ${entry.name} ${entry.version}`);
    } catch {
      push("ERROR: package registry unreachable (packages/registry.json)", "err");
    } finally {
      setBusy(false);
    }
  };

  const runAlly = async (message: string) => {
    setBusy(true);
    const model = ALLY_MODELS.find((m) => m.id === "game")!;
    push(`Ally-5 Game · thinking…`, "dim");
    await new Promise((r) => window.setTimeout(r, model.latency));
    const reply = respond(message, model, {
      currentCode: files["main.py"]?.content ?? "",
      lastGameType: null,
    });
    printlns(reply.text.replace(/\*\*/g, "").replace(/`/g, ""), "ally");
    if (reply.filesWritten?.includes("main.py") && reply.code) {
      setFile("main.py", reply.code, "python");
      openFile("main.py");
      push("Ally wrote main.py — type 'python main.py' to run it.", "ok");
      playSuccess();
    }
    setBusy(false);
  };

  const exec = async (raw: string) => {
    const cmdline = raw.trim();
    push(`dev@lapia:~/game$ ${cmdline}`, "cmd");
    if (!cmdline) return;
    setHistory((h) => [...h.slice(-50), cmdline]);
    setHistPos(-1);
    const [cmd, ...args] = cmdline.split(/\s+/);
    const arg = args.join(" ");

    switch (cmd) {
      case "help":
        printlns(HELP, "out");
        break;
      case "clear":
        setLines([]);
        break;
      case "ls": {
        const names = Object.keys(files);
        printlns(names.map((n) => (files[n].kind === "python" ? n : n + "  ")).join("   "), "out");
        push(`${names.length} file(s)`, "dim");
        break;
      }
      case "cat": {
        const f = files[arg];
        if (!f) {
          push(`cat: ${arg}: No such file`, "err");
        } else {
          printlns(f.content.length > 3000 ? f.content.slice(0, 3000) + "\n… (truncated)" : f.content, "out");
        }
        break;
      }
      case "python": {
        if (arg !== "main.py") {
          push(`python: can't open file '${arg || ""}' — try 'python main.py'`, "err");
          break;
        }
        push("Starting Lapia runtime… game output streams to the Console panel.", "dim");
        requestRun();
        push("▶ Run requested — the preview pane now plays main.py", "ok");
        break;
      }
      case "pip": {
        if (args[0] === "install" && args[1]) {
          await runPipInstall(args[1]);
        } else if (args[0] === "list") {
          push("Package            Version", "out");
          push("------------------ ---------", "dim");
          installedRef.current.forEach((n) => push(`${n.padEnd(18)} 1.0.0`, "out"));
        } else {
          push("Usage: pip install <pkg> | pip list", "dim");
        }
        break;
      }
      case "ally": {
        if (!arg) {
          push("Usage: ally <message>   e.g. ally make me a snake game", "dim");
          break;
        }
        await runAlly(arg);
        break;
      }
      case "model":
        push(ALLY_VERSION, "ok");
        ALLY_MODELS.forEach((m) => push(`  ${m.name.padEnd(14)} ctx ${fmtCtx(m.ctx).padEnd(5)} ${m.tag} — ${m.desc}`, "out"));
        break;
      case "neofetch":
        push("        .--.        dev@lapia", "ok");
        push("       |o_o |       ----------", "ok");
        push("       |:_/ |       OS: LapiaOS 3.3 (browser sandbox)", "ok");
        push("      //   \\ \\      Engine: Pygame 2D (Pyodide + canvas shim)", "ok");
        push("     (|     | )     Python: 3.12 (WASM)", "ok");
        push("    /'\\_   _/`\\     AI: " + ALLY_VERSION, "ok");
        push("    \\___)=(___/     Files: " + Object.keys(files).length + " · Panel: Terminal", "ok");
        break;
      case "whoami":
        push("dev (game developer, powered by curiosity)", "out");
        break;
      case "date":
        push(new Date().toString(), "out");
        break;
      case "echo":
        push(arg, "out");
        break;
      case "about":
        push("Lapia Studio — All In One Engine · github.com/gefrus112/all-in-onen-engine", "out");
        break;
      default:
        push(`${cmd}: command not found. Type 'help'.`, "err");
    }
  };

  const onSubmit = async () => {
    if (busy) return;
    const v = input;
    setInput("");
    playTap();
    await exec(v);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0c12] border-t border-border" onClick={() => inputRef.current?.focus()}>
      <div className="flex items-center justify-between px-2 h-7 border-b border-border bg-[var(--studio-toolbar)]">
        <div className="flex items-center gap-2">
          <TerminalSquare className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Terminal</span>
          <span className="text-[10px] font-mono text-muted-foreground/60">dev@lapia:~/game</span>
        </div>
        <button className="tool-btn h-6 w-6 p-0" title="Clear terminal" onClick={() => setLines([])}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div ref={bodyRef} className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[11.5px] leading-relaxed">
        {lines.map((l) => (
          <div
            key={l.id}
            className={
              l.kind === "cmd"
                ? "text-white/90"
                : l.kind === "ok"
                  ? "text-emerald-400"
                  : l.kind === "err"
                    ? "text-red-400"
                    : l.kind === "ally"
                      ? "text-fuchsia-300"
                      : l.kind === "dim"
                        ? "text-muted-foreground/70"
                        : "text-foreground/80"
            }
          >
            {l.text || "\u00A0"}
          </div>
        ))}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-emerald-400 whitespace-nowrap">dev@lapia:~/game$</span>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none text-foreground/90 font-mono caret-emerald-400"
            value={input}
            disabled={busy}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void onSubmit();
              else if (e.key === "ArrowUp") {
                e.preventDefault();
                const idx = histPos < 0 ? history.length - 1 : Math.max(0, histPos - 1);
                if (history[idx] !== undefined) {
                  setHistPos(idx);
                  setInput(history[idx]);
                }
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                if (histPos >= 0 && histPos < history.length - 1) {
                  setHistPos(histPos + 1);
                  setInput(history[histPos + 1]);
                } else {
                  setHistPos(-1);
                  setInput("");
                }
              }
            }}
          />
          {busy && <span className="text-[10px] text-fuchsia-300/80 font-mono animate-pulse">working…</span>}
        </div>
      </div>
    </div>
  );
}
