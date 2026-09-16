/* @jsxRuntime automatic @jsxImportSource react */
import { Connector, Defs, Label, Node, Packet } from "uipack";
import { define } from "./_shared";

type P = [number, number][];
const toGguf: P = [[540, 80], [540, 116], [188, 116], [188, 152]];
const toQ2: P = [[540, 80], [540, 152]];
const toMlx: P = [[540, 80], [540, 116], [892, 116], [892, 152]];
const q2 = (x: number): P => [[540, 240], [540, 296], [x, 296], [x, 344]];

export default define({
  alt: "Decision tree. Which runtime: llama.cpp or Ollama lead to GGUF (UD-Q4_K_XL or Q4_K_M, dynamic bits per layer); Apple Silicon leads to MLX (4-bit or 6-bit, unified memory); vLLM or TGI lead to a second question, which GPU generation: Turing takes GPTQ only with no AWQ kernels, Ampere takes AWQ or W4A16 as the common default, Ada and later take FP8 W8A8 on native FP8 tensor cores.",
  viewBox: "0 0 1080 460",
  children: (
    <>
      <Defs id="qd" />
      <Node size={19} subSize={13} x={440} y={24} w={200} h={56} label="Which runtime?" icon="tool" />

      <Connector points={toGguf} defs="qd" />
      <Label x={360} y={110} text="llama.cpp · Ollama" anchor="middle" size={13} />
      <Packet points={toGguf} kind="neutral" dur={2} r={4} />
      <Connector points={toQ2} defs="qd" kind="change" />
      <Label x={556} y={126} text="vLLM / TGI" size={13} />
      <Packet points={toQ2} kind="change" dur={1.4} delay={-0.4} r={4} />
      <Connector points={toMlx} defs="qd" />
      <Label x={720} y={110} text="Apple Silicon" anchor="middle" size={13} />
      <Packet points={toMlx} kind="neutral" dur={2} delay={-1} r={4} />

      <Node size={19} subSize={13} x={40} y={152} w={296} h={88} label="GGUF" sub="UD-Q4_K_XL or Q4_K_M · dynamic bits" icon="doc" accent />
      <Node size={19} subSize={13} x={440} y={152} w={200} h={88} label="Which GPU generation?" icon="service" />
      <Node size={19} subSize={13} x={744} y={152} w={296} h={88} label="MLX" sub="4-bit or 6-bit · unified memory" icon="doc" accent />

      {[260, 540, 820].map((x, i) => (
        <g key={x}>
          <Connector points={q2(x)} defs="qd" kind="change" />
          <Packet points={q2(x)} kind="change" dur={1.8} delay={-i * 0.6} r={4} />
        </g>
      ))}
      <Node size={19} subSize={13} x={136} y={344} w={248} h={88} label="Turing" sub="GPTQ only · no AWQ kernels" icon="model" />
      <Node size={19} subSize={13} x={416} y={344} w={248} h={88} label="Ampere" sub="AWQ / W4A16 · common default" icon="model" />
      <Node size={19} subSize={13} x={696} y={344} w={248} h={88} label="Ada+" sub="FP8 W8A8 · native tensor cores" icon="model" />
    </>
  ),
});
