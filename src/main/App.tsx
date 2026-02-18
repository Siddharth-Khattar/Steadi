// ABOUTME: Main application window with three-panel script editor layout.
// ABOUTME: Composes sidebar (fixed-width CSS), editor, and resizable markdown preview.

import { lazy, Suspense, useEffect } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { useScriptStore } from "../stores/scriptStore";
import { useUIStore } from "../stores/uiStore";
import { TopBar } from "../components/toolbar/TopBar";
import { Sidebar } from "../components/sidebar/Sidebar";

// Lazy-load heavy editor and preview components so CodeMirror (~300 kB)
// and react-markdown (~100 kB) are fetched as separate async chunks.
const ScriptEditor = lazy(() =>
  import("../components/editor/ScriptEditor").then((m) => ({
    default: m.ScriptEditor,
  })),
);
const MarkdownPreview = lazy(() =>
  import("../components/preview/MarkdownPreview").then((m) => ({
    default: m.MarkdownPreview,
  })),
);

/** Fixed sidebar width in pixels — consistent across macOS and Windows. */
const SIDEBAR_WIDTH_PX = 260;

/**
 * Root component for the main editor window. Initializes the script
 * persistence layer on mount and renders a three-region layout:
 *
 *   TopBar (fixed height)
 *   |--------------------------------------|
 *   | Sidebar (fixed px) | Editor | Preview|
 *   |--------------------------------------|
 *
 * The sidebar is a simple CSS flexbox element with a fixed pixel width,
 * toggled on/off via a button. The editor and preview use
 * react-resizable-panels only when the preview is visible, providing
 * a draggable divider between them.
 */
export default function MainApp() {
  const isLoading = useScriptStore((s) => s.isLoading);
  const sidebarVisible = useUIStore((s) => s.sidebarVisible);
  const previewVisible = useUIStore((s) => s.previewVisible);

  useEffect(() => {
    useScriptStore.getState().initialize();

    // Flush in-memory content to disk when the window is about to close.
    // This covers the case where the user closes the app during the 1-second
    // auto-save debounce window — without this, those keystrokes are lost.
    const flushOnClose = () => {
      useScriptStore.getState().saveActiveContent();
    };
    window.addEventListener("beforeunload", flushOnClose);
    return () => window.removeEventListener("beforeunload", flushOnClose);
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

      <div className="flex flex-1 overflow-hidden">
        {sidebarVisible && (
          <aside
            style={{ width: SIDEBAR_WIDTH_PX, minWidth: SIDEBAR_WIDTH_PX }}
            className="shrink-0 overflow-hidden"
          >
            <Sidebar />
          </aside>
        )}

        <ContentArea previewVisible={previewVisible} />
      </div>
    </div>
  );
}

/**
 * Editor + optional preview region. Extracted as a component so the
 * resizable panel Group only mounts when preview is visible — avoids
 * layout recalculation issues when toggling preview on/off.
 */
/** Minimal placeholder shown while a lazy-loaded panel chunk is being fetched. */
function PanelLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <p className="text-white/30 text-sm">Loading…</p>
    </div>
  );
}

function ContentArea({ previewVisible }: { previewVisible: boolean }) {
  if (!previewVisible) {
    return (
      <div className="flex-1 overflow-hidden relative">
        <Suspense fallback={<PanelLoader />}>
          <ScriptEditor />
        </Suspense>
      </div>
    );
  }

  return (
    <Group orientation="horizontal" className="flex-1 overflow-hidden">
      <Panel id="editor" defaultSize={50} minSize={30} className="relative">
        <Suspense fallback={<PanelLoader />}>
          <ScriptEditor />
        </Suspense>
      </Panel>
      <Separator className="w-px bg-white/10 hover:bg-white/20 transition-colors cursor-col-resize" />
      <Panel id="preview" defaultSize={50} minSize={20} className="relative">
        <Suspense fallback={<PanelLoader />}>
          <MarkdownPreview />
        </Suspense>
      </Panel>
    </Group>
  );
}
