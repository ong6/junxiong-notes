/* @jsxRuntime automatic @jsxImportSource react */
import { Connector, Defs, Label, Node, Packet } from "uipack";
import { define } from "./_shared";

const loop: [number, number][] = [[900, 96], [900, 48], [800, 48], [800, 96]];

export default define({
  alt: "A prompt of N tokens enters prefill, one compute-bound N-row GEMM that saturates FLOPs and emits the first token (TTFT). Decode then loops, one bandwidth-bound 1-row matmul per token, and every pass re-reads every weight and the whole growing KV cache.",
  viewBox: "0 0 1080 300",
  children: (
    <>
      <Defs id="pd" />
      <Node size={19} subSize={13} x={48} y={112} w={200} h={72} label="Prompt" sub="N tokens" icon="doc" />
      <Connector points={[[248, 148], [328, 148]]} defs="pd" kind="request" />
      <Label x={288} y={138} text="all N tokens" anchor="middle" size={13} />
      <Packet points={[[248, 148], [328, 148]]} kind="request" dur={1.6} r={4} />

      <Node size={19} subSize={13} x={328} y={96} w={280} h={104} label="Prefill · compute-bound" sub="one N-row GEMM · saturates FLOPs" icon="model" />
      <Connector points={[[608, 148], [704, 148]]} defs="pd" kind="request" />
      <Label x={656} y={138} text="first token · TTFT" anchor="middle" size={13} />
      <Packet points={[[608, 148], [704, 148]]} kind="request" dur={1.6} delay={-0.8} r={4} />

      <Node size={19} subSize={13} x={704} y={96} w={328} h={104} label="Decode · bandwidth-bound" sub="one 1-row matmul · one token out" icon="cache" />
      <Connector points={loop} defs="pd" kind="change" />
      <Label x={850} y={40} text="every pass re-reads every weight + the whole growing KV cache" anchor="middle" size={13} />
      <Packet points={loop} kind="change" dur={1.8} delay={-0.4} r={4} />
    </>
  ),
});
