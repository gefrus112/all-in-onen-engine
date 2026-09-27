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
import { AssetPicker } from "@/components/ide/AssetPicker";
import { TemplatesPanel } from "@/components/ide/TemplatesPanel";
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
    showAssetPicker,
    showToolbox,
  } = useStudio();

  // Load socket.io client library and connect to relay.
  useEffect(() => {
    if ((window as any)._lapiaSocket) return;
    // Inject socket.io client from CDN
    const script = document.createElement("script");
    script.src = "https://cdn.socket.io/4.7.5/socket.io.min.js";
    script.onload = () => {
      try {
        // Try direct localhost first (works in dev), fall back to gateway
        const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        const url = isLocalhost ? "http://localhost:3001" : "";
        const path = isLocalhost ? "/" : "/?XTransformPort=3001";
        const sock = (window as any).io(url, {
          path,
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });
        (window as any)._lapiaSocket = sock;
        sock.on("connect", () => {
          console.log("[Multiplayer] Connected to relay:", sock.id);
          sock.emit("join", { room: "default", name: `Player-${Math.floor(Math.random()*9000)+1000}` });
        });
        sock.on("connect_error", (e: any) => {
          console.warn("[Multiplayer] Connection error:", e?.message || e);
        });
        sock.on("disconnect", () => {
          console.log("[Multiplayer] Disconnected from relay");
        });
      } catch (e) {
        console.warn("[Multiplayer] Failed to connect to relay:", e);
      }
    };
    script.onerror = () => {
      console.warn("[Multiplayer] Failed to load socket.io client");
    };
    document.head.appendChild(script);
    return () => {
      // Leave socket alive across HMR
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden text-foreground">
      {/* Top bar: studio ribbon with file menu, play controls, profile */}
      <TopBar />

      {/* Main 4-column layout: Explorer | Toolbox | Center (Editor + Preview) | Properties */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" autoSaveId="lapia-main">
          {/* LEFT: File Explorer + Scene Hierarchy */}
          {showExplorer && (
            <>
              <ResizablePanel defaultSize={16} minSize={12} maxSize={28}>
                <div className="flex flex-col h-full bg-sidebar">
                  <FileExplorer />
                  <div className="h-px bg-border" />
                  <SceneHierarchy />
                </div>
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}

          {/* LEFT-CENTER: Asset Picker + Templates (Toolbox) */}
          {showToolbox && (
            <>
              <ResizablePanel defaultSize={16} minSize={12} maxSize={28}>
                <ResizablePanelGroup direction="vertical" autoSaveId="lapia-toolbox">
                  <ResizablePanel defaultSize={60} minSize={20}>
                    <AssetPicker />
                  </ResizablePanel>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={40} minSize={20}>
                    <TemplatesPanel />
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}

          {/* CENTER: Editor + Preview */}
          <ResizablePanel defaultSize={42} minSize={25}>
            <ResizablePanelGroup direction="vertical" autoSaveId="lapia-center">
              <ResizablePanel defaultSize={45} minSize={20}>
                <div className="flex flex-col h-full bg-card">
                  <EditorTabs />
                  <div className="flex-1 min-h-0 relative">
                    <CodeEditor />
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={55} minSize={25}>
                <PreviewPane />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          {/* RIGHT: Properties + Console */}
          {showProperties && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={26} minSize={18} maxSize={42}>
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
