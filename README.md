# notes.junxiong.dev

Working notes on making AI systems cheaper, faster and smarter. Static site, plain markdown,
no CMS.

## Writing

One file per article in `content/articles/<slug>.md`. Frontmatter:

```yaml
---
title: Prompt caching, and why the same prompt costs 10x more on some days
description: One sentence, under 155 characters. Used as the meta description and in llms.txt.
date: 2026-08-28
updated: 2026-08-28
tags: [prompt-caching, cost]
draft: false
---
```

Body starts at `##` — the `<h1>` comes from `title`. Files starting with `_` are ignored, and
so is anything with `draft: true`.

The URL is the filename: `content/articles/foo.md` serves at `/foo`.

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
npm run dev     # regenerates the agent files, then serves on :3000
npm run build   # prebuild + next build
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
