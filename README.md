# notes.junxiong.dev

Working notes on software, AI and building a career around both. Static site, plain markdown, no
CMS.

## Writing

One file per article in `content/articles/<slug>.md`. Frontmatter:

```yaml
---
title: Prompt caching, and why the same prompt costs 10x more on some days
description: One sentence, under 155 characters. Used as the meta description and in llms.txt.
date: 2026-08-28
updated: 2026-08-28
category: AI systems
tags: [prompt-caching, cost]
draft: false
---
```

Optional `project: { name, href, detail }` names the one page an article is about (an absolute
URL, usually on junxiong.dev). It renders as a large framed link under the title, so the related
project never hides as a small inline link.

Optional `toc: false` drops the contents list that long articles get under the title. Use it when the
article opens with its own map, such as a ```` ```stack ```` figure with `sectionHeads` (see
`docs-figures.md`), so the page does not carry two contents lists in opposite orders.

Body starts at `##` — the `<h1>` comes from `title`. Files starting with `_` are ignored, and
so is anything with `draft: true`.

Use one broad category per article: `AI systems`, `Web engineering`, `Career`, or `Trading`.
Tags describe narrower topics and can be shared across categories. Both appear on article
cards and article pages. The index filters by category and tag together, keeps newest-first
order, and saves the selection in the URL (for example `/?category=AI+systems&tag=agents`).
Missing categories fall back to `Uncategorized`; drafts never appear in filters or public article routes.

The URL is the filename: `content/articles/foo.md` serves at `/foo`.

## Data

Two figures are built from data files rather than drawn: `content/data/ai-stack.yaml` (158
companies placed on the layers of the AI stack, rendered by a ```` ```span ```` fence in
`who-builds-the-ai-stack`) and `content/data/ai-stack-layers.yaml` (the layer stack in
`ai-stack-roadmap`, a ```` ```stack ```` fence). Edit the YAML, run `npm run logos` for new
companies, then `npm run build`; bad data fails the build. Company logos live in `public/logos/`
and are fetched only by `npm run logos`, never by the build. The steps are in
[docs-figures.md](docs-figures.md#3-span-and-stack--data-figures-from-yaml).

## Agent-readable by construction

The markdown is the source of truth for both surfaces, so the HTML and the machine-readable
version cannot drift:

| Path | What |
|---|---|
| `/raw/<slug>.md` | The article's markdown source, CORS-open, `text/markdown` |
| `/llms.txt` | Index of every article, per [llmstxt.org](https://llmstxt.org) |
| `/llms-full.txt` | Every article inlined, for one-fetch ingestion |
| `/feed.xml` | RSS |
| `/sitemap.xml` | Real `lastmod` from each article's `updated` |

`scripts/generate-agent-files.mjs` writes the first three at build time. It runs automatically
via `prebuild` and at the start of `dev`.

## Commands

```bash
npm install
npm run dev       # regenerates the agent files, then serves on :3000
npm run build     # prebuild + next build
npm run diagrams  # re-render figures and data charts only
npm run logos     # fetch logos for new companies in content/data/*.yaml
```

## Deploying

Vercel, on push. The domain is set in `lib/site.mjs` — change `SITE.url` there if it moves,
because canonicals, JSON-LD, the sitemap and both llms files all read from it.

## House rules for articles

- Every non-obvious number carries a working source link.
- A number that can't be verified doesn't get published. No estimates dressed as measurements.
- Measured figure, vendor claim and personal read are visibly different things.
- Articles are revised in place and `updated` is bumped. Nothing is reposted.
- Personal notes only. Nothing here describes any employer's systems.

## Editorial review

[Trading article review](docs/trading-article-review.md) records the source evidence and publication checks for the trading article. It is not part of the public article surface.

## Reading and navigation design

Keep the index focused on titles: category navigation is underlined text, topics are disclosed on demand, and tags remain available on article pages. Use at least 44px targets for standalone controls and preserve URL filter state. Audit the whole notes site at phone and desktop widths in both appearances when shared navigation or article styling changes. See [the UX review](docs/notes-ux-review.md) for the design rationale and validation scope.
