/* @jsxRuntime automatic @jsxImportSource react */
// Shared palette and helpers for the uipack figures under content/figures/.
// Colours mirror app/globals.css and the chart palette in
// scripts/render-diagrams.mjs, so diagrams and charts read as one set.
import type { ReactNode } from "react";
import type { StaticOptions } from "uipack/static";

export const THEMES: Record<"light" | "dark", NonNullable<StaticOptions["theme"]>> = {
  light: {
    base: "light",
    fg: "#14110d",
    muted: "#6b6459",
    bg: "#fffdf9",
    surface: "#f6f2ea",
    "surface-raised": "#efe9df",
    grid: "#d9d2c5",
    border: "#d9d2c5",
    accent: "#1baf7a",
    "token-request": "#2a78d6",
    "token-response": "#1baf7a",
    "token-change": "#eb6834",
    sans: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Inter, Helvetica, Arial, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },
  dark: {
    base: "dark",
    fg: "#ece7de",
    muted: "#9d9488",
    bg: "#12110f",
    surface: "#1b1917",
    "surface-raised": "#232019",
    grid: "#3a352f",
    border: "#3a352f",
    accent: "#199e70",
    "token-request": "#3987e5",
    "token-response": "#199e70",
    "token-change": "#d95926",
    sans: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Inter, Helvetica, Arial, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },
};

/** What every figure module exports as default. */
export interface NotesFigure {
  /** Accessible description; becomes aria-label on the SVG. */
  alt: string;
  viewBox: string;
  children: ReactNode;
}

export const define = (f: NotesFigure) => f;
