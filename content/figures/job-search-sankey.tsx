/* @jsxRuntime automatic @jsxImportSource react */
import type { ReactNode } from "react";
import { define } from "./_shared";

// Sankey of my job search, 2026-07-24 to 2026-10-21, from my own tracker.
// Band thickness is proportional to the count (k units per lead). Colours come
// from the theme through var(--uipack-*), which uipack/static resolves per mode:
// blue for routes I started, green for routes a recruiter started.

type Src = "cold" | "ref" | "inh" | "agy";
type Mid = "proc" | "wait" | "rej" | "none" | "decl";
type Out = "offer" | "pend" | "lost" | "quiet";

const SOURCES: { id: Src; n: number; label: string; short: string[] }[] = [
  { id: "cold", n: 37, label: "cold applications", short: ["cold", "applications"] },
  { id: "ref", n: 2, label: "referrals", short: ["referrals"] },
  { id: "inh", n: 19, label: "in-house recruiters", short: ["in-house", "recruiters"] },
  { id: "agy", n: 51, label: "agency recruiters", short: ["agency", "recruiters"] },
];
const MIDS: { id: Mid; n: number; label: string; short: string[] }[] = [
  { id: "proc", n: 25, label: "reached a hiring process", short: ["reached", "a process"] },
  { id: "wait", n: 4, label: "still waiting", short: ["waiting"] },
  { id: "rej", n: 2, label: "rejected before a process", short: ["rejected early"] },
  { id: "none", n: 38, label: "no reply", short: ["no reply"] },
  { id: "decl", n: 40, label: "declined by me", short: ["declined by me"] },
];
const OUTS: { id: Out; n: number; label: string; short: string[] }[] = [
  { id: "offer", n: 6, label: "offers", short: ["offers"] },
  { id: "pend", n: 4, label: "still interviewing", short: ["still", "interviewing"] },
  { id: "lost", n: 7, label: "rejected in a round", short: ["rejected", "in a round"] },
  { id: "quiet", n: 8, label: "went quiet or I stopped", short: ["went quiet", "or I stopped"] },
];

// Source -> first outcome, in the order bands leave each source node.
const L1: [Src, Mid, number][] = [
  ["cold", "proc", 4], ["cold", "wait", 4], ["cold", "rej", 1], ["cold", "none", 28],
  ["ref", "none", 2],
  ["inh", "proc", 11], ["inh", "decl", 8],
  ["agy", "proc", 10], ["agy", "rej", 1], ["agy", "none", 8], ["agy", "decl", 32],
];
// Inside a process -> result, split by where the lead started so the colour carries through.
const L2: [Src, Out, number][] = [
  ["inh", "offer", 3], ["agy", "offer", 3],
  ["cold", "pend", 3], ["agy", "pend", 1],
  ["inh", "lost", 5], ["agy", "lost", 2],
  ["cold", "quiet", 1], ["inh", "quiet", 3], ["agy", "quiet", 4],
];

const colour = (s: Src) => (s === "cold" || s === "ref" ? "var(--uipack-token-request)" : "var(--uipack-token-response)");

interface Layout {
  k: number; gap: number; top: number; bar: number;
  xs: [number, number, number];
  midTop: number; leftTop: number; rightTop: number;
}

const stack = <T extends { id: string; n: number }>(items: T[], top: number, k: number, gap: number) => {
  const pos = new Map<string, { y0: number; y1: number }>();
  let y = top;
  for (const it of items) {
    pos.set(it.id, { y0: y, y1: y + it.n * k });
    y += it.n * k + gap;
  }
  return pos;
};

const band = (x0: number, a0: number, a1: number, x1: number, b0: number, b1: number) => {
  const xm = (x0 + x1) / 2;
  return `M${x0},${a0} C${xm},${a0} ${xm},${b0} ${x1},${b0} L${x1},${b1} C${xm},${b1} ${xm},${a1} ${x0},${a1} Z`;
};

const halo = { stroke: "var(--uipack-bg)", strokeWidth: 4, paintOrder: "stroke", strokeLinejoin: "round" } as const;

function sankey(L: Layout, labels: "wide" | "narrow"): ReactNode {
  const { k, gap, bar, xs } = L;
  const left = stack(SOURCES, L.leftTop, k, gap);
  const mid = stack(MIDS, L.midTop, k, gap);
  const right = stack(OUTS, L.rightTop, k, gap);

  // Running offsets for band ends on each node.
  const outOff = new Map<string, number>();
  const inOff = new Map<string, number>();
  const take = (m: Map<string, number>, key: string, start: number, h: number) => {
    const y = m.get(key) ?? start;
    m.set(key, y + h);
    return y;
  };

  const bands: ReactNode[] = [];
  L1.forEach(([s, m, n], i) => {
    const h = n * k;
    const a = take(outOff, `L:${s}`, left.get(s)!.y0, h);
    const b = take(inOff, `M:${m}`, mid.get(m)!.y0, h);
    bands.push(<path key={`a${i}`} d={band(xs[0] + bar, a, a + h, xs[1], b, b + h)} fill={colour(s)} fillOpacity={0.3} />);
  });
  L2.forEach(([s, o, n], i) => {
    const h = n * k;
    const a = take(outOff, "M:proc", mid.get("proc")!.y0, h);
    const b = take(inOff, `R:${o}`, right.get(o)!.y0, h);
    bands.push(<path key={`b${i}`} d={band(xs[1] + bar, a, a + h, xs[2], b, b + h)} fill={colour(s)} fillOpacity={o === "offer" ? 0.55 : 0.3} />);
  });

  const nodes: ReactNode[] = [];
  const nodeRect = (key: string, x: number, p: { y0: number; y1: number }, fill: string) =>
    nodes.push(<rect key={key} x={x} y={p.y0} width={bar} height={Math.max(p.y1 - p.y0, 2)} rx={2} fill={fill} />);
  SOURCES.forEach((s) => nodeRect(`ln${s.id}`, xs[0], left.get(s.id)!, colour(s.id)));
  MIDS.forEach((m) => nodeRect(`mn${m.id}`, xs[1], mid.get(m.id)!, m.id === "proc" ? "var(--uipack-accent)" : "var(--uipack-muted)"));
  OUTS.forEach((o) => nodeRect(`rn${o.id}`, xs[2], right.get(o.id)!, o.id === "offer" ? "var(--uipack-accent)" : "var(--uipack-muted)"));

  const text: ReactNode[] = [];
  const cy = (p: { y0: number; y1: number }) => (p.y0 + p.y1) / 2;
  const T = (key: string, x: number, y: number, n: number, words: string[], opts: { anchor?: "start" | "end"; size: number; big?: number; accent?: boolean }) => {
    const lh = opts.size + 3;
    const y0 = y - ((words.length - 1) * lh) / 2 + opts.size * 0.35;
    text.push(
      <text key={key} x={x} y={y0} fontSize={opts.size} textAnchor={opts.anchor ?? "start"} fill={opts.accent ? "var(--uipack-accent)" : "currentColor"} {...halo}>
        {words.map((w, i) => (
          <tspan key={i} x={x} dy={i === 0 ? 0 : lh}>
            {i === 0 ? <tspan fontWeight={700} fontSize={opts.big ?? opts.size}>{n}</tspan> : null}
            {i === 0 ? <tspan dx={Math.round(opts.size * 0.3)}>{w}</tspan> : w}
          </tspan>
        ))}
      </text>,
    );
  };

  if (labels === "wide") {
    SOURCES.forEach((s) => T(`lt${s.id}`, xs[0] - 12, cy(left.get(s.id)!), s.n, [s.label], { anchor: "end", size: 15 }));
    MIDS.forEach((m) => T(`mt${m.id}`, xs[1] + bar + 10, cy(mid.get(m.id)!), m.n, [m.label], { size: 15, accent: m.id === "proc" }));
    OUTS.forEach((o) =>
      o.id === "offer"
        ? T(`rt${o.id}`, xs[2] + bar + 12, cy(right.get(o.id)!), o.n, [o.label], { size: 22, big: 30, accent: true })
        : T(`rt${o.id}`, xs[2] + bar + 12, cy(right.get(o.id)!), o.n, [o.label], { size: 15 }),
    );
  } else {
    SOURCES.forEach((s) => T(`lt${s.id}`, xs[0] + bar + 6, cy(left.get(s.id)!), s.n, s.short, { size: 14 }));
    MIDS.forEach((m) => T(`mt${m.id}`, xs[1] + bar + 6, cy(mid.get(m.id)!), m.n, m.short, { size: 14, accent: m.id === "proc" }));
    OUTS.forEach((o) =>
      o.id === "offer"
        ? T(`rt${o.id}`, xs[2] + bar + 8, cy(right.get(o.id)!), o.n, o.short, { size: 18, big: 26, accent: true })
        : T(`rt${o.id}`, xs[2] + bar + 8, cy(right.get(o.id)!), o.n, o.short, { size: 14 }),
    );
  }

  return (
    <>
      {bands}
      {nodes}
      {text}
    </>
  );
}

const head = (x: number, y: number, t: string, size: number, anchor: "start" | "middle" | "end" = "start") => (
  <text x={x} y={y} fontSize={size} textAnchor={anchor} fontFamily="var(--uipack-mono)" letterSpacing=".08em" fill="currentColor" fillOpacity={0.7}>
    {t}
  </text>
);

// Desktop: k = 5px per lead. Middle column is the tallest: 109*5 + 4*20 = 625.
const D: Layout = { k: 5, gap: 20, top: 56, bar: 12, xs: [232, 512, 792], midTop: 56, leftTop: 66, rightTop: 56 };
// Mobile: k = 6px per lead, 109*6 + 4*16 = 718.
const M: Layout = { k: 6, gap: 16, top: 48, bar: 8, xs: [12, 172, 300], midTop: 48, leftTop: 58, rightTop: 48 };

const ALT =
  "A Sankey diagram of 109 job-search leads, band widths proportional to counts. Sources: 37 cold applications, 2 referrals, 19 in-house recruiter reach-outs and 51 agency recruiter reach-outs. First outcome: 25 reached a hiring process (4 from cold applications, 11 from in-house recruiters, 10 from agencies), 4 are still waiting, 2 were rejected before a process, 38 got no reply and 40 I declined. Inside a hiring process: 6 offers (3 from in-house recruiters, 3 from agencies, none from applications), 4 still interviewing, 7 rejected in a round, and 8 went quiet or I stopped.";

export default define({
  alt: ALT,
  viewBox: "0 0 1080 712",
  children: (
    <>
      {head(D.xs[0] + D.bar, 32, "WHERE IT STARTED", 13, "end")}
      {head(D.xs[1], 32, "FIRST OUTCOME", 13)}
      {head(D.xs[2], 32, "INSIDE A PROCESS", 13)}
      {sankey(D, "wide")}
    </>
  ),
  mobile: {
    alt: ALT,
    viewBox: "0 0 440 784",
    children: (
      <>
        {head(M.xs[0], 30, "START", 14)}
        {head(M.xs[1], 30, "FIRST", 14)}
        {head(M.xs[2], 30, "RESULT", 14)}
        {sankey(M, "narrow")}
      </>
    ),
  },
});
