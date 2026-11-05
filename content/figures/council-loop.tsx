/* @jsxRuntime automatic @jsxImportSource react */
import { Connector, Defs, Label, Node, Packet } from "uipack";
import { define } from "./_shared";

// Desktop: version → three fresh reviewers → gate → keep, with the fix loop underneath.
const toR1: [number, number][] = [[256, 196], [288, 196], [288, 112], [320, 112]];
const toR2: [number, number][] = [[256, 196], [320, 196]];
const toR3: [number, number][] = [[256, 196], [288, 196], [288, 280], [320, 280]];
const fromR1: [number, number][] = [[552, 112], [592, 112], [592, 196], [624, 196]];
const fromR2: [number, number][] = [[552, 196], [624, 196]];
const fromR3: [number, number][] = [[552, 280], [592, 280], [592, 196], [624, 196]];
const pass: [number, number][] = [[840, 196], [888, 196]];
const toFix: [number, number][] = [[732, 240], [732, 336]];
const back: [number, number][] = [[632, 368], [148, 368], [148, 240]];

const desktop = (
  <>
    <Defs id="cn" />
    <Node size={19} subSize={13} x={40} y={152} w={216} h={88} label="Version vN" sub="+ before · references" icon="doc" />

    <Label size={14} x={436} y={60} text="fresh each round · target hidden" anchor="middle" />
    <Node size={17} subSize={13} x={320} y={84} w={232} h={56} label="Reviewer" sub="lens: first-time user" />
    <Node size={17} subSize={13} x={320} y={168} w={232} h={56} label="Reviewer" sub="lens: power user" />
    <Node size={17} subSize={13} x={320} y={252} w={232} h={56} label="Reviewer" sub="lens: designer" />
    <Connector points={toR1} defs="cn" kind="request" />
    <Connector points={toR2} defs="cn" kind="request" />
    <Connector points={toR3} defs="cn" kind="request" />
    <Packet points={toR2} kind="request" dur={1.4} r={4} />
    <Connector points={fromR1} defs="cn" kind="request" />
    <Connector points={fromR2} defs="cn" kind="request" />
    <Connector points={fromR3} defs="cn" kind="request" />

    <Node size={19} subSize={13} x={624} y={152} w={216} h={88} label="Gate" sub="constraints · all ≥ target" icon="lock" />
    <Connector points={pass} defs="cn" kind="response" />
    <Packet points={pass} kind="response" dur={1.2} delay={-0.5} r={4} />
    <Node size={19} subSize={13} x={888} y={152} w={160} h={88} label="Keep" sub="best compliant" accent />

    <Connector points={toFix} defs="cn" kind="change" />
    <Label size={14} x={744} y={292} text="fail" anchor="start" />
    <Node size={17} subSize={13} x={632} y={336} w={200} h={64} label="Main agent fixes" sub="snapshot · new evidence" />
    <Connector points={back} defs="cn" kind="change" />
    <Packet points={back} kind="change" dur={2.4} delay={-1} r={4} />
    <Label size={14} x={390} y={392} text="next round · at most 3 by default" anchor="middle" />
  </>
);

// Phone: the same loop stacked; keep and fix sit side by side under the gate.
const mobile = (
  <>
    <Defs id="cnm" />
    <Node size={16} subSize={14} x={40} y={24} w={248} h={56} label="Version vN" sub="+ before · references" align="center" />
    <Connector points={[[164, 80], [164, 112]]} defs="cnm" kind="request" />
    <Packet points={[[164, 80], [164, 112]]} kind="request" dur={0.9} r={4} />
    <Node size={16} subSize={14} x={40} y={112} w={248} h={72} label="3 fresh reviewers" sub="own metrics · target hidden" align="center" />
    <Connector points={[[164, 184], [164, 216]]} defs="cnm" kind="request" />
    <Node size={16} subSize={14} x={40} y={216} w={248} h={64} label="Gate" sub="constraints · all ≥ target" align="center" />
    <Connector points={[[112, 280], [112, 320]]} defs="cnm" kind="response" />
    <Label size={14} x={104} y={306} text="pass" anchor="end" />
    <Node size={16} subSize={14} x={24} y={320} w={152} h={64} label="Keep" sub="best compliant" align="center" accent />
    <Connector points={[[216, 280], [216, 320]]} defs="cnm" kind="change" />
    <Label size={14} x={224} y={306} text="fail" anchor="start" />
    <Node size={16} subSize={14} x={184} y={320} w={152} h={64} label="Fix" sub="≤ 3 rounds" align="center" />
    <Connector points={[[336, 352], [348, 352], [348, 52], [288, 52]]} defs="cnm" kind="change" />
    <Packet points={[[336, 352], [348, 352], [348, 52], [288, 52]]} kind="change" dur={2.2} delay={-0.8} r={4} />
  </>
);

export default define({
  alt: "One version of the work, with the before snapshot and reference products, goes to three fresh reviewers with different lenses who never see the target score. Their scores reach a gate that passes only when every stated constraint holds and every metric meets the target. A pass keeps the best compliant version; a fail sends the work to the main agent to fix, snapshot and rebuild evidence, then back to a new set of reviewers, for at most three rounds by default.",
  viewBox: "0 0 1080 424",
  children: desktop,
  mobile: {
    alt: "The council loop stacked: a version with references goes to three fresh reviewers who pick their own metrics and never see the target, then to a gate. A pass keeps the best compliant version; a fail goes to a fix step that loops back to the version, at most three rounds.",
    viewBox: "0 0 360 408",
    children: mobile,
  },
});
