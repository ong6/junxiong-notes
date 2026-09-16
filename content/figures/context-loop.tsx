/* @jsxRuntime automatic @jsxImportSource react */
import { Connector, Defs, Label, Node, Packet } from "uipack";
import { define } from "./_shared";

const loop: [number, number][] = [[520, 96], [520, 48], [400, 48], [400, 96]];
const back: [number, number][] = [[740, 184], [740, 248], [164, 248], [164, 184]];

export default define({
  alt: "A fixed prefix of tool schemas, system prompt and instructions is read from cache and feeds the loop of file reads, edits and tool output, which grows with each tool call and is re-sent every turn. When the window fills, compaction discards detail chosen for you, and a dashed edge back to the prefix shows the cached prefix dying.",
  viewBox: "0 0 1080 320",
  children: (
    <>
      <Defs id="cl" />
      <Node size={19} subSize={13} x={48} y={96} w={232} h={88} label="Fixed prefix" sub="schemas · prompt · from cache" icon="doc" />
      <Connector points={[[280, 140], [344, 140]]} defs="cl" kind="request" />
      <Packet points={[[280, 140], [344, 140]]} kind="request" dur={1.6} r={4} />

      <Node size={19} subSize={13} x={344} y={96} w={232} h={88} label="The loop" sub="reads · edits · tool output" icon="terminal" />
      <Connector points={loop} defs="cl" kind="change" />
      <Label size={14} x={460} y={40} text="each tool call · re-sent every turn" anchor="middle" />
      <Packet points={loop} kind="change" dur={2} delay={-0.7} r={4} />

      <Connector points={[[576, 140], [640, 140]]} defs="cl" kind="change" />
      <Packet points={[[576, 140], [640, 140]]} kind="change" dur={1.6} delay={-0.4} r={4} />
      <Node size={19} subSize={13} x={640} y={96} w={200} h={88} label="Compaction" sub="when the window fills" icon="warning" />

      <Connector points={[[840, 140], [904, 140]]} defs="cl" kind="change" />
      <Packet points={[[840, 140], [904, 140]]} kind="change" dur={1.6} delay={-1} r={4} />
      <Node size={19} subSize={13} x={904} y={96} w={152} h={88} label="Detail discarded" sub="chosen for you" dashed />

      <Connector points={back} defs="cl" kind="change" dashed />
      <Label size={14} x={452} y={244} text="cache prefix dies" anchor="middle" />
      <Packet points={back} kind="change" dur={3} delay={-1.3} r={4} />
    </>
  ),
});
