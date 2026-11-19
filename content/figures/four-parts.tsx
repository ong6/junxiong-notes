/* @jsxRuntime automatic @jsxImportSource react */
import { Connector, Defs, Label, Node, Packet } from "uipack";
import { define, T, TP } from "./_shared";

// Desktop: three parts are text read into the model's window, each at a different
// time; tools are the one part the model calls out to, and a result comes back.
const fromPrompt: [number, number][] = [[296, 72], [520, 72], [520, 192], [560, 192]];
const fromContext: [number, number][] = [[296, 192], [560, 192]];
const fromSkills: [number, number][] = [[296, 312], [520, 312], [520, 192], [560, 192]];
const toTools: [number, number][] = [[752, 192], [856, 192]];

const desktop = (
  <>
    <Defs id="fp" />
    <Node {...T.node} x={32} y={32} w={264} h={80} label="Prompt" sub="system prompt · request" icon="terminal" />
    <Node {...T.node} x={32} y={152} w={264} h={80} label="Context" sub="wiki pages · docs" icon="doc" />
    <Node {...T.node} x={32} y={272} w={264} h={80} label="Skills" sub="SKILL.md · scripts" icon="git" />

    <Connector points={fromPrompt} defs="fp" kind="request" />
    <Label size={T.label} x={408} y={62} text="every request" anchor="middle" />
    <Packet points={fromPrompt} kind="request" dur={2} r={4} />

    <Connector points={fromContext} defs="fp" kind="request" />
    <Label size={T.label} x={408} y={182} text="read when relevant" anchor="middle" />
    <Packet points={fromContext} kind="request" dur={1.8} delay={-0.6} r={4} />

    <Connector points={fromSkills} defs="fp" kind="request" />
    <Label size={T.label} x={408} y={302} text="body loads on match" anchor="middle" />
    <Packet points={fromSkills} kind="request" dur={2} delay={-1.2} r={4} />

    <Node {...T.node} x={560} y={152} w={192} h={80} label="Model" sub="one window" icon="model" accent />

    <Connector points={toTools} defs="fp" kind="change" />
    <Label size={T.label} x={804} y={182} text="call" anchor="middle" />
    <Label size={T.label} x={804} y={216} text="result" anchor="middle" />
    <Packet points={toTools} kind="change" dur={1.4} r={4} />
    <Packet points={toTools} kind="response" dur={1.4} delay={-0.7} r={4} reverse />
    <Node {...T.node} x={856} y={152} w={192} h={80} label="Tools" sub="APIs · shell · MCP" icon="tool" />
  </>
);

// Phone: the same parts stacked. The three inputs share a rail down the right
// edge into the model; the when-labels move into the node subs.
const rail = (y: number): [number, number][] => [[296, y], [328, y], [328, 284], [296, 284]];
const down: [number, number][] = [[160, 312], [160, 368]];

const mobile = (
  <>
    <Defs id="fpm" />
    <Node {...TP.node} x={24} y={16} w={272} h={56} label="Prompt" sub="every request" align="center" />
    <Node {...TP.node} x={24} y={96} w={272} h={56} label="Context" sub="read when relevant" align="center" />
    <Node {...TP.node} x={24} y={176} w={272} h={56} label="Skills" sub="body loads on match" align="center" />
    <Connector points={rail(44)} defs="fpm" kind="request" />
    <Connector points={rail(124)} defs="fpm" kind="request" />
    <Connector points={rail(204)} defs="fpm" kind="request" />
    <Packet points={rail(44)} kind="request" dur={2.2} r={4} />
    <Node {...TP.node} x={24} y={256} w={272} h={56} label="Model" sub="one window" align="center" accent />
    <Connector points={down} defs="fpm" kind="change" />
    <Label size={TP.label} x={172} y={346} text="call · result" anchor="start" />
    <Packet points={down} kind="change" dur={1.2} r={4} />
    <Packet points={down} kind="response" dur={1.2} delay={-0.6} r={4} reverse />
    <Node {...TP.node} x={24} y={368} w={272} h={56} label="Tools" sub="APIs · shell · MCP" align="center" />
  </>
);

export default define({
  alt: "Three parts feed text into the model's one context window at different times: the prompt on every request, context such as wiki pages and docs when it is relevant, and a skill's body only when the task matches its description. Tools are the fourth part and the only one the model calls out to: a call goes from the model to an API, a shell or an MCP server, and a result comes back.",
  viewBox: "0 0 1080 384",
  children: desktop,
  mobile: {
    alt: "The four parts stacked: the prompt on every request, context read when relevant and skills whose body loads on a match all feed the model's one window. Below it, the model calls tools such as APIs, a shell or an MCP server, and results come back.",
    viewBox: "0 0 360 440",
    children: mobile,
  },
});
