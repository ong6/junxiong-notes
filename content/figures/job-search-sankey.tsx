/* @jsxRuntime automatic @jsxImportSource react */
import type { ReactNode } from "react";
import { define } from "./_shared";

// Sankey of my job search, 2026-07-24 to 2026-10-21, from my own tracker.
//
// Five levels, left to right: all leads -> who started it -> route -> first outcome -> result
// inside a hiring process. Band thickness is proportional to the count.
//
// Colour does one job, origin: recruiter-started leads in the response token, my own
// applications in the request token, carried through every band. Node bars add state:
// grey for dead ends, the change token for failed rounds, the accent for offers.
// Every colour is a var(--uipack-*) token that uipack/static resolves per theme.
// Labels never sit on a band: intermediate nodes are labelled in the gap above their bar,
// terminal nodes to the right of it, where no band runs.

type Origin = "rec" | "app";
type Tone = "ink" | "rec" | "app" | "dead" | "fail" | "offer" | "open";
type Place = "above" | "right";

interface N {
  id: string;
  col: number;
  n: number;
  wide: string;
  narrow: string[];
  tone: Tone;
  place: Place;
}

// Column order is chosen to cut crossings: the recruiter routes sit on top, so "reached a
// process" lines up with them, and dead ends fall to the bottom.
const NODES: N[] = [
  { id: "all", col: 0, n: 109, wide: "leads", narrow: ["leads"], tone: "ink", place: "above" },
  { id: "rec", col: 1, n: 70, wide: "recruiter started", narrow: ["recruiter"], tone: "rec", place: "above" },
  { id: "app", col: 1, n: 39, wide: "I applied", narrow: ["I applied"], tone: "app", place: "above" },
  { id: "inh", col: 2, n: 19, wide: "in-house", narrow: ["in-house"], tone: "rec", place: "above" },
  { id: "agy", col: 2, n: 51, wide: "agency", narrow: ["agency"], tone: "rec", place: "above" },
  { id: "cold", col: 2, n: 37, wide: "cold", narrow: ["cold"], tone: "app", place: "above" },
  { id: "ref", col: 2, n: 2, wide: "referred", narrow: ["referred"], tone: "app", place: "above" },
  { id: "proc", col: 3, n: 25, wide: "reached a hiring process", narrow: ["in a process"], tone: "ink", place: "above" },
  { id: "decl", col: 3, n: 40, wide: "declined by me", narrow: ["declined"], tone: "dead", place: "right" },
  { id: "none", col: 3, n: 38, wide: "no reply", narrow: ["no reply"], tone: "dead", place: "right" },
  { id: "cvno", col: 3, n: 2, wide: "resume rejected", narrow: ["resume", "rejected"], tone: "fail", place: "right" },
  { id: "wait", col: 3, n: 4, wide: "still waiting", narrow: ["waiting"], tone: "open", place: "right" },
  { id: "offer", col: 4, n: 7, wide: "offers", narrow: ["offers"], tone: "offer", place: "right" },
  { id: "tech", col: 4, n: 3, wide: "failed a technical round", narrow: ["failed", "technical"], tone: "fail", place: "right" },
  { id: "hr", col: 4, n: 3, wide: "failed HR or behavioural", narrow: ["failed HR or", "behavioural"], tone: "fail", place: "right" },
  { id: "unk", col: 4, n: 1, wide: "rejected, stage not recorded", narrow: ["rejected,", "stage unknown"], tone: "fail", place: "right" },
  { id: "quiet", col: 4, n: 7, wide: "went quiet or I withdrew", narrow: ["quiet or", "withdrew"], tone: "dead", place: "right" },
  { id: "intv", col: 4, n: 4, wide: "still interviewing", narrow: ["still", "interviewing"], tone: "open", place: "right" },
];

// [from, to, count, origin]
const LINKS: [string, string, number, Origin][] = [
  ["all", "rec", 70, "rec"], ["all", "app", 39, "app"],
  ["rec", "inh", 19, "rec"], ["rec", "agy", 51, "rec"],
  ["app", "cold", 37, "app"], ["app", "ref", 2, "app"],
  ["inh", "proc", 11, "rec"], ["inh", "decl", 8, "rec"],
  ["agy", "proc", 10, "rec"], ["agy", "decl", 32, "rec"], ["agy", "none", 8, "rec"], ["agy", "cvno", 1, "rec"],
  ["cold", "proc", 4, "app"], ["cold", "none", 28, "app"], ["cold", "cvno", 1, "app"], ["cold", "wait", 4, "app"],
  ["ref", "none", 2, "app"],
  ["proc", "offer", 7, "rec"],
  ["proc", "tech", 3, "rec"],
  ["proc", "hr", 3, "rec"],
  ["proc", "unk", 1, "rec"],
  ["proc", "quiet", 6, "rec"], ["proc", "quiet", 1, "app"],
  ["proc", "intv", 1, "rec"], ["proc", "intv", 3, "app"],
];

const TOKEN = {
  rec: "var(--uipack-token-response)",
  app: "var(--uipack-token-request)",
  ink: "currentColor",
  dead: "var(--uipack-muted)",
  open: "var(--uipack-muted)",
  fail: "var(--uipack-token-change)",
  offer: "var(--uipack-accent)",
} as const;

export interface Spec {
  xs: number[];
  top: number;
  k: number;
  gaps: number[];
  bar: number;
  size: number;
  offerSize: number;
  narrow: boolean;
  /** First column drawn; mobile starts at the route column and labels it on the left. */
  fromCol: number;
  /** Extra space under "reached a process", so the result bands clear the dead-end labels. */
  procGap: number;
}

export interface Rect { x: number; y: number; w: number; h: number; id: string }
export interface Band { x0: number; a0: number; a1: number; x1: number; b0: number; b1: number; origin: Origin }

const ORDER = Object.fromEntries(NODES.map((n, i) => [n.id, i]));
const OWEIGHT: Record<Origin, number> = { rec: 0, app: 1 };

const bez = (p0: number, p1: number, p2: number, p3: number, t: number) =>
  (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3;
/** The band's top and bottom edge at x (the bands are cubic, so solve for t first). */
export function bandAt(b: Band, x: number): [number, number] {
  const xm = (b.x0 + b.x1) / 2;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 30; i++) {
    const m = (lo + hi) / 2;
    if (bez(b.x0, xm, xm, b.x1, m) < x) lo = m;
    else hi = m;
  }
  const t = (lo + hi) / 2;
  return [bez(b.a0, b.a0, b.b0, b.b0, t), bez(b.a1, b.a1, b.b1, b.b1, t)];
}

export function layout(s: Spec) {
  const nodes = NODES.filter((n) => n.col >= s.fromCol);
  const keep = new Set(nodes.map((n) => n.id));
  const links = LINKS.filter((l) => keep.has(l[0]) && keep.has(l[1]));
  const pos = new Map<string, { x: number; y0: number; y1: number }>();
  const cols = [0, 1, 2, 3, 4].map((c) => nodes.filter((n) => n.col === c));
  cols.forEach((col, c) => {
    let y = s.top;
    for (const n of col) {
      pos.set(n.id, { x: s.xs[c], y0: y, y1: y + n.n * s.k });
      y += n.n * s.k + s.gaps[c] + (n.id === "proc" ? s.procGap : 0);
    }
  });
  // Band ends: leave a node in target order, enter a node in source order; ties by origin.
  const outs = [...links].sort((p, q) => ORDER[p[0]] - ORDER[q[0]] || ORDER[p[1]] - ORDER[q[1]] || OWEIGHT[p[3]] - OWEIGHT[q[3]]);
  const ins = [...links].sort((p, q) => ORDER[p[1]] - ORDER[q[1]] || ORDER[p[0]] - ORDER[q[0]] || OWEIGHT[p[3]] - OWEIGHT[q[3]]);
  const outY = new Map<string, number>();
  const inY = new Map<string, number>();
  const ends = new Map<(typeof LINKS)[number], { a: number; b: number }>();
  for (const l of outs) {
    const y = outY.get(l[0]) ?? pos.get(l[0])!.y0;
    outY.set(l[0], y + l[2] * s.k);
    ends.set(l, { a: y, b: 0 });
  }
  for (const l of ins) {
    const y = inY.get(l[1]) ?? pos.get(l[1])!.y0;
    inY.set(l[1], y + l[2] * s.k);
    ends.get(l)!.b = y;
  }
  const bands: Band[] = links.map((l) => {
    const e = ends.get(l)!;
    const h = l[2] * s.k;
    return { x0: pos.get(l[0])!.x + s.bar, a0: e.a, a1: e.a + h, x1: pos.get(l[1])!.x, b0: e.b, b1: e.b + h, origin: l[3] };
  });

  // Labels: "N name" on one line (wide) or a short stack (narrow). Text never sits on a band:
  // terminal nodes are labelled to the right of their bar, where no band runs; every other
  // node tries the gap above its bar, then the space below it, left- or right-aligned, and
  // takes the first spot that clears every band, bar and earlier label. Widths are estimates
  // (0.55 em per character), padded so the real text has room.
  const placed: { x: number; y: number; w: number; h: number }[] = [];
  const hit = (r: { x: number; y: number; w: number; h: number }) => {
    const pad = 3;
    const R = { x0: r.x - pad, x1: r.x + r.w + pad, y0: r.y - pad, y1: r.y + r.h + pad };
    for (const b of bands) {
      for (let x = Math.max(R.x0, b.x0); x <= Math.min(R.x1, b.x1); x += 2) {
        const [t, u] = bandAt(b, x);
        if (u > R.y0 && t < R.y1) return true;
      }
    }
    for (const q of pos.values()) if (q.x < R.x1 && q.x + s.bar > R.x0 && q.y1 > R.y0 && q.y0 < R.y1) return true;
    for (const q of placed) if (q.x < R.x1 && q.x + q.w > R.x0 && q.y < R.y1 && q.y + q.h > R.y0) return true;
    return false;
  };
  const labels = nodes.map((n) => {
    const p = pos.get(n.id)!;
    const big = n.id === "offer";
    const fs = big ? s.offerSize : s.size;
    const lines = s.narrow ? n.narrow : [n.wide];
    const lh = Math.round(fs * 1.2);
    const numW = String(n.n).length * fs * 0.62 + fs * 0.3;
    const w = Math.max(...lines.map((t, i) => (i === 0 ? numW : 0) + t.length * fs * 0.55));
    const h = lines.length * lh;
    let spot = { x: p.x + s.bar + 8, y: (p.y0 + p.y1) / 2 - h / 2, w, h };
    let clear = true;
    if (n.col === s.fromCol && s.fromCol > 0) {
      spot = { x: p.x - 8 - w, y: (p.y0 + p.y1) / 2 - h / 2, w, h };
    } else if (n.place === "above") {
      const cands = [
        { x: p.x, y: p.y0 - 8 - h },
        { x: p.x + s.bar - w, y: p.y0 - 8 - h },
        { x: p.x, y: p.y1 + 8 },
        { x: p.x + s.bar - w, y: p.y1 + 8 },
      ].map((c) => ({ ...c, w, h }));
      const ok = cands.find((c) => !hit(c));
      clear = !!ok;
      spot = ok ?? cands[0];
    }
    placed.push(spot);
    return { node: n, x: spot.x, y: spot.y, w, h, fs, lh, lines, big, clear };
  });
  return { pos, bands, labels, nodes };
}

const bandPath = (b: Band) => {
  const xm = (b.x0 + b.x1) / 2;
  return `M${b.x0},${b.a0} C${xm},${b.a0} ${xm},${b.b0} ${b.x1},${b.b0} L${b.x1},${b.b1} C${xm},${b.b1} ${xm},${b.a1} ${b.x0},${b.a1} Z`;
};

function sankey(s: Spec, heads: string[]): ReactNode {
  const { pos, bands, labels, nodes } = layout(s);
  return (
    <>
      {heads.map((t, c) => t && (
        <text key={`h${c}`} x={c === s.fromCol && c > 0 ? 12 : s.xs[c]} y={s.narrow ? 28 : 24} fontSize={s.narrow ? 14 : 12} fontFamily="var(--uipack-mono)" letterSpacing=".08em" fill="var(--uipack-muted)">
          {t}
        </text>
      ))}
      {s.fromCol > 1 ? (
        // The "who started it" level has no column on a phone, so its split is a key instead.
        <g>
          <rect x={12} y={50} width={12} height={12} rx={2} fill={TOKEN.rec} />
          <text x={30} y={61} fontSize={14} fill="currentColor"><tspan fontWeight={700}>70</tspan> recruiter started</text>
          <rect x={232} y={50} width={12} height={12} rx={2} fill={TOKEN.app} />
          <text x={250} y={61} fontSize={14} fill="currentColor"><tspan fontWeight={700}>39</tspan> I applied</text>
        </g>
      ) : null}
      {bands.map((b, i) => (
        <path key={`b${i}`} d={bandPath(b)} fill={TOKEN[b.origin]} fillOpacity={0.36} stroke="var(--uipack-bg)" strokeWidth={1} />
      ))}
      {nodes.map((n) => {
        const p = pos.get(n.id)!;
        const w = n.id === "offer" ? s.bar + 4 : s.bar;
        return <rect key={`n${n.id}`} x={p.x} y={p.y0} width={w} height={Math.max(p.y1 - p.y0, 3)} rx={2} fill={TOKEN[n.tone]} />;
      })}
      {labels.map((l) => (
        <text key={`t${l.node.id}`} x={l.x} y={l.y + l.fs * 0.95} fontSize={l.fs} fill="currentColor">
          {l.lines.map((t, i) => (
            <tspan key={i} x={l.x} dy={i === 0 ? 0 : l.lh}>
              {i === 0 ? (
                <>
                  <tspan fontWeight={700}>{l.node.n}</tspan>
                  <tspan dx={Math.round(l.fs * 0.3)} fillOpacity={l.big ? 1 : 0.85}>{t}</tspan>
                </>
              ) : (
                <tspan fillOpacity={0.85}>{t}</tspan>
              )}
            </tspan>
          ))}
        </text>
      ))}
    </>
  );
}

// Desktop: 5 px per lead. Columns with labels above their bars get 40 px gaps for the label.
export const DESKTOP: Spec = { xs: [40, 232, 424, 616, 824], top: 72, k: 5, gaps: [0, 40, 40, 16, 22], bar: 6, size: 14, offerSize: 26, narrow: false, fromCol: 0, procGap: 0 };
// Mobile: the "all leads" column is dropped (its total is in the header) to make room.
export const MOBILE: Spec = { xs: [0, 0, 104, 220, 314], top: 112, k: 5, gaps: [0, 0, 24, 16, 30], bar: 5, size: 14, offerSize: 24, narrow: true, fromCol: 2, procGap: 90 };

const ALT =
  "A Sankey diagram of all 109 leads in my job search, band widths proportional to counts. A recruiter reached out for 70 (19 in-house, 51 through agencies); I applied for 39 (37 cold, 2 with a referral). First outcome: 25 reached a hiring process (11 in-house, 10 agency, 4 cold), 40 I declined, 38 got no reply, 2 were resume rejections and 4 are still waiting. Inside a hiring process: 7 offers, all from recruiter-started leads; 3 failed a technical round; 3 failed a behavioural, HR or recruiter-screen round; 1 was rejected at a stage I did not record; 7 went quiet or I withdrew; 4 are still interviewing.";

export default define({
  alt: ALT,
  viewBox: "0 0 1080 780",
  children: sankey(DESKTOP, ["ALL LEADS", "WHO STARTED IT", "ROUTE", "FIRST OUTCOME", "INSIDE A PROCESS"]),
  mobile: {
    alt: ALT,
    viewBox: "0 0 440 840",
    children: sankey(MOBILE, ["", "", "ROUTE", "FIRST", "RESULT"]),
  },
});
