"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/ide/TopBar";
import { FileExplorer } from "@/components/ide/FileExplorer";
import { SceneHierarchy } from "@/components/ide/SceneHierarchy";
import { PropertiesPanel } from "@/components/ide/PropertiesPanel";
import { Console } from "@/components/ide/Console";
import { StatusBar } from "@/components/ide/StatusBar";
import { EditorTabs } from "@/components/ide/EditorTabs";
import { PreviewPane } from "@/components/ide/PreviewPane";
import { useStudio } from "@/lib/studio-store";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

// Monaco editor must be loaded client-side only.
const CodeEditor = dynamic(
  () => import("@/components/ide/CodeEditor").then((m) => m.CodeEditor),
  { ssr: false, loading: () => <div className="p-4 text-muted-foreground text-sm">Loading editor…</div> }
);

export default function Home() {
  const {
    showExplorer,
    showProperties,
    showConsole,
  } = useStudio();

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden text-foreground">
      {/* Top bar: studio ribbon with file menu, play controls, profile */}
      <TopBar />

      {/* Main 3-column layout */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" autoSaveId="lapia-main">
          {/* LEFT: File Explorer + Scene Hierarchy */}
          {showExplorer && (
            <>
              <ResizablePanel defaultSize={20} minSize={14} maxSize={32}>
                <div className="flex flex-col h-full bg-sidebar">
                  <FileExplorer />
                  <div className="h-px bg-border" />
                  <SceneHierarchy />
                </div>
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}

          {/* CENTER: Editor + Preview */}
          <ResizablePanel defaultSize={52} minSize={25}>
            <ResizablePanelGroup direction="vertical" autoSaveId="lapia-center">
              <ResizablePanel defaultSize={50} minSize={20}>
                <div className="flex flex-col h-full bg-card">
                  <EditorTabs />
                  <div className="flex-1 min-h-0 relative">
                    <CodeEditor />
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={50} minSize={20}>
                <PreviewPane />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          {/* RIGHT: Properties + Console */}
          {showProperties && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={28} minSize={18} maxSize={45}>
                <ResizablePanelGroup direction="vertical" autoSaveId="lapia-right">
                  <ResizablePanel defaultSize={55} minSize={20}>
                    <PropertiesPanel />
                  </ResizablePanel>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={45} minSize={20}>
                    {showConsole ? <Console /> : <div className="h-full bg-card" />}
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* Bottom status bar */}
      <StatusBar />
    </div>
  );
}
