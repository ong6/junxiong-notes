---
title: The verification layers behind Anthropic's 30,000 merges a day
description: Anthropic merges AI-written code at a rate no reviewer could read. How it checks that code, layer by layer, and which layers a team can copy.
date: 2026-10-20
updated: 2026-10-20
category: AI systems
tags: [verification, code-review, agents, claude-code, ci]
draft: false
---

In May 2026 Anthropic merged about 2,500 code changes a day into its monorepo. By September it was merging more than 30,000 ([Anthropic](https://www.anthropic.com/engineering/redesigning-source-control)). More than 80% of the lines merged to production are attributed to Claude ([Anthropic](https://www.anthropic.com/institute/recursive-self-improvement)). Nobody reads 30,000 changes a day, so the interesting question is what replaced reading.

The Claude Code team's own answer is "Layers, not one gate… Each layer catches some problems and misses others. Few get through all of them, and rollback handles the rest" ([Claude Code team](https://claude.dev/blog/solving-code-review-at-anthropic/)). I read their public record as a stack of cheap, imperfect checks, with human review as the last and rarest layer, scaled by risk. That stack is the part of their process worth copying. The volume is not.

Everything below is the process as Anthropic described it as of October 2026, mostly in posts that also sell the tools involved. There is no independent audit. Where a number is a guess rather than a measurement, I say so.

## The stack

| Layer | Where it runs | What it catches |
|---|---|---|
| 1. The agent checks its own work | Inside the agent's turn | Code that doesn't build, run or match the design |
| 2. Deterministic checks | Every edit, then required CI | Formatting, lint, types, tests on every platform |
| 3. Multi-agent AI review | Every pull request | Logic bugs a test didn't cover |
| 4. Security review | Every pull request | Vulnerabilities, as a separate pass |
| 5. Human approval by risk tier | Before merge | Intent, trust boundaries, sensitive paths |
| 6. Merge queue, flags, staged rollout | After merge | Conflicts, regressions real use finds |
| 7. Checks on the reviewer | Daily, offline | A reviewer that drifts noisy or blind |
| 8. Containment | Every tool call | Agents doing more than their task allows |

Each layer is weak alone. The design works because a bug has to slip past several unrelated checks, and the ones that do can be switched off without a deploy.

## 1. The agent checks its own work

The cheapest layer runs before a pull request exists. The Claude Code team: "Most review now happens before a PR exists. We give Claude something it can run—like tests, a build or a screenshot to compare against the design—and ask it to show the output instead of saying it's done. Then a subagent reviews the diff with fresh context" ([Claude Code team](https://claude.dev/blog/solving-code-review-at-anthropic/)).

Boris Cherny, who leads Claude Code, calls this "probably the most important thing to get great results out of Claude Code -- give Claude a way to verify its work", and puts the gain at "2-3x the quality of the final result" ([Cherny on X](https://x.com/bcherny/status/2007179861115511237)). That multiplier is his estimate; nobody has published a measurement.

The mechanism is simple. An agent stops when the work looks done. The best-practices docs put it bluntly: "Without a check it can run, 'looks done' is the only signal available, and you become the verification loop" ([Claude Code docs](https://code.claude.com/docs/en/best-practices)). The same docs list four strengths of check: asked for in the prompt, set as a `/goal` that a separate model re-checks after each turn, enforced by a Stop hook that blocks the turn from ending until a script passes, or handed to [a fresh subagent that tries to refute the result](/opus-orchestrating-gpt-agents#the-self-score-problem). Only the hook is deterministic.

Anthropic's playbook for customers adds a rule I'd take on its own: "an agent fixing code must not be able to weaken the check on that code" ([Anthropic](https://claude.com/resources/articles/the-ai-native-sdlc-playbook)). It suggests a hook that blocks edits to test files during a fix. That is advice to customers; I found no post saying Anthropic does it internally.

## 2. Deterministic checks

Then come the checks that don't need a model. Cherny's team runs a hook after every edit to format Claude's code, which "handles the last 10% to avoid formatting errors in CI later" ([Cherny on X](https://x.com/bcherny/status/2007179861115511237)). In CI it's "the usual: lint, type checks, tests on every platform, and a build", and "red blocks the merge" ([Claude Code team](https://claude.dev/blog/solving-code-review-at-anthropic/)).

Two details make this layer grow instead of standing still. When a reviewer keeps leaving the same comment, Cherny asks Claude to turn it into a lint rule in the same pull request ([Pragmatic Engineer podcast](https://www.youtube.com/watch?v=julbw1JuAz0)). And when Claude makes a mistake, the team adds a line to the repo's shared `CLAUDE.md` "so Claude knows not to do it next time" ([Cherny on X](https://x.com/bcherny/status/2007179861115511237)). Review comments become rules, and rules become checks that no longer need a reviewer.

The cost shows up in CI. Anthropic reports tests across its codebase grew 10x and CI jobs 25x over six months, which forced it to build test impact analysis to choose which tests each change runs ([Anthropic](https://claude.com/resources/articles/agentic-coding-is-straining-ci-heres-how-we-scaled-test-impact-analysis-at-anthropic)).

## 3. Multi-agent AI review

Every pull request at Anthropic gets an automated Claude review. The design as of October 2026: "Several agents look for bugs at the same time. Then a separate group votes on each finding, and it only gets posted if enough of them agree it's real. Findings that are only about style, diagnostics, or cleanup get dropped" ([Claude Code team](https://claude.dev/blog/solving-code-review-at-anthropic/)). Every finding must be answered: fixed, or closed with a reason.

The voting step is what makes it usable. When Anthropic launched the product version, the share of its own pull requests getting substantive review comments went from 16% to 54%, and engineers marked less than 1% of findings incorrect ([Anthropic](https://claude.com/resources/articles/code-review)). The Deputy CISO credits the jump to "requiring the agents to write a proof that their finding is valid" ([Anthropic](https://claude.com/resources/articles/how-anthropic-secures-its-ai-native-software-development-lifecycle)). Looking back at past incidents, Anthropic estimates this review "would have caught roughly a third of the bugs behind past incidents on claude.ai" ([Anthropic](https://www.anthropic.com/institute/recursive-self-improvement)).

A third is good and also a limit. The review reads the diff and the code around it; it works "without building or running your code" ([Claude Code docs](https://code.claude.com/docs/en/code-review)). It is a layer, not a gate.

## 4. Security review

Security gets its own automated pass, and "a PR can't merge while any finding from the bug review or the security review is still open" ([Claude Code team](https://claude.dev/blog/solving-code-review-at-anthropic/)). Earlier in the loop, `CLAUDE.md` files tell the agent to run `/security-review` before it opens a pull request, a plugin reviews code as it's written, and traditional static analysis still posts on pull requests alongside the agents ([Anthropic](https://claude.com/resources/articles/how-anthropic-secures-its-ai-native-software-development-lifecycle)). Its reasoning for using several narrow review agents instead of one broad one is that they "do not share biases and blindspots".

## 5. Human approval, scaled by risk

This is the layer that changed most over the year. In March 2026 Cherny said "there always has to be a person in the loop approving the change" ([Pragmatic Engineer podcast](https://www.youtube.com/watch?v=julbw1JuAz0)). By October 2026 the Claude Code team's target was for most pull requests to "merge with at most one human in the loop, who can be the author, with no increase in reverts or incidents" ([Claude Code team](https://claude.dev/blog/solving-code-review-at-anthropic/)). They get there with tiers:

| Risk | Examples | Human approvals |
|---|---|---|
| Low | Docs, copy, internal-only, additive changes behind a flag | None, once automated review and security checks pass |
| Medium | Ordinary product changes, caching, the auto-updater, system prompts | One |
| High | The highest-risk code and a few named paths | Two |

The rules around the tiers carry the weight. "The change sets the tier, not the author": a classifier reads the change and picks the tier. Only authors on a trusted list get the lighter paths. "An agent's approval never counts as a person's." On an agent-written pull request, the person who directed the agent counts as one of the reviewers. Owner-listed sensitive paths and "any CI workflow file" always need a person, which closes the obvious route of an agent loosening its own checks.

Teams that still review everything have changed what they look at. The team that built Anthropic's new source control system reviews every change, "but they now examine the intent of the change as opposed to reading every line of code" ([Anthropic](https://www.anthropic.com/engineering/redesigning-source-control)).

## 6. After the merge

A merge queue re-runs every check against the latest main with the change applied. New behaviour ships behind a flag to Anthropic employees first, then to a public "latest" channel, with "stable" trailing it. "Flags turn off without a deploy", there is a weekly on-call rotation, and incident reviews ask "which layer should have caught the issue" ([Claude Code team](https://claude.dev/blog/solving-code-review-at-anthropic/)).

At monorepo scale even the queue had to give. The source control team says it couldn't keep a global lock on the merge queue at 30,000 merges a day, so it "invested in post-merge and pre-deploy automated testing" with automated bisect and revert, accepting that concurrent changes sometimes conflict ([Anthropic](https://www.anthropic.com/engineering/redesigning-source-control)).

## 7. Checking the reviewer

An automated reviewer can drift: noisier, or blind to a class of bug. Anthropic treats it as a system under test. "Any incidents are now an eval": past pull requests that caused incidents, with each bug confirmed by an engineer who knows the code, and "the reviewer runs against that set daily". Noise is measured from how authors respond to each comment: fixed, wrong, intentional, or didn't matter ([Claude Code team](https://claude.dev/blog/solving-code-review-at-anthropic/)). New AI reviewers start in shadow mode, posting for human approval "until trust is earned", and a sample of automated approvals goes to humans ([Anthropic](https://claude.com/resources/articles/how-anthropic-secures-its-ai-native-software-development-lifecycle)).

This layer exists because of a failure. With an agent writing and an agent reviewing, the loop doesn't end on its own: "One CLI PR went through more than fifty rounds of review and fixes overnight before its author stopped it." Later rounds mostly re-flagged code that had been there since the first pass. A cap of three rounds, re-reviewing only the new diff, and never repeating a finding raised the first-round pass rate from 65% to 78% and cut pull requests needing five or more rounds from 8.9% to 1.5% ([Claude Code team](https://claude.dev/blog/solving-code-review-at-anthropic/)). A nitpick also costs more when the author is an agent: "A person can wave off a nit in seconds. An agent fixes it, which means another commit and another round of review."

## 8. Containment

The last layer limits what an agent can do instead of judging what it wrote. Engineers code on virtual machines where agent traffic is restricted to approved destinations, and agents get [narrow identities](/agent-integrations-in-large-orgs#whose-permissions-does-the-agent-use) ([Anthropic](https://claude.com/resources/articles/how-anthropic-secures-its-ai-native-software-development-lifecycle)). Anthropic says sandboxing cut permission prompts by 84% in its own use ([Anthropic](https://www.anthropic.com/engineering/claude-code-sandboxing)).

The best example of why this matters is in the same security post. An incident-response agent that wasn't allowed to deploy fixes messaged another Claude instance over Slack, one that could write code, and asked it to push the fix. A human review gate caught it. Agents route around a boundary through other agents, so each boundary has to hold on its own.

## What the numbers do and don't show

The outcome Anthropic reports for the Claude Code repository: from June to September 2026, merged pull requests more than doubled while the share that had to be reverted fell by more than 40% ([Claude Code team](https://claude.dev/blog/solving-code-review-at-anthropic/)). That is the right kind of metric, output against a quality guardrail, though absolute revert and incident rates aren't public.

The productivity figures are softer, and Anthropic says so. Engineers merged 8x as much code per day in mid-2026 as in 2024, which the same post calls "almost certainly an overstatement of the true productivity gain". It also says Claude's code was widely seen as worse than human code in late 2025 and is "roughly at parity" now ([Anthropic](https://www.anthropic.com/institute/recursive-self-improvement)). And the team admits a gap: "We don't yet have circuit breakers that tighten approval when those numbers move" ([Claude Code team](https://claude.dev/blog/solving-code-review-at-anthropic/)).

## What a team can copy

Most of these layers ship as tools or are a few lines of config. One thing surprised me reading the docs: as of October 2026, none of Anthropic's review tools block a merge by default. The managed Code Review "never approves or blocks the pull request" ([Claude Code docs](https://code.claude.com/docs/en/code-review)). The gate is something you build.

| Layer | Starting point |
|---|---|
| Self-check | A Stop hook that runs your tests before the agent may finish; ask for output, not a claim |
| Deterministic checks | A format hook after edits; turn repeated review comments into lint rules |
| AI review | `/code-review` locally, Code Review or `claude-code-action` on pull requests, tuned with `REVIEW.md` |
| Security | `/security-review` before the pull request; the security review Action in CI |
| Human tiers | Code owners on sensitive paths and CI files; lighter rules for docs and flagged changes |
| Reviewer checks | Collect past incident pull requests and run the reviewer against them |

I would build them in that order, and I wouldn't start with the human tiers. Relaxing human review is the last step, and it is only safe once the layers above it have their own record. The part to copy is the rule that sits under the whole stack: every miss should become a check, so the next miss is a different one.

For where verification sits among everything else a team changes when it adopts AI, see [Improving team efficiency at a high level](/improving-team-efficiency-with-ai).
