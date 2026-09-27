"use client";

import { useEffect, useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { useStudio } from "@/lib/studio-store";

const MONACO_THEME = "lapia-dark";

const MONACO_THEME_DEFINITION = {
  base: "vs-dark" as const,
  inherit: true,
  rules: [
    { token: "comment", foreground: "6a7080", fontStyle: "italic" },
    { token: "keyword", foreground: "5b9eff" },
    { token: "string", foreground: "9ecbff" },
    { token: "number", foreground: "f59e0b" },
    { token: "type", foreground: "8b5cf6" },
    { token: "function", foreground: "10b981" },
    { token: "variable", foreground: "e6e8eb" },
    { token: "constant", foreground: "f59e0b" },
  ],
  colors: {
    "editor.background": "#1e1f22",
    "editor.foreground": "#e6e8eb",
    "editorLineNumber.foreground": "#4a4b50",
    "editorLineNumber.activeForeground": "#c9ccd1",
    "editor.selectionBackground": "#3b82f640",
    "editor.inactiveSelectionBackground": "#3b82f620",
    "editor.lineHighlightBackground": "#25262b",
    "editor.lineHighlightBorder": "#00000000",
    "editorCursor.foreground": "#5b9eff",
    "editorWhitespace.foreground": "#3a3b40",
    "editorIndentGuide.background1": "#2a2b30",
    "editorIndentGuide.activeBackground1": "#4a4b50",
    "editorWidget.background": "#25262b",
    "editorWidget.border": "#35363c",
    "editorSuggestWidget.background": "#25262b",
    "editorSuggestWidget.selectedBackground": "#3b82f640",
    "editorSuggestWidget.highlightForeground": "#5b9eff",
    "editorBracketMatch.background": "#3b82f630",
    "editorBracketMatch.border": "#3b82f6",
    "scrollbarSlider.background": "#3a3b4080",
    "scrollbarSlider.hoverBackground": "#4a4b5080",
    "scrollbarSlider.activeBackground": "#5a5b60",
    "minimap.background": "#1e1f22",
  },
};

export function CodeEditor() {
  const { files, activeFile, setFile } = useStudio();
  const editorRef = useRef<any>(null);
  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monaco.editor.defineTheme(MONACO_THEME, MONACO_THEME_DEFINITION as any);
    monaco.editor.setTheme(MONACO_THEME);

    // Ctrl+S to save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Content is already in the store via onChange
      useStudio.getState().addConsole("success", "Saved.");
    });

    // F5 to run
    editor.addCommand(monaco.KeyCode.F5, () => {
      const st = useStudio.getState();
      if (st.runState !== "running" && st.runState !== "loading") {
        st.setRunState("loading");
        st.addConsole("system", `Running ${st.activeFile}…`);
      }
    });
  };

  // Apply the theme to Monaco globally on first load
  useEffect(() => {
    // Monaco theme is set in onMount
  }, []);

  if (!activeFile || !files[activeFile]) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        Open a file to start editing
      </div>
    );
  }

  const file = files[activeFile];
  const language =
    file.kind === "python" ? "python" :
    file.kind === "css" ? "css" :
    file.kind === "json" ? "json" :
    "plaintext";

  return (
    <Editor
      path={activeFile}
      language={language}
      value={file.content}
      theme={MONACO_THEME}
      beforeMount={(monaco) => {
        monaco.editor.defineTheme(MONACO_THEME, MONACO_THEME_DEFINITION as any);
      }}
      onMount={onMount}
      onChange={(value) => {
        if (value !== undefined && activeFile) {
          setFile(activeFile, value, file.kind);
        }
      }}
      options={{
        fontSize: 13,
        fontFamily: "var(--font-geist-mono), 'JetBrains Mono', Consolas, monospace",
        fontLigatures: true,
        minimap: { enabled: true, scale: 1, renderCharacters: false },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorSmoothCaretAnimation: "on",
        cursorBlinking: "smooth",
        renderWhitespace: "selection",
        renderLineHighlight: "all",
        renderIndentGuides: true,
        bracketPairColorization: { enabled: true },
        automaticLayout: true,
        tabSize: 4,
        insertSpaces: true,
        wordWrap: "off",
        lineNumbers: "on",
        glyphMargin: true,
        folding: true,
        showFoldingControls: "mouseover",
        padding: { top: 8, bottom: 8 },
        scrollbar: {
          vertical: "auto",
          horizontal: "auto",
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
          useShadows: false,
        },
        overviewRulerBorder: false,
        fixedOverflowWidgets: true,
      }}
    />
  );
}
