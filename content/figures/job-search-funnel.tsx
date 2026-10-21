/* @jsxRuntime automatic @jsxImportSource react */
import { Connector, Defs, Group, Node, Packet } from "uipack";
import { define } from "./_shared";

// Counts from my own tracker, 2026-07-24 to 2026-10-21. Boxes are equal width on purpose:
// the numbers carry the proportions, the drawing only shows where each route loses people.
type Stage = [string, string, string];
type Kind = "request" | "response";

const lanes: { title: string; mTitle: string; kind: Kind; accent: boolean; moving: boolean; stages: Stage[] }[] = [
  {
    title: "Applied myself · the first human read is the filter",
    mTitle: "Applied myself",
    kind: "request",
    accent: false,
    moving: true,
    stages: [
      ["39 applications", "37 cold · 2 referred", "incl. 2 referrals"],
      ["5 replies", "30 silent · 1 rejected", "30 silent · 1 no"],
      ["4 processes", "screen, test or round", "screen or round"],
      ["0 offers", "1 final round pending", "1 final pending"],
    ],
  },
  {
    title: "In-house recruiter · the match happens before the message",
    mTitle: "In-house recruiters",
    kind: "response",
    accent: true,
    moving: true,
    stages: [
      ["19 reach-outs", "employer's own recruiter", "employer's own"],
      ["12 went forward", "7 I passed on", "7 I passed on"],
      ["11 processes", "1 I dropped", "1 I dropped"],
      ["1 offer", "of 11 processes", "of 11 processes"],
    ],
  },
  {
    title: "Agency recruiter · filtered twice: by me, then by the client",
    mTitle: "Agency recruiters",
    kind: "response",
    accent: false,
    moving: false,
    stages: [
      ["46 reach-outs", "third-party recruiter", "third-party"],
      ["16 went forward", "30 I passed on", "30 I passed on"],
      ["8 processes", "8 stopped at the CV", "8 stopped at CV"],
      ["2 offers", "of 8 processes", "of 8 processes"],
    ],
  },
];

// Desktop: three lanes, four stages each, on an 8px grid.
const XS = [56, 312, 568, 824];
const NW = 208;
const NH = 64;
const LANE_H = 136;
const laneY = (i: number) => 24 + i * (LANE_H + 24);

// Mobile: each lane is a 2x2 grid read as a Z (top row, then bottom row).
const MX = [40, 232];
const MW = 168;
const MLANE_H = 224;
const mLaneY = (i: number) => 16 + i * (MLANE_H + 16);

export default define({
  alt: "Three routes into a hiring process, each drawn as four stages. Applied myself: 39 applications, 5 human replies (30 silent, 1 rejected), 4 hiring processes, 0 offers with one final round pending. In-house recruiters: 19 reach-outs, 12 I took forward (7 I passed on), 11 hiring processes (1 I dropped), 1 offer. Agency recruiters: 46 reach-outs, 16 I took forward (30 I passed on), 8 hiring processes (8 stopped at the CV), 2 offers. Boxes are equal size; only the counts carry the proportions.",
  viewBox: "0 0 1080 504",
  children: (
    <>
      <Defs id="jsf" />
      {lanes.map((lane, li) => {
        const gy = laneY(li);
        const ny = gy + 48;
        const cy = ny + NH / 2;
        return (
          <Group key={lane.title} titleSize={13} x={24} y={gy} w={1032} h={LANE_H} title={lane.title} variant="dashed" accent={lane.accent}>
            {lane.stages.map(([label, sub], si) => (
              <g key={label}>
                {si > 0 ? (
                  <>
                    <Connector points={[[XS[si - 1] + NW, cy], [XS[si], cy]]} defs="jsf" kind={lane.kind} />
                    {lane.moving ? (
                      <Packet points={[[XS[si - 1] + NW, cy], [XS[si], cy]]} kind={lane.kind} dur={1.8} delay={-si * 0.45} r={4} />
                    ) : null}
                  </>
                ) : null}
                <Node
                  size={17}
                  subSize={12}
                  x={XS[si]}
                  y={ny}
                  w={NW}
                  h={NH}
                  label={label}
                  sub={sub}
                  align="center"
                  accent={lane.accent && si > 0}
                  dashed={si === 3 && li === 0}
                />
              </g>
            ))}
          </Group>
        );
      })}
    </>
  ),
  mobile: {
    alt: "Three stacked routes, four stages each. Applied myself: 39 applications, 5 replies, 4 hiring processes, 0 offers. In-house recruiters: 19 reach-outs, 12 taken forward, 11 hiring processes, 1 offer. Agency recruiters: 46 reach-outs, 16 taken forward, 8 hiring processes, 2 offers.",
    viewBox: "0 0 440 736",
    children: (
      <>
        <Defs id="jsfm" />
        {lanes.map((lane, li) => {
          const gy = mLaneY(li);
          const rows = [gy + 52, gy + 52 + NH + 32];
          const pos = (si: number): [number, number] => [MX[si % 2], rows[Math.floor(si / 2)]];
          const links: [number, number][][] = [
            [[MX[0] + MW, rows[0] + NH / 2], [MX[1], rows[0] + NH / 2]],
            [[MX[1] + MW / 2, rows[0] + NH], [MX[1] + MW / 2, rows[0] + NH + 16], [MX[0] + MW / 2, rows[0] + NH + 16], [MX[0] + MW / 2, rows[1]]],
            [[MX[0] + MW, rows[1] + NH / 2], [MX[1], rows[1] + NH / 2]],
          ];
          return (
            <Group key={lane.mTitle} titleSize={14} x={16} y={gy} w={408} h={MLANE_H} title={lane.mTitle} variant="dashed" accent={lane.accent}>
              {links.map((pts, k) => (
                <g key={k}>
                  <Connector points={pts} defs="jsfm" kind={lane.kind} radius={6} />
                  {lane.moving && k !== 1 ? <Packet points={pts} kind={lane.kind} dur={1.4} delay={-k * 0.35} r={4} /> : null}
                </g>
              ))}
              {lane.stages.map(([label, , mSub], si) => {
                const [x, y] = pos(si);
                return (
                  <Node
                    key={label}
                    size={16}
                    subSize={14}
                    x={x}
                    y={y}
                    w={MW}
                    h={NH}
                    label={label}
                    sub={mSub}
                    align="center"
                    accent={lane.accent && si > 0}
                    dashed={si === 3 && li === 0}
                  />
                );
              })}
            </Group>
          );
        })}
      </>
    ),
  },
});
