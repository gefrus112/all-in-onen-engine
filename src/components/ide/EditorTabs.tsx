"use client";

import { X, Circle } from "lucide-react";
import { useStudio } from "../../lib/studio-store";

function kindIcon(kind: string) {
  const color =
    kind === "python" ? "text-blue-400" :
    kind === "css" ? "text-purple-400" :
    "text-muted-foreground";
  return <Circle className={`w-2 h-2 fill-current ${color}`} />;
}

export function EditorTabs() {
  const { openTabs, activeFile, setActiveFile, closeTab, files } = useStudio();

  if (openTabs.length === 0) {
    return (
      <div className="h-9 bg-[var(--studio-toolbar)] border-b border-border flex items-center px-3 text-xs text-muted-foreground">
        No files open
      </div>
    );
  }

  return (
    <div className="h-9 bg-[var(--studio-toolbar)] border-b border-border flex items-stretch overflow-x-auto">
      {openTabs.map((path) => {
        const isActive = path === activeFile;
        const file = files[path];
        return (
          <div
            key={path}
            className={`group flex items-center gap-2 px-3 cursor-pointer border-r border-border whitespace-nowrap ${
              isActive
                ? "bg-[var(--studio-tab-active)] text-foreground"
                : "bg-[var(--studio-tab-inactive)] text-muted-foreground hover:bg-[var(--studio-tab-hover)]"
            }`}
            onClick={() => setActiveFile(path)}
          >
            {file && kindIcon(file.kind)}
            <span className="text-xs">{path.split("/").pop()}</span>
            <button
              className="opacity-0 group-hover:opacity-100 hover:bg-background/40 rounded p-0.5"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(path);
              }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
