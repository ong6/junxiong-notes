/* @jsxRuntime automatic @jsxImportSource react */
// The blog's diagram theme and shared helpers for the uipack figures under
// content/figures/. Colours mirror app/globals.css and the chart palette in
// scripts/render-diagrams.mjs, so diagrams and charts read as one set.
import type { ReactNode } from "react";
import { defineDiagramTheme } from "uipack";

const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Inter, Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

// The blog's one diagram theme (STYLE.md, diagram-themes: { default: notes }).
// uipack/static inlines it into each file; the article surface shows through
// (canvas "plain", and the renderer paints no background).
export const notes = defineDiagramTheme({
  name: "notes",
  canvas: "plain",
  fonts: { text: SANS, label: MONO },
  light: {
    ink: "#14110d",
    "ink-2": "#6b6459",
    surface: "#fffdf9",
    "surface-raised": "#f6f2ea",
    "surface-2": "#efe9df",
    "line-soft": "#d9d2c5",
    line: "#d9d2c5",
    // Green labels sit on node fills (surface-raised) and the page (surface).
    // #1baf7a was ~2.5:1 there; this is 4.8:1 on the node fill and 5.3:1 on the page.
    accent: "#0f7a55",
    "flow-request": "#2a78d6",
    "flow-response": "#0f7a55",
    "flow-change": "#eb6834",
    // A declined branch. 5.8:1 on the page, 5.3:1 on the node fill, 4.9:1 on surface-2.
    "flow-error": "#b8352a",
  },
  dark: {
    ink: "#ece7de",
    "ink-2": "#9d9488",
    surface: "#12110f",
    "surface-raised": "#1b1917",
    "surface-2": "#232019",
    "line-soft": "#3a352f",
    line: "#3a352f",
    accent: "#199e70",
    "flow-request": "#3987e5",
    "flow-response": "#199e70",
    "flow-change": "#d95926",
    // 6.3:1 on the page, 5.9:1 on the node fill, 5.5:1 on surface-2.
    "flow-error": "#e8735f",
  },
});

/** What every figure module exports as default. */
export interface NotesFigure {
  /** Accessible description; becomes aria-label on the SVG. */
  alt: string;
  viewBox: string;
  children: ReactNode;
  /** Optional narrow composition. Rendered only below the site's 600px breakpoint. */
  mobile?: {
    alt: string;
    viewBox: string;
    children: ReactNode;
  };
}

export const define = (f: NotesFigure) => f;
