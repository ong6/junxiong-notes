# Figure spec for notes.junxiong.dev

Two fences. Both render to SVG at **build time** — no runtime JavaScript, real
`<text>` nodes, and the source stays readable in `/raw/<slug>.md` for agents.
A malformed fence **fails the build with a line/column error**, so a broken
figure can never ship. Run `npm run diagrams` to check your work.

Text after the language word becomes the caption. Always write one — it states
what the figure shows, and it is where the source citation goes.

---

## 1. ```d2 — structural diagrams

D2, laid out with ELK. **Draw the mechanism, not its name.** A box labelled
"cache" says less than the prose; the path a request takes through it, and the
arrow that disappears when it is removed, say what words cannot.

### Working example — copy this shape

````
```d2 Prefill reads the whole prompt in one compute-bound pass. Decode then loops once per token, and every pass re-reads the entire model out of memory.
direction: down

prompt: Prompt\nN tokens {
  style: { stroke: "#6b6459"; fill: transparent; stroke-width: 1; font-size: 22 }
}

prefill: PREFILL\ncompute-bound\n\nOne N-row GEMM over every token\nat once. Saturates FLOPs. {
  style: { fill: "#e4edf9"; stroke: "#2a78d6"; stroke-width: 2; font-size: 22 }
}

step: DECODE\nmemory-bandwidth-bound\n\nOne 1-row matmul. One token out. {
  style: { fill: "#fbe8de"; stroke: "#eb6834"; stroke-width: 2; font-size: 22 }
}

prompt -> prefill: all N tokens { style: { stroke: "#6b6459"; font-size: 20 } }
prefill -> step: first token · TTFT { style: { stroke: "#6b6459"; stroke-width: 2; font-size: 20 } }
```
````

### Sizing — the rule that matters most

Figures break out of the text column into a **960px slot**. A diagram wider than
that is scaled down, and scaling is what makes labels unreadable.

**Target: 900–1150 wide, under 800 tall.** At 1150 the text still lands at ~17px;
at 400 wide and 1300 tall you get a thin ribbon that scrolls forever. Both are
failures, and the second is the more common one.

Check every diagram before you hand it back:

```
npm run diagrams
grep -o 'viewBox="0 0 [0-9]* [0-9]*"' content/diagrams/*.svg
```

**How to hit the target:**

- **`direction: right` is the default.** Vertical stacking is what produces
  1300px-tall ribbons.
- **Collapse loops into a self-edge.** `decode -> decode: every pass re-reads…`
  removes a whole node and a rank. This single change took one diagram from
  399x1016 to 1030x254.
- **Node labels: at most 4 short lines.** In a horizontal layout the longest
  line sets the node width, and three verbose nodes hit 1900px.
- **Too wide?** Shorten labels, or drop a node. Do not switch to vertical — you
  will trade a readable wide diagram for an unreadable tall one.
- **Two-panel comparison?** Stack the panels with `direction: down` at the top
  level and give each container `direction: right`.

### Other rules learned the hard way

- **`font-size: 21` on nodes, `19` on edge labels.** Smaller disappears once the
  SVG is scaled.
- **Never use `|md` blocks.** They collapse multiline text to one line and drop
  the node's box. Use `\n` in a plain label.
- **Avoid deep nesting.** One level of container for a labelled panel is fine;
  nesting beyond that routes edges through parent boxes.
- **Keep edge labels to 1–3 words** unless the edge is the point. Parallel edges
  with long labels collide.
- **Never set a `font-family`,** and never add `sketch: true`.

### Palette — use these hexes only

| Role | Stroke | Fill |
|---|---|---|
| Neutral / input | `#6b6459` | `transparent` |
| Emphasis 1 (blue) | `#2a78d6` | `#e4edf9` |
| Emphasis 2 (orange) | `#eb6834` | `#fbe8de` |
| Emphasis 3 (green) | `#1baf7a` | `#e0f4ec` |
| Callout on a fill | `#eb6834` | `#fffdf9` |

Colour must **mean** something — the two things being contrasted, the hop under
discussion. Do not colour boxes for decoration. D2 bakes a dark palette into the
same file automatically, so ignore dark mode.

---

## 2. ```vega-lite — charts

A Vega-Lite v6 spec as JSON. A shared config already sets the site fonts,
palette, gridlines and a transparent background — **do not set colours, fonts or
background yourself.**

### Working example — copy this shape

````
```vega-lite Prefill and decode differ by ~32x on the same box. Source: llama.cpp DGX Spark thread.
{"title":{"text":"Same box, same weights: prefill vs decode","subtitle":"DGX Spark, gpt-oss-120b, llama.cpp."},
 "height":{"step":38},
 "data":{"values":[{"phase":"Prefill (pp2048)","v":1956},{"phase":"Decode (tg32)","v":60.57}]},
 "encoding":{
   "y":{"field":"phase","type":"nominal","sort":"-x","title":null,"axis":{"labelFontSize":13}},
   "x":{"field":"v","type":"quantitative","title":"tokens / sec","axis":{"grid":true}}},
 "layer":[
   {"mark":{"type":"bar","height":24},"encoding":{"color":{"field":"phase","type":"nominal","legend":null}}},
   {"mark":{"type":"text","align":"left","dx":8,"fontWeight":600,"fontSize":13},
    "encoding":{"text":{"field":"v","type":"quantitative","format":",.4~f"}}}]}
```
````

### Rules

- **Put `color` on the bar layer only, never at the top level.** At the top
  level it also paints the value labels, and text must never wear a series
  colour.
- **Always add the text layer with direct value labels.** The light-mode palette
  sits below 3:1 contrast on this site's surface, so labels are required, not
  optional.
- **`"height":{"step":38}`** for horizontal bars. A fixed `height` crushes rows.
- **Horizontal bars for anything with long labels** (model and hardware names).
  Sort with `"sort":"-x"`.
- **One axis, always zero-based for bars.** Never two measures with different
  units on one chart. Two units → two charts.
- **Put the source in the `subtitle`**, and the interpretation in the caption.
- If lower-is-better (perplexity), say so in the subtitle — a bar chart implies
  bigger-is-more.
- 2–7 bars. More is a table.
- **Watch what the colour implies.** Vega assigns hues in alphabetical order of
  the category, which can land green on the expensive option and orange on the
  cheap one. If a reader would read the palette as good/bad, pin it:
  `"scale":{"domain":["read","base","write"],"range":["#1baf7a","#2a78d6","#eb6834"]}`
- **Keep the subtitle under ~86 characters per line.** Longer is wrapped for you,
  but a very long subtitle still eats the width the plot needs.
- Axis labels get 300px on the y axis before truncating, set centrally. You do
  **not** need `labelLimit` in your spec. Long hardware and model names are fine;
  a full sentence is not.
- A layered chart with an explicit `"sort":[...]` array logs a
  `Domains that should be unioned has conflicting sort properties` warning. It is
  cosmetic and the rendered order is correct — ignore it.

---

## Hard content rules for both

- **Invent no data.** Every number must already appear in the article with its
  citation. Not already there and sourced? You may not chart it.
- **The figure must earn its place.** It should show something the prose cannot
  say as fast — a ratio, a shape, a flow. If a sentence says it quicker, delete
  the figure.
- **2–3 figures per article.** Place each right after the paragraph it
  illustrates, blank line before and after. Do not restate it in the next
  paragraph.
- Change no other prose except a short lead-in clause if needed.
