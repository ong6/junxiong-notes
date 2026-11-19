/* @jsxRuntime automatic @jsxImportSource react */
import { Activation, Defs, Label, Lifeline, Message, Node, SelfLoop } from "uipack";
import { define, T } from "./_shared";

// A sequence built from uipack's sequence parts: participants are Nodes, time runs
// down their lifelines, each message is numbered on its sender's lifeline, and the
// two steps a participant does on its own are self-loops over an activation bar.
const AGENT = 140;
const BROKER = 580;
const SVC = 920;
const TOP = 80;
const BOTTOM = 504;

export default define({
  alt: "Sequence: the agent sends its own credential plus the user's subject token to the auth broker. The broker downscopes to one audience with a TTL in minutes and returns a short-lived token carrying an act claim. The agent presents only that token to the internal service, which checks audience, scope and expiry.",
  viewBox: "0 0 1080 520",
  children: (
    <>
      <Defs id="te" />
      <Node {...T.node} x={AGENT - 104} y={24} w={208} h={56} label="Agent" icon="agent" />
      <Node {...T.node} x={BROKER - 104} y={24} w={208} h={56} label="Auth broker" icon="lock" accent />
      <Node {...T.node} x={SVC - 104} y={24} w={208} h={56} label="Internal service" icon="service" />
      {[AGENT, BROKER, SVC].map((x) => (
        <Lifeline key={x} x={x} y1={TOP} y2={BOTTOM} />
      ))}

      <Message id="te" from={AGENT} to={BROKER} y={144} n={1} kind="request" label="own credential + user's subject token" labelSize={T.label} packet={{ dur: 2 }} />

      <Activation x={BROKER} y1={180} y2={252} accent />
      <SelfLoop id="te" x={BROKER} y={192} h={48} w={64} side="right" n={2} kind="change" packet={{ dur: 2, delay: -0.5 }} />
      <Label size={T.label} x={BROKER - 20} y={210} text="downscope: audience = one service" anchor="end" />
      <Label size={T.label} x={BROKER - 20} y={228} text="TTL in minutes" anchor="end" />

      <Message id="te" from={BROKER} to={AGENT} y={296} n={3} kind="response" dashed label="short-lived token · act claim: agent for user" labelX={330} labelSize={T.label} packet={{ dur: 2, delay: -1 }} />

      <Message id="te" from={AGENT} to={SVC} y={360} n={4} kind="request" label="that token, nothing else" labelX={(BROKER + SVC) / 2} labelSize={T.label} packet={{ dur: 2.4, delay: -1.5 }} />

      <Activation x={SVC} y1={404} y2={476} />
      <SelfLoop id="te" x={SVC} y={416} h={48} w={64} side="right" n={5} kind="response" packet={{ dur: 2, delay: -0.3 }} />
      <Label size={T.label} x={SVC - 20} y={434} text="audience is me? scope?" anchor="end" />
      <Label size={T.label} x={SVC - 20} y={452} text="not expired?" anchor="end" />
    </>
  ),
});
