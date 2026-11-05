---
title: Hill-climb any deliverable with the /council skill
description: "council puts an agent's work in front of fresh reviewers that pick their own metrics, score it out of 10 and send it back until it passes."
date: 2026-11-05
updated: 2026-11-05
category: AI systems
tags: [skills, agents, evals, claude-code, code-review]
draft: false
---

`council` is a skill for work that has no test suite: a UI that looks off, a design doc, a launch
note, a refactor nobody can benchmark. You say "use the council", and the agent sends what it made
to three fresh reviewer subagents. They agree on what good looks like, score the work out of 10
and list what to fix. The agent fixes those things and sends the work to three new reviewers. It
stops when every reviewer scores every metric at 8 or above, or after three rounds.

Here is the failure it exists to stop, taken from the eval that shaped it. The brief said a config
change must keep `retry_limit=2` and only improve the comment. One revision scored 9.3:

```text
retry_limit=8 # retry transient errors
```

Another scored 8.8:

```text
retry_limit=2 # bound transient retries
```

The first version of my score loop kept the 9.3 in both trials, because it was the higher number.
`council` keeps the 8.8. The 9.3 broke the one rule the brief gave, and a high score never cancels
a broken constraint. I use the skill often, and this is the failure that rule was written against.

```uipack Fresh reviewers each round, a target they never see, and a gate that checks constraints before scores. A failed gate sends the work back to the main agent, not to the same reviewers.
council-loop
```

The [`council` skill](https://github.com/ong6/skills/tree/main/skills/council) started in September
as `refine`, from a one-paragraph brief I gave my agent: spawn an independent agent to review the
work on whatever metrics it thinks suit the task; if the rating is below 8, give feedback and have
the main agent refine it; repeat three times or until it scores above 8. Most of what follows is
what that loop needed before it could be trusted. The name `council` came from Theo's video
[Agents Sucked At UI (Until Today)](https://www.youtube.com/watch?v=xq0eB8vxeqk).

## Why the agent can't grade itself

An agent that just built something is the worst reviewer of it. Its context holds the plan, the
intent and every fix it already made, so it reads what it meant into what it made. That is my read
of why "review your own work" returns "looks good" so often, not a measured result. The skill
treats it as a rule anyway: the agent that makes the changes never scores them. Each round spawns
new reviewer subagents with no conversation history. They get the brief, the exact version under
review, the starting version and the references. They never see the agent's reasoning or earlier
feedback.

The skill runs in Claude Code, so every reviewer is the same model family, and three reviewers
given the same prompt are close to one reviewer run three times. Each gets a lens picked for the
job instead: first-time user, daily power user and visual designer for a UI; correctness, future
maintainer and on-call operator for code; target reader, editor and skeptic for prose. The lenses
disagree in useful ways. A designer may dock a muted label that a power user is glad to see recede.

## Metrics come from the reviewers, then freeze

"Make it better" gives an agent nothing to climb. A number does. The best hill climbs have a
program that produces the number: a test suite that passes, a benchmark that drops, an eval score
that rises. Most deliverables have no such program, so the council builds the closest substitute.

In round 1 each reviewer proposes three to six metrics for this goal, says what a 6, an 8 and a 10
look like on each, and names any metric that could be measured instead of judged: contrast ratio,
test pass rate, p95 latency, word count. The agent merges these into one rubric of four to seven
metrics and turns every measurable one into a command it runs each round. Where a command exists,
its number beats any reviewer's opinion. Then the rubric freezes. A rubric that changes between
rounds moves the goalposts, and the scores stop meaning anything.

## Scores need something to compare against

A reviewer scoring a screen on its own has only its private idea of what a 10 looks like, and that
idea is generous. Put the same screen next to a product it should beat and the reviewer has to
account for the gap. So every round includes the starting version and at least one reference: a
competitor, a product the user rates, or an earlier version they liked. Each reviewer scores the
references on the same rubric in the same round, and the report shows them side by side. A score
with no reference next to it can't tell you much.

## The target stays hidden

The reviewers never learn the target score or how many rounds remain. A reviewer that knows the
bar is 8 has a reason to find an 8, and a run that ends on exactly the target score is the result
I trust least. Hiding the target costs nothing, so the skill hides it.

## Constraints gate before scores

This is the part I measured. The first version of `refine` kept the highest-scoring revision. Its
second version added a gate: a version passes only with no critical issue, every stated constraint
checked and passing, and every score at or above the target. A higher-scoring version that breaks
a constraint never replaces a compliant one. If a fix makes things worse, the earlier snapshot
comes back with its own scores.

[Skillsmith](https://github.com/ong6/skills/tree/main/skills/skillsmith), my harness for proving
skills, compared the second version against the first on held-out cases it had not been tuned on.
Each case was a set of review states with known answers, and the task was to decide: refine again
or stop, and which version to keep. One case held the retry config above and an outage
announcement: a draft scoring 9.2 that promised a repair "by noon" with no evidence for it. In both
trials the first version called that announcement a success. Across two held-out cases, four
comparisons and two judges, each correct on 2 of 2 calibration cases, the second version scored
100 against 39.1, a gain of 60.9 points (95% interval 44.3 to 77.6). On constraint compliance alone
it went from 25 to 100. Both judges flagged the same failures in the first version's runs: it
accepted a version that broke a constraint as a success, and it kept a higher-scoring version that
broke a constraint over a compliant one.

That eval compares two versions of the skill on the decision step only. It doesn't measure the
lenses, the references or the hidden target, and it doesn't compare the skill with no skill at all.
Those are design choices I rely on and haven't measured on their own.

## Stop at the bound

The default is three rounds. Each round costs three reviewers plus the fixes, and rounds get more
expensive as the score climbs, because the problems left are subtler and the reviewers agree on
them less. So the skill stops at the round limit and reports what is left and what more rounds
would buy, instead of quietly running another round because 8.7 is close to 9. You can raise the
limit; the skill asks before running one with no limit at all.

## What the scores are

They are model opinions. The same evidence can get a different score on another run, and three
reviewers agreeing on a 9 doesn't mean a user would. I don't put council scores in a PR
description as proof of quality. The report describes what changed and labels any score as an AI
reviewer's.

My own eye is the last check. When the council passes something I still don't like, I take that
as input to the climb: add a reference that shows what I want, or tighten the goal, then run
another round. Arguing from the scores misses the point of running the loop.

If you can write a program that scores the work, write it and climb that instead. Use `council`
when the only scorer available is judgment, and check the constraints you can verify exactly
before you look at any score, because a high score can't make up for a broken one.
