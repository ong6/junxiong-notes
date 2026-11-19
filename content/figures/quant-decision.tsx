/* @jsxRuntime automatic @jsxImportSource react */
import { Connector, Decision, Defs, Label, Node, Packet } from "uipack";
import { define, T } from "./_shared";

// Two questions as uipack Decisions, each branch a neutral connector (no branch is
// the "right" one; the answer depends on the reader's stack). r = 96 so the longer
// question fits inside its diamond in the label face, with room either side.
type P = [number, number][];
const R = 96;
const Q1 = { cx: 540, cy: 112 };
const Q2 = { cx: 540, cy: 352 };
const toGguf: P = [[Q1.cx - R, Q1.cy], [188, Q1.cy], [188, 232]];
const toMlx: P = [[Q1.cx + R, Q1.cy], [892, Q1.cy], [892, 232]];
const toQ2: P = [[Q1.cx, Q1.cy + R], [Q2.cx, Q2.cy - R]];
const toTuring: P = [[Q2.cx - R, Q2.cy], [260, Q2.cy], [260, 496]];
const toAmpere: P = [[Q2.cx, Q2.cy + R], [Q2.cx, 496]];
const toAda: P = [[Q2.cx + R, Q2.cy], [820, Q2.cy], [820, 496]];

export default define({
  alt: "Decision tree. Which runtime: llama.cpp or Ollama lead to GGUF (UD-Q4_K_XL or Q4_K_M, dynamic bits per layer); Apple Silicon leads to MLX (4-bit or 6-bit, unified memory); vLLM or TGI lead to a second question, which GPU generation: Turing takes GPTQ only with no AWQ kernels, Ampere takes AWQ or W4A16 as the common default, Ada and later take FP8 W8A8 on native FP8 tensor cores.",
  viewBox: "0 0 1080 600",
  children: (
    <>
      <Defs id="qd" />
      <Decision cx={Q1.cx} cy={Q1.cy} r={R} label="Which runtime?" />

      <Connector points={toGguf} defs="qd" />
      <Label x={316} y={Q1.cy - 10} text="llama.cpp · Ollama" anchor="middle" size={T.label} />
      <Packet points={toGguf} kind="neutral" dur={2} r={4} />
      <Connector points={toMlx} defs="qd" />
      <Label x={764} y={Q1.cy - 10} text="Apple Silicon" anchor="middle" size={T.label} />
      <Packet points={toMlx} kind="neutral" dur={2} delay={-1} r={4} />
      <Connector points={toQ2} defs="qd" />
      <Label x={556} y={Q1.cy + R + 30} text="vLLM / TGI" size={T.label} />
      <Packet points={toQ2} kind="neutral" dur={1.4} delay={-0.4} r={4} />

      <Node {...T.node} x={40} y={232} w={296} h={88} label="GGUF" sub="UD-Q4_K_XL or Q4_K_M · dynamic bits" icon="doc" accent />
      <Node {...T.node} x={744} y={232} w={296} h={88} label="MLX" sub="4-bit or 6-bit · unified memory" icon="doc" accent />

      <Decision cx={Q2.cx} cy={Q2.cy} r={R} label="Which GPU generation?" />
      {[toTuring, toAmpere, toAda].map((p, i) => (
        <g key={i}>
          <Connector points={p} defs="qd" />
          <Packet points={p} kind="neutral" dur={1.8} delay={-i * 0.6} r={4} />
        </g>
      ))}
      <Node {...T.node} x={136} y={496} w={248} h={88} label="Turing" sub="GPTQ only · no AWQ kernels" icon="model" />
      <Node {...T.node} x={416} y={496} w={248} h={88} label="Ampere" sub="AWQ / W4A16 · common default" icon="model" />
      <Node {...T.node} x={696} y={496} w={248} h={88} label="Ada+" sub="FP8 W8A8 · native tensor cores" icon="model" />
    </>
  ),
});
