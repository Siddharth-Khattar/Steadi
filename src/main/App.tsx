// ABOUTME: Main application window with three-panel script editor layout.
// ABOUTME: Composes sidebar, editor, and markdown preview via react-resizable-panels.

import { useEffect } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { useScriptStore } from "../stores/scriptStore";
import { useUIStore } from "../stores/uiStore";
import { TopBar } from "../components/toolbar/TopBar";
import { Sidebar } from "../components/sidebar/Sidebar";
import { ScriptEditor } from "../components/editor/ScriptEditor";
import { MarkdownPreview } from "../components/preview/MarkdownPreview";

/**
 * Root component for the main editor window. Initializes the script
 * persistence layer on mount and renders a three-panel layout:
 *
 *   TopBar (fixed height)
 *   |---------------------------------|
 *   | Sidebar | Editor | Preview      |
 *   |---------------------------------|
 *
 * Sidebar and preview panels are conditionally rendered based on UI
 * store visibility flags. Panels use their own defaultSize/minSize
 * values; the library handles dynamic add/remove automatically via IDs.
 */
export default function MainApp() {
  const isLoading = useScriptStore((s) => s.isLoading);
  const sidebarVisible = useUIStore((s) => s.sidebarVisible);
  const previewVisible = useUIStore((s) => s.previewVisible);

  useEffect(() => {
    useScriptStore.getState().initialize();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-neutral-900 flex items-center justify-center">
        <p className="text-white/40 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-neutral-900 flex flex-col overflow-hidden">
      <TopBar />

      <Group
        orientation="horizontal"
        className="flex-1 overflow-hidden"
      >
        {sidebarVisible && (
          <>
            <Panel
              id="sidebar"
              defaultSize={20}
              minSize={12}
              maxSize={35}
              collapsible
              className="min-w-45"
            >
              <Sidebar />
            </Panel>
            <Separator className="w-px bg-white/10 hover:bg-white/20 transition-colors" />
          </>
        )}

        <Panel id="editor" minSize={30}>
          <ScriptEditor />
        </Panel>

        {previewVisible && (
          <>
            <Separator className="w-px bg-white/10 hover:bg-white/20 transition-colors" />
            <Panel id="preview" defaultSize={40} minSize={20}>
              <MarkdownPreview />
            </Panel>
          </>
        )}
      </Group>
    </div>
  );
}
