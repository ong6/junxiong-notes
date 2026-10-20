/* @jsxRuntime automatic @jsxImportSource react */
import { Badge, Connector, Defs, Group, Node, Packet } from "uipack";
import type { ReactNode } from "react";
import { define } from "./_shared";

// A Swiss-cheese stack. Each lane is one defect (orange = change, the code
// carrying a bug). Six walls filter in sequence; each wall stops one lane and
// has holes where the others pass. One lane finds a hole in every wall and
// reaches rollback, the accent. Layer 7 checks the reviewer (a loop onto the
// AI review wall), and layer 8 limits actions, so it is the frame round the
// whole flow. Lane counts are illustrative: Anthropic publishes no per-layer
// catch rates. The only numbers drawn are the two it does publish.

type Layer = { n: string; name: [string, string?]; sub: [string, string?] };
const layers: Layer[] = [
  { n: "1", name: ["Self-check"], sub: ["won't build", "or run"] },
  { n: "2", name: ["Deterministic", "CI"], sub: ["lint · types", "tests"] },
  { n: "3", name: ["AI review"], sub: ["logic bugs", "tests missed"] },
  { n: "4", name: ["Security", "review"], sub: ["vulnerabilities"] },
  { n: "5", name: ["Human, by", "risk tier"], sub: ["intent ·", "risky paths"] },
  { n: "6", name: ["Queue, flags,", "rollout"], sub: ["conflicts ·", "regressions"] },
];

// Wall (1-based) at which each lane, top to bottom, is stopped; 0 slips through.
const stops = [2, 5, 1, 0, 3, 6, 4];

const Txt = ({ x, y, size, children, mono, bold, anchor = "middle", muted, accent }: {
  x: number; y: number; size: number; children: ReactNode; mono?: boolean; bold?: boolean;
  anchor?: "start" | "middle" | "end"; muted?: boolean; accent?: boolean;
}) => (
  <text
    x={x}
    y={y}
    fontSize={size}
    fontFamily={mono ? "var(--uipack-mono)" : "var(--uipack-sans)"}
    fontWeight={bold ? 600 : 400}
    textAnchor={anchor}
    fill={accent ? "var(--uipack-accent)" : "currentColor"}
    fillOpacity={muted ? 0.72 : 1}
  >
    {children}
  </text>
);

/** A wall as solid slabs with a hole wherever a lane passes. Axis "v" for desktop, "h" for phone. */
const Wall = ({ at, from, to, holes, axis, t = 12, gap = 10 }: {
  at: number; from: number; to: number; holes: number[]; axis: "v" | "h"; t?: number; gap?: number;
}) => {
  const cuts = [...holes].sort((a, b) => a - b);
  const segs: [number, number][] = [];
  let s = from;
  for (const c of cuts) {
    segs.push([s, c - gap]);
    s = c + gap;
  }
  segs.push([s, to]);
  return (
    <g>
      {segs.map(([a, b]) =>
        axis === "v" ? (
          <rect key={a} x={at - t / 2} y={a} width={t} height={b - a} rx={2} fill="var(--uipack-surface-raised)" stroke="currentColor" strokeOpacity={0.55} strokeWidth={1.25} />
        ) : (
          <rect key={a} x={a} y={at - t / 2} width={b - a} height={t} rx={2} fill="var(--uipack-surface-raised)" stroke="currentColor" strokeOpacity={0.55} strokeWidth={1.25} />
        ),
      )}
    </g>
  );
};

/**
 * A caught defect resting against a wall, and a plain arrowhead. Drawn here
 * rather than with the shared currentColor marker: the light and dark SVGs
 * share marker ids on the page, so a currentColor head would render in the
 * light ink on the dark page.
 */
const Caught = ({ x, y, r = 5 }: { x: number; y: number; r?: number }) => (
  <path d={`M${x},${y - r} L${x + r},${y} L${x},${y + r} L${x - r},${y} z`} fill="var(--uipack-token-change)" fillOpacity={0.55} />
);
const Head = ({ x, y, dir }: { x: number; y: number; dir: "up" | "left" }) => (
  <path d={dir === "up" ? `M${x - 4},${y + 8} L${x},${y} L${x + 4},${y + 8} z` : `M${x + 8},${y - 4} L${x},${y} L${x + 8},${y + 4} z`} fill="currentColor" />
);

const alt =
  "Defects in agent-written code enter on the left as seven packets and pass through six walls in order: the agent's self-check, deterministic CI, multi-agent AI review, security review, human approval by risk tier, and the merge queue with flags and staged rollout. Each wall has holes, and each stops one defect, so the count falls from seven to one; the counts are illustrative, not measured. Anthropic estimates the AI review would have caught about a third of past incident bugs. A seventh layer, a daily eval of past incidents, checks the AI reviewer itself. The one defect that slips through every wall reaches rollback, where a flag is switched off without a deploy. An eighth layer, containment, frames the whole flow: sandboxes and narrow identities limit what any agent can do. In the Claude Code repository from June to September 2026, merged pull requests more than doubled while the reverted share fell by more than 40%.";

/* ---------- desktop: left to right, 1120 wide ---------- */
const wx = [248, 368, 488, 608, 728, 848];
const lanes = stops.map((_, i) => 216 + i * 40);
const W_TOP = 184;
const W_BOT = 488;
const MID = lanes[3];
const IN_X = 176; // entry node right edge
const RB_X = 912; // rollback node left edge
const SPEED = 150; // user units per second, so every packet moves at one pace

const laneEnd = (stop: number) => (stop === 0 ? RB_X : wx[stop - 1] - 6);
// Packets on the slip lane and three stopped lanes; the rest stay still.
const moving = new Set([0, 1, 5]);

const desktop = (
  <>
    <Defs id="vs" />
    <Group titleSize={13} x={16} y={16} w={1088} h={608} title="8 · Containment: sandboxed VMs, narrow identities, on every tool call" variant="dashed">
      {layers.map((l, i) => (
        <g key={l.n}>
          <Badge cx={wx[i]} cy={64} text={l.n} r={12} size={14} />
          <Txt x={wx[i]} y={100} size={16} bold>{l.name[0]}</Txt>
          {l.name[1] ? <Txt x={wx[i]} y={120} size={16} bold>{l.name[1]}</Txt> : null}
          <Txt x={wx[i]} y={l.name[1] ? 144 : 124} size={14} mono muted>{l.sub[0]}</Txt>
          {l.sub[1] ? <Txt x={wx[i]} y={l.name[1] ? 162 : 142} size={14} mono muted>{l.sub[1]}</Txt> : null}
        </g>
      ))}

      <Node x={48} y={W_TOP} w={128} h={W_BOT - W_TOP} label="Defects" sub="in agent code" size={17} subSize={14} align="center" dashed />

      {stops.map((stop, i) => {
        const y = lanes[i];
        const pts: [number, number][] = [[IN_X, y], [laneEnd(stop), y]];
        const slip = stop === 0;
        const len = laneEnd(stop) - IN_X;
        return (
          <g key={i}>
            <Connector points={pts} defs="vs" kind={slip ? "change" : undefined} arrow={slip} flow={slip ? "slip" : undefined} />
            {slip ? null : <Caught x={laneEnd(stop) - 9} y={y} />}
            {slip ? (
              <>
                <Packet points={pts} kind="change" dur={len / SPEED} r={5} flow="slip" />
                <Packet points={pts} kind="change" dur={len / SPEED} delay={-len / SPEED / 2} r={5} flow="slip" />
              </>
            ) : moving.has(i) ? (
              <Packet points={pts} kind="change" dur={len / SPEED} delay={-i * 0.7} r={5} />
            ) : null}
          </g>
        );
      })}

      {wx.map((x, k) => (
        <Wall key={x} at={x} from={W_TOP} to={W_BOT} axis="v" holes={lanes.filter((_, i) => stops[i] === 0 || stops[i] > k + 1)} t={16} gap={9} />
      ))}

      <Node x={RB_X} y={MID - 32} w={168} h={64} label="Rollback" sub="flag off, no deploy" size={17} subSize={14} align="center" accent flow="slip" />
      <Txt x={RB_X} y={400} size={15} anchor="start" bold>Merged PRs 2x+,</Txt>
      <Txt x={RB_X} y={420} size={15} anchor="start" bold>reverted share −40%+</Txt>
      <Txt x={RB_X} y={444} size={14} anchor="start" mono muted>Claude Code repo</Txt>
      <Txt x={RB_X} y={462} size={14} anchor="start" mono muted>Jun–Sep 2026</Txt>

      {/* layer 7: the reviewer is itself under test, a loop onto wall 3 */}
      <Txt x={476} y={520} size={14} anchor="end" mono accent>≈ a third of past incident bugs</Txt>
      <Connector points={[[528, 568], [488, 568], [488, W_BOT + 12]]} arrow={false} dashed />
      <Head x={488} y={W_BOT + 4} dir="up" />
      <Node x={528} y={536} w={280} h={64} label="Checks on the reviewer" sub="past incidents, run daily" size={17} subSize={14} icon="chart" dashed />
      <Badge cx={528} cy={536} text="7" r={12} size={14} />
    </Group>
  </>
);

/* ---------- phone: top to bottom, 440 wide ---------- */
const mx = stops.map((_, i) => 40 + i * 24); // lane x
const L = { left: 32, right: 200 }; // lane field
const my = [120, 200, 280, 440, 520, 600]; // wall y; a wider gap after 3 holds layer 7
const M_IN = 96; // entry node bottom
const M_RB = 664; // rollback node top
const mEnd = (stop: number) => (stop === 0 ? M_RB : my[stop - 1] - 6);
const TX = 216; // label column
const mLabels: [string, string][] = [
  ["Self-check", "won't build"],
  ["Deterministic CI", "lint · types · tests"],
  ["AI review", "logic bugs"],
  ["Security review", "vulnerabilities"],
  ["Human, by risk tier", "intent · risky paths"],
  ["Queue · rollout", "regressions"],
];

const mobile = (
  <>
    <Defs id="vsm" />
    <Group titleSize={14} x={8} y={8} w={424} h={768} title="8 · Containment, every tool call" variant="dashed">
      <Node x={L.left} y={40} w={L.right - L.left} h={M_IN - 40} label="Defects" sub="agent code" size={16} subSize={14} align="center" dashed />

      {stops.map((stop, i) => {
        const x = mx[i];
        const pts: [number, number][] = [[x, M_IN], [x, mEnd(stop)]];
        const slip = stop === 0;
        const len = mEnd(stop) - M_IN;
        return (
          <g key={i}>
            <Connector points={pts} defs="vsm" kind={slip ? "change" : undefined} arrow={slip} flow={slip ? "slip" : undefined} />
            {slip ? null : <Caught x={x} y={mEnd(stop) - 5} r={4} />}
            {slip ? (
              <>
                <Packet points={pts} kind="change" dur={len / 120} r={4} flow="slip" />
                <Packet points={pts} kind="change" dur={len / 120} delay={-len / 240} r={4} flow="slip" />
              </>
            ) : moving.has(i) ? (
              <Packet points={pts} kind="change" dur={len / 120} delay={-i * 0.7} r={4} />
            ) : null}
          </g>
        );
      })}

      {my.map((y, k) => (
        <Wall key={y} at={y} from={20} to={204} axis="h" t={10} gap={7} holes={mx.filter((_, i) => stops[i] === 0 || stops[i] > k + 1)} />
      ))}

      {mLabels.map(([name, sub], i) => (
        <g key={name}>
          <Badge cx={TX + 12} cy={my[i] - 14} text={String(i + 1)} r={11} size={14} />
          <Txt x={TX + 32} y={my[i] - 9} size={16} anchor="start" bold>{name}</Txt>
          <Txt x={TX + 32} y={my[i] + 13} size={14} anchor="start" mono muted>{sub}</Txt>
        </g>
      ))}
      <Txt x={TX + 32} y={my[2] + 33} size={14} anchor="start" mono accent>≈ ⅓ of incident bugs</Txt>

      {/* layer 7 loops back onto wall 3 */}
      <Connector points={[[248, 376], [224, 376], [224, my[2]], [216, my[2]]]} arrow={false} dashed />
      <Head x={208} y={my[2]} dir="left" />
      <Node x={248} y={344} w={176} h={64} label="Reviewer checks" sub="incidents, daily" size={16} subSize={14} align="center" dashed />
      <Badge cx={248} cy={344} text="7" r={11} size={14} />

      <Node x={L.left} y={M_RB} w={L.right - L.left} h={56} label="Rollback" sub="flag off" size={16} subSize={14} align="center" accent flow="slip" />
      <Txt x={TX + 8} y={M_RB + 18} size={14} anchor="start" bold>Merged PRs 2x+,</Txt>
      <Txt x={TX + 8} y={M_RB + 38} size={14} anchor="start" bold>reverts −40%+</Txt>
      <Txt x={TX + 8} y={M_RB + 60} size={14} anchor="start" mono muted>Claude Code repo</Txt>
      <Txt x={TX + 8} y={M_RB + 78} size={14} anchor="start" mono muted>Jun–Sep 2026</Txt>
    </Group>
  </>
);

export default define({
  alt,
  viewBox: "0 0 1120 640",
  children: desktop,
  mobile: { alt, viewBox: "0 0 440 784", children: mobile },
});
