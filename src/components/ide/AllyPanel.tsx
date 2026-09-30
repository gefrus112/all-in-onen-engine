// Ally-5 — the AI game assistant panel for the Lapia Pygame engine.
"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, X, ChevronDown, FileCode2, Play, Copy } from "lucide-react";
import { useStudio } from "../../lib/studio-store";
import { toast } from "sonner";
import { playPop, playSuccess, playTap, playWhoosh } from "../../lib/ui-sounds";
import {
  ALLY_MODELS,
  ALLY_TRAINING_EXAMPLES,
  ALLY_VERSION,
  respond,
  type AllyModelId,
  type AllyReply,
} from "../../lib/ally5";
import type { GameType } from "../../lib/ally5-games";

interface ChatMsg {
  id: number;
  role: "user" | "ally";
  text: string;
  code?: string;
  chips?: string[];
  streaming?: boolean;
}

let msgId = 1;

// --- markdown-lite rendering (bold, inline code, code fences, lists) -------
function inline(text: string, keyPrefix: string) {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      parts.push(
        <strong key={`${keyPrefix}-b${i++}`} className="text-white font-semibold">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else {
      parts.push(
        <code key={`${keyPrefix}-c${i++}`} className="px-1 py-0.5 mx-0.5 rounded bg-black/40 text-emerald-300 text-[11px] font-mono">
          {tok.slice(1, -1)}
        </code>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function RichText({ text }: { text: string }) {
  const blocks = text.split(/```(?:python)?\n?/);
  return (
    <div className="space-y-1.5">
      {blocks.map((b, bi) =>
        bi % 2 === 1 ? (
          <pre key={bi} className="rounded-lg bg-black/50 border border-white/10 p-2.5 text-[11px] font-mono text-emerald-200/90 overflow-x-auto whitespace-pre">
            {b.replace(/\n$/, "")}
          </pre>
        ) : (
          <div key={bi} className="space-y-1">
            {b.split("\n").map((line, li) =>
              line.trim() === "" ? (
                <div key={li} className="h-1" />
              ) : (
                <p key={li} className="leading-relaxed">
                  {inline(line, `${bi}-${li}`)}
                </p>
              ),
            )}
          </div>
        ),
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
export function AllyPanel() {
  const { setFile, openFile, addConsole, toggleAlly, requestRun, files } = useStudio();
  const [modelId, setModelId] = useState<AllyModelId>("pro");
  const [modelMenu, setModelMenu] = useState(false);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [lastGameType, setLastGameType] = useState<GameType | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const bootedRef = useRef(false);

  const model = ALLY_MODELS.find((m) => m.id === modelId) || ALLY_MODELS[2];

  useEffect(() => {
    return () => timers.current.forEach((t) => window.clearTimeout(t));
  }, []);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, thinking]);

  // welcome message on first open
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    const t = window.setTimeout(() => {
      setMsgs([
        {
          id: msgId++,
          role: "ally",
          text: `Hey — I'm **Ally**, your built-in game developer, powered by the **Ally-5** model family (trained on ${ALLY_TRAINING_EXAMPLES.toLocaleString()} game examples).\n\nTell me what to build — "make a neon snake game", "build a space shooter", "surprise me" — and I'll write a complete, playable main.py right here in your project.`,
          chips: ["Make me a snake game", "Build a space shooter", "Surprise me", "What can you do?"],
        },
      ]);
    }, 500);
    timers.current.push(t);
  }, []);

  const pushMsg = (m: Omit<ChatMsg, "id">) => setMsgs((prev) => [...prev, { ...m, id: msgId++ }]);

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || thinking) return;
    playPop();
    pushMsg({ role: "user", text });
    setInput("");
    setThinking(true);

    const recentErrors = useStudio
      .getState()
      .consoleMessages.filter((m) => m.type === "error")
      .slice(-3)
      .map((m) => m.text);

    const reply: AllyReply = respond(text, model, {
      currentCode: files["main.py"]?.content ?? "",
      lastGameType,
      recentErrors,
    });

    const delay = model.latency + (reply.code ? 500 : 0);
    const t = window.setTimeout(() => {
      setThinking(false);
      pushMsg({ role: "ally", text: reply.text, code: reply.code, chips: reply.chips });
      playSuccess();
      if (reply.gameType) setLastGameType(reply.gameType);
      if (reply.filesWritten?.includes("main.py") && reply.code) {
        writeGame(reply.code, false);
      }
    }, delay);
    timers.current.push(t);
  };

  const writeGame = (code: string, notify: boolean) => {
    setFile("main.py", code, "python");
    openFile("main.py");
    addConsole("system", "Ally-5 wrote main.py — press Run to play.");
    if (notify) toast.success("main.py updated by Ally-5", { description: "Press Run ▶ to play your new game." });
  };

  const insertAndMaybeRun = (code: string, alsoRun: boolean) => {
    playWhoosh();
    writeGame(code, true);
    if (alsoRun) window.setTimeout(() => requestRun(), 250);
  };

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    toast.info("Code copied to clipboard");
  };

  return (
    <div className="ally-root flex flex-col h-full bg-[#0c0e18] border-r border-border overflow-hidden">
      {/* ---- header ---- */}
      <div className="ally-header relative px-3 py-2.5 flex items-center gap-2.5 border-b border-white/5">
        <div className="ally-orb">
          <Sparkles className="w-4 h-4 text-white/90" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-extrabold tracking-wide text-white">Ally</span>
            <span className="ally-badge" style={{ borderColor: `${model.color}66`, color: model.color }}>
              {model.name.replace("Ally-", "Ally-5 ")}
            </span>
          </div>
          <div className="text-[10px] text-white/40 font-mono truncate">{model.tag} · {ALLY_VERSION}</div>
        </div>
        <div className="flex-1" />
        <button
          className="ally-btn"
          title="Switch Ally-5 model"
          onClick={() => {
            playTap();
            setModelMenu((v) => !v);
          }}
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${modelMenu ? "rotate-180" : ""}`} />
        </button>
        <button className="ally-btn" title="Close Ally" onClick={() => { playTap(); toggleAlly(); }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ---- model menu ---- */}
      {modelMenu && (
        <div className="ally-model-menu">
          <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-widest text-white/35 font-mono">Ally-5 model family</div>
          {ALLY_MODELS.map((m) => (
            <button
              key={m.id}
              className={`ally-model-row ${m.id === modelId ? "active" : ""}`}
              onClick={() => {
                playTap();
                setModelId(m.id);
                setModelMenu(false);
                pushMsg({
                  role: "ally",
                  text: `Switched to **${m.name}** — ${m.desc.toLowerCase()}`,
                });
              }}
            >
              <span className="ally-model-dot" style={{ background: m.color, boxShadow: `0 0 8px ${m.color}` }} />
              <span className="flex-1 text-left">
                <span className="block text-[12px] font-bold text-white/90">{m.name}</span>
                <span className="block text-[10px] text-white/45">{m.desc}</span>
              </span>
              {m.id === modelId && <span className="text-[10px] font-mono" style={{ color: m.color }}>ACTIVE</span>}
            </button>
          ))}
        </div>
      )}

      {/* ---- feed ---- */}
      <div ref={feedRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 ally-feed">
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={
                m.role === "user"
                  ? "ally-bubble ally-bubble-user"
                  : "ally-bubble ally-bubble-ally"
              }
            >
              <RichText text={m.text} />
              {m.code ? (
                <div className="mt-2 rounded-lg border border-emerald-400/25 bg-emerald-400/5 overflow-hidden">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-emerald-400/15">
                    <FileCode2 className="w-3 h-3 text-emerald-300" />
                    <span className="text-[10px] font-mono text-emerald-200/80 flex-1">main.py · {m.code.split("\n").length} lines · ready to play</span>
                    <button className="ally-code-btn" title="Copy code" onClick={() => copyCode(m.code!)}>
                      <Copy className="w-3 h-3" />
                    </button>
                    <button className="ally-code-btn" title="Insert into main.py" onClick={() => insertAndMaybeRun(m.code!, false)}>
                      <FileCode2 className="w-3 h-3" />
                    </button>
                    <button className="ally-code-btn ally-code-btn-go" title="Insert and run" onClick={() => insertAndMaybeRun(m.code!, true)}>
                      <Play className="w-3 h-3" />
                    </button>
                  </div>
                  <pre className="max-h-32 overflow-y-auto px-2.5 py-1.5 text-[10px] font-mono text-emerald-100/70 whitespace-pre">
                    {m.code.split("\n").slice(0, 8).join("\n")}
                    {m.code.split("\n").length > 8 ? "\n…" : ""}
                  </pre>
                </div>
              ) : null}
              {m.chips?.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.chips.map((c) => (
                    <button key={c} className="ally-chip" onClick={() => send(c)}>
                      {c}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex justify-start">
            <div className="ally-bubble ally-bubble-ally ally-typing">
              <span className="ally-typing-dot" />
              <span className="ally-typing-dot" style={{ animationDelay: "0.15s" }} />
              <span className="ally-typing-dot" style={{ animationDelay: "0.3s" }} />
              <span className="text-[10px] text-white/40 font-mono ml-1.5">{model.name} is thinking…</span>
            </div>
          </div>
        )}
      </div>

      {/* ---- input ---- */}
      <div className="p-2.5 border-t border-white/5 bg-black/20">
        <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2 focus-within:border-emerald-400/40 transition-colors">
          <textarea
            className="flex-1 bg-transparent outline-none resize-none text-[12.5px] text-white/90 placeholder:text-white/30 font-mono leading-relaxed max-h-24"
            rows={1}
            placeholder={`Tell ${model.name} what to build…`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            className="ally-send"
            title="Send to Ally-5"
            onClick={() => send()}
            disabled={thinking || !input.trim()}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="mt-1.5 px-1 text-[9.5px] text-white/25 font-mono flex items-center justify-between">
          <span>{model.name} · runs 100% in your browser — nothing leaves this page</span>
          <span>Enter to send</span>
        </div>
      </div>
    </div>
  );
}
