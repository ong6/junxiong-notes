---
title: Hill-climb any deliverable with the /council skill
description: "council puts an agent's work in front of fresh reviewers that pick their own metrics, score it out of 10 and send it back until it passes."
date: 2026-11-05
updated: 2026-11-05
category: AI systems
tags: [skills, agents, evals, claude-code, code-review]
draft: true
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
`council` keeps the 8.8. The 9.3 broke the one rule the brief gave, and a high score never cancels a broken
constraint. I use the skill often, and this is the failure that rule was written against.

```uipack Fresh reviewers each round, a target they never see, and a gate that checks constraints before scores. A failed gate sends the work back to the main agent, not to the same reviewers.
council-loop
```

The [`council` skill](https://github.com/ong6/skills/tree/main/skills/council) merges two things:
my earlier `refine` skill, which had the constraint gate, and the loop Theo describes in [Agents
Sucked At UI (Until Today)](https://www.youtube.com/watch?v=xq0eB8vxeqk). He pushed an agent to
redesign T3 Code's UI until a council of models, one strong model from each of three providers,
rated screenshots 9 out of 10. His council mixed providers. Mine runs in Claude Code with one model
family, so the variety comes from somewhere else.

## Why the agent can't grade itself

An agent that just built something is the worst reviewer of it. Its context holds the plan, the
intent and every fix it already made, so it reads what it meant into what it made. That is my read
of why "review your own work" returns "looks good" so often, not a measured result. The skill
treats it as a rule anyway: the agent that makes the changes never scores them. Each round spawns
new reviewer subagents with no conversation history. They get the brief, the exact version under
review, the starting version and the references. They never see the agent's reasoning or earlier
feedback.

With one model family, three reviewers given the same prompt are close to one reviewer run three
times. So each gets a lens picked for the job: first-time user, daily power user and visual
designer for a UI; correctness, future maintainer and on-call operator for code; target reader,
editor and skeptic for prose. The lenses disagree in useful ways. A designer may dock a muted label
that a power user is glad to see recede.

## Metrics come from the reviewers, then freeze

"Make it better" gives an agent nothing to climb. A number does. Theo's examples of hill climbs
that work are programmatic: make the eval for his MCP tools pass while using a third of the
context, or send four times less data to the client with no UI regressions. A UI has no such
program, so the council builds the closest substitute.

In round 1 each reviewer proposes three to six metrics for this goal, says what a 6, an 8 and a 10
look like on each, and names any metric that could be measured instead of judged: contrast ratio,
test pass rate, p95 latency, word count. The agent merges these into one rubric of four to seven
metrics and turns every measurable one into a command it runs each round. Where a command exists,
its number beats any reviewer's opinion. Then the rubric freezes. A rubric that changes between
rounds moves the goalposts, and the scores stop meaning anything.

## Scores need something to compare against

Theo's most useful data point is the one that undercut his first result. His first council took
T3 Code from 6 to 9 in three rounds, and the goal was met. He didn't think the UI was a 9, so he
started a fresh thread and added screenshots of Claude Code and Codex to the comparison. The Codex
reviewer that had just given the PR a 9 now scored it 7.4, against 7 for the unchanged main
branch. Nothing about the screenshots changed. What changed was having something to compare them
to.

So every `council` round includes the starting version and at least one reference: a competitor, a
product the user rates, or an earlier version they liked. Each reviewer scores the references on
the same rubric in the same round. Without a reference, a score has nothing to be measured
against.

## The target stays hidden

The reviewers never learn the target score or how many rounds remain. Theo noticed the reference
scores drifting: Claude Code went from 8.3 to 9.1 over a run in which its screenshots never
changed. He suspected that telling sub-agents about the 9.5 goal had influenced their scores, and
said he might stop doing it. I took that as a rule from the start. A reviewer that knows the bar
is 8 has a reason to find an 8. Hiding the target costs nothing.

## Constraints gate before scores

This is the part the eval measured. The rule appeared when I revised `refine`. Its first version
kept the highest-scoring revision. The revision added a gate: a version passes only with no
critical issue, every stated constraint checked and passing, and every score at or above the
target. A higher-scoring version that breaks a constraint never replaces a compliant one. If a fix
makes things worse, the earlier snapshot comes back with its own scores.

[Skillsmith](https://github.com/ong6/skills/tree/main/skills/skillsmith), my harness for proving
skills, compared the revision against the first version on held-out cases it had not been tuned
on. Each case was a set of review states with known answers, and the task was to decide: refine
again or stop, and which version to keep. One case held the retry config above and an outage
announcement: a draft scoring 9.2 that promised a repair "by noon" with no evidence for it. In both
trials the first version called that announcement a success. Across two held-out cases, four comparisons and two judges, each correct on 2 of 2 calibration cases, the revision
scored 100 against 39.1, a gain of 60.9 points (95% interval 44.3 to 77.6). On constraint
compliance alone it went from 25 to 100. Both judges flagged the same failures in the first version's runs: it
accepted a version that broke a constraint as a success, and it kept a higher-scoring version that
broke a constraint over a compliant one.

That eval compares two versions of the old skill on the decision step only. It doesn't measure the
lenses, the references or the hidden target, and it doesn't compare `council` with no skill at all.
Those parts rest on Theo's runs and on how the loop behaves in my own use.

## Stop at the bound

The default is three rounds. Going from 9 to 9.5 cost Theo ten more rounds. His whole experiment
came to about 17.6 hours of parallel agent time and roughly $400, about $250 of it for the work he
showed. Most of what he spent went on the last half point. So the skill stops at the round bound
and reports what is left and what more rounds would buy, instead of quietly running another round
because 8.7 is close to 9.

## What the scores are

They are model opinions. Theo says the same screenshot given to the same model three times can get
three different scores, and he called the method silly but working. A 9 from the council means
three reviewers with different lenses agreed against references. It doesn't mean a user would
agree, and I don't put council scores in a PR description as proof of quality. The report
describes what changed and labels any score as an AI reviewer's.

The user's eye is the last check. Theo's first run cleared its 9/10 goal, and he still didn't
accept it: he wanted T3 Code to look better than Claude Code and Codex, not just better than it
used to. That objection started the second climb, and the climbs after it produced the version he
was happy with. When a council pass
and your own judgment disagree, take your judgment as new input to the climb: add a reference or
tighten the goal, then run another round.

If you can write a program that scores the work, write it and climb that instead. Use `council`
when the only scorer available is judgment, and keep the constraints you can check exactly in
front of the scores, because a high score can't make up for a broken one.
