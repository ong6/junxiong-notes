# UI review, November 2026

A review of notes.junxiong.dev against its new [style spec](../STYLE.md) and UiPack's core rules
(layout floors, type floors, contrast, writing rules), done on 2026-11-07 on branch `site-ui-1`.
Findings are ranked by how much they cost a reader; each has its evidence and the fix, and says
whether this pass implemented it.

## How it was checked

- **Tier 1** (uipack's mechanical grader, uipack `f10d920`): `npm run grade -- check <url>` on
  seven pages (index, `/?category=Career`, `/local-inference-hardware` as the long article with
  diagrams, charts, code and a table, `/ai-stack-roadmap` with the HTML stack chart and note
  clusters, `/why-my-trading-strategies-havent-earned-real-money` as the short article, `/about`,
  a missing page), each at 1440 and 390, light and dark, reduced motion. Run against the live
  site and the local build, with two specs: `STYLE.md` alone, and `uipack-grade.json` (STYLE.md
  plus the figure text floor and the platform faces, see finding 9).
- **Reader read**: screenshots at the same views, measured line length, type steps, figure and
  code sizes, and a comparison of the shared nav and footer with junxiong.dev.
- Reports, crops and before/after screenshots:
  `~/Sideproject/skills-private/.evals/uipack-review/review/sites/notes/` (`grade-before-live/`,
  `grade-before-local/`, `grade-before-local-config/`, `grade-after-local*/`, `before/`, `after/`).
- Not done: tier 2 (judged) review, a real phone or Safari, a screen reader, Lighthouse.

## Tier 1 results

| Check | Before (live and local, config) | After (branch, config) |
| --- | --- | --- |
| `one-h1`, `heading-order` | Fail on the index and filtered index: the only h1 was visually hidden | Pass |
| `focus-visible` | Fail at 390: the scrolling category row clipped 5 focus rings | Pass |
| `tap-targets` | Fail at 390: heading links 29–32px tall (1 on the long article, 18 on the AI-stack article, 2 on the short one) | Pass |
| `text-size` | Fail: desktop diagram labels at 10.78px (floor 11), the swipe hint at 11px and note-card kickers at 11.52px (floor 12) | Pass |
| `font-faces` | Fail with `STYLE.md` alone (system faces, finding 9); pass with the config | Unchanged: an owner decision |
| `overflow-x`, `text-clip`, `text-overlap`, `row-heights`, `contrast`, `img-alt`, `reduced-motion` | Pass | Pass |

Live and local before-runs matched check for check. After, with the config, all seven pages pass in all four views (exit 0). With `STYLE.md`
alone two checks still fail by design: `font-faces` on every page (finding 9) and `text-size` on
the two figure-heavy articles, because without the config the grader holds figure and chart labels
to 12px instead of the core 11px figure floor.

## Findings, by reader impact

### 1. Charts on phones are cropped; the values sit off screen (not implemented)

Evidence: `before/long-390-*.png` at the bandwidth chart. A 900px Vega-Lite chart sits in a
350px column, scrolling sideways at the width that keeps its smallest label at 11px. A reader sees
the labels and the left half of the bars; the value labels and half the legend need a swipe. All
16 Vega-Lite charts across 10 articles do this, and the brief says most readers arrive on a phone.

Fix: an authored phone drawing per chart, as uipack figures already have (`mobile:` in a figure
module, switched at 600px by `lib/rehype-figures.js`). I tried a generic one (each chart rendered
again at 350px): with labels at their authored 14px, the category labels take 150–200px and the
plot drops below 40% of the width, so 0 of 16 charts fit; wrapping labels onto two lines got
one chart to a 133px plot, still too thin, and the legend overflowed. It needs a layout change
per chart (category label above each bar, values inside the bar end, legend as a line of text),
so it is a chart-by-chart job, not a switch. Reverted; the scrolling fallback stays.

### 2. The article starts below the first screen (part implemented)

Evidence: `before/long-1440-light.png`, `before/long-390-light.png`. The masthead (about 200px),
the article header and a contents box with 44px rows (6 headings = 264px of rows) push the first
paragraph to y≈880 at 1440×900 and well past the first screen at 390×844.

- Implemented: contents rows are 28px with a mouse or trackpad on screens wider than 600px (the
  24px pointer floor); touch keeps 44px. The first paragraph and the first heading now show at
  1440×900 (`after/long-1440-light.png`). `app/globals.css`, the `(min-width: 601px) and
  (pointer: fine)` block.
- Proposed: on phones, show the site's tagline only on the index and About (it repeats on every
  article), and show the contents as a closed "Contents (6)" disclosure. Both change what the
  page shows, so they wait for the owner.

### 3. The index has no visible h1 (implemented)

Evidence: `one-h1` and `heading-order` on `/` and `/?category=…` in every view; the h1 was
`<h1 class="sr-only">Notes</h1>`, so the visible outline began at the first article's h2.

Fix: on the index the masthead's site name renders as the h1 (`app/site-title.js`, same look:
`font-weight: 400` on `.masthead .site-title`); other pages keep it a paragraph and have their own
h1. The hidden h1 is removed. The index looks the same (`after/index-*`).

### 4. Diagram labels below the 11px figure floor on desktop (implemented)

Evidence: `text-size` on `/local-inference-hardware` at 1440: 6 labels at 10.78px. The figure
slot was 56rem (896px), while `docs-figures.md` sizes drawings for a 960px slot, so a 13px label
in a 1080 viewBox scaled to 10.8px.

Fix: the slot is 60rem (`--fig-w` in `app/globals.css`), matching the docs; that label now renders
at 11.6px. Phone behaviour is unchanged. Only the seven graded pages were checked; a figure
with 13px labels in a viewBox wider than 1135 would still render under 11px.

### 5. Heading links are small tap targets on phones (implemented)

Evidence: `tap-targets` at 390, e.g. `h2#moe-changed-the-arithmetic > a.heading-anchor` 308×32px.

Fix: `.prose :is(h2, h3) > a.heading-anchor` gets `.5rem` padding pulled back by an equal
negative margin, so the target is 44px and the heading does not move.

### 6. Category-tab focus ring is clipped on phones (implemented)

Evidence: `focus-visible` at 390 on the index: "focus ring clipped by nav.category-filters (needs
6px, has 0px)". The row scrolls sideways, which clips anything outside it.

Fix: under 600px the ring is drawn inside each tab (`outline-offset: -2px`), with `.25rem` side
padding absorbed by the gap and the row's offset, so labels keep their positions.

### 7. Text under the 12px floor outside drawings (implemented)

Evidence: `text-size`: `.fig-swipe` at 11px (bold tracked mono caps) and
`.uipack-notecard__kicker` at 11.52px (`.72rem`). Fix: 12px and `.75rem`.

### 8. Chart colours: the light green series is below 3:1 (not implemented)

Evidence: `SERIES.light[2]` `#1baf7a` in `scripts/render-diagrams.mjs` is 2.77:1 on `#fffdf9`
(marks need 3:1); the orange `#eb6834` is 3.15:1, just over. The comment there already accepts
this and relies on direct labels. Tier 1 does not grade SVG marks, so it passed.

Fix (proposed): use the figure green `#0f7a55` (5.25:1, already the site's `--fig-accent`) for the
light third series. Rendered charts are cached by fence hash, so the light chart SVGs that use the
third series must be deleted and re-rendered; that rewrites committed files under
`content/diagrams/`, which this pass did not touch.

### 9. Faces are system stacks, not self-hosted (owner decision)

Evidence: `font-faces` with `STYLE.md` alone: every sans and mono text fails, because Chromium
draws `ui-sans-serif` as ".SF NS" and the spec names only the generic. The real issue is the core
rule: three faces at most, self-hosted with metric-matched fallbacks. The serif identity is
"Iowan Old Style" on Apple devices only; Windows readers get Palatino Linotype and Android readers
their default serif, so the blog reads differently on each platform.

Options: self-host one serif with an OFL licence (one 400 and one 700 file, a metric-matched
fallback, preloaded), keeping the system sans; or keep the stacks and accept the platform
difference. `uipack-grade.json` lists the macOS faces so the rest of tier 1 can run in the
meantime. Recorded in STYLE.md, Open TODOs.

### 10. Diagrams follow the blog's palette while uipack says Blueprint is fixed (owner decision)

Evidence: `app/globals.css` maps `--uipack-*` onto the warm-paper roles (the `.fig-html, .prose`
block) and `content/figures/_shared.tsx` bakes the same palette into each SVG; uipack's
`docs/components/diagrams.md` makes the Blueprint look `fixed`. Its role contract also says each
style keeps the flow colours in its own palette, so uipack contradicts itself here. STYLE.md lays
out both options (A: Blueprint fixed, B: site palette, today) and leaves the flow rows `TODO:`.
Nothing changed.

### 11. Heading steps are close together, especially on phones (owner decision)

Evidence: body 19px, `h3` 1.3rem (20.8px), `h2` 1.45rem (23.2px), `h1` 2.1rem; at 390 the `h1` is
27.2px against a 23.2px `h2`, a 1.17 step, and the index titles (23.2px) match the `h2`. The
hierarchy rests on weight and space more than size. A type ratio (for example 1.25: `h3` 1.19rem,
`h2` 1.48rem, `h1` 1.85rem) is a spec choice; STYLE.md leaves `--ui-type-ratio` `TODO:`.

### 12. Small consistency items (implemented)

- The topic panel had an 8px radius while every other box uses 6px (one container radius per
  site). Now 6px.
- The footer's GitHub link had no external arrow while "Main site ↗" and junxiong.dev mark every
  external link. Added.

### 13. Smaller notes (not changed)

- **Line length** is good: 61–73 characters at 1440, 38–42 at 390 (`.prose > p` measured).
- **Code blocks**: 13.4px mono, scroll inside their own box on phones. Fine.
- **Tables** fit at 390 with tighter cells; wide ones scroll with edge shadows. Fine.
- **Dark mode** passes contrast everywhere; figures and charts swap with the theme.
- **Spacing** is in rem steps (`.45rem`, `1.15rem`) and not on uipack's 8px base unit. Re-basing
  would shift every margin by a pixel or two; STYLE.md leaves it to the owner.
- **Footer vs junxiong.dev**: the notes footer has no LinkedIn link and no copyright line;
  junxiong.dev has both. A content choice, not a defect.
- **End-of-article line** ("Revised in place rather than reposted — the date above is the one
  that matters.") repeats on every article and uses the corrective "X rather than Y" shape the
  writing research flags. It is site copy, not a post, but the owner's words: left alone.
- **Page weight**: the long article is about 38 KB gzipped (295 KB raw). App Router repeats the
  article HTML in its RSC payload, so raw HTML is roughly double; gzip absorbs most of it.

## Overall critique

The blog's reading surface is strong and already disciplined: one serif column at a comfortable
measure, a quiet palette with a single rust link colour, figures that break out to their own
width, real captions with separate source lines, keyboard and touch work done properly (44px
targets, skip link, visible focus, reduced motion pausing every diagram). Tier 1 found nothing in
contrast, overflow, clipping or motion, which is rare.

Its weaknesses are at the edges of the column. The chrome stacks up before the writing (masthead,
tagline, taxonomy, a tall contents box), the type scale is flat enough that headings lean on bold
alone, and phones get a worse version of the most expensive content, the charts. The identity also
depends on a face only Apple devices have.

## The changes that would improve it most

1. **Phone layouts for the 16 charts** (finding 1): label above each bar, value in or at the bar's
   end, legend as text. Biggest gain for the phone readers the site is designed around.
2. **Self-host the serif** (finding 9): the same page on every platform, and the last tier-1 failure.
3. **Less chrome before the first paragraph on phones** (finding 2): no tagline on articles, a
   closed contents disclosure.
4. **A type ratio** (finding 11): clearer `h1` / `h2` / `h3` steps, especially at 390.
5. **Chart green at 3:1** (finding 8): a one-line palette fix plus a re-render.

## The uipack pin

Kept at `3886f0d` (13 Oct); nothing in this pass needed a newer uipack. Main is 570 commits ahead.
A bump will need:

- `check-spec.ts` and the grader live in uipack's `scripts/` and `src/grade/` from later commits;
  after a bump they run from `node_modules/uipack` (`npx uipack-grade`, `npx tsx
  node_modules/uipack/scripts/check-spec.ts STYLE.md`).
- The chart, article, static and theme sources changed substantially (about 1,070 lines added
  and 310 removed in `src/charts`, `src/article`, `src/static` and `src/theme.css`): re-render every figure
  (`npm run diagrams`) and check the warm-paper overrides still reach figures, HTML charts and
  article parts (`--uipack-*` names, `--uipack-label-font`, `--uipack-article-wide`).
- If uipack starts enforcing the fixed Blueprint values, the site's overrides stop working: the
  diagram decision (finding 10) has to be made first.
- Register the spec in uipack's `siteRegistry` (`playground/docs-manifest.ts`) as
  `junxiong-notes:STYLE.md` with the new pin.
