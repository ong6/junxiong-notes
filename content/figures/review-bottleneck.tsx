/* @jsxRuntime automatic @jsxImportSource react */
import { Connector, Defs, Group, Label, Node, Packet } from "uipack";
import { define } from "./_shared";

// One pipeline that narrows. Blue packets are changes: they leave the agent
// fast, queue as static chips in front of Review (the narrow step, accented),
// and one slow packet reaches Ship. Underneath, dashed notes name what widens
// each step. Conceptual figure: no numbers anywhere.

const alt =
  "A pipeline from left to right: Write, Check, Review, Ship. The agent writes at agent speed and sends many changes out at once; Check passes them on; they pile up in a queue in front of Review, the narrowest step, which runs at human speed; and only one change at a time reaches Ship, so the team ships at reviewer speed. Underneath, what widens each step: a team harness with a definition of done under Write, fast tests and CI that agents run under Check, and risk tiers that let reviewers read evidence first under Review.";

const F = "claim";

/* ---------- desktop: 1080 wide ---------- */
const cy = 160; // pipeline centre line
const lanes = [cy - 40, cy, cy + 40];
// The backlog: a 5 x 3 pile of static packets packed against Review.
const queue = [0, 1, 2, 3, 4].flatMap((c) => [-16, 0, 16].map((d) => [584 + c * 16, cy + d] as const));
// A packet on a zero-length path holds still: the queue, drawn in the same token as the moving work.
const held = (x: number, y: number, key: number) => (
  <Packet key={key} points={[[x, y], [x, y]]} kind="request" r={6} trim={[0, 0]} at={0} flow={F} />
);

const desktop = (
  <>
    <Defs id="rb" />

    <Node size={19} subSize={13} x={48} y={72} w={160} h={176} label="Write" sub="agent speed" icon="robot" />
    {lanes.map((y, i) => (
      <g key={y}>
        <Connector points={[[208, y], [280, y]]} defs="rb" kind="request" />
        <Packet points={[[208, y], [280, y]]} kind="request" dur={0.9} delay={-i * 0.3} r={4} />
      </g>
    ))}

    <Node size={19} subSize={13} x={280} y={104} w={152} h={112} label="Check" sub="tests · CI" icon="terminal" />
    <Connector points={[[432, cy], [680, cy]]} defs="rb" kind="request" flow={F} />
    <Packet points={[[432, cy], [568, cy]]} kind="request" dur={0.9} r={4} trim={[6, 4]} flow={F} />
    <Packet points={[[432, cy], [568, cy]]} kind="request" dur={0.9} delay={-0.45} r={4} trim={[6, 4]} flow={F} />
    {queue.map(([x, y], i) => held(x, y, i))}
    <Label x={616} y={cy - 36} text="waiting for review" anchor="middle" size={14} />

    <Node size={19} subSize={13} x={680} y={cy - 28} w={152} h={56} label="Review" sub="human speed" icon="user" accent flow={F} />
    <Connector points={[[832, cy], [880, cy]]} defs="rb" kind="request" flow={F} />
    <Packet points={[[832, cy], [880, cy]]} kind="request" dur={3.2} r={4} flow={F} />
    <Node size={19} subSize={13} x={880} y={cy - 28} w={160} h={56} label="Ship" sub="reviewer speed" icon="git" flow={F} />

    <Group x={16} y={280} w={1048} h={128} variant="dashed" accent>
      <Label x={1032} y={356} text="what widens each step" anchor="end" size={14} accent />
      <Node size={17} subSize={13} x={48} y={320} w={176} h={64} label="Team harness" sub="definition of done" icon="doc" dashed />
      <Connector points={[[128, 320], [128, 248]]} defs="rb" dashed />
      <Node size={17} subSize={13} x={264} y={320} w={184} h={64} label="Fast tests + CI" sub="agents run them" icon="terminal" dashed />
      <Connector points={[[356, 320], [356, 216]]} defs="rb" dashed />
      <Node size={17} subSize={13} x={616} y={320} w={216} h={64} label="Risk tiers" sub="review evidence first" icon="lock" dashed />
      <Connector points={[[756, 320], [756, 188]]} defs="rb" dashed />
    </Group>
  </>
);

/* ---------- phone: 440 wide, stacked top to bottom ---------- */
const M = { size: 17, subSize: 14 };
const mx = 152; // spine x
const mq = [0, 1, 2, 3, 4].flatMap((r) => [-16, 0, 16].map((d) => [mx + d, 296 + r * 16] as const));

const mobile = (
  <>
    <Defs id="rbm" />
    <Label x={360} y={28} text="what widens it" anchor="middle" size={14} accent />

    <Node {...M} x={24} y={48} w={256} h={56} label="Write" sub="agent speed" icon="robot" />
    {[88, 152, 216].map((x, i) => (
      <g key={x}>
        <Connector points={[[x, 104], [x, 152]]} defs="rbm" kind="request" />
        <Packet points={[[x, 104], [x, 152]]} kind="request" dur={0.9} delay={-i * 0.3} r={4} />
      </g>
    ))}
    <Node {...M} x={56} y={152} w={192} h={56} label="Check" sub="tests · CI" icon="terminal" />

    <Connector points={[[mx, 208], [mx, 392]]} defs="rbm" kind="request" flow={F} />
    <Packet points={[[mx, 208], [mx, 280]]} kind="request" dur={0.9} r={4} trim={[6, 4]} flow={F} />
    <Packet points={[[mx, 208], [mx, 280]]} kind="request" dur={0.9} delay={-0.45} r={4} trim={[6, 4]} flow={F} />
    {mq.map(([x, y], i) => held(x, y, i))}
    <Label x={184} y={332} text="waiting for review" anchor="start" size={14} />

    <Node {...M} x={80} y={392} w={144} h={56} label="Review" sub="human speed" icon="user" accent flow={F} />
    <Connector points={[[mx, 448], [mx, 496]]} defs="rbm" kind="request" flow={F} />
    <Packet points={[[mx, 448], [mx, 496]]} kind="request" dur={3.2} r={4} flow={F} />
    <Node {...M} x={56} y={496} w={192} h={56} label="Ship" sub="reviewer speed" icon="git" flow={F} />

    <Node size={15} x={304} y={52} w={120} h={48} label="Team harness" align="center" dashed />
    <Connector points={[[304, 76], [280, 76]]} defs="rbm" dashed />
    <Node size={15} x={304} y={156} w={120} h={48} label="Tests + CI" align="center" dashed />
    <Connector points={[[304, 180], [248, 180]]} defs="rbm" dashed />
    <Node size={15} x={304} y={396} w={120} h={48} label="Risk tiers" align="center" dashed />
    <Connector points={[[304, 420], [224, 420]]} defs="rbm" dashed />
  </>
);

export default define({
  alt,
  viewBox: "0 0 1080 424",
  children: desktop,
  mobile: { alt, viewBox: "0 0 440 568", children: mobile },
});
