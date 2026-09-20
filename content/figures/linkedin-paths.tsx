/* @jsxRuntime automatic @jsxImportSource react */
import { Connector, Defs, Group, Label, Node, Packet } from "uipack";
import { define } from "./_shared";

const xs = [64, 320, 576, 832];

const path = (
  y: number,
  labels: [string, string][],
  kind: "request" | "response",
  accent: boolean,
) => (
  <>
    {labels.map(([label, sub], i) => (
      <g key={label}>
        {i > 0 ? (
          <>
            <Connector
              points={[[xs[i - 1] + 184, y + 32], [xs[i], y + 32]]}
              defs="lip"
              kind={kind}
            />
            <Packet
              points={[[xs[i - 1] + 184, y + 32], [xs[i], y + 32]]}
              kind={kind}
              dur={1.8}
              delay={-i * 0.45}
              r={4}
            />
          </>
        ) : null}
        <Node
          size={18}
          subSize={12}
          x={xs[i]}
          y={y}
          w={184}
          h={64}
          label={label}
          sub={sub}
          icon={i === 0 ? "user" : i === 1 ? "search" : i === 2 ? "doc" : "agent"}
          accent={accent && i >= 1}
        />
      </g>
    ))}
  </>
);

const mobilePath = (
  startY: number,
  labels: [string, string][],
  kind: "request" | "response",
  accent: boolean,
) => (
  <>
    {labels.map(([label, sub], i) => {
      const y = startY + i * 72;
      return (
        <g key={label}>
          {i > 0 ? (
            <>
              <Connector points={[[220, y - 16], [220, y]]} defs="lipm" kind={kind} />
              <Packet points={[[220, y - 16], [220, y]]} kind={kind} dur={1.4} delay={-i * 0.35} r={4} />
            </>
          ) : null}
          <Node
            size={16}
            subSize={11}
            x={48}
            y={y}
            w={344}
            h={56}
            label={label}
            sub={sub}
            icon={i === 0 ? "user" : i === 1 ? "search" : i === 2 ? "doc" : "agent"}
            accent={accent && i >= 1}
          />
        </g>
      );
    })}
  </>
);

export default define({
  alt: "Two hiring paths. In a cold application, the candidate submits into a general queue before a recruiter reviews the resume and starts a conversation. With LinkedIn inbound, the recruiter's title, skills and location search matches the profile first, so the message begins after that initial relevance check.",
  viewBox: "0 0 1080 392",
  children: (
    <>
      <Defs id="lip" />
      <Group titleSize={13} x={24} y={24} w={1032} h={152} title="Cold application · asks the queue to notice you" variant="dashed">
        {path(88, [["Candidate", "chooses one role"], ["Application queue", "starts from zero"], ["Resume review", "first relevance check"], ["Conversation", "if selected"]], "request", false)}
      </Group>
      <Group titleSize={13} x={24} y={216} w={1032} h={152} title="LinkedIn inbound · the match happens before the message" variant="dashed" accent>
        {path(280, [["Profile", "always available"], ["Recruiter search", "title · skills · place"], ["Matched shortlist", "relevance checked"], ["Conversation", "role arrives first"]], "response", true)}
        <Label x={484} y={272} text="matched before contact" anchor="middle" size={12} />
      </Group>
    </>
  ),
  mobile: {
    alt: "Two vertical hiring paths. A cold application moves from candidate to application queue, resume review and then a conversation. LinkedIn inbound moves from an always-available profile through recruiter search and a matched shortlist before the conversation.",
    viewBox: "0 0 440 744",
    children: (
      <>
        <Defs id="lipm" />
        <Group titleSize={11} x={16} y={16} w={408} h={344} title="Cold application · queue first" variant="dashed">
          {mobilePath(64, [["Candidate", "chooses one role"], ["Application queue", "starts from zero"], ["Resume review", "first relevance check"], ["Conversation", "if selected"]], "request", false)}
        </Group>
        <Group titleSize={11} x={16} y={384} w={408} h={344} title="LinkedIn inbound · match first" variant="dashed" accent>
          {mobilePath(432, [["Profile", "always available"], ["Recruiter search", "title · skills · place"], ["Matched shortlist", "relevance checked"], ["Conversation", "role arrives first"]], "response", true)}
        </Group>
      </>
    ),
  },
});
