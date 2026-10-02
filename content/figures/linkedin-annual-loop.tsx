/* @jsxRuntime automatic @jsxImportSource react */
import { Connector, Defs, Label, Node, Packet } from "uipack";
import { define } from "./_shared";

const top: [number, number][] = [[264, 112], [304, 112]];
const second: [number, number][] = [[528, 112], [568, 112]];
const third: [number, number][] = [[792, 112], [832, 112]];
const down: [number, number][] = [[944, 160], [944, 288], [824, 288]];
// Next year: from Leave it alone, under Real change, back up to the review.
const back: [number, number][] = [[728, 336], [728, 360], [152, 360], [152, 160]];
// From Real change straight back up into Refresh profile, as the phone version and the alt text say.
const event: [number, number][] = [[424, 288], [592, 288], [592, 160]];

export default define({
  alt: "An annual LinkedIn maintenance loop. Review accomplishments, sample ten relevant job descriptions, refresh the profile, measure qualified inbound for four weeks, then leave it alone until next year. A promotion, new scope, relocation or target change takes a shorter path directly back to the profile refresh.",
  viewBox: "0 0 1080 384",
  children: (
    <>
      <Defs id="lal" />
      <Node size={18} subSize={12} x={40} y={64} w={224} h={96} label="Review the year" sub="work · resume · direction" icon="doc" />
      <Connector points={top} defs="lal" kind="request" />
      <Packet points={top} kind="request" dur={1.4} r={4} />
      <Node size={18} subSize={12} x={304} y={64} w={224} h={96} label="Read 10 roles" sub="repeated titles · skills" icon="search" />
      <Connector points={second} defs="lal" kind="request" />
      <Packet points={second} kind="request" dur={1.4} delay={-0.4} r={4} />
      <Node size={18} subSize={12} x={568} y={64} w={224} h={96} label="Refresh profile" sub="one coherent story" icon="user" accent />
      <Connector points={third} defs="lal" kind="response" />
      <Packet points={third} kind="response" dur={1.4} delay={-0.8} r={4} />
      <Node size={18} subSize={12} x={832} y={64} w={224} h={96} label="Measure 4 weeks" sub="qualified inbound" icon="chart" accent />

      <Connector points={down} defs="lal" kind="response" />
      <Packet points={down} kind="response" dur={1.8} delay={-1.1} r={4} />
      <Node size={18} subSize={12} x={632} y={240} w={192} h={96} label="Leave it alone" sub="until reality changes" icon="pause" />
      <Connector points={back} defs="lal" kind="request" dashed />
      <Packet points={back} kind="request" dur={3.2} delay={-1.4} r={4} />
      <Label x={152} y={280} text="next year" anchor="middle" size={12} />

      <Node size={18} subSize={12} x={264} y={240} w={160} h={96} label="Real change" sub="promotion · move" icon="warning" dashed />
      <Connector points={event} defs="lal" kind="change" />
      <Packet points={event} kind="change" dur={1.6} delay={-0.6} r={4} />
      <Label x={508} y={280} text="update now" anchor="middle" size={12} />
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
              <Node size={16} subSize={14} x={72} y={y} w={296} h={80} label={String(label)} sub={String(sub)} icon={String(icon)} accent={Boolean(accent)} />
            </g>
          );
        })}
        {/* Phone labels are 14px+ so they render at 11px+ in a 350px column (440 viewBox). */}
        <Node size={16} subSize={14} x={24} y={568} w={196} h={88} label="Real change" sub="promotion · move" icon="warning" dashed />
        <Connector points={[[220, 612], [408, 612], [408, 272], [368, 272]]} defs="lalm" kind="change" />
        <Label x={314} y={604} text="update now" anchor="middle" size={14} />
        <Packet points={[[220, 612], [408, 612], [408, 272], [368, 272]]} kind="change" dur={3} delay={-1} r={4} />
        <Connector points={[[236, 520], [236, 680], [16, 680], [16, 64], [72, 64]]} defs="lalm" kind="request" dashed />
        <Label x={112} y={674} text="next year" anchor="middle" size={14} />
        <Packet points={[[236, 520], [236, 680], [16, 680], [16, 64], [72, 64]]} kind="request" dur={4} delay={-1.5} r={4} />
      </>
    ),
  },
});
