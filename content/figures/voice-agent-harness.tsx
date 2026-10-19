/* @jsxRuntime automatic @jsxImportSource react */
import { Bus, Connector, Defs, Group, Label, Node, Packet } from "uipack";
import { define } from "./_shared";

// A production voice agent as a half-cascade. Blue (request) is the caller's
// turn moving in; green (response) is the reply going back out. The speech layer
// on the left is swappable; the harness on the right is where a call resolves.

const alt =
  "A production voice agent. The caller reaches telephony over the phone network or an app, then a speech layer handles turn detection and barge-in, speech to text, and the voice; one duplex model such as GPT-Live-1 can replace all three. The speech layer passes text to a reasoning model inside the harness. The reasoning model reaches five harness parts: tools and APIs that issue the refund or book the slot, caller context from the CRM and past calls, guardrails for policy and identity checks, a warm handoff to a human, and evals that replay simulated calls against the whole thing.";

const parts = [
  { label: "Tools and APIs", sub: "refund · booking", icon: "tool" as const },
  { label: "Caller context", sub: "CRM · past calls", icon: "db" as const },
  { label: "Guardrails", sub: "policy · identity", icon: "lock" as const },
  { label: "Human handoff", sub: "warm transfer", icon: "user" as const },
  { label: "Evals", sub: "simulated calls", icon: "chart" as const, dashed: true },
];

const cy = 248; // main row
const top = 88; // first harness part
const step = 80;

const desktop = (
  <>
    <Defs id="vh" />

    <Node size={17} subSize={12} x={16} y={cy - 32} w={136} h={64} label="Caller" sub="phone · app" icon="user" />
    <Connector points={[[152, cy], [184, cy]]} defs="vh" kind="request" />
    <Packet points={[[152, cy], [184, cy]]} kind="request" dur={1.4} r={4} />

    <Node size={17} subSize={12} x={184} y={cy - 32} w={168} h={64} label="Telephony" sub="SIP · Twilio" icon="gateway" />
    <Connector points={[[352, cy], [384, cy]]} defs="vh" kind="request" />

    <Group titleSize={13} x={384} y={96} w={232} h={304} title="Speech layer · swappable" variant="dashed">
      <Node size={16} subSize={12} x={400} y={136} w={200} h={56} label="Turn detection" sub="VAD · barge-in" icon="clock" />
      <Node size={16} subSize={12} x={400} y={208} w={200} h={56} label="Speech to text" sub="Deepgram · Scribe" icon="doc" />
      <Node size={16} subSize={12} x={400} y={280} w={200} h={56} label="Voice" sub="ElevenLabs · Cartesia" icon="model" />
      <Label x={500} y={368} text="or one duplex model" anchor="middle" size={12} />
      <Label x={500} y={386} text="(GPT-Live-1)" anchor="middle" size={12} />
    </Group>

    <Connector points={[[616, cy - 16], [672, cy - 16]]} defs="vh" kind="request" />
    <Packet points={[[616, cy - 16], [672, cy - 16]]} kind="request" dur={1.4} delay={-0.7} r={4} />
    <Connector points={[[672, cy + 16], [616, cy + 16]]} defs="vh" kind="response" />
    <Packet points={[[672, cy + 16], [616, cy + 16]]} kind="response" dur={1.4} delay={-0.3} r={4} />
    <Label x={644} y={cy + 4} text="text" anchor="middle" size={12} />

    <Group titleSize={13} x={656} y={40} w={408} h={456} title="Harness · where the call resolves" variant="dashed" accent>
      <Node size={16} subSize={12} x={672} y={cy - 40} w={160} h={80} label="Reasoning model" sub="text · tool calls" icon="agent" accent />
      <Connector points={[[832, cy], [852, cy]]} defs="vh" arrow={false} />
      <Bus
        axis="v"
        at={852}
        from={top + 28}
        to={top + 28 + step * 4}
        defs="vh"
        stubs={parts.map((_, i) => ({ at: top + 28 + i * step, to: 872, arrow: true }))}
      />
      {parts.map((p, i) => (
        <Node
          key={p.label}
          size={16}
          subSize={12}
          x={872}
          y={top + i * step}
          w={176}
          h={56}
          label={p.label}
          sub={p.sub}
          icon={p.icon}
          dashed={p.dashed}
        />
      ))}
    </Group>
  </>
);

export default define({
  alt,
  viewBox: "0 0 1080 512",
  children: desktop,
});
