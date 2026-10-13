/* @jsxRuntime automatic @jsxImportSource react */
import { Bus, Connector, Defs, Group, Label, Node, Packet } from "uipack";
import { define } from "./_shared";

// Three architectures as three different shapes. Blue (request) is a turn moving
// through the harness; plain lines are composition (what plugs into what);
// dashed is something optional that attaches from outside.

const alt =
  "Three harness architectures. One closed loop, Claude Code: every surface drives one closed binary in which the agent loop, with its subagents, and the Claude-only model adapter are fused; extensions such as hooks, skills, plugins and mods attach from outside. Plugin kernel, DeepSeek Harness: a preset, a YAML list of plugins such as Minimal, Standard or PTC, composes the Cordis kernel, and the agent loop, the model adapters, the tools and the surfaces all plug into it as plugins, the loop no more privileged than the rest. Gateway daemon, Hermes Agent: chat platforms reach an always-on gateway that owns sessions, cron and delivery and runs a fresh agent loop for each turn, or hands the turn to Codex's engine; the loop calls any model with a fallback chain, keeps memory and the skills it writes, and runs commands on a chosen backend such as Docker or SSH.";

const plugins = [
  { label: "Agent loop, a plugin too", icon: "agent" as const, accent: true },
  { label: "Model adapters", icon: "model" as const },
  { label: "Tools · MCP · run_code", icon: "tool" as const },
  { label: "Surfaces · Web · SDK · ACP", icon: "browser" as const },
];
const side = [
  { label: "Any model", sub: "fallback chain", icon: "model" as const },
  { label: "Memory", sub: "skills it writes", icon: "doc" as const },
  { label: "Backends", sub: "Docker · SSH", icon: "cloud" as const },
];

/* ---------- desktop: three panels, 1080 wide ---------- */
const r1 = 136; // closed loop
const r2 = 388; // kernel bar
const r3 = 628; // gateway

const desktop = (
  <>
    <Defs id="ha" />

    <Group titleSize={13} x={16} y={16} w={1048} h={232} title="One closed loop · Claude Code" variant="dashed">
      <Node size={19} subSize={13} x={48} y={r1 - 32} w={200} h={64} label="Surfaces" sub="CLI · IDE · web · SDK" icon="terminal" />
      <Connector points={[[248, r1], [312, r1]]} defs="ha" kind="request" />
      <Packet points={[[248, r1], [312, r1]]} kind="request" dur={1.6} r={4} />
      <Group titleSize={12} x={288} y={64} w={560} h={168} title="One closed binary" variant="solid">
        <Node size={19} subSize={13} x={312} y={r1 - 32} w={232} h={64} label="Agent loop" sub="tools · MCP" icon="agent" accent />
        <Connector points={[[544, r1], [616, r1]]} defs="ha" kind="request" />
        <Packet points={[[544, r1], [616, r1]]} kind="request" dur={1.6} delay={-0.8} r={4} />
        <Node size={19} subSize={13} x={616} y={r1 - 32} w={208} h={64} label="Claude models" sub="Claude only" icon="model" />
        <Connector points={[[488, r1 + 32], [488, r1 + 64], [368, r1 + 64], [368, r1 + 32]]} defs="ha" kind="request" />
        <Label x={428} y={r1 + 84} text="subagents: the same loop again" anchor="middle" size={13} />
      </Group>
      <Node size={19} subSize={13} x={880} y={r1 - 32} w={160} h={64} label="Extensions" sub="hooks · mods" icon="tool" dashed />
      <Connector points={[[880, r1], [852, r1]]} defs="ha" dashed />
      <Label x={960} y={r1 - 44} text="attach at fixed points" anchor="middle" size={13} />
    </Group>

    <Group titleSize={13} x={16} y={264} w={1048} h={240} title="Plugin kernel · DeepSeek Harness" variant="dashed" accent>
      <Node size={19} subSize={13} x={48} y={r2 - 40} w={200} h={80} label="Preset" sub="Minimal · Standard · PTC" icon="doc" />
      <Connector points={[[248, r2], [320, r2]]} defs="ha" />
      <Label x={284} y={r2 - 12} text="YAML" anchor="middle" size={13} />
      {/* the kernel is a bar that everything plugs into; nothing sits above it */}
      <Node size={19} subSize={13} x={320} y={r2 - 28} w={712} h={56} label="Cordis kernel" sub="services · typed events · registrations undone on unload" icon="service" accent />
      {plugins.map((p, i) => {
        const x = i % 2 === 0 ? 336 : 688;
        const top = i < 2;
        const y = top ? r2 - 92 : r2 + 44;
        const cx = x + 168;
        return (
          <g key={p.label}>
            <Node size={17} x={x} y={y} w={336} h={48} label={p.label} icon={p.icon} accent={p.accent} />
            <Connector points={top ? [[cx, y + 48], [cx, r2 - 28]] : [[cx, r2 + 28], [cx, y]]} defs="ha" arrow={false} />
          </g>
        );
      })}
    </Group>

    <Group titleSize={13} x={16} y={520} w={1048} h={208} title="Gateway daemon · Hermes Agent" variant="dashed">
      <Node size={19} subSize={13} x={48} y={r3 - 32} w={200} h={64} label="Chat platforms" sub="Telegram · Slack · CLI" icon="user" />
      <Connector points={[[248, r3], [312, r3]]} defs="ha" kind="request" />
      <Packet points={[[248, r3], [312, r3]]} kind="request" dur={1.6} delay={-0.2} r={4} />
      <Group titleSize={12} x={288} y={560} w={552} h={152} title="Always on" variant="solid">
        <Node size={19} subSize={13} x={312} y={r3 - 32} w={216} h={64} label="Gateway" sub="sessions · cron · delivery" icon="gateway" accent />
        <Connector points={[[528, r3], [584, r3]]} defs="ha" kind="request" />
        <Packet points={[[528, r3], [584, r3]]} kind="request" dur={1.6} delay={-1} r={4} />
        <Node size={19} subSize={13} x={600} y={r3 - 16} w={216} h={64} label="" dashed />
        <Node size={19} subSize={13} x={592} y={r3 - 24} w={216} h={64} label="" dashed />
        <Node size={19} subSize={13} x={584} y={r3 - 32} w={216} h={64} label="Agent loop" sub="fresh each turn, or Codex's" icon="agent" />
      </Group>
      <Connector points={[[800, r3], [856, r3]]} defs="ha" kind="request" arrow={false} />
      <Bus axis="v" at={856} from={r3 - 56} to={r3 + 56} kind="request" defs="ha" stubs={[-56, 0, 56].map((d) => ({ at: r3 + d, to: 880, arrow: true }))} />
      {side.map((s, i) => (
        <Node key={s.label} size={17} subSize={13} x={880} y={r3 - 80 + i * 56} w={160} h={48} label={s.label} sub={s.sub} icon={s.icon} />
      ))}
    </Group>
  </>
);

/* ---------- phone: the same three shapes, stacked, 440 wide, under 900 tall ---------- */
const M = { size: 17, subSize: 14 };
const p1 = 8; // panel tops
const p2 = 292;
const p3 = 584;
const short = ["Agent loop", "Model adapters", "Tools · MCP", "Surfaces"];

const mobile = (
  <>
    <Defs id="ham" />

    <Group titleSize={14} x={8} y={p1} w={424} h={272} title="One closed loop · Claude Code" variant="dashed">
      <Node {...M} x={32} y={p1 + 36} w={376} h={44} label="Surfaces" sub="CLI · IDE · web · SDK" icon="terminal" />
      <Connector points={[[220, p1 + 80], [220, p1 + 100]]} defs="ham" kind="request" />
      <Group titleSize={14} x={24} y={p1 + 100} w={392} h={104} title="One closed binary" variant="solid">
        <Node {...M} x={40} y={p1 + 132} w={168} h={56} label="Agent loop" sub="tools · MCP" icon="agent" accent />
        <Connector points={[[208, p1 + 160], [232, p1 + 160]]} defs="ham" kind="request" />
        <Node {...M} x={232} y={p1 + 132} w={168} h={56} label="Claude" sub="Claude only" icon="model" />
      </Group>
      <Connector points={[[220, p1 + 220], [220, p1 + 204]]} defs="ham" dashed />
      <Node {...M} x={32} y={p1 + 220} w={376} h={44} label="Extensions" sub="hooks · mods" icon="tool" dashed />
    </Group>

    <Group titleSize={14} x={8} y={p2} w={424} h={280} title="Plugin kernel · DeepSeek Harness" variant="dashed" accent>
      <Node {...M} x={32} y={p2 + 36} w={376} h={44} label="Preset" sub="Minimal · Standard · PTC" icon="doc" />
      <Connector points={[[220, p2 + 80], [220, p2 + 96]]} defs="ham" />
      <Node {...M} x={32} y={p2 + 96} w={376} h={48} label="Cordis kernel" sub="services · events · undo" icon="service" accent />
      <Bus axis="v" at={220} from={p2 + 144} to={p2 + 238} defs="ham" stubs={[182, 238].flatMap((d) => [{ at: p2 + d, to: 212 }, { at: p2 + d, to: 228 }])} />
      {plugins.map((p, i) => (
        <Node key={p.label} size={16} x={i % 2 === 0 ? 32 : 228} y={p2 + (i < 2 ? 160 : 216)} w={180} h={44} label={short[i]} icon={p.icon} accent={p.accent} />
      ))}
    </Group>

    <Group titleSize={14} x={8} y={p3} w={424} h={288} title="Gateway daemon · Hermes Agent" variant="dashed">
      <Node {...M} x={32} y={p3 + 36} w={376} h={44} label="Chat platforms" sub="Telegram · Slack · CLI" icon="user" />
      <Connector points={[[220, p3 + 80], [220, p3 + 96]]} defs="ham" kind="request" />
      <Group titleSize={14} x={24} y={p3 + 96} w={392} h={112} title="Always on" variant="solid">
        <Node {...M} x={40} y={p3 + 128} w={160} h={56} label="Gateway" sub="sessions · cron" icon="gateway" accent />
        <Connector points={[[200, p3 + 156], [224, p3 + 156]]} defs="ham" kind="request" />
        <Node {...M} x={240} y={p3 + 144} w={160} h={56} label="" dashed />
        <Node {...M} x={232} y={p3 + 136} w={160} h={56} label="" dashed />
        <Node {...M} x={224} y={p3 + 128} w={160} h={56} label="Agent loop" sub="each turn" icon="agent" />
      </Group>
      <Connector points={[[304, p3 + 184], [304, p3 + 224]]} defs="ham" kind="request" arrow={false} />
      <Bus axis="h" at={p3 + 224} from={92} to={348} kind="request" defs="ham" stubs={[92, 220, 348].map((x) => ({ at: x, to: p3 + 240, arrow: true }))} />
      {side.map((s, i) => (
        <Node key={s.label} size={16} x={32 + i * 128} y={p3 + 240} w={120} h={40} label={s.label} align="center" />
      ))}
    </Group>
  </>
);

export default define({
  alt,
  viewBox: "0 0 1080 744",
  children: desktop,
  mobile: { alt, viewBox: "0 0 440 880", children: mobile },
});
