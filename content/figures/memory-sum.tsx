/* @jsxRuntime automatic @jsxImportSource react */
import { Bus, Connector, Defs, Label, Node, Packet } from "uipack";
import { define } from "./_shared";

const rows = [48, 152, 256];
const stubs = rows.map((y) => ({ at: y + 40, to: 392 }));

export default define({
  alt: "Three memory claims feed one total: Q4 weights at 63 GB for a 120B MoE, the KV cache at real context (Gemma 4 at 128K: 105 GiB; Qwen3-Next at 1M: 24 GiB), and about 20% headroom for the OS and prompt cache. The total resident is 1.5 to 2 times the weights. If it fits RAM the context is usable; over budget means cutting context or quantising harder.",
  viewBox: "0 0 1080 420",
  children: (
    <>
      <Defs id="ms" />
      <Node size={19} subSize={13} x={16} y={rows[0]} w={376} h={80} label="1 · Q4 weights" sub="63 GB, 120B MoE · what most tables count" icon="model" />
      <Node size={19} subSize={13} x={16} y={rows[1]} w={376} h={80} label="2 · KV cache at real context" sub="Gemma 4 @128K: 105 GiB · Qwen3-Next @1M: 24 GiB" icon="cache" />
      <Node size={19} subSize={13} x={16} y={rows[2]} w={376} h={80} label="3 · OS + prompt cache" sub="~20% headroom · 40K ctx: 5s, not 200s" icon="service" />
      <Bus axis="v" at={432} from={rows[0] + 40} to={rows[2] + 40} stubs={[...stubs, { at: 192, to: 472, arrow: true }]} defs="ms" />
      {stubs.map((s, i) => (
        <Packet key={i} points={[[392, s.at], [432, s.at]]} kind="neutral" dur={1.6} delay={-i * 0.5} r={4} />
      ))}
      <Label x={452} y={184} text="plus" anchor="middle" size={13} />
      <Packet points={[[432, 192], [472, 192]]} kind="neutral" dur={1.6} delay={-0.9} r={4} />

      <Node size={19} subSize={13} x={472} y={152} w={232} h={80} label="Total resident" sub="1.5–2× weights" icon="db" accent />

      <Connector points={[[704, 192], [744, 192], [744, 120], [800, 120]]} defs="ms" kind="response" />
      <Label size={14} x={744} y={108} text="fits RAM" anchor="middle" />
      <Packet points={[[704, 192], [744, 192], [744, 120], [800, 120]]} kind="response" dur={1.8} r={4} />
      <Node size={19} subSize={13} x={800} y={88} w={240} h={64} label="Context is usable" icon="chart" />

      <Connector points={[[704, 192], [744, 192], [744, 264], [800, 264]]} defs="ms" kind="change" />
      <Label size={14} x={744} y={288} text="over budget" anchor="middle" />
      <Packet points={[[704, 192], [744, 192], [744, 264], [800, 264]]} kind="change" dur={1.8} delay={-0.9} r={4} />
      <Node size={19} subSize={13} x={800} y={232} w={240} h={64} label="Cut context, or" sub="quantise harder" icon="warning" dashed />
    </>
  ),
});
