---
title: Why my trading strategies haven't earned real money
description: What my trading engine's tests actually showed, why positive returns weren't enough, and the agentic paper experiment I'm building next.
date: 2026-09-23
updated: 2026-09-23
category: Trading
tags: [trading, backtesting, agents, systematic-trading]
draft: false
---

I haven't found a fully mechanical strategy in my trading engine that has earned the right to trade real money. Some of the backtests made money. Some looked impressive. None of the completed candidates established a reliable advantage over its proper control under the project's evidence standard.

That distinction has changed what I want to build next. I'm putting more effort into an agent that can make a bounded decision inside the trading process, while deterministic code continues to own risk and execution. The agent still has to prove that its decisions help.

For the architecture and interactive diagrams, see the [trading-engine case study on my main site](https://junxiong.dev/trading-engine). It walks through the nightly pipeline from market data to signals, simulated fills and the forward tests. This article covers what those tests taught me and the experiment I want to run next.

## Turning books and videos into rules

I started with ideas from trading books and YouTube, then turned selected ideas into rules I could run and inspect. The implementations are my mechanical interpretations. They test the decisions I encoded, not every discretionary judgment an author or trader might make.

The [strategy code](https://github.com/ong6/trading-engine/tree/96266fc85a283268de05089c261782ced907f106/sim/strategies) includes Minervini-style screen selection, dual momentum, sector rotation, short-term mean reversion, Turtle-style breakouts and cross-sectional momentum. There are also variants for position sizing, stops and market-regime gates.

Those labels hide decisions that become unavoidable in code. My mean-reversion implementation requires a low RSI and consecutive down closes, then exits on a rebound or a time limit. The breakout implementation applies its entry and trailing-stop rules to stocks that passed the screen. Dual momentum compares the total returns of SPY and EFA against a cash-proxy hurdle. These are specific implementations, with specific universes and exits. A result for one is not a verdict on every strategy with the same name.

## Testing the strategy I would actually run

I wanted the historical tests and the paper portfolios to use the same machinery. The [walk-forward runner](https://github.com/ong6/trading-engine/blob/96266fc85a283268de05089c261782ced907f106/farm/walkforward/runner.py) calls the simulator's day-step and the registered strategy code. It doesn't carry a second, simplified implementation of the trading rule.

The [fill model](https://github.com/ong6/trading-engine/blob/96266fc85a283268de05089c261782ced907f106/sim/fills.py) prevents a signal calculated from a closing price from filling at that same close. Orders can fill at a later session's open, with modeled slippage and liquidity limits. Missing or untradeable bars can leave an order pending or cause rejection. Dividend accounting also matters: a cash-proxy hurdle built from price alone can tell a different story from one built from total return.

These choices make the simulation more useful. They don't make it equivalent to real trading. Costs remain modeled, and historical data still have limitations.

The [20 September 2026 walk-forward report](https://github.com/ong6/trading-engine/blob/96266fc85a283268de05089c261782ced907f106/data/reports/walkforward/README.md) uses 24-month training windows followed by 12-month validation windows, advancing a year at a time. The rules are fixed rather than fitted inside those training windows. That separation checks how a rule behaves across periods; it cannot erase the fact that I chose the rule after living through some of that market history.

## Positive returns weren't enough

Sector momentum is a useful example because it uses a fixed ETF universe rather than a historical reconstruction of today's surviving stocks. In that report, its mean validation return was **13.90%**, but its mean excess over SPY was **−1.09 percentage points**. The reported 90% confidence interval on mean excess ran from **−6.24 to +4.87 percentage points**. Its latest validation window beat SPY, but the broader result didn't establish an advantage.

A concentrated screen portfolio looked much stronger on its headline return. `template_top5` received a mechanical PASS, yet its confidence interval on excess return still crossed zero. It also depended on a survivor-biased stock universe. PASS was a review label under the report's rules, not proof of an investable edge.

The [research decision ledger](https://github.com/ong6/trading-engine/blob/96266fc85a283268de05089c261782ced907f106/docs/strategy-research-backlog.md) therefore leaves the completed candidates unpromoted. Some trailed their controls. Others remained statistically inconclusive. Neither result gives me a reason to put real capital behind them.

There are limits on the negative conclusion too. A confidence interval crossing zero does not prove there is no effect. A weak result for my implementation does not prove that algorithmic trading cannot work. It means this research hasn't supplied the evidence I require.

## The data can make the result look better than it is

The historical stock universe is one of the biggest constraints. Companies that disappeared through failure, acquisition or delisting are missing from much of the reconstructed history. A strategy that can only select today's survivors gets an advantage it would not have had at the time.

Comparing two rules on the same survivor universe helps isolate their difference, but it does not recreate the missing companies. One low-volatility strategy also uses a current fundamentals snapshot in historical windows. The report explicitly labels that look-ahead problem. I can't treat its returns as clean historical evidence.

Even the report's confidence intervals need care. They resample a small collection of validation folds from one market history. The report warns that this can understate uncertainty. Running more nearby parameter combinations on the same history doesn't create a new independent market path.

The useful response is to keep collecting point-in-time data and preserve frozen forward rules. It is slower than producing another attractive backtest.

## Where the agent fits

My working hypothesis is that some of the judgment I left outside the mechanical rules may matter. I want to test whether an agent can supply useful context at a defined decision point. The existing results don't establish that humans are always necessary, and they don't establish that a language model can replace human judgment.

The next [paper-trial plan](https://github.com/ong6/trading-engine/blob/96266fc85a283268de05089c261782ced907f106/docs/plans/p7-autonomous-paper-trial.md) separates three approaches:

| Arm | Decision being tested |
|---|---|
| Algorithm-only | The registered deterministic dual-momentum rule. |
| AI-only | A model chooses among SPY, EFA, BIL and cash at the monthly decision boundary. |
| Algorithm plus AI | The model can veto an eligible algorithmic buy, but cannot invent or resize an order. |

The comparison is designed to give each arm the same admitted facts, starting balance, dates, execution model and risk envelope. The human defines the experiment and reviews its continuation. Routine paper decisions are intended to run without a human approving each order.

The agent's authority stops at its assigned decision. Deterministic code owns data checks, sizing, risk limits, fills, accounting and halts. If the inputs or model identity fail the checks, the system should stop rather than improvise a trade.

This comparison is still being built. The [checked-in registration](https://github.com/ong6/trading-engine/blob/96266fc85a283268de05089c261782ced907f106/server/p7-trial-registration.json) has no activation date or bound trial portfolios. There is no completed three-way performance result. The plan separates a 90-day operational pilot from a strategy comparison, which requires at least 12 paired monthly decisions. Neither automatically authorizes real capital.

I want the next experiment to answer one narrow question: does adding this decision-maker improve the result under the same constraints? If it doesn't, adding an agent has only made the system more complicated. That is a result I need to be willing to keep.
