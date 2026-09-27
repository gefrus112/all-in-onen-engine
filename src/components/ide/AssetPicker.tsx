"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon, Search, ChevronDown, ChevronRight, X } from "lucide-react";
import { useStudio } from "../../lib/studio-store";
import { toast } from "sonner";

interface SpriteManifestItem {
  slug: string;
  name: string;
  path: string;
  size: [number, number];
}

interface SpriteManifestCategory {
  label: string;
  icon: string;
  items: SpriteManifestItem[];
}

interface SpriteManifest {
  version: string;
  categories: Record<string, SpriteManifestCategory>;
}

export function AssetPicker() {
  const { setSelectedSpritePath, setFile, openFile, activeFile, addConsole } = useStudio();
  const [manifest, setManifest] = useState<SpriteManifest | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["player", "enemies", "tiles"]));
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/sprites/manifest.json")
      .then((r) => r.json())
      .then((m) => {
        setManifest(m);
        setLoading(false);
      })
      .catch((e) => {
        console.error("Failed to load sprite manifest", e);
        setLoading(false);
      });
  }, []);

  const toggleCat = (slug: string) => {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const insertSpriteIntoCode = (item: SpriteManifestItem) => {
    setSelectedSpritePath(item.path);
    toast.success(`Selected: ${item.name}`, {
      description: "Paste-ready code is in your clipboard.",
    });
    // Build a Python snippet that the user can paste
    const code = `# Loaded from ${item.path}\n` +
      `# Sprite: ${item.name} (${item.size[0]}x${item.size[1]})\n` +
      `_sprite = Sprite(color=Color(255, 255, 255), size=(${item.size[0]}, ${item.size[1]}))\n` +
      `_sprite.position = Vector2(100, 100)\n`;
    navigator.clipboard?.writeText(code).catch(() => {});
    addConsole("info", `Asset "${item.name}" copied to clipboard. Paste into your code.`);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--studio-explorer)] border-r border-border">
      <div className="flex items-center justify-between px-2 h-7 border-b border-border bg-[var(--studio-toolbar)]">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <ImageIcon className="w-3 h-3" />
          Toolbox
        </span>
      </div>
      <div className="p-1 border-b border-border">
        <div className="flex items-center gap-2 px-2 py-1 rounded bg-background/40">
          <Search className="w-3 h-3 text-muted-foreground" />
          <input
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            placeholder="Search sprites…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setSearch("")}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {loading && <div className="p-3 text-xs text-muted-foreground">Loading sprites…</div>}
        {!loading && !manifest && <div className="p-3 text-xs text-muted-foreground">Failed to load sprite manifest.</div>}
        {manifest && Object.entries(manifest.categories).map(([slug, cat]) => {
          const isExpanded = expanded.has(slug) || search.length > 0;
          const items = search.length > 0
            ? cat.items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.slug.includes(search.toLowerCase()))
            : cat.items;
          if (items.length === 0) return null;
          return (
            <div key={slug}>
              <div
                className="tree-row"
                onClick={() => !search && toggleCat(slug)}
              >
                <span className="tree-twisty">
                  {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </span>
                <span className="tree-icon">
                  <ImageIcon className="w-3 h-3 text-emerald-400" />
                </span>
                <span className="tree-label">{cat.label}</span>
                <span className="text-[10px] text-muted-foreground ml-auto pr-2">{items.length}</span>
              </div>
              {isExpanded && (
                <div className="grid grid-cols-4 gap-1 p-2">
                  {items.map((item) => (
                    <button
                      key={item.slug}
                      className="aspect-square p-1 rounded border border-border hover:border-primary hover:bg-accent transition-colors group relative"
                      title={item.name}
                      onClick={() => insertSpriteIntoCode(item)}
                    >
                      <img
                        src={item.path}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        style={{ imageRendering: "pixelated" }}
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-black/70 text-[9px] text-center text-white opacity-0 group-hover:opacity-100 truncate px-1">
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {!loading && manifest && search && Object.values(manifest.categories).every(c => c.items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).length === 0) && (
          <div className="p-3 text-xs text-muted-foreground">No sprites match &quot;{search}&quot;.</div>
        )}
      </div>
    </div>
  );
}
