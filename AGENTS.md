# junxiong-notes — agent guide

Static Next.js 16 blog (app router, every route prerendered) for notes.junxiong.dev. Markdown in, HTML,
`/raw/*.md`, `llms.txt` and RSS out. Pushing `main` deploys to production on Vercel; CI runs on every push.

## Commands
- `npm run dev` — renders figures, writes agent files, serves :3000
- `npm run verify` — `npm test` + `npm run links` + `npm run lint`; run before every commit
- `npm run build` — prebuild (link check, `render-diagrams`, `generate-agent-files`) then `next build`
- `npm run diagrams` — re-render figures only; `npm run logos` — fetch logos for new companies (network)

## Layout
- `app/` routes, layout, `globals.css`; `lib/` markdown pipeline, rehype plugins, link check, `site.mjs`
- `content/articles/<slug>.md` — one article per file; URL is the filename; `_`-prefixed or `draft: true` skipped
- `content/figures/<name>.tsx` — uipack figure sources; palette in `_shared.tsx`
- `content/diagrams/` — GENERATED, committed render output (SVG/HTML keyed by fence hash)
- `content/data/` — YAML for the ```` ```span ```` / ```` ```stack ```` figures; `scripts/` build-time renderers
- `public/logos/` — committed company logos; `test/` — `node --test` suites; `next.config.mjs` — headers incl. CSP

## Recipes (files to touch)
- Publish an article: `content/articles/<slug>.md` (frontmatter in README.md "Writing", body starts at `##`) → verify, build
- uipack figure: new `content/figures/<name>.tsx` + a ```` ```uipack <caption> | <source> ```` fence naming it → `npm run diagrams`, commit the new `content/diagrams/<hash>.*.svg`
- Vega chart: ```` ```vega-lite <caption> | <source> ```` fence with JSON in the article (no colours/fonts) → `npm run diagrams`, commit new SVGs
- Layout/style: `app/globals.css`, `app/layout.js`, `app/[slug]/page.js`, `app/site-*.js`; chart palette `scripts/render-diagrams.mjs`, figure palette `content/figures/_shared.tsx`

## Read first
- `docs-figures.md` before adding or editing any figure fence or YAML figure data
- `STYLE.md` before any visual, palette, layout or writing-style change; check both themes, phone and desktop

## Never read or edit
- `content/diagrams/*` (generated; `b6e98de97beabc08.html` is 228 KB) — change the source and re-render
- `public/raw/`, `public/llms*.txt`, `public/figures/` (generated, gitignored); `.next/`; `package-lock.json`
- `docs/` — historical reviews, not specs
- `content/data/ai-stack.yaml` is ~2k lines: grep it, never read it whole

## Gotchas
- Vega-Lite SVGs are cached by a hash of the fence body only. After changing the chart config or palette in
  `scripts/render-diagrams.mjs`, delete `content/diagrams/*.svg` and run `npm run diagrams` (uipack, span,
  stack and notes figures always re-render; Vega ones do not).
- CSP in `next.config.mjs` allows only self-hosted assets. A new external host, embed or font needs it updated.

## Verify loop
`npm run verify` → `npm run build` → `git status` shows only intended changes (no stray `content/diagrams` churn)
→ for visual or header changes, `npx next start` and check the touched pages in light and dark with no console errors.
