"use client";

import {
  Box,
  Camera,
  Circle,
  Folder,
  Grid3x3,
  Layers,
  Move,
  Package,
  Settings,
  ChevronRight,
  ChevronDown,
  Search,
} from "lucide-react";
import { useStudio, SceneEntity } from "@/lib/studio-store";

function iconForEntity(type: string) {
  switch (type.toLowerCase()) {
    case "scene": return <Box className="w-3.5 h-3.5 text-blue-400" />;
    case "entity": return <Box className="w-3.5 h-3.5 text-cyan-400" />;
    case "camera": return <Camera className="w-3.5 h-3.5 text-purple-400" />;
    case "tilemap": return <Grid3x3 className="w-3.5 h-3.5 text-emerald-400" />;
    case "enemy": return <Circle className="w-3.5 h-3.5 text-red-400" />;
    case "group": return <Folder className="w-3.5 h-3.5 text-amber-500" />;
    case "player": return <Move className="w-3.5 h-3.5 text-blue-400" />;
    case "layer": return <Layers className="w-3.5 h-3.5 text-purple-400" />;
    default: return <Package className="w-3.5 h-3.5 text-muted-foreground" />;
  }
}

function EntityRow({
  entity,
  depth,
  entities,
  selectedId,
  onToggle,
  onSelect,
}: {
  entity: SceneEntity;
  depth: number;
  entities: SceneEntity[];
  selectedId: string | null;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const children = entities.filter((e) => e.parentId === entity.id);
  const hasChildren = children.length > 0;
  const isExpanded = entity.expanded;
  const padLeft = 8 + depth * 12;
  return (
    <>
      <div
        className={`tree-row ${selectedId === entity.id ? "selected" : ""}`}
        style={{ paddingLeft: padLeft }}
        onClick={() => onSelect(entity.id)}
      >
        <span className="tree-twisty" onClick={(e) => { e.stopPropagation(); if (hasChildren) onToggle(entity.id); }}>
          {hasChildren ? (isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />) : null}
        </span>
        <span className="tree-icon">{iconForEntity(entity.type)}</span>
        <span className="tree-label">{entity.name}</span>
      </div>
      {hasChildren && isExpanded && children.map((c) => (
        <EntityRow
          key={c.id}
          entity={c}
          depth={depth + 1}
          entities={entities}
          selectedId={selectedId}
          onToggle={onToggle}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

export function SceneHierarchy() {
  const { sceneTree, selectedEntityId, selectEntity, toggleEntityExpanded } = useStudio();
  const roots = sceneTree.filter((e) => e.parentId === null);

  return (
    <div className="flex flex-col h-full bg-[var(--studio-explorer)] border-r border-border">
      <div className="flex items-center justify-between px-2 h-7 border-b border-border bg-[var(--studio-toolbar)]">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Hierarchy
        </span>
        <Settings className="w-3 h-3 text-muted-foreground" />
      </div>
      <div className="p-1 border-b border-border">
        <div className="flex items-center gap-2 px-2 py-1 rounded bg-background/40">
          <Search className="w-3 h-3 text-muted-foreground" />
          <input
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            placeholder="Filter…"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {roots.map((e) => (
          <EntityRow
            key={e.id}
            entity={e}
            depth={0}
            entities={sceneTree}
            selectedId={selectedEntityId}
            onToggle={toggleEntityExpanded}
            onSelect={selectEntity}
          />
        ))}
      </div>
    </div>
  );
}
