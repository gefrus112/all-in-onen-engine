"use client";

import { useStudio, SceneEntity } from "@/lib/studio-store";
import { Search, Settings2 } from "lucide-react";
import { useState } from "react";

function ValueEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (typeof value === "boolean") {
    return (
      <button
        className={`px-2 py-0.5 rounded text-xs ${value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        onClick={() => onChange(!value)}
      >
        {value ? "True" : "False"}
      </button>
    );
  }
  if (typeof value === "number") {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full bg-transparent text-xs px-1 py-0.5 outline-none border border-transparent hover:border-border focus:border-primary rounded"
      />
    );
  }
  if (typeof value === "string") {
    if (value.startsWith("#")) {
      return (
        <div className="flex items-center gap-1 px-1">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-5 h-5 rounded border border-border bg-transparent cursor-pointer"
          />
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 bg-transparent text-xs px-1 py-0.5 outline-none border border-transparent focus:border-primary rounded"
          />
        </div>
      );
    }
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-xs px-1 py-0.5 outline-none border border-transparent hover:border-border focus:border-primary rounded"
      />
    );
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 2 && entries[0][0] === "x" && entries[1][0] === "y") {
      const obj = value as { x: number; y: number };
      return (
        <div className="flex items-center gap-1 px-1">
          <span className="text-xs text-muted-foreground">X</span>
          <input
            type="number"
            value={obj.x}
            step="any"
            onChange={(e) => onChange({ ...obj, x: parseFloat(e.target.value) })}
            className="w-16 bg-transparent text-xs px-1 py-0.5 outline-none border border-transparent hover:border-border focus:border-primary rounded"
          />
          <span className="text-xs text-muted-foreground">Y</span>
          <input
            type="number"
            value={obj.y}
            step="any"
            onChange={(e) => onChange({ ...obj, y: parseFloat(e.target.value) })}
            className="w-16 bg-transparent text-xs px-1 py-0.5 outline-none border border-transparent hover:border-border focus:border-primary rounded"
          />
        </div>
      );
    }
    return (
      <div className="text-xs text-muted-foreground italic px-1">
        {JSON.stringify(value).slice(0, 60)}
        {JSON.stringify(value).length > 60 ? "…" : ""}
      </div>
    );
  }
  if (Array.isArray(value)) {
    return (
      <div className="text-xs text-muted-foreground px-1">
        [{value.length} items]
      </div>
    );
  }
  return <div className="text-xs text-muted-foreground px-1">{String(value)}</div>;
}

export function PropertiesPanel() {
  const { sceneTree, selectedEntityId, updateEntityProperty } = useStudio();
  const entity = sceneTree.find((e) => e.id === selectedEntityId);

  if (!entity) {
    return (
      <div className="flex flex-col h-full bg-[var(--studio-properties)] border-l border-border">
        <div className="flex items-center justify-between px-2 h-7 border-b border-border bg-[var(--studio-toolbar)]">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Properties
          </span>
          <Settings2 className="w-3 h-3 text-muted-foreground" />
        </div>
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground p-4 text-center">
          Select an entity in the Hierarchy to view its properties.
        </div>
      </div>
    );
  }

  const props = entity.properties ?? {};

  return (
    <div className="flex flex-col h-full bg-[var(--studio-properties)] border-l border-border">
      <div className="flex items-center justify-between px-2 h-7 border-b border-border bg-[var(--studio-toolbar)]">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Properties
        </span>
        <Settings2 className="w-3 h-3 text-muted-foreground" />
      </div>
      <div className="p-2 border-b border-border">
        <div className="text-xs text-muted-foreground mb-1">Selected</div>
        <div className="text-sm font-medium">{entity.name}</div>
        <div className="text-xs text-muted-foreground mt-1">{entity.type}</div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {Object.entries(props).map(([key, value]) => (
          <div key={key} className="prop-row">
            <div className="prop-key">{key}</div>
            <div className="prop-value">
              <ValueEditor
                value={value}
                onChange={(v) => updateEntityProperty(entity.id, key, v)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
