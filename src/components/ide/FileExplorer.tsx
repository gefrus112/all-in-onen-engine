"use client";

import { useState } from "react";
import {
  File,
  FileCode2,
  FileType2,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
} from "lucide-react";
import { useStudio } from "@/lib/studio-store";
import { toast } from "sonner";

function iconForFile(path: string, kind: string) {
  if (kind === "python" || path.endsWith(".py")) return <FileCode2 className="w-3.5 h-3.5 text-blue-400" />;
  if (kind === "css" || path.endsWith(".css")) return <FileType2 className="w-3.5 h-3.5 text-purple-400" />;
  if (path.endsWith(".md")) return <File className="w-3.5 h-3.5 text-amber-400" />;
  if (path.endsWith(".json")) return <File className="w-3.5 h-3.5 text-emerald-400" />;
  return <File className="w-3.5 h-3.5 text-muted-foreground" />;
}

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: TreeNode[];
  kind: string;
}

function buildTree(files: Record<string, { path: string; kind: string }>): TreeNode {
  const root: TreeNode = { name: "", path: "", isDir: true, children: [], kind: "" };
  const sorted = Object.values(files).sort((a, b) => a.path.localeCompare(b.path));
  for (const f of sorted) {
    const parts = f.path.split("/");
    let cur = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const fullPath = parts.slice(0, i + 1).join("/");
      let child = cur.children?.find((c) => c.name === part);
      if (!child) {
        child = {
          name: part,
          path: fullPath,
          isDir: !isLast,
          children: isLast ? undefined : [],
          kind: isLast ? f.kind : "",
        };
        cur.children?.push(child);
      }
      if (!isLast) cur = child;
    }
  }
  // Sort: dirs first, then files alphabetically
  const sortRec = (n: TreeNode) => {
    if (n.children) {
      n.children.sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      n.children.forEach(sortRec);
    }
  };
  sortRec(root);
  return root;
}

function TreeRow({
  node,
  depth,
  expanded,
  toggleExpand,
  activePath,
  onActivate,
}: {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  toggleExpand: (p: string) => void;
  activePath: string | null;
  onActivate: (p: string) => void;
}) {
  const isExpanded = expanded.has(node.path);
  const padLeft = 8 + depth * 12;
  return (
    <>
      <div
        className={`tree-row ${activePath === node.path ? "selected" : ""}`}
        style={{ paddingLeft: padLeft }}
        onClick={() => {
          if (node.isDir) toggleExpand(node.path);
          else onActivate(node.path);
        }}
      >
        {node.isDir ? (
          <>
            <span className="tree-twisty">
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </span>
            <span className="tree-icon">
              {isExpanded ? <FolderOpen className="w-3.5 h-3.5 text-amber-500" /> : <Folder className="w-3.5 h-3.5 text-amber-500" />}
            </span>
          </>
        ) : (
          <>
            <span className="tree-twisty" />
            <span className="tree-icon">{iconForFile(node.path, node.kind)}</span>
          </>
        )}
        <span className="tree-label">{node.name}</span>
      </div>
      {node.isDir && isExpanded && node.children?.map((c) => (
        <TreeRow
          key={c.path}
          node={c}
          depth={depth + 1}
          expanded={expanded}
          toggleExpand={toggleExpand}
          activePath={activePath}
          onActivate={onActivate}
        />
      ))}
    </>
  );
}

export function FileExplorer() {
  const { files, activeFile, openFile, createFile, deleteFile } = useStudio();
  const [expanded, setExpanded] = useState<Set<string>>(new Set([""]));
  const tree = buildTree(files);

  const toggleExpand = (path: string) => {
    const next = new Set(expanded);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setExpanded(next);
  };

  const handleNewFile = () => {
    const name = prompt("New file name:", "new_file.py");
    if (!name) return;
    if (files[name]) {
      toast.error("File already exists.");
      return;
    }
    const kind = name.endsWith(".py") ? "python" : name.endsWith(".css") ? "css" : "text";
    createFile(name, kind);
    toast.success(`Created ${name}`);
  };

  const handleDelete = (path: string) => {
    if (confirm(`Delete ${path}?`)) {
      deleteFile(path);
      toast.success(`Deleted ${path}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--studio-explorer)] border-r border-border">
      <div className="flex items-center justify-between px-2 h-7 border-b border-border bg-[var(--studio-toolbar)]">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Explorer
        </span>
        <div className="flex items-center gap-0.5">
          <button className="tool-btn h-6 w-6 p-0" onClick={handleNewFile} title="New file">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            className="tool-btn h-6 w-6 p-0"
            onClick={() => activeFile && handleDelete(activeFile)}
            title="Delete active file"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {tree.children?.map((node) => (
          <TreeRow
            key={node.path}
            node={node}
            depth={0}
            expanded={expanded}
            toggleExpand={toggleExpand}
            activePath={activeFile}
            onActivate={(p) => openFile(p)}
          />
        ))}
      </div>
    </div>
  );
}
