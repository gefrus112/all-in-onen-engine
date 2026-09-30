"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { TopBar } from "../components/ide/TopBar";
import { FileExplorer } from "../components/ide/FileExplorer";
import { SceneHierarchy } from "../components/ide/SceneHierarchy";
import { PropertiesPanel } from "../components/ide/PropertiesPanel";
import { Console } from "../components/ide/Console";
import { StatusBar } from "../components/ide/StatusBar";
import { EditorTabs } from "../components/ide/EditorTabs";
import { PreviewPane } from "../components/ide/PreviewPane";
import { AssetPicker } from "../components/ide/AssetPicker";
import { TemplatesPanel } from "../components/ide/TemplatesPanel";
import { LandingPage } from "../components/ide/LandingPage";
import { SettingsDialog } from "../components/ide/SettingsDialog";
import { ProjectWizard } from "../components/ide/ProjectWizard";
import { GitHubAuth } from "../components/ide/GitHubAuth";
import { Studio3D } from "../components/ide/Studio3D";
import { AvatarPicker } from "../components/ide/AvatarPicker";
import { PublishDialog } from "../components/ide/PublishDialog";
import { InstructionsDialog } from "../components/ide/InstructionsDialog";
import { useStudio } from "../lib/studio-store";
import { installUiSounds } from "../lib/ui-sounds";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../components/ui/resizable";

// Monaco editor must be loaded client-side only.
const CodeEditor = dynamic(
  () => import("../components/ide/CodeEditor").then((m) => m.CodeEditor),
  { ssr: false, loading: () => <div className="p-4 text-muted-foreground text-sm">Loading editor…</div> }
);

type ViewMode = "landing" | "ide-2d" | "ide-3d";

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("landing");
  const {
    showExplorer,
    showProperties,
    showConsole,
    showAssetPicker,
    showToolbox,
    theme,
  } = useStudio();

  // Apply the selected theme to the whole document
  useEffect(() => {
    if (theme === "dark") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Satisfying UI sounds — one-time global install (respects Settings → Audio)
  useEffect(() => {
    installUiSounds();
  }, []);

  const launch2DIDE = useCallback(() => setViewMode("ide-2d"), []);
  const launch3DStudio = useCallback(() => setViewMode("ide-3d"), []);
  const backToLanding = useCallback(() => setViewMode("landing"), []);

  // Listen for #ide hash to auto-launch IDE
  useEffect(() => {
    if (window.location.hash === "#ide") {
      /* eslint-disable react-hooks/set-state-in-effect */
      setViewMode("ide-2d");
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, []);

  // Toggle landing-mode class on <html> to allow scrolling on landing page
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    if (viewMode === "landing") {
      html.classList.add("landing-mode");
      html.style.overflow = "auto";
      html.style.height = "auto";
      body.style.overflow = "auto";
      body.style.height = "auto";
    } else {
      html.classList.remove("landing-mode");
      html.style.overflow = "";
      html.style.height = "";
      body.style.overflow = "";
      body.style.height = "";
    }
  }, [viewMode]);

  // Load socket.io client library and connect to relay (only in 2D IDE mode).
  useEffect(() => {
    if (viewMode !== "ide-2d") return;
    if ((window as any)._lapiaSocket) return;
    const script = document.createElement("script");
    script.src = "https://cdn.socket.io/4.7.5/socket.io.min.js";
    script.onload = () => {
      try {
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
      } catch (e) {
        console.warn("[Multiplayer] Failed to connect to relay:", e);
      }
    };
    document.head.appendChild(script);
  }, [viewMode]);

  if (viewMode === "landing") {
    return <LandingPage onLaunchIDE={launch2DIDE} onLaunch3DStudio={launch3DStudio} />;
  }

  if (viewMode === "ide-3d") {
    return (
      <>
        <Studio3D onExit={backToLanding} />
        <AvatarPicker />
        <PublishDialog />
        <InstructionsDialog />
        <GitHubAuth />
        <SettingsDialog />
      </>
    );
  }

  // 2D IDE
  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden text-foreground">
      <TopBar onExitToLanding={backToLanding} />
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" autoSaveId="lapia-main">
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

      <StatusBar />
      <SettingsDialog />
      <ProjectWizard />
      <GitHubAuth />
      <AvatarPicker />
      <PublishDialog />
      <InstructionsDialog />
    </div>
  );
}
