/* @jsxRuntime automatic @jsxImportSource react */
import { Bus, Connector, Defs, Group, Label, Node, Packet } from "uipack";
import { define } from "./_shared";

const agents = ["Agent A", "Agent B", "Agent C"];
const panel = (y: number, title: string, accent: boolean, kind: "change" | "request") => {
  const rows = agents.map((_, i) => y + 48 + i * 64);
  const mid = rows[1] + 24;
  const stubs = rows.map((r) => ({ at: r + 24, to: 224 }));
  return { rows, mid, stubs, title, accent, kind };
};
const a = panel(16, "Without a broker", false, "change");
const b = panel(288, "With a broker", true, "request");

export default define({
  alt: "Two stacked panels. Without a broker, three agents each hold their own token and reach the internal service directly, leaving three credentials and three logs. With a broker, the agents hold no token; the auth broker is the only path, mints a scoped token for the service, and there is one audit log and one switch to revoke.",
  viewBox: "0 0 1080 560",
  children: (
    <>
      <Defs id="bp" />
      <Group titleSize={13} x={16} y={16} w={1048} h={256} title={a.title} variant="dashed">
        {a.rows.map((r, i) => (
          <Node size={19} subSize={13} key={i} x={48} y={r} w={176} h={48} label={agents[i]} sub="own token" icon="agent" />
        ))}
        <Bus axis="v" at={272} from={a.rows[0] + 24} to={a.rows[2] + 24} kind="change" stubs={[...a.stubs, { at: a.mid, to: 352, arrow: true }]} defs="bp" />
        {a.stubs.map((s, i) => (
          <Packet key={i} points={[[224, s.at], [272, s.at]]} kind="change" dur={1.6} delay={-i * 0.5} r={4} />
        ))}
        <Packet points={[[272, a.mid], [352, a.mid]]} kind="change" dur={1.6} delay={-0.8} r={4} />
        <Node size={19} subSize={13} x={352} y={a.mid - 24} w={208} h={48} label="Internal service" icon="service" />
        <Connector points={[[560, a.mid], [640, a.mid]]} defs="bp" kind="change" />
        <Packet points={[[560, a.mid], [640, a.mid]]} kind="change" dur={1.6} delay={-1.2} r={4} />
        <Node size={19} subSize={13} x={640} y={a.mid - 40} w={392} h={80} label="3 credentials, 3 logs" sub="a leak means hunting every copy" icon="warning" dashed />
      </Group>

      <Group titleSize={13} x={16} y={288} w={1048} h={256} title={b.title} variant="dashed" accent>
        {b.rows.map((r, i) => (
          <Node size={19} subSize={13} key={i} x={48} y={r} w={176} h={48} label={agents[i]} sub="no token" icon="agent" />
        ))}
        <Bus axis="v" at={272} from={b.rows[0] + 24} to={b.rows[2] + 24} kind="request" stubs={[...b.stubs, { at: b.mid, to: 352, arrow: true }]} defs="bp" />
        {b.stubs.map((s, i) => (
          <Packet key={i} points={[[224, s.at], [272, s.at]]} kind="request" dur={1.6} delay={-i * 0.5} r={4} />
        ))}
        <Packet points={[[272, b.mid], [352, b.mid]]} kind="request" dur={1.6} delay={-0.8} r={4} />
        <Node size={19} subSize={13} x={352} y={b.mid - 24} w={200} h={48} label="Auth broker" sub="the only path" icon="lock" accent />
        <Connector points={[[552, b.mid], [656, b.mid]]} defs="bp" kind="response" />
        <Label x={584} y={b.mid - 10} text="scoped token" anchor="middle" size={13} />
        <Packet points={[[552, b.mid], [656, b.mid]]} kind="response" dur={1.6} delay={-1.1} r={4} />
        <Node size={19} subSize={13} x={656} y={b.mid - 24} w={192} h={48} label="Internal service" icon="service" />
        <Connector points={[[848, b.mid], [880, b.mid]]} defs="bp" kind="response" />
        <Packet points={[[848, b.mid], [880, b.mid]]} kind="response" dur={1.6} delay={-1.4} r={4} />
        <Node size={19} subSize={13} x={880} y={b.mid - 40} w={168} h={80} label="1 audit log" sub="1 switch to revoke" icon="doc" accent />
      </Group>
    </>
  ),
});
