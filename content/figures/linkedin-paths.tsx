/* @jsxRuntime automatic @jsxImportSource react */
import { Actor, Connector, Defs, Group, Label, Node, Packet } from "uipack";
import { define, T, TP } from "./_shared";

// 200px nodes so "Matched shortlist" fits inside its box. A path that starts with
// a person (the candidate) starts with an Actor; the inbound path is the claim, so
// it takes the accent path.
const xs = [64, 320, 576, 832];
const NODE_W = 200;

const path = (
  y: number,
  labels: [string, string][],
  kind: "request" | "accent",
  accent: boolean,
  actor = false,
) => (
  <>
    {labels.map(([label, sub], i) => (
      <g key={label}>
        {i === 1 && actor ? (
          <>
            <Connector points={[[xs[0] + 128, y + 32], [xs[1], y + 32]]} defs="lip" kind={kind} />
            <Packet points={[[xs[0] + 128, y + 32], [xs[1], y + 32]]} kind={kind} dur={1.8} delay={-0.45} r={4} />
          </>
        ) : i > 0 ? (
          <>
            <Connector
              points={[[xs[i - 1] + NODE_W, y + 32], [xs[i], y + 32]]}
              defs="lip"
              kind={kind}
            />
            <Packet
              points={[[xs[i - 1] + NODE_W, y + 32], [xs[i], y + 32]]}
              kind={kind}
              dur={1.8}
              delay={-i * 0.45}
              r={4}
            />
          </>
        ) : null}
        {i === 0 && actor ? (
          <Actor cx={xs[0] + 100} cy={y + 32} role={label} sub={sub} />
        ) : (
          <Node
            {...T.node}
            x={xs[i]}
            y={y}
            w={NODE_W}
            h={64}
            label={label}
            sub={sub}
            icon={i === 0 ? "browser" : i === 1 ? undefined : i === 2 ? "doc" : "agent"}
            accent={accent && i >= 1}
          />
        )}
      </g>
    ))}
  </>
);

const mobilePath = (
  startY: number,
  labels: [string, string][],
  kind: "request" | "accent",
  accent: boolean,
  actor = false,
) => (
  <>
    {labels.map(([label, sub], i) => {
      const y = startY + i * 72;
      return (
        <g key={label}>
          {i > 0 ? (
            <>
              <Connector points={[[i === 1 && actor ? 180 : 220, y - 16], [i === 1 && actor ? 180 : 220, y]]} defs="lipm" kind={kind} />
              <Packet points={[[i === 1 && actor ? 180 : 220, y - 16], [i === 1 && actor ? 180 : 220, y]]} kind={kind} dur={1.4} delay={-i * 0.35} r={4} />
            </>
          ) : null}
          {i === 0 && actor ? (
            <Actor cx={180} cy={y + 28} role={label} sub={sub} labelSide="right" />
          ) : (
            <Node
              {...TP.node}
              x={48}
              y={y}
              w={344}
              h={56}
              label={label}
              sub={sub}
              icon={i === 0 ? "browser" : i === 1 ? undefined : i === 2 ? "doc" : "agent"}
              accent={accent && i >= 1}
            />
          )}
        </g>
      );
    })}
  </>
);

export default define({
  alt: "Two hiring paths. In a cold application, the candidate submits into a general queue before a recruiter reviews the resume and starts a conversation. With LinkedIn inbound, the recruiter's title, skills and location search matches the profile first, so the message begins after that initial relevance check.",
  viewBox: "0 0 1080 424",
  children: (
    <>
      <Defs id="lip" />
      <Group titleSize={T.label} x={24} y={24} w={1032} h={176} title="Cold application · asks the queue to notice you" variant="dashed">
        {path(88, [["Candidate", "chooses one role"], ["Application queue", "starts from zero"], ["Resume review", "first relevance check"], ["Conversation", "if selected"]], "request", false, true)}
      </Group>
      <Group titleSize={T.label} x={24} y={224} w={1032} h={176} title="LinkedIn inbound · the match happens before the message" variant="dashed" accent>
        {path(296, [["Profile", "always available"], ["Recruiter search", "title · skills · place"], ["Matched shortlist", "relevance checked"], ["Conversation", "role arrives first"]], "accent", true)}
        <Label x={484} y={288} text="matched before contact" anchor="middle" size={T.label} />
      </Group>
    </>
  ),
  mobile: {
    alt: "Two vertical hiring paths. A cold application moves from candidate to application queue, resume review and then a conversation. LinkedIn inbound moves from an always-available profile through recruiter search and a matched shortlist before the conversation.",
    viewBox: "0 0 440 744",
    children: (
      <>
        <Defs id="lipm" />
        <Group titleSize={TP.label} x={16} y={16} w={408} h={344} title="Cold application · queue first" variant="dashed">
          {mobilePath(64, [["Candidate", "chooses one role"], ["Application queue", "starts from zero"], ["Resume review", "first relevance check"], ["Conversation", "if selected"]], "request", false, true)}
        </Group>
        <Group titleSize={TP.label} x={16} y={384} w={408} h={344} title="LinkedIn inbound · match first" variant="dashed" accent>
          {mobilePath(432, [["Profile", "always available"], ["Recruiter search", "title · skills · place"], ["Matched shortlist", "relevance checked"], ["Conversation", "role arrives first"]], "accent", true)}
        </Group>
      </>
    ),
  },
});
