---
spec: junxiong-notes
site: notes.junxiong.dev
extends: core
pages: [landing, article]
layouts: { landing: custom, article: layer-article }
components: { diagrams: blueprint }
diagram-themes: { default: notes }
status: draft
uipack: 1.0.0
values: none
---

# notes.junxiong.dev: style spec

This spec describes the blog as it is built today (`app/globals.css`, `app/layout.js`,
`content/figures/_shared.tsx`, `scripts/render-diagrams.mjs`). It does not ask uipack to render
the look: the site paints itself and maps its colours onto the `--uipack-*` tokens for the parts it
borrows (figures, HTML charts, article parts). A value the site does not have, or that only the
owner can choose, is a `TODO:` with what would decide it. Written from uipack's
[template](https://github.com/ong6/uipack/blob/main/docs/specs/TEMPLATE.md) and checked with
`scripts/check-spec.ts`.

The index is mapped onto the `landing` page type because uipack's library has no index or list
page type; its layout is `custom` below. The About page and the 404 page use the article layout.

## Identity

Working notes by one engineer, read mostly by people arriving from junxiong.dev or a shared link,
often on a phone. It should feel like a printed notebook page: warm paper, near-black ink, a serif
for everything you read, a small system sans for everything you operate, and one rust accent that
means "this is a link". The recognisable idea is restraint: a single 44rem text column, no images
in the chrome, no hero, no cards with shadows; the figures are the only thing that breaks the
column. It is not a magazine, not a product site and not a docs shell: there is no sidebar, no
sticky header and no marketing copy.

## Role values

Colours are the live values in `app/globals.css` (`:root` and the two identical dark blocks).
Faces are the site's system stacks; nothing is self-hosted.

<!-- generated:contract-roles -->
| Role | Light | Dark |
| --- | --- | --- |
| `--ui-paper` | `#fffdf9` | `#12110f` |
| `--ui-surface` | `#f6f2ea` | `#1b1917` |
| `--ui-surface-raised` | TODO: the site has no raised box off its panels (note cards inside a cluster use the paper); decide if one is needed | TODO: as light |
| `--ui-surface-2` | `#f3efe7` (the code ground, `--code-bg`) | `#1b1917` |
| `--ui-ink` | `#14110d` | `#ece7de` |
| `--ui-ink-2` | `#6b6459` | `#aaa195` |
| `--ui-ink-3` | TODO: the site uses two ink steps only; a third would be the owner's choice | TODO: as light |
| `--ui-line` | `#d9d2c5` | `#423d35` |
| `--ui-line-soft` | TODO: one rule weight today (`--faint`); a softer hairline is unchosen | TODO: as light |
| `--ui-accent` | `#9a3412` | `#f0854f` |
| `--ui-on-accent` | TODO: nothing is filled with the accent today | TODO: as light |
| `--ui-accent-surface` | TODO: no accent-tone slide or band (the site has no deck); `--accent-soft` `#f0e5dc` is the selected-chip tint | TODO: `--accent-soft` dark is `#2a1d16` |
| `--ui-accent-ink-2` | TODO: no accent-tone surface | TODO: as light |
| `--ui-accent-line` | TODO: no accent-tone surface | TODO: as light |
| `--ui-flow-request` | `#2a78d6` (the `notes` diagram theme, see Component looks) | `#3987e5` |
| `--ui-flow-response` | `#0f7a55` (`notes`) | `#199e70` |
| `--ui-flow-change` | `#eb6834` (`notes`) | `#d95926` |
| `--ui-data-pos` | TODO: no signed values on the site yet | TODO: as light |
| `--ui-data-neg` | TODO: no signed values on the site yet | TODO: as light |
| `--ui-data-context` | TODO: Vega-Lite charts draw context in `--muted` `#6b6459`; confirm it as the context grey | TODO: `#9d9488` in the charts |
| `--ui-data-1` | `#2a78d6` (Vega-Lite series 1, `scripts/render-diagrams.mjs`) | `#3987e5` |
| `--ui-data-2` | `#eb6834` (series 2) | `#d95926` |
| `--ui-data-3` | `#1baf7a` (series 3) | `#199e70` |
| `--ui-data-4` | TODO: the charts use three series | TODO: as light |
| `--ui-on-data-1` | TODO: no labels are set on filled marks | TODO: as light |
| `--ui-on-data-2` | TODO: as data-1 | TODO: as light |
| `--ui-on-data-3` | TODO: as data-1 | TODO: as light |
| `--ui-on-data-4` | TODO: as data-1 | TODO: as light |
| `--ui-inv-paper` | TODO: no inverted ground | TODO: as light |
| `--ui-inv-surface` | TODO: no inverted ground | TODO: as light |
| `--ui-inv-ink` | TODO: no inverted ground | TODO: as light |
| `--ui-inv-ink-2` | TODO: no inverted ground | TODO: as light |
| `--ui-inv-line` | TODO: no inverted ground | TODO: as light |
| `--ui-inv-accent` | TODO: no inverted ground | TODO: as light |
| `--ui-inv-node` | TODO: no inverted ground | TODO: as light |
| `--ui-node` | `#f6f2ea` (`notes` surface-raised, the figure node fill) | `#1b1917` |
| `--ui-line-solid` | TODO: a solid twin of the rule is unchosen; the rule `#d9d2c5` is already solid | TODO: `#423d35` |
| `--ui-accent-ink` | `#9a3412` | `#f0854f` |
| `--ui-data-neg-ink` | TODO: no signed values | TODO: as light |
| `--ui-alert` | TODO: no alert state on the site | TODO: as light |
| `--ui-warn` | TODO: no warning state on the site | TODO: as light |
| `--ui-slide-font-text` | TODO: no deck on the site | TODO: as light |
| `--ui-slide-font-label` | TODO: no deck on the site | TODO: as light |
| `--ui-slide-font-display` | TODO: no deck on the site | TODO: as light |
| `--ui-web-font-text` | `"Iowan Old Style", "Palatino Linotype", Palatino, Charter, Georgia, serif` | `"Iowan Old Style", "Palatino Linotype", Palatino, Charter, Georgia, serif` |
| `--ui-web-font-label` | `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Inter, Helvetica, Arial, sans-serif` | `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Inter, Helvetica, Arial, sans-serif` |
| `--ui-web-font-display` | `"Iowan Old Style", "Palatino Linotype", Palatino, Charter, Georgia, serif` | `"Iowan Old Style", "Palatino Linotype", Palatino, Charter, Georgia, serif` |
| `--ui-font-text` | `"Iowan Old Style", "Palatino Linotype", Palatino, Charter, Georgia, serif` | `"Iowan Old Style", "Palatino Linotype", Palatino, Charter, Georgia, serif` |
| `--ui-font-label` | `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Inter, Helvetica, Arial, sans-serif` | `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Inter, Helvetica, Arial, sans-serif` |
| `--ui-font-display` | `"Iowan Old Style", "Palatino Linotype", Palatino, Charter, Georgia, serif` | `"Iowan Old Style", "Palatino Linotype", Palatino, Charter, Georgia, serif` |
| `--ui-display-weight` | `700` (the browser's bold on `h1`/`h2`; not set explicitly) | `700` |
| `--ui-display-tracking` | `-0.02em` (article `h1`; `h2` and index titles `-0.01em`) | `-0.02em` |
| `--ui-display-case` | `none` | `none` |
| `--ui-label-tracking` | `0.02em` (`.meta`) | `0.02em` |
| `--ui-radius` | `6px` (`--radius`: every frame: contents box, code blocks, tables, project link, note clusters, panels, chips) | `6px` |
| `--ui-radius-sm` | `4px` (`--radius-sm`: a mark inside a line or a panel: inline code, topic links, the focus ring) | `4px` |
| `--ui-radius-xs` | TODO: unused since inline code took the small radius; set if a part ever needs a third | TODO: as light |
| `--ui-radius-pill` | `50%` (the appearance toggle) | `50%` |
| `--ui-stroke` | TODO: figures inherit uipack's stroke; the site sets none | TODO: as light |
| `--ui-rule-width` | `1px` | `1px` |
| `--ui-density` | TODO: not expressed as a scalar; spacing uses 8px steps per element (see Density and rhythm) | TODO: as light |
| `--ui-type-ratio` | `1.2` (body 19px; h3 1.425rem, h2 1.71rem, h1 2.1rem) | `1.2` |
| `--ui-measure` | `44rem` column (`--max`), less 1.25rem padding a side | `44rem` |
| `--ui-ease-settle` | `ease` (the project link's 150ms hover) | `ease` |
| `--ui-ease-travel` | TODO: nothing travels outside the figures | TODO: as light |
| `--ui-dur-quick` | `150ms` | `150ms` |
| `--ui-dur-base` | TODO: no base-duration transition on the site | TODO: as light |
| `--ui-dur-slow` | TODO: no slow transition on the site | TODO: as light |
| `--ui-backdrop` | `none` | `none` |
| `--ui-backdrop-mask` | `none` | `none` |
| `--ui-frame-border` | `1px solid #d9d2c5` | `1px solid #423d35` |
| `--ui-frame-shadow` | `none` | `none` |
| `--ui-card-shadow` | `none` | `none` |
| `--ui-marker-size` | `0` (no eyebrow marker) | `0` |
| `--ui-marker-shape` | `none` | `none` |
| `--ui-marker-color` | `none` | `none` |
| `--ui-section-rule` | `none` (sections are headings only) | `none` |
| `--ui-nav-fill` | `transparent` (the masthead is not sticky) | `transparent` |
| `--ui-nav-blur` | `0` | `0` |
| `--ui-grain` | `0` | `0` |
| `--ui-glow` | `0` | `0` |
| `--ui-cta-shadow` | TODO: the site has no primary button | TODO: as light |
| `--ui-cta-shadow-hover` | TODO: no primary button | TODO: as light |
| `--ui-display-scale` | `1` | `1` |
| `--ui-em-style` | TODO: no emphasised phrase in a headline | TODO: as light |
| `--ui-em-color` | TODO: as em-style | TODO: as light |
| `--ui-star-fill` | `0` | `0` |
| `--ui-accent-stroke` | `#9a3412` (the blockquote and project-link rule) | `#f0854f` |
| `--ui-flow-error` | `#b8352a` (`notes`; the agent's proposal, 2026-11-19, unused by any figure yet: 4.9:1 or more on every figure fill; the owner may change it) | `#e8735f` (the agent's proposal; 5.5:1 or more) |
| `--ui-font-heading` | `"Iowan Old Style", "Palatino Linotype", Palatino, Charter, Georgia, serif` | `"Iowan Old Style", "Palatino Linotype", Palatino, Charter, Georgia, serif` |
| `--ui-canvas-pattern` | `none` (figures sit on the page with no canvas) | `none` |
| `--ui-cta-fill` | TODO: no primary button | TODO: as light |
| `--ui-on-cta` | TODO: no primary button | TODO: as light |
| `--ui-em-decoration` | TODO: as em-style | TODO: as light |
| `--ui-num-ring` | TODO: no numbered steps outside figures | TODO: as light |
<!-- /generated -->

Syntax colours (`--hl-*`, nine per theme) are part of the site's colour set and each clears 4.5:1
on the code ground; they are not contract roles and live only in `app/globals.css`.

## Type

| Medium | Display | Text | Label |
| --- | --- | --- | --- |
| Page, article, index | Iowan Old Style 700 (browser bold), −0.02em on `h1`, −0.01em on `h2` and index titles | Iowan Old Style 400, 19px / 1.7 (18px under 600px) | ui-sans-serif (the system UI sans) 400 / 600 for navigation, meta, captions, tables, the contents box; ui-monospace for code |

- **Stacks.** Serif `"Iowan Old Style", "Palatino Linotype", Palatino, Charter, Georgia, serif`
  (macOS and iOS draw Iowan; Windows draws Palatino Linotype; Android falls to its default serif).
  Sans `ui-sans-serif, system-ui, …`. Mono `ui-monospace, SFMono-Regular, "SF Mono", Menlo,
  Consolas, monospace`. Figures name the same sans and mono stacks (`_shared.tsx`).
- **Self-hosting.** None. The core rule asks for self-hosted faces with metric-matched fallbacks;
  TODO: the owner decides whether to self-host a serif (which one, and its weight files) or keep
  the system stacks and accept that the serif differs by platform.
- **Steps.** A 1.2 ratio over the body: `h3` 1.425rem, `h2` 1.71rem, article `h1` 2.1rem (under
  600px, over the 18px body: 1.35 / 1.62 / 1.95rem). Dek 1.12rem, index title 1.45rem (1.35rem
  under 600px).
- **Sans sizes.** Four, as variables in `app/globals.css`: micro .75rem (caps kickers, tab
  counts), small .8rem (meta, credits, counts, notes), label .875rem (navigation, controls,
  captions, tables, the contents box, the footer) and the tagline's .95rem.
- **Leading.** Four line heights, as variables: display 1.25 (`--leading-display`: titles and
  headings), label 1.4 (`--leading-label`: navigation, meta, controls, the contents box), text 1.6
  (`--leading-text`: the dek, captions, tables, code, notes, the footer) and prose 1.7
  (`--leading-prose`: the article body). uipack's charts and article parts keep their own.
- **Tracking.** −0.02em on the article `h1`, −0.01em on every other heading and title.
- **One spec per role.** A role (page title, dek, meta, caption, table cell, contents link…) is
  set one way on every page; `e2e/shell.spec.mjs` holds the roles, the four line heights and the
  radii.
- **Preload.** None (no web fonts).

## Density and rhythm

A loose, bookish rhythm on uipack's 8px base unit: 19px body at 1.7 line height, paragraphs
1.5rem (24px) apart, `h2` 3rem above and 1rem below, `h3` 2.5rem above and .5rem below (2.5 /
2rem on phones), figures 2.5rem above and below, index items 1.25–1.5rem of padding with a rule
between, panels 1rem by 1.5rem of padding. Every margin and padding is a multiple of 8px; 4px
(.25rem) and 12px (.75rem) appear only inside a part (a cell, a caption rule, a label gap).

Corners follow one rule: a frame takes 6px (`--radius`), a mark inside a line or a panel 4px
(`--radius-sm`), and the appearance toggle's hover disc is a circle.

The measure is a 44rem column with 1.25rem gutters; figures break out to a 60rem (960px) slot
(`min(60rem, 100vw − 2.5rem)`), so prose keeps a short line while a drawing gets room.

## Ornaments

Almost none, on purpose. Painted today:

| Slot | This site |
| --- | --- |
| Backdrop, canvas pattern, grain, glow | None |
| Eyebrow marker, section index | None (no eyebrows) |
| Section rule | None; the masthead and footer carry a 1px `--faint` rule |
| Frames | 1px `--faint` border, the 6px frame radius, no shadow: the contents box, code blocks, tables, the project link and note clusters |
| Nav | Not sticky, no fill; current page underlined in ink |
| Primary button, closing band, stamp | None |

Treatments: the blockquote and the project link carry a 3px accent rule on the left; the contents
box, topic panel and note clusters are `--surface` panels; selected topic chips use `--accent-soft`.
TODO: the `--ui-perf`, `--ui-card-*`, `--ui-num-*`, `--ui-quote-*`, `--ui-cell-*` and
`--ui-window-*` treatments are unused; nothing to set until a part that reads them appears.

## Layout

Both layouts keep the floors: one column at 390px, no page overflow (wide tables and figures
scroll in their own box), 44px touch targets on standalone controls, a skip link and a visible
2px accent focus ring.

**One header.** The masthead, the content and the footer share one column on every page
([layout floor 8](https://github.com/ong6/uipack/blob/main/docs/system/layout/README.md#floors-what-holds-on-every-site)):
the site title, the tagline and the first nav word start on the column's start edge, and the
appearance toggle's icon ends on its end edge (its 44px target reaches into the gutter by the space
around the icon, as a nav link's padding does). The scrollbar's gutter is kept on a page that does
not scroll, so the column is at the same x on every page. The toggle shows "on" in the accent,
read from the theme, not from the script.

**Page changes.** The document carries its ground and colour scheme in an inline `<style>` ahead
of the stylesheet (`GROUND_STYLE` in `app/layout.js`, the `--bg` values), and the inline theme
script sets a stored choice before the first paint, so no frame is white on a dark page. The
index is prerendered whole (tabs, count, Topics, list), so nothing is added above the list when
the script arrives. **Theme:** the reader's last choice (`localStorage`, `notes-appearance`),
then the system's setting, followed live.

**One name per page.** The nav label, the `<title>`, the `h1` and the links to a page say the same
words, as on junxiong.dev: "Notes" (the index; its `h1` and title are the site's name, which ends
in it, and links back say "All notes"), "About", "Page not found". The product is "UiPack"; the
package and its code are `uipack`.

`npm run test:e2e` (`e2e/shell.spec.mjs`, after a build) holds these and the floors above at 1920,
1440 and 390, light and dark.

### Landing

The index (`/`, `app/page.js`, `app/article-browser.js`). No hero: the masthead's title and tagline
are the first screen, then the list.

| Setting | This site |
| --- | --- |
| Grid | One 44rem column, 1.25rem gutters, centred; the same column at every width |
| Regions | Masthead (site title, tagline, Notes / About / Main site, appearance toggle), category tabs with counts, result count and a Topics disclosure, the article list, the agent note, the footer |
| Section order | Masthead, category tabs, result count and Topics, active-topic chip (when filtered), list newest first (category and date, title, description), agent note, footer |
| Hero | None: the site title and one-line tagline; the first article title sits in the first screen at 390×844 |

Filters live in the URL (`?category=…&tag=…`). Under 600px the category tabs are one row that
scrolls sideways.

### Article

`layer-article`, extended. Kept: one text column at the measure, figures breaking out to the
60rem slot, the title and one-sentence dek as the only hero. Changed:

- **Wider than the measure.** The prose is one width on every article (664px from a 704px
  window). Three things may take more, each centred on the column and never past the window less
  the gutters: a figure (the 60rem slot, or the width that brings its smallest label to 11px if
  that is more, `--fig-floor-w`), an HTML chart (the slot) and a table whose columns need more
  than the column (it grows to the width its words need, 60rem at most, then scrolls inside its
  box). Code blocks stay on the column and scroll inside their frame.

- **Header order:** date and reading time, `h1`, dek, category and tags, then the project link
  when the article names one (`project:` frontmatter).
- **Contents box** under the header when an article has three or more headings (`toc: false`
  drops it): a disclosure, open on desktop and closed on phones, so the first paragraph is in the
  first screen. Article pages also hide the masthead's tagline on phones.
- **Parts used:** `LayerHead`, `TermList`, `ChangeNote`, `Callout` (self-test), `LinkList` and
  `NoteCluster`, emitted from bold-label paragraphs and fences by `lib/rehype-article-parts.js`
  and `lib/rehype-chart.js`, only where an article writes them (the two AI-stack articles).
  Clusters stay in the text column on this site (`--uipack-article-wide: 100%`) and take the
  contents box's card language.
- **Figures** may not lead the page; they sit where the prose refers to them, with a caption and a
  separate source line. On phones a figure shows its authored narrow drawing, or scrolls inside
  its frame under a swipe hint. Between a phone and the width its 11px floor needs (a tablet, a
  narrow window) every drawing keeps that width and scrolls inside its frame the same way. Every Vega-Lite chart has a phone drawing made by
  `scripts/render-diagrams.mjs`: category labels above the bars, values at the bar ends, the
  legend one item per line.
- **End matter:** the dated revision line, Related notes (the index's list, four items), the
  markdown-source note.

## Writing style

From the published posts and the owner's house voice (the private `write-a-blog` skill,
`references/house-voice.md`, which is the source; this table only summarises it).

| Setting | This site |
| --- | --- |
| Tone and register | An engineer telling a peer what happened and what they decided. First person singular for what the owner did and chose; plain, specific, numbers flat with what they measure; doubt stated once where it sits |
| Title form | Article: full-sentence claim or a plain "How I…" / "Why…" sentence, sentence case ("Prefill and decode want different machines"). Article headings: plain names or short claims. Index and chrome: plain names ("Notes", "About", "Related notes") |
| Copy density | Reasoning in paragraphs; bullets only for list-shaped things; tables for numbers being compared. Headings only past about 1,500 words. Every non-obvious number carries a source link |
| House words | "Notes" for the site and its articles; the author's name as "Ong Jun Xiong"; plain names for things, internal codes only in parentheses; avoid the AI tells in uipack's table and the house voice (corrective "X, not Y", triads, tidy closers) |
| Budgets | The ceilings, plus: description under 155 characters (README); `<title>` gets the site suffix only within 60 characters (`pageTitle`) |

## Component looks

| Component | Picks | Why |
| --- | --- | --- |
| Diagrams | `blueprint`, theme `notes` | Structural figures are drawn with uipack (```` ```uipack ```` fences, `content/figures/*.tsx`), the same parts and grammar as junxiong.dev, coloured by this site's one diagram theme; the HTML charts (```` ```span ````, ```` ```stack ````) are members too. Vega-Lite charts are not uipack parts and take the site's data colours |

**`notes` diagram theme** (`content/figures/_shared.tsx`, `defineDiagramTheme`; every figure on the
blog draws in it, and `scripts/render-figures.tsx` passes it to `renderStatic` per mode). Blueprint
has been a `flex` look since uipack 0.3.0: one grammar, coloured per site, which settles the old
"Blueprint fixed or the site's palette" question in favour of the site's palette (the owner's brief,
2026-11-07: one diagram grammar, themed per site, the blog's figures in one theme).

| Role | Light | Dark |
| --- | --- | --- |
| `ink` / `ink-2` | `#14110d` / `#6b6459` | `#ece7de` / `#9d9488` |
| `surface` (page) / `surface-raised` (node) / `surface-2` | `#fffdf9` / `#f6f2ea` / `#efe9df` | `#12110f` / `#1b1917` / `#232019` |
| `line` / `line-soft` | `#d9d2c5` / `#d9d2c5` | `#3a352f` / `#3a352f` |
| `accent` (the claim's path, the outcome) | `#0f7a55` | `#199e70` |
| `flow-request` / `flow-response` / `flow-change` / `flow-error` | `#2a78d6` / `#0f7a55` / `#eb6834` / `#b8352a` | `#3987e5` / `#199e70` / `#d95926` / `#e8735f` |
| `fonts` | text: the sans stack; label: the mono stack | as light |
| `canvas` | `plain` (figures sit on the article with no ground) | `plain` |

`flow-error` is the agent's proposal: the theme API requires one and no figure draws a declined branch yet.

The figure accent is green while the site's accent is terracotta (`#9a3412`); the theme keeps the
figure colours the blog already had. The HTML charts and article parts still take their colours from
the `--uipack-*` mapping on `.fig-html, .prose` in `app/globals.css` (the theme reaches the static
figures only), and `.fig-diagram text` there sets every figure's text in the site sans, the mono
labels included: whether figures keep uipack's mono labels is an open owner decision (Open TODOs).

## Reuse

Extends `core` only. It does not reuse junxiong.dev's look (cobalt accent, sans, `#F3EFE7` paper)
and no site reuses this one. The two sites share the diagram look and the author's name and links;
the nav label "Main site ↗" points back to junxiong.dev.

## Open TODOs

- `--ui-flow-error`: confirm or replace the agent's proposed `#b8352a` / `#e8735f`.
- Figure labels: keep `.fig-diagram text` (every figure label in the site sans; the layouts are
  tuned to it, and uipack's 11px mono `Decision` and `Actor` labels read small beside 19px node
  labels) or let uipack's mono labels through (about thirty subs would need wider boxes).
- HTML charts and article parts: move the `--uipack-*` mapping in `app/globals.css` onto the
  `notes` theme (`diagramThemeCss`) if uipack's charts start reading diagram themes.
- Faces: self-host a serif (and which) or keep system stacks; decides the font rows' first family
  and a preload.
- Density: express the 8px rhythm as a `--ui-density` scalar if uipack ever renders this look.
- Unused roles (raised surface, third ink, soft line, accent-tone and inverted sets, signed data,
  alerts, deck faces, buttons): set when a page first needs one.
- Registry: add this spec to uipack's `siteRegistry` (`playground/docs-manifest.ts`) as
  `junxiong-notes:STYLE.md`, looks `diagrams: blueprint`, pin `1.0.0`; not done from this repo.
