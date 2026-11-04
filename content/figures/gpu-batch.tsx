/* @jsxRuntime automatic @jsxImportSource react */
import type { ReactNode } from "react";
import { Connector, Defs, Group, Label, Node, Packet } from "uipack";
import { define } from "./_shared";

// One decode step for Llama 3.1 8B on an H100 (numbers from the article's
// roofline arithmetic: 16 GB of BF16 weights, 268 MB of KV per 2,048-token
// sequence, 3.35 TB/s). Top: what the step reads and what it emits. Bottom:
// bytes read per step at batch 1 and batch 64, drawn to scale.

const BLUE = "var(--uipack-token-request)";
const ORANGE = "var(--uipack-token-change)";

const Txt = ({ x, y, size, children, mono, bold, anchor = "start", muted }: {
  x: number; y: number; size: number; children: ReactNode; mono?: boolean; bold?: boolean;
  anchor?: "start" | "middle" | "end"; muted?: boolean;
}) => (
  <text
    x={x}
    y={y}
    fontSize={size}
    fontFamily={mono ? "var(--uipack-mono)" : "var(--uipack-sans)"}
    fontWeight={bold ? 600 : 400}
    textAnchor={anchor}
    fill="currentColor"
    fillOpacity={muted ? 0.72 : 1}
  >
    {children}
  </text>
);

/** A to-scale bar: weights segment then KV segment. */
const Bar = ({ x, y, h, pxPerGB, kvGB }: { x: number; y: number; h: number; pxPerGB: number; kvGB: number }) => {
  const w = 16 * pxPerGB;
  const k = Math.max(kvGB * pxPerGB, 3);
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={3} fill={BLUE} />
      <rect x={x + w + 2} y={y} width={k} height={h} rx={3} fill={ORANGE} />
    </>
  );
};

// ---------- desktop ----------
const kvRows = [168, 216, 264];
const outRows = [148, 196, 244];
const kvPaths = kvRows.map((y): [number, number][] => [[312, y], [432, y], [432, 200], [496, 200]]);
const outPaths = outRows.map((y): [number, number][] => [[728, 176], [784, 176], [784, y], [832, y]]);
const weightsPath: [number, number][] = [[312, 96], [408, 96], [408, 152], [496, 152]];

const PX = 19.3; // px per GB in the desktop bars: 33.2 GB → 640px

const desktop = (
  <>
    <Defs id="gb" />
    <Group titleSize={13} x={24} y={24} w={312} h={272} title="GPU memory (HBM) · 80 GB" variant="dashed">
      <></>
    </Group>
    <Node size={16} subSize={13} x={40} y={60} w={272} h={72} label="Weights" sub="16 GB · shared by every user" icon="db" />
    <Node size={14} x={40} y={148} w={272} h={40} label="KV cache · seq 1" />
    <Node size={14} x={40} y={196} w={272} h={40} label="KV cache · seq 2" />
    <Node size={14} x={40} y={244} w={272} h={40} label="KV cache · seq B" />

    <Connector points={weightsPath} defs="gb" kind="request" />
    <Label x={420} y={84} text="read once" anchor="middle" size={13} />
    <Packet points={weightsPath} kind="request" dur={1.6} r={4} />
    {kvPaths.map((p, i) => <Connector key={i} points={p} defs="gb" kind="change" />)}
    <Packet points={kvPaths[2]} kind="change" dur={1.6} delay={-0.5} r={4} />
    <Label x={416} y={312} text="+ every sequence's own KV" anchor="middle" size={13} />

    <Node size={16} subSize={13} x={496} y={124} w={232} h={104} label="Tensor cores" sub="one matmul · B rows" icon="model" />

    {outPaths.map((p, i) => <Connector key={i} points={p} defs="gb" kind="response" />)}
    <Packet points={outPaths[0]} kind="response" dur={1.4} delay={-0.3} r={4} />
    <Node size={14} x={832} y={128} w={224} h={40} label="next token · seq 1" />
    <Node size={14} x={832} y={176} w={224} h={40} label="next token · seq 2" />
    <Node size={14} x={832} y={224} w={224} h={40} label="next token · seq B" />
    <Label x={944} y={112} text="B tokens per step" anchor="middle" size={13} />

    <Txt x={24} y={352} size={15} bold>Bytes read per decode step, to scale</Txt>
    <Txt x={24} y={399} size={14}>Batch 1</Txt>
    <Bar x={144} y={380} h={28} pxPerGB={PX} kvGB={0.27} />
    <Txt x={800} y={399} size={13} mono>16.3 GB → 1 token · 4.9 ms</Txt>
    <Txt x={24} y={451} size={14}>Batch 64</Txt>
    <Bar x={144} y={432} h={28} pxPerGB={PX} kvGB={17.2} />
    <Txt x={800} y={451} size={13} mono>33.2 GB → 64 tokens · 9.9 ms</Txt>
    <Txt x={298} y={484} size={13} mono anchor="middle" muted>weights · 16 GB</Txt>
    <Txt x={144 + 16 * PX + 2 + (17.2 * PX) / 2} y={484} size={13} mono anchor="middle" muted>KV · 64 × 268 MB = 17.2 GB</Txt>
  </>
);

// ---------- mobile ----------
const MPX = 10.6; // 33.2 GB → 352px

const mobile = (
  <>
    <Defs id="gbm" />
    <Group titleSize={13} x={16} y={16} w={368} h={192} title="GPU memory · 80 GB" variant="dashed">
      <></>
    </Group>
    <Node size={16} subSize={13} x={32} y={48} w={336} h={60} label="Weights" sub="16 GB · shared" icon="db" />
    <Node size={14} x={32} y={120} w={160} h={40} label="KV · seq 1" />
    <Node size={14} x={208} y={120} w={160} h={40} label="KV · seq B" />
    <Label x={200} y={188} text="268 MB per sequence" anchor="middle" size={13} />

    <Connector points={[[200, 208], [200, 248]]} defs="gbm" kind="request" />
    <Packet points={[[200, 208], [200, 248]]} kind="request" dur={0.9} r={4} />
    <Label x={212} y={233} text="read every step" anchor="start" size={13} />
    <Node size={16} subSize={13} x={32} y={248} w={336} h={64} label="Tensor cores" sub="one matmul · B rows" icon="model" />
    <Connector points={[[200, 312], [200, 344]]} defs="gbm" kind="response" />
    <Node size={14} x={32} y={344} w={336} h={44} label="B tokens out · one per sequence" />

    <Txt x={16} y={432} size={15} bold>Bytes read per step, to scale</Txt>
    <Txt x={16} y={462} size={13} mono>Batch 1 · 1 token · 4.9 ms</Txt>
    <Bar x={16} y={470} h={20} pxPerGB={MPX} kvGB={0.27} />
    <Txt x={16} y={518} size={13} mono>Batch 64 · 64 tokens · 9.9 ms</Txt>
    <Bar x={16} y={526} h={20} pxPerGB={MPX} kvGB={17.2} />
    <rect x={16} y={566} width={14} height={14} rx={2} fill={BLUE} />
    <Txt x={36} y={578} size={13} mono>weights 16 GB</Txt>
    <rect x={180} y={566} width={14} height={14} rx={2} fill={ORANGE} />
    <Txt x={200} y={578} size={13} mono>KV 268 MB × B</Txt>
  </>
);

export default define({
  alt: "One decode step on an H100 serving Llama 3.1 8B. The tensor cores read the 16 GB of weights once, plus every sequence's own KV cache, run one matmul over B rows and emit the next token for each of the B sequences. Drawn to scale: at batch 1 the step reads 16.3 GB for 1 token in about 4.9 ms; at batch 64 it reads 33.2 GB, of which 17.2 GB is KV cache, for 64 tokens in about 9.9 ms.",
  viewBox: "0 0 1080 496",
  children: desktop,
  mobile: {
    alt: "One decode step: the weights (16 GB, shared) and each sequence's KV cache (268 MB each) are read from GPU memory every step, one matmul runs over B rows, and B tokens come out, one per sequence. At batch 1 the step reads 16.3 GB for 1 token in 4.9 ms; at batch 64 it reads 33.2 GB for 64 tokens in 9.9 ms.",
    viewBox: "0 0 400 592",
    children: mobile,
  },
});
