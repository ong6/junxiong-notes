/* @jsxRuntime automatic @jsxImportSource react */
// The blog's diagram theme and shared helpers for the uipack figures under
// content/figures/. Colours mirror app/globals.css and the chart palette in
// scripts/render-diagrams.mjs, so diagrams and charts read as one set.
import type { ReactNode } from "react";
import { Connector, Label, Packet, defineDiagramTheme, useFontFloor, type ConnectorKind } from "uipack";

const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Inter, Helvetica, Arial, sans-serif";

// The blog's one diagram theme (STYLE.md, diagram-themes: { default: notes }).
// uipack/static inlines it into each file; the article surface shows through
// (canvas "plain", and the renderer paints no background). Labels are the site
// sans too: the page sets every figure label in it (.fig-diagram text in
// app/globals.css), so the full-size files match what readers see in the article.
export const notes = defineDiagramTheme({
  name: "notes",
  canvas: "plain",
  fonts: { text: SANS, label: SANS },
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

/**
 * One type scale for every figure. Desktop drawings are 1080-1150 units wide in a
 * 960px slot; phone drawings 320-440 wide in a 350px column.
 * - `node`: the default box. `compact`: a box in a dense row or a secondary box.
 * - `label`: connector labels, lane headers, group titles and free text.
 */
export const T = {
  node: { size: 19, subSize: 13 },
  compact: { size: 16, subSize: 13 },
  label: 13,
} as const;

/** The phone scale: every size lands at 11px or more in the 350px column of a 440 viewBox. */
export const TP = {
  node: { size: 16, subSize: 14 },
  label: 14,
} as const;

/**
 * Free text in a figure (a wall's name, a to-scale bar's caption). Floored like
 * uipack's own parts, so it never renders under 11px at the slot width.
 */
export function Text({ x, y, size = T.label, children, mono, bold, anchor = "middle", muted, accent }: {
  x: number;
  y: number;
  size?: number;
  children: ReactNode;
  mono?: boolean;
  bold?: boolean;
  anchor?: "start" | "middle" | "end";
  muted?: boolean;
  accent?: boolean;
}) {
  const fontSize = useFontFloor(size);
  return (
    <text
      x={x}
      y={y}
      fontSize={fontSize}
      fontFamily={mono ? "var(--uipack-mono)" : "var(--uipack-sans)"}
      fontWeight={bold ? 600 : 400}
      textAnchor={anchor}
      fill={accent ? "var(--uipack-accent-ink)" : "currentColor"}
      fillOpacity={muted ? 0.72 : 1}
    >
      {children}
    </text>
  );
}

/**
 * A step that repeats, drawn as a loop over a node's top edge with its label above:
 * decode's per-token pass, the engine's forward pass, an agent's tool calls.
 * `cx` is the loop's centre, `top` the node's top edge.
 */
export function LoopAbove({ defs, cx, top, w = 100, rise = 44, kind = "change", label, size = T.label, dur = 1.8, delay = -0.4 }: {
  defs: string;
  cx: number;
  top: number;
  w?: number;
  rise?: number;
  kind?: ConnectorKind;
  label: string | string[];
  size?: number;
  dur?: number;
  delay?: number;
}) {
  const points: [number, number][] = [[cx + w / 2, top], [cx + w / 2, top - rise], [cx - w / 2, top - rise], [cx - w / 2, top]];
  const lines = Array.isArray(label) ? label : [label];
  const step = size + 5;
  return (
    <>
      <Connector points={points} defs={defs} kind={kind} />
      {lines.map((text, i) => (
        <Label key={text} x={cx} y={top - rise - 12 - (lines.length - 1 - i) * step} text={text} anchor="middle" size={size} />
      ))}
      <Packet points={points} kind={kind} dur={dur} delay={delay} r={4} />
    </>
  );
}
