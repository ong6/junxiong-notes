/* @jsxRuntime automatic @jsxImportSource react */
import { Connector, Defs, Group, Node, Packet } from "uipack";
import { define } from "./_shared";

const xs = [64, 312, 560, 808];
const row = (y: number, labels: [string, string][], kind: "request" | "change", hot: boolean[]) => (
  <>
    {labels.map(([label, sub], i) => (
      <g key={i}>
        {i > 0 ? (
          <>
            <Connector points={[[xs[i - 1] + 200, y + 28], [xs[i], y + 28]]} defs="chm" kind={hot[i] ? kind : i === 3 && !hot[i] ? undefined : kind} />
            <Packet points={[[xs[i - 1] + 200, y + 28], [xs[i], y + 28]]} kind={hot[i] ? kind : "neutral"} dur={1.4} delay={-i * 0.4} r={4} />
          </>
        ) : null}
        <Node size={19} subSize={13} x={xs[i]} y={y} w={200} h={56} label={label} sub={sub} icon={i === 0 ? "doc" : i === 1 ? "db" : i === 2 ? "clock" : "user"} dashed={hot[i] && kind === "change"} />
      </g>
    ))}
  </>
);

export default define({
  alt: "Two rows of four layers: system, context, history, new turn. On a cache hit the prefix is byte-identical and the first three layers are read at 0.1x, only the new turn is written. On a miss, one byte edited in layer 2 means context, history and the new turn are all recomputed at full price.",
  viewBox: "0 0 1080 380",
  children: (
    <>
      <Defs id="chm" />
      <Group titleSize={13} x={24} y={24} w={1032} h={152} title="Cache hit · prefix byte-identical" variant="dashed">
        {row(88, [["1 · System", "0.1x"], ["2 · Context", "0.1x"], ["3 · History", "0.1x"], ["4 · New turn", "write"]], "request", [false, true, true, false])}
      </Group>
      <Group titleSize={13} x={24} y={200} w={1032} h={152} title="Cache miss · one byte edited in layer 2" variant="dashed">
        {row(264, [["1 · System", "0.1x"], ["2 · Context", "full price"], ["3 · History", "full price"], ["4 · New turn", "full price"]], "change", [false, true, true, true])}
      </Group>
    </>
  ),
});
