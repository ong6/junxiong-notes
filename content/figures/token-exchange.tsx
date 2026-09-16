/* @jsxRuntime automatic @jsxImportSource react */
import { Connector, Defs, Label, Lane, Node, Packet } from "uipack";
import { define } from "./_shared";

const AGENT = 180;
const BROKER = 540;
const SVC = 900;
const TOP = 88;
const BOTTOM = 500;

export default define({
  alt: "Sequence: the agent sends its own credential plus the user's subject token to the auth broker. The broker downscopes to one audience with a TTL in minutes and returns a short-lived token carrying an act claim. The agent presents only that token to the internal service, which checks audience, scope and expiry.",
  viewBox: "0 0 1080 520",
  children: (
    <>
      <Defs id="te" />
      <Lane size={13} x={0} w={360} y={20} title="Agent" />
      <Lane size={13} x={360} w={360} y={20} title="Auth broker" />
      <Lane size={13} x={720} w={360} y={20} title="Internal service" />
      <Node size={19} subSize={13} x={AGENT - 104} y={32} w={208} h={48} label="Agent" icon="agent" />
      <Node size={19} subSize={13} x={BROKER - 104} y={32} w={208} h={48} label="Auth broker" icon="lock" accent />
      <Node size={19} subSize={13} x={SVC - 104} y={32} w={208} h={48} label="Internal service" icon="service" />
      {[AGENT, BROKER, SVC].map((x) => (
        <Connector key={x} points={[[x, TOP], [x, BOTTOM]]} arrow={false} dashed inset={0} />
      ))}

      <Connector points={[[AGENT, 144], [BROKER, 144]]} defs="te" kind="request" inset={0} />
      <Label size={12} x={(AGENT + BROKER) / 2} y={134} text="own credential + user's subject token" anchor="middle" />
      <Packet points={[[AGENT, 144], [BROKER, 144]]} kind="request" dur={2} r={4} trim={[0, 10]} />

      <Connector points={[[BROKER, 192], [BROKER + 64, 192], [BROKER + 64, 240], [BROKER, 240]]} defs="te" kind="change" inset={0} />
      <Label size={12} x={BROKER + 76} y={210} text="downscope: audience = one service" />
      <Label size={12} x={BROKER + 76} y={228} text="TTL in minutes" />
      <Packet points={[[BROKER, 192], [BROKER + 64, 192], [BROKER + 64, 240], [BROKER, 240]]} kind="change" dur={2} delay={-0.5} r={4} trim={[0, 10]} />

      <Connector points={[[BROKER, 296], [AGENT, 296]]} defs="te" kind="response" inset={0} />
      <Label size={12} x={(AGENT + BROKER) / 2} y={286} text="short-lived token · act claim: agent for user" anchor="middle" />
      <Packet points={[[BROKER, 296], [AGENT, 296]]} kind="response" dur={2} delay={-1} r={4} trim={[0, 10]} />

      <Connector points={[[AGENT, 360], [SVC, 360]]} defs="te" kind="request" inset={0} />
      <Label size={12} x={(BROKER + SVC) / 2} y={350} text="that token, nothing else" anchor="middle" />
      <Packet points={[[AGENT, 360], [SVC, 360]]} kind="request" dur={2.4} delay={-1.5} r={4} trim={[0, 10]} />

      <Connector points={[[SVC, 416], [SVC + 64, 416], [SVC + 64, 464], [SVC, 464]]} defs="te" kind="response" inset={0} />
      <Label size={12} x={SVC - 12} y={434} text="audience is me? scope?" anchor="end" />
      <Label size={12} x={SVC - 12} y={452} text="not expired?" anchor="end" />
      <Packet points={[[SVC, 416], [SVC + 64, 416], [SVC + 64, 464], [SVC, 464]]} kind="response" dur={2} delay={-0.3} r={4} trim={[0, 10]} />
    </>
  ),
});
