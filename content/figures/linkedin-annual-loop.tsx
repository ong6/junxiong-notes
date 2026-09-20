/* @jsxRuntime automatic @jsxImportSource react */
import { Connector, Defs, Label, Node, Packet } from "uipack";
import { define } from "./_shared";

const top: [number, number][] = [[232, 112], [280, 112]];
const second: [number, number][] = [[472, 112], [520, 112]];
const third: [number, number][] = [[712, 112], [760, 112]];
const down: [number, number][] = [[856, 160], [856, 240], [760, 240]];
const back: [number, number][] = [[280, 288], [160, 288], [160, 160]];
const event: [number, number][] = [[520, 288], [424, 288]];

export default define({
  alt: "An annual LinkedIn maintenance loop. Review accomplishments, sample ten relevant job descriptions, refresh the profile, measure qualified inbound for four weeks, then leave it alone until next year. A promotion, new scope, relocation or target change takes a shorter path directly back to the profile refresh.",
  viewBox: "0 0 1080 384",
  children: (
    <>
      <Defs id="lal" />
      <Node size={18} subSize={12} x={40} y={64} w={192} h={96} label="Review the year" sub="work · resume · direction" icon="doc" />
      <Connector points={top} defs="lal" kind="request" />
      <Packet points={top} kind="request" dur={1.4} r={4} />
      <Node size={18} subSize={12} x={280} y={64} w={192} h={96} label="Read 10 roles" sub="repeated titles · skills" icon="search" />
      <Connector points={second} defs="lal" kind="request" />
      <Packet points={second} kind="request" dur={1.4} delay={-0.4} r={4} />
      <Node size={18} subSize={12} x={520} y={64} w={192} h={96} label="Refresh profile" sub="one coherent story" icon="user" accent />
      <Connector points={third} defs="lal" kind="response" />
      <Packet points={third} kind="response" dur={1.4} delay={-0.8} r={4} />
      <Node size={18} subSize={12} x={760} y={64} w={192} h={96} label="Measure 4 weeks" sub="qualified inbound" icon="chart" accent />

      <Connector points={down} defs="lal" kind="response" />
      <Packet points={down} kind="response" dur={1.8} delay={-1.1} r={4} />
      <Node size={18} subSize={12} x={568} y={240} w={192} h={96} label="Leave it alone" sub="until reality changes" icon="pause" />
      <Connector points={back} defs="lal" kind="request" dashed />
      <Packet points={back} kind="request" dur={3.2} delay={-1.4} r={4} />
      <Label x={160} y={280} text="next year" anchor="middle" size={12} />

      <Node size={18} subSize={12} x={280} y={240} w={144} h={96} label="Real change" sub="promotion · move" icon="warning" dashed />
      <Connector points={event} defs="lal" kind="change" />
      <Packet points={event} kind="change" dur={1.6} delay={-0.6} r={4} />
      <Label x={472} y={280} text="update now" anchor="middle" size={12} />
    </>
  ),
  mobile: {
    alt: "A vertical annual maintenance loop: review the year, read ten roles, refresh the profile, measure four weeks, and leave it alone. A next-year path returns to the review; a real-change path returns directly to the profile refresh.",
    viewBox: "0 0 440 696",
    children: (
      <>
        <Defs id="lalm" />
        {[
          ["Review the year", "work · resume · direction", "doc", false],
          ["Read 10 roles", "repeated titles · skills", "search", false],
          ["Refresh profile", "one coherent story", "user", true],
          ["Measure 4 weeks", "qualified inbound", "chart", true],
          ["Leave it alone", "until reality changes", "pause", false],
        ].map(([label, sub, icon, accent], i) => {
          const y = 24 + i * 104;
          return (
            <g key={String(label)}>
              {i > 0 ? (
                <>
                  <Connector points={[[220, y - 24], [220, y]]} defs="lalm" kind={i >= 3 ? "response" : "request"} />
                  <Packet points={[[220, y - 24], [220, y]]} kind={i >= 3 ? "response" : "request"} dur={1.5} delay={-i * 0.35} r={4} />
                </>
              ) : null}
              <Node size={16} subSize={11} x={72} y={y} w={296} h={80} label={String(label)} sub={String(sub)} icon={String(icon)} accent={Boolean(accent)} />
            </g>
          );
        })}
        <Node size={15} subSize={10} x={24} y={568} w={160} h={88} label="Real change" sub="promotion · move" icon="warning" dashed />
        <Connector points={[[184, 612], [408, 612], [408, 272], [368, 272]]} defs="lalm" kind="change" />
        <Label x={296} y={604} text="update now" anchor="middle" size={11} />
        <Packet points={[[184, 612], [408, 612], [408, 272], [368, 272]]} kind="change" dur={3} delay={-1} r={4} />
        <Connector points={[[220, 520], [220, 680], [16, 680], [16, 64], [72, 64]]} defs="lalm" kind="request" dashed />
        <Label x={112} y={674} text="next year" anchor="middle" size={11} />
        <Packet points={[[220, 520], [220, 680], [16, 680], [16, 64], [72, 64]]} kind="request" dur={4} delay={-1.5} r={4} />
      </>
    ),
  },
});
