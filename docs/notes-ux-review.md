# Notes UX review

## Design brief

A personal essay index for readers arriving from the portfolio or a shared article, often on a phone. Its primary job is to help them choose a relevant note and start reading.

Keep the existing reading palette: paper `#fffdf9`, ink `#14110d`, secondary text `#6b6459`, link `#9a3412`, rule `#d9d2c5`, panel `#f6f2ea`. Dark appearance uses the existing ink/paper reversal with higher-contrast secondary text `#aaa195`. Serif titles and prose carry the identity; system sans-serif serves navigation and metadata. Keep the 44rem text column and no new fonts.

The first pass used boxed categories, a permanent native select, and repeated tag rows. That gave secondary controls too much visual weight. The revised plan uses underlined text navigation and an on-demand topic panel, with category and date above each title. Topic links stay in the article header; the index prioritizes reading. Mobile wraps labels rather than clipping them into a horizontal strip.

```
Site title / description
Notes   About   Main site               Appearance

All notes   AI systems   Career   Trading   Web engineering
9 notes                                           Topics

Trading   Date
Article title
Description
```

## Findings and fixes

Rule numbers refer to the store's UX checklist.

| Rule | Location | Severity | Resolution |
|---|---|---|---|
| 3, 37 | Categories and primary navigation | Medium / High | Underline plus semantic current state; theme toggle has an accessible pressed state. |
| 22, 23, 104 | Navigation, filters, topic links, article tags, contents and footer navigation | High / Medium | Primary standalone controls have at least 44px touch height and width. Inline prose references retain the inline-target exception. |
| 28, 41, 45 | Shared shell and wide article content | High / Medium | Visible focus, skip link, keyboard-focusable scroll regions for tables and code. |
| 39 | About, articles and missing-page view | Medium | Site name is branding; each page has one content h1. |
| 5, 115, 118 | Filter state | High / Medium | Shareable query state, wrapping labels, one contextual live result count, remove-topic action, browser history retained. |
| 16, 111, 112 | Long links, code, tables, responsive figures | High / Medium | Prose wraps; wide content scrolls within its container; full-size static figure links give phone readers another reading view. |
| 9, 12 | Animated article diagrams | High / Medium | Pause/play controls; reduced-motion preference pauses SVG timelines and hides decorative moving packets until explicitly played. |
| 36 | Both appearances | High | Measured body/control palette contrast is above 4.5:1. |

## Validation

Initial live audit at 390px found no whole-page overflow, but 60 small standalone controls on the index and duplicate h1s on every inner page.

Updated browser checks cover the index, About, all nine articles and a missing-page route at 390px and 1440px, in both light and dark appearance (48 page/viewport/theme combinations). No whole-page overflow, duplicate h1, missing raster-image alt attributes, body text under 12px, or undersized primary controls in those checks. All 20 figures have full-size links. Palette ratios: light muted 5.75:1, link 7.19:1, selected 5.90:1; dark muted 7.41:1, link 7.34:1, selected 6.36:1.

These are browser viewport checks, not a physical iPhone/Safari test or a screen-reader certification. Inline citations and dense SVG preview labels are not claimed to be 44px controls or 12px text; full-size figure reading remains available. Reduced-motion implementation is inspected separately from the default-motion browser checks.

Additional checks: all 12 routes reflow at 320px without page overflow; keyboard traversal exposed visible 2px focus outlines; topic selection, automatic incompatible-topic clearing, remove-topic action and browser Back worked. Diagram pause/play buttons changed state, and full-size assets are generated as static illustrations. The trading title is now “Why My Automated Trading Strategies Haven’t Earned Real Money”; its URL is unchanged.

Final local validation: production build, ESLint and diff checks passed. Paused-diagram screenshots taken at separate times were byte-identical; resumed playback produced different frames. Generated full-size assets contain no animation tags. The title change retains the original article URL and is included in the feed, raw Markdown and social image build.
