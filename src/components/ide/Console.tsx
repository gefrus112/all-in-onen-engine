"use client";

import { useEffect, useRef } from "react";
import { Trash2, X, ChevronDown } from "lucide-react";
import { useStudio } from "../../lib/studio-store";

export function Console() {
  const { consoleMessages, clearConsole } = useStudio();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [consoleMessages.length]);

  return (
    <div className="flex flex-col h-full bg-[var(--studio-console)] border-t border-border">
      <div className="flex items-center justify-between px-2 h-7 border-b border-border bg-[var(--studio-toolbar)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Output
          </span>
          <button className="tool-btn h-5 text-[10px] px-2">
            All ▾
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="tool-btn h-6 w-6 p-0"
            onClick={clearConsole}
            title="Clear console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1 font-mono text-xs">
        {consoleMessages.length === 0 ? (
          <div className="p-4 text-muted-foreground italic">
            No messages yet. Run your game to see output.
          </div>
        ) : (
          consoleMessages.map((msg) => (
            <div key={msg.id} className={`console-line ${msg.type}`}>
              <span className="opacity-50 mr-2">
                {new Date(msg.timestamp).toLocaleTimeString(undefined, { hour12: false })}
              </span>
              {msg.source ? `[${msg.source}] ` : ""}
              {msg.text}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
