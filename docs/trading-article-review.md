# Trading article evidence review

Reviewed 2026-09-23 against a fresh read-only clone of `ong6/trading-engine`, commit `96266fc85a283268de05089c261782ced907f106`. No engine files or trading state changed. This is inspection of checked-in code and generated reports, not a rerun of historical tests or a query of the running appliance.

Article: [Why my trading strategies haven't earned real money](../content/articles/why-my-trading-strategies-havent-earned-real-money.md). Initially prepared as a private draft. Owner approved publication on 2026-09-23, with a link to the main trading-engine case study.

| Proposed claim | Finding | Article treatment |
|---|---|---|
| We tested ideas from books and YouTube. | Owner-supplied provenance. Code confirms the named strategy families, but no book/channel-to-test inventory was found by searching tracked Markdown and Python for YouTube URLs, book titles and author names. | State the inspiration in first person; describe implementations as mechanical interpretations. |
| We tested the top strategies from the most popular books/channels. | No ranked source list, popularity measure or coverage map found. | Omit ranking and completeness claims. |
| None worked. | September 20 report contains positive returns and mechanical PASS labels. No judged strategy has a wholly positive reported interval on mean excess; some are negative, others inconclusive, and low_vol has no comparator interval. | No completed candidate has established a reliable edge under the project's standard. |
| Human in the loop is always needed. | Not demonstrated by these experiments. Latest approved plan explicitly removes routine human approval of paper orders. | Human sets/reviews the experiment; decision-level human necessity is unproven. |
| We are focusing on an agent in the middle. | Supported by P5 implementation and active P7 plan, registration and status code. P7 manifest still has null activation, portfolio bindings and operational evidence. | An experiment under construction, with no demonstrated superiority or completed three-arm trial. |

## Code and report anchors

All paths below resolve against the sibling engine checkout.

- `sim/strategies/mr_overlay.py`: RSI, consecutive down closes, rebound/time-stop exits.
- `sim/strategies/turtle_breakout.py`: screened-universe breakout and ATR stop interpretation.
- `sim/strategies/dual_momentum.py`: total-return SPY/EFA winner and BIL hurdle; defensive targets are cash in this implementation.
- `farm/walkforward/runner.py`: calls `league.step`; same registered strategy implementation.
- `sim/fills.py`: strictly later fill date, spread/slippage, participation guard, missing-bar behavior.
- `data/reports/walkforward/README.md`: generated 2026-09-20, anchored 2026-09-18. Sector mean +13.90%, mean excess -1.09 pp, interval [-6.24, +4.87] pp; template_top5 PASS but indistinguishable. Includes survivor bias, low_vol look-ahead and bootstrap caveats.
- `docs/strategy-research-backlog.md`: promotion standard and frozen forward records. Its headline sector numbers are older; article uses the newer generated report.
- `docs/feedback.md`: latest P7 approval supersedes older MAINTAIN-only/general model-review wording.
- `sim/strategies/agent_only_policy.py`: deliberately generates no algorithmic orders; P5 consumer supplies decisions.
- `docs/plans/p7-autonomous-paper-trial.md`, `server/p7_trial_status.py`, `server/p7-trial-registration.json`: intended arm boundaries, incomplete activation, pilot and comparison gates.

Every public article source link is pinned to the inspected commit. No current market prices, owner capital amount, machine identifiers, or employer details were needed in the article.

## Local validation

- Production build and ESLint passed; draft Markdown rendered successfully.
- Browser checked category filtering, category/tag intersection, no-match state and reset.
- Desktop and 390px mobile inspected; mobile document width equals viewport width.
- Draft article, social image, raw Markdown and machine-readable indexes exclude the unpublished draft. A clean production build returned 404 for the draft page and image; a published image still returned 200.
- Existing diagram-renderer warnings about SVG `animateMotion` casing remain; they did not fail the build.
- No push or deployment performed.

## Publication preparation — 2026-09-23

Owner authorized publication of all notes changes. Added the main-site case-study link near the opening and changed the article to `draft: false`. Verified the destination is live and includes the interactive nightly-loop architecture figure. Publication verification is recorded below after deployment.
