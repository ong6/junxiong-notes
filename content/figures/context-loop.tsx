/* @jsxRuntime automatic @jsxImportSource react */
import { Connector, Defs, Label, Node, Packet } from "uipack";
import { define, LoopAbove, T } from "./_shared";

const back: [number, number][] = [[740, 184], [740, 248], [164, 248], [164, 184]];

export default define({
  alt: "A fixed prefix of tool schemas, system prompt and instructions is read from cache and feeds the loop of file reads, edits and tool output, which grows with each tool call and is re-sent every turn. When the window fills, compaction discards detail chosen for you, and a dashed edge back to the prefix shows the cached prefix dying.",
  viewBox: "0 0 1080 320",
  children: (
    <>
      <Defs id="cl" />
      <Node {...T.node} x={48} y={96} w={232} h={88} label="Fixed prefix" sub="schemas · prompt · from cache" icon="doc" />
      <Connector points={[[280, 140], [344, 140]]} defs="cl" kind="request" />
      <Packet points={[[280, 140], [344, 140]]} kind="request" dur={1.6} r={4} />

      <Node {...T.node} x={344} y={96} w={232} h={88} label="The loop" sub="reads · edits · tool output" icon="terminal" />
      <LoopAbove defs="cl" cx={460} top={96} w={120} rise={48} label="each tool call · re-sent every turn" dur={2} delay={-0.7} />

      <Connector points={[[576, 140], [640, 140]]} defs="cl" kind="change" />
      <Packet points={[[576, 140], [640, 140]]} kind="change" dur={1.6} delay={-0.4} r={4} />
      <Node {...T.node} x={640} y={96} w={200} h={88} label="Compaction" sub="when the window fills" icon="warning" />

      <Connector points={[[840, 140], [904, 140]]} defs="cl" kind="change" />
      <Packet points={[[840, 140], [904, 140]]} kind="change" dur={1.6} delay={-1} r={4} />
      <Node {...T.node} x={904} y={96} w={152} h={88} label="Detail discarded" sub="chosen for you" dashed />

      <Connector points={back} defs="cl" kind="change" dashed />
      <Label size={T.label} x={452} y={244} text="cache prefix dies" anchor="middle" />
      <Packet points={back} kind="change" dur={3} delay={-1.3} r={4} />
    </>
  ),
});
