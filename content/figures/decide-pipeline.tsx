/* @jsxRuntime automatic @jsxImportSource react */
import { Chip, Connector, Cross, Defs, Label, Lane, Node, Packet, Wall } from "uipack";
import { define, T, TP, Text } from "./_shared";

// The decide skill as a funnel that widens before it narrows. A question is
// sized first; a cheap, reversible one exits early with a quick pick. The
// frame step fans the two offered options out to four (orange = the two the
// user did not list). Three walls (inputs, numbers, downside) each stop one
// option; which option dies where is illustrative, not measured. The survivor
// is pre-mortemed and becomes the one pick (the accent path), and the tripwire set with
// it loops back to the frame step if it trips.

type Opt = { label: string; mobile: string; added: boolean; stop: number }; // stop: wall index 1-3, 0 survives
const opts: Opt[] = [
  { label: "X", mobile: "X", added: false, stop: 3 },
  { label: "Y", mobile: "Y", added: false, stop: 1 },
  { label: "Neither", mobile: "Neither", added: true, stop: 2 },
  { label: "Third path", mobile: "3rd path", added: true, stop: 0 },
];
const walls: [string, string][] = [
  ["Inputs", "hope→odds"],
  ["Numbers", "EV · cost"],
  ["Downside", "survive?"],
];

const F = "pick";

/* ---------- desktop: left to right, 1144 wide ---------- */
const CY = 240; // main row centre
const lanes = [168, 216, 264, 312];
const wx = [640, 736, 832];
const W_TOP = 144;
const W_BOT = 336;
const CHIP_X = 480;
const CHIP_W = 112;
const TRUNK_X = 456;

const desktop = (
  <>
    <Defs id="dp" />
    <Lane x={160} w={120} y={64} title="Size" size={T.label} />
    <Lane x={312} w={280} y={64} title="Widen" size={T.label} />
    <Lane x={616} w={376} y={64} title="Narrow" size={T.label} />
    <Lane x={1024} w={104} y={64} title="Commit" size={T.label} />

    <Node x={24} y={208} w={104} h={64} label="Question" sub="X or Y?" {...T.compact} align="center" />
    <Connector points={[[128, CY], [160, CY]]} defs="dp" kind="request" />

    <Node x={160} y={208} w={120} h={64} label="Size it" sub="stakes · undo" {...T.compact} align="center" />
    <Connector points={[[220, 272], [220, 344]]} defs="dp" kind="request" />
    <Label x={220} y={312} text="cheap to undo" anchor="middle" size={T.label} />
    <Node x={156} y={344} w={128} h={64} label="Quick pick" sub="+ cheap test" {...T.compact} align="center" dashed />

    <Connector points={[[280, CY], [312, CY]]} defs="dp" kind="request" />
    <Packet points={[[280, CY], [312, CY]]} kind="request" dur={0.9} r={4} trim={[4, 10]} />

    <Node x={312} y={208} w={120} h={64} label="Frame" sub="real question" {...T.compact} align="center" />

    {/* fan-out: one trunk, four stubs into the options */}
    <Connector points={[[432, CY], [TRUNK_X, CY]]} arrow={false} inset={[2, 0]} />
    <Connector points={[[TRUNK_X, lanes[0]], [TRUNK_X, lanes[3]]]} arrow={false} inset={0} />
    {opts.map((o, i) => (
      <Connector key={o.label} points={[[TRUNK_X, lanes[i]], [CHIP_X, lanes[i]]]} defs="dp" kind={o.added ? "change" : undefined} inset={[0, 2]} />
    ))}
    {opts.map((o, i) => (
      <Chip key={o.label} x={CHIP_X} y={lanes[i] - 16} w={CHIP_W} h={32} label={o.label} kind={o.added ? "change" : undefined} size={13} flow={o.stop === 0 ? F : undefined} />
    ))}
    <Label x={CHIP_X + CHIP_W / 2} y={360} text="+2 you didn't list" anchor="middle" size={T.label} />

    {walls.map(([name, sub], k) => (
      <g key={name}>
        <Text x={wx[k]} y={112} size={T.compact.size} bold>{name}</Text>
        <Text x={wx[k]} y={130} size={T.label} mono muted>{sub}</Text>
      </g>
    ))}

    {opts.map((o, i) => {
      const y = lanes[i];
      if (o.stop === 0) {
        const pts: [number, number][] = [[CHIP_X + CHIP_W, y], [872, y]];
        return (
          <g key={o.label}>
            <Connector points={pts} defs="dp" kind="accent" flow={F} />
            <Packet points={pts} kind="accent" dur={2} r={5} flow={F} />
          </g>
        );
      }
      const cx = wx[o.stop - 1] - 16; // the cross sits clear of the wall's face
      return (
        <g key={o.label}>
          <Connector points={[[CHIP_X + CHIP_W, y], [cx - 8, y]]} arrow={false} />
          <Cross x={cx} y={y} />
        </g>
      );
    })}
    {wx.map((x, k) => (
      <Wall key={x} at={x} from={W_TOP} to={W_BOT} axis="v" thickness={14} holes={lanes.filter((_, i) => opts[i].stop === 0 || opts[i].stop > k + 1)} />
    ))}

    <Node x={872} y={280} w={120} h={64} label="Pre-mortem" sub="fix top cause" {...T.compact} align="center" flow={F} />
    <Connector points={[[992, 312], [1024, 312]]} defs="dp" kind="accent" flow={F} />
    <Node x={1024} y={280} w={104} h={64} label="One pick" sub="+ flip fact" {...T.compact} align="center" accent flow={F} />
    <Connector points={[[1076, 344], [1076, 376]]} defs="dp" kind="accent" flow={F} />
    <Node x={1024} y={376} w={104} h={64} label="Tripwire" sub="X by date Y" {...T.compact} align="center" flow={F} />

    {/* the tripwire, if it trips, reopens the decision at the frame step */}
    <Connector points={[[1024, 408], [372, 408], [372, 272]]} defs="dp" kind="change" dashed />
    <Packet points={[[1024, 408], [372, 408], [372, 272]]} kind="change" dur={4} r={4} />
    <Label x={700} y={412} text="tripped → re-decide" anchor="middle" size={T.label} />
  </>
);

/* ---------- phone: top to bottom, 440 wide ---------- */
const mLanes = [48, 120, 208, 304];
const mChipW = [56, 56, 88, 88];
const mWalls = [408, 472, 536];
const M_CHIP_Y = 328;
const M_TRUNK_Y = 296;

const mobile = (
  <>
    <Defs id="dpm" />
    <Node x={40} y={24} w={224} h={56} label="Question" sub="X or Y?" {...TP.node} align="center" />
    <Connector points={[[152, 80], [152, 112]]} defs="dpm" kind="request" />
    <Node x={40} y={112} w={224} h={64} label="Size it" sub="stakes · undo" {...TP.node} align="center" />
    <Connector points={[[264, 144], [296, 144]]} defs="dpm" kind="request" />
    <Node x={296} y={112} w={128} h={64} label="Quick pick" sub="+ cheap test" {...TP.node} align="center" dashed />
    <Connector points={[[152, 176], [152, 208]]} defs="dpm" kind="request" />
    <Packet points={[[152, 176], [152, 208]]} kind="request" dur={0.9} r={4} trim={[4, 10]} />
    <Node x={40} y={208} w={224} h={64} label="Frame" sub="real question" {...TP.node} align="center" />
    <Text x={296} y={248} size={TP.label} mono bold anchor="start">WIDEN ↓</Text>

    <Connector points={[[152, 272], [152, M_TRUNK_Y]]} arrow={false} inset={[2, 0]} />
    <Connector points={[[mLanes[0], M_TRUNK_Y], [mLanes[3], M_TRUNK_Y]]} arrow={false} inset={0} />
    {opts.map((o, i) => (
      <Connector key={o.label} points={[[mLanes[i], M_TRUNK_Y], [mLanes[i], M_CHIP_Y]]} defs="dpm" kind={o.added ? "change" : undefined} inset={[0, 2]} />
    ))}
    {opts.map((o, i) => (
      <Chip key={o.label} x={mLanes[i] - mChipW[i] / 2} y={M_CHIP_Y} w={mChipW[i]} h={32} label={o.mobile} kind={o.added ? "change" : undefined} size={TP.label} />
    ))}

    <Text x={352} y={384} size={TP.label} mono bold anchor="start">NARROW ↓</Text>
    {walls.map(([name, sub], k) => (
      <g key={name}>
        <Text x={352} y={mWalls[k] + 2} size={TP.node.size} bold anchor="start">{name}</Text>
        <Text x={352} y={mWalls[k] + 20} size={TP.label} mono muted anchor="start">{sub}</Text>
      </g>
    ))}
    {opts.map((o, i) => {
      const x = mLanes[i];
      const top = M_CHIP_Y + 32;
      if (o.stop === 0) {
        const pts: [number, number][] = [[x, top], [x, 584]];
        return (
          <g key={o.label}>
            <Connector points={pts} defs="dpm" kind="accent" />
            <Packet points={pts} kind="accent" dur={1.8} r={5} />
          </g>
        );
      }
      const cy = mWalls[o.stop - 1] - 16;
      return (
        <g key={o.label}>
          <Connector points={[[x, top], [x, cy - 8]]} arrow={false} />
          <Cross x={x} y={cy} />
        </g>
      );
    })}
    {mWalls.map((y, k) => (
      <Wall key={y} at={y} from={20} to={340} axis="h" thickness={14} holes={mLanes.filter((_, i) => opts[i].stop === 0 || opts[i].stop > k + 1)} />
    ))}

    <Node x={208} y={584} w={192} h={56} label="Pre-mortem" sub="fix top cause" {...TP.node} align="center" />
    <Connector points={[[304, 640], [304, 672]]} defs="dpm" kind="accent" />
    <Node x={208} y={672} w={192} h={56} label="One pick" sub="+ flip fact" {...TP.node} align="center" accent />
    <Connector points={[[304, 728], [304, 760]]} defs="dpm" kind="accent" />
    <Node x={208} y={760} w={192} h={56} label="Tripwire" sub="X by date Y" {...TP.node} align="center" />

    <Connector points={[[208, 788], [12, 788], [12, 240], [40, 240]]} defs="dpm" kind="change" dashed />
    <Packet points={[[208, 788], [12, 788], [12, 240], [40, 240]]} kind="change" dur={4.5} r={4} />
    <Label x={100} y={792} text="re-decide" anchor="middle" size={TP.label} />
  </>
);

export default define({
  alt: "The decide skill as a flow from left to right. A question is sized first: a decision that is cheap to undo exits early as a quick pick with a cheap test. A consequential one goes to the frame step, which turns the two offered options, X and Y, into four by adding neither and a third path, the two the user did not list. Three walls then narrow the set: checking the inputs turns hopes into odds and stops one option, the numbers that decide it stop a second, and the downside check stops a third. Which option stops where is illustrative. The survivor is pre-mortemed and becomes one pick with the fact that would flip it, and a tripwire set at the same time loops back to the frame step to reopen the decision if it trips.",
  viewBox: "0 0 1144 464",
  children: desktop,
  mobile: {
    alt: "The decide skill top to bottom. A question is sized; a decision that is cheap to undo exits right as a quick pick with a cheap test. Otherwise the frame step widens the two offered options, X and Y, to four by adding neither and a third path. Three walls, inputs, numbers and downside, each stop one option; which one stops where is illustrative. The survivor is pre-mortemed, becomes one pick with its flip fact, and gets a tripwire whose dashed line loops back up to the frame step to reopen the decision.",
    viewBox: "0 0 440 840",
    children: mobile,
  },
});
