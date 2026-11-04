/* @jsxRuntime automatic @jsxImportSource react */
import { Connector, Defs, Label, Node, Packet } from "uipack";
import { define } from "./_shared";

// Desktop: request path left to right, the decode loop over the engine, and the
// token stream returning along the bottom. Each label sits in a gap wider than
// itself so no node covers it.
const loop: [number, number][] = [[968, 104], [968, 60], [868, 60], [868, 104]];
const back: [number, number][] = [[916, 208], [916, 256], [96, 256], [96, 176]];

const desktop = (
  <>
    <Defs id="sp" />
    <Node size={18} subSize={13} x={24} y={104} w={144} h={72} label="Users" sub="N requests" icon="user" />
    <Connector points={[[168, 140], [240, 140]]} defs="sp" kind="request" />
    <Packet points={[[168, 140], [240, 140]]} kind="request" dur={1.4} r={4} />

    <Node size={18} subSize={13} x={240} y={96} w={192} h={88} label="Router" sub="picks a replica" icon="route" />
    <Connector points={[[432, 140], [512, 140]]} defs="sp" kind="request" />
    <Packet points={[[432, 140], [512, 140]]} kind="request" dur={1.4} delay={-0.7} r={4} />

    <Node size={18} subSize={13} x={512} y={96} w={232} h={88} label="Scheduler" sub="queue · token budget" icon="clock" />
    <Connector points={[[744, 140], [800, 140]]} defs="sp" kind="request" />
    <Label x={772} y={128} text="admit" anchor="middle" size={13} />

    <Node size={18} subSize={13} x={800} y={104} w={256} h={104} label="Forward pass · batch B" sub="weights read once per step" icon="model" />
    <Connector points={loop} defs="sp" kind="change" />
    <Label x={918} y={30} text="one step = one token per sequence" anchor="middle" size={13} />
    <Label x={918} y={48} text="step time = per-token latency" anchor="middle" size={13} />
    <Packet points={loop} kind="change" dur={1.8} delay={-0.4} r={4} />

    <Connector points={back} defs="sp" kind="response" />
    <Label x={506} y={246} text="tokens stream back · first one is TTFT = queue wait + prefill" anchor="middle" size={13} />
    <Packet points={back} kind="response" dur={2.4} r={4} />
  </>
);

const mobile = (
  <>
    <Defs id="spm" />
    <Node size={16} subSize={13} x={24} y={24} w={248} h={64} label="Users" sub="N requests" icon="user" />
    <Connector points={[[148, 88], [148, 120]]} defs="spm" kind="request" />
    <Packet points={[[148, 88], [148, 120]]} kind="request" dur={0.9} r={4} />
    <Node size={16} subSize={13} x={24} y={120} w={248} h={64} label="Router" sub="picks a replica" icon="route" />
    <Connector points={[[148, 184], [148, 216]]} defs="spm" kind="request" />
    <Node size={16} subSize={13} x={24} y={216} w={248} h={64} label="Scheduler" sub="queue · token budget" icon="clock" />
    <Connector points={[[148, 280], [148, 312]]} defs="spm" kind="request" />
    <Node size={16} subSize={13} x={24} y={312} w={248} h={80} label="Forward pass" sub="batch B · B tokens out" icon="model" />
    <Connector points={[[272, 336], [320, 336], [320, 368], [272, 368]]} defs="spm" kind="change" />
    <Packet points={[[272, 336], [320, 336], [320, 368], [272, 368]]} kind="change" dur={1.4} r={4} />
    <Label x={24} y={424} text="loop: one token per sequence per step" anchor="start" size={14} />
    <Label x={24} y={448} text="first token back = queue + prefill" anchor="start" size={14} />
  </>
);

export default define({
  alt: "Requests from many users go through a router that picks a replica, then a scheduler that queues them under a token budget and admits them to the engine. Each forward pass reads the weights once and produces one token for every sequence in the batch, so the step time is everyone's per-token latency. Tokens stream back to users; the first arrives after queue wait plus prefill.",
  viewBox: "0 0 1080 280",
  children: desktop,
  mobile: {
    alt: "Users send requests to a router, then a scheduler with a queue and token budget, then a forward pass that loops once per step, producing one token for every sequence in the batch. The first token back costs queue wait plus prefill.",
    viewBox: "0 0 400 472",
    children: mobile,
  },
});
