/* @jsxRuntime automatic @jsxImportSource react */
import { Connector, Defs, Group, Node, Packet } from "uipack";
import { define } from "./_shared";

const gates: [string, string, "key" | "user" | "doc" | "clock"][] = [
  ["Target role", "one loop to train for", "key"],
  ["LinkedIn", "recruiters find you", "user"],
  ["Resume", "gets you the call", "doc"],
  ["First & last 5 min", "frames the round", "clock"],
];

const rounds: [string, string][] = [
  ["System design", "framework, AI mock"],
  ["LeetCode", "daily pattern reps"],
  ["LLD", "rare, trading firms"],
  ["AI-assisted", "prompt, read, catch"],
  ["Debugging", "map before fixing"],
  ["Take-home", "know every line"],
];

const GX = [64, 320, 576, 832];
const GW = 200;
const RW = 148;
const rx = (i: number) => 48 + i * (RW + 19);

export default define({
  alt: "Two rows. The top row is four cheap steps in order: pick the target role, point LinkedIn at it, write the resume for it, and rehearse the first and last five minutes of every interview. Each one gates the next. The bottom row is the six technical round types in order of impact: system design, LeetCode, low-level design, AI-assisted coding, codebase debugging and take-homes, each with its own way to train.",
  viewBox: "0 0 1080 392",
  children: (
    <>
      <Defs id="jpo" />
      <Group titleSize={13} x={24} y={24} w={1032} h={152} title="The cheap 20% · each step gates the next" variant="dashed" accent>
        {gates.map(([label, sub, icon], i) => (
          <g key={label}>
            {i > 0 ? (
              <>
                <Connector points={[[GX[i - 1] + GW, 120], [GX[i], 120]]} defs="jpo" kind="response" />
                <Packet points={[[GX[i - 1] + GW, 120], [GX[i], 120]]} kind="response" dur={1.8} delay={-i * 0.45} r={4} />
              </>
            ) : null}
            <Node size={16} subSize={12} x={GX[i]} y={88} w={GW} h={64} label={label} sub={sub} icon={icon} accent />
          </g>
        ))}
      </Group>
      <Group titleSize={13} x={24} y={216} w={1032} h={152} title="Technical rounds · in order of impact, each trained differently" variant="dashed">
        {rounds.map(([label, sub], i) => (
          <Node key={label} size={15} subSize={11} x={rx(i)} y={280} w={RW} h={64} label={label} sub={sub} />
        ))}
      </Group>
    </>
  ),
  mobile: {
    alt: "Two stacked lists. First, four cheap steps in order, each gating the next: target role, LinkedIn, resume, and the first and last five minutes. Then the six technical round types in order of impact: system design, LeetCode, low-level design, AI-assisted coding, codebase debugging and take-homes.",
    viewBox: "0 0 440 848",
    children: (
      <>
        <Defs id="jpom" />
        <Group titleSize={14} x={16} y={16} w={408} h={328} title="The cheap 20% · in order" variant="dashed" accent>
          {gates.map(([label, sub, icon], i) => {
            const y = 64 + i * 68;
            return (
              <g key={label}>
                {i > 0 ? (
                  <>
                    <Connector points={[[220, y - 16], [220, y]]} defs="jpom" kind="response" />
                    <Packet points={[[220, y - 16], [220, y]]} kind="response" dur={1.4} delay={-i * 0.35} r={4} />
                  </>
                ) : null}
                <Node size={16} subSize={14} x={48} y={y} w={344} h={52} label={label} sub={sub} icon={icon} accent />
              </g>
            );
          })}
        </Group>
        <Group titleSize={14} x={16} y={368} w={408} h={464} title="Technical rounds · by impact" variant="dashed">
          {rounds.map(([label, sub], i) => (
            <Node key={label} size={16} subSize={14} x={48} y={416 + i * 68} w={344} h={52} label={label} sub={sub} />
          ))}
        </Group>
      </>
    ),
  },
});
