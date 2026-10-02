/* @jsxRuntime automatic @jsxImportSource react */
import { Connector, Defs, Label, Node, Packet } from "uipack";
import { define } from "./_shared";

// Each arrow gap is wider than its label (plus ~11px either side), so no box
// covers a label. The loop is centred on Decode and its label wraps to two
// lines over it, so nothing runs past the right edge.
const loop: [number, number][] = [[954, 104], [954, 60], [854, 60], [854, 104]];

export default define({
  alt: "A prompt of N tokens enters prefill, one compute-bound N-row GEMM that saturates FLOPs and emits the first token (TTFT). Decode then loops, one bandwidth-bound 1-row matmul per token, and every pass re-reads every weight and the whole growing KV cache.",
  viewBox: "0 0 1080 240",
  children: (
    <>
      <Defs id="pd" />
      <Node size={19} subSize={13} x={24} y={120} w={144} h={72} label="Prompt" sub="N tokens" icon="doc" />
      <Connector points={[[168, 156], [296, 156]]} defs="pd" kind="request" />
      <Label x={232} y={146} text="all N tokens" anchor="middle" size={13} />
      <Packet points={[[168, 156], [296, 156]]} kind="request" dur={1.6} r={4} />

      <Node size={19} subSize={13} x={296} y={104} w={280} h={104} label="Prefill · compute-bound" sub="one N-row GEMM · saturates FLOPs" icon="model" />
      <Connector points={[[576, 156], [752, 156]]} defs="pd" kind="request" />
      <Label x={664} y={146} text="first token · TTFT" anchor="middle" size={13} />
      <Packet points={[[576, 156], [752, 156]]} kind="request" dur={1.6} delay={-0.8} r={4} />

      <Node size={19} subSize={13} x={752} y={104} w={304} h={104} label="Decode · bandwidth-bound" sub="one 1-row matmul · one token out" icon="cache" />
      <Connector points={loop} defs="pd" kind="change" />
      <Label x={904} y={30} text="every pass re-reads every weight" anchor="middle" size={13} />
      <Label x={904} y={48} text="+ the whole growing KV cache" anchor="middle" size={13} />
      <Packet points={loop} kind="change" dur={1.8} delay={-0.4} r={4} />
    </>
  ),
});
