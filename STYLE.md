---
spec: junxiong-notes
site: notes.junxiong.dev
extends: core
pages: [landing, article]
layouts: { landing: custom, article: layer-article }
components: { diagrams: blueprint }
status: draft
uipack: 0.4.0
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
| `--ui-flow-request` | TODO: owner decision, see Component looks (A: Blueprint `#0b77a3`; B: site palette `#2a78d6`) | TODO: owner decision (A: `#8fd6ff`; B: `#3987e5`) |
| `--ui-flow-response` | TODO: owner decision (A: Blueprint `#2b7a4b`; B: site palette `#0f7a55`) | TODO: owner decision (A: `#8be6ae`; B: `#199e70`) |
| `--ui-flow-change` | TODO: owner decision (A: Blueprint `#7048c0`; B: site palette `#eb6834`) | TODO: owner decision (A: `#d2b4ff`; B: `#d95926`) |
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
| `--ui-node` | TODO: follows the diagram decision (today `#f6f2ea`, the figure node fill in `_shared.tsx`) | TODO: today `#1b1917` |
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
| `--ui-radius` | `6px` (contents box, code blocks, tables, project link, note clusters) | `6px` |
| `--ui-radius-sm` | `4px` (topic links) | `4px` |
| `--ui-radius-xs` | `3px` (inline code) | `3px` |
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
| `--ui-flow-error` | TODO: owner decision (A: Blueprint `#c2392b`; B: no site value yet) | TODO: owner decision (A: `#ff8c7a`) |
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
  under 600px). Meta and captions .8–.86rem sans, table text .875rem.
- **Preload.** None (no web fonts).

## Density and rhythm

A loose, bookish rhythm on uipack's 8px base unit: 19px body at 1.7 line height, paragraphs
1.5rem (24px) apart, `h2` 3rem above and 1rem below, `h3` 2.5rem above and .5rem below (2.5 /
2rem on phones), figures 2.5rem above and below, index items 1.25–1.5rem of padding with a rule
between, panels 1rem by 1.5rem of padding. Every margin and padding is a multiple of 8px; 4px
(.25rem) and 12px (.75rem) appear only inside a part (a cell, a caption rule, a label gap).

The measure is a 44rem column with 1.25rem gutters; figures break out to a 60rem (960px) slot
(`min(60rem, 100vw − 2.5rem)`), so prose keeps a short line while a drawing gets room.

## Ornaments

Almost none, on purpose. Painted today:

| Slot | This site |
| --- | --- |
| Backdrop, canvas pattern, grain, glow | None |
| Eyebrow marker, section index | None (no eyebrows) |
| Section rule | None; the masthead and footer carry a 1px `--faint` rule |
| Frames | 1px `--faint` border, 6px radius, no shadow: the contents box, code blocks, tables, the project link and note clusters |
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
  its frame under a swipe hint. Every Vega-Lite chart has a phone drawing made by
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
| Diagrams | `blueprint` | Structural figures are drawn with uipack (```` ```uipack ```` fences, `content/figures/*.tsx`), the same parts as junxiong.dev; the HTML charts (```` ```span ````, ```` ```stack ````) are members too. Vega-Lite charts are not uipack parts and take the site's data colours |

**Open owner decision: do diagrams look the same on every site, or follow this site's palette?**
uipack's Blueprint look is `fixed` (only light and dark follow the host), but its role contract also
says each style keeps the flow colours in its own palette, and the code does not enforce the fixed
values yet. Today this site follows option B.

| Option | What it means here | Cost |
| --- | --- | --- |
| A. Blueprint fixed | Figures, HTML charts and article parts render in Blueprint's values (Prussian ink, cool white card, request `#0b77a3`, response `#2b7a4b`, change `#7048c0`), identical to junxiong.dev and the uipack docs | A cool blue drawing on warm paper; drop the site's `--uipack-*` mapping and `_shared.tsx` palette once uipack ships figures that own their values |
| B. Site palette (today) | Figures take the warm-paper roles: `app/globals.css` maps `--uipack-fg/muted/bg/surface/border` to the site's ink, paper and rules (the `.fig-html, .prose` block) and the accent and change tokens to `--fig-accent` `#0f7a55` and `--fig-change` `#eb6834`; `_shared.tsx` bakes the same palette into the static SVGs | Figures differ between this blog and junxiong.dev; needs uipack to offer a `flex` diagram look, since a fixed look may not be recoloured locally |

The overrides stay in place until the owner chooses. The flow-colour rows above stay `TODO:` for
the same reason.

## Reuse

Extends `core` only. It does not reuse junxiong.dev's look (cobalt accent, sans, `#F3EFE7` paper)
and no site reuses this one. The two sites share the diagram look and the author's name and links;
the nav label "Main site ↗" points back to junxiong.dev.

## Open TODOs

- Diagrams: Blueprint fixed (A) or this site's palette (B); decides the four `--ui-flow-*` rows,
  `--ui-node` and whether the `--uipack-*` mapping stays.
- Faces: self-host a serif (and which) or keep system stacks; decides the font rows' first family
  and a preload.
- Density: express the 8px rhythm as a `--ui-density` scalar if uipack ever renders this look.
- Unused roles (raised surface, third ink, soft line, accent-tone and inverted sets, signed data,
  alerts, deck faces, buttons): set when a page first needs one.
- Registry: add this spec to uipack's `siteRegistry` (`playground/docs-manifest.ts`) as
  `junxiong-notes:STYLE.md`, looks `diagrams: blueprint`, pin `0.4.0`; not done from this repo.
