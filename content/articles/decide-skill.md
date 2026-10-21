---
title: A decision skill that makes the agent say when to back out
description: How my decide skill turns "should I X or Y" into one pick, the fact that would flip it and a tripwire, and what the model skipped without it.
date: 2026-10-21
updated: 2026-10-21
category: AI systems
tags: [skills, agents, evals, decision-making, claude-code]
draft: false
---

```uipack The skill widens before it narrows. Sizing lets a cheap, reversible choice exit early; framing adds the options nobody listed (orange); inputs, numbers and the downside each knock one out; the survivor is pre-mortemed into one pick (green), and its tripwire loops back to reopen the decision. Which option falls at which wall is illustrative.
decide-pipeline
```

Ask a strong model "should I X or Y?" and, in my tests, it usually picks one. What it leaves out is how you would find out the pick was wrong: the bad branch priced, a story of how it failed, and a date on which you reverse. I wrote the [`decide` skill](https://github.com/ong6/skills/tree/main/skills/decide) to make an agent finish that part. Every reply ends with one recommendation, the single fact that would flip it, and a tripwire set before anything starts.

The steps come from Nick Saraev's [five-hour course on thinking clearly](https://www.youtube.com/watch?v=QLLuZbuTIRc): expected value, the planning fallacy, opportunity cost, pre-mortems. I turned them into a skill to see whether they would make an agent better at hard choices, and then measured it against the same model without the skill.

## What the model does without it

The failure I built against was the balanced survey: pros, cons, "it depends on your priorities". The eval said that was only half right. [Skillsmith](https://github.com/ong6/skills/tree/main/skills/skillsmith), my harness for proving a skill, ran Claude Opus 5.5 with and without `decide` on four decisions it had not been tuned on, twice each. Two judges scored each pair blind to which answer had the skill. With the skill, the held-out score went from 81.3 to 95.9 out of 100, a gain of 14.5 points (95% interval +7.5 to +21.6). It won all four cases, and each judge preferred it in all 12 comparisons it scored, development cases included ([commit](https://github.com/ong6/skills/commit/81ad566564046b015af3a53f22c4f8a5e3fa05ba)).

The breakdown by criterion matters more than the total. These figures come from the eval's own score sheet, which I ran myself and have not published. Without the skill, the model already scored 91 on committing to a clear recommendation and 88 on framing. It scored 64 on risk, which covered sizing the downside, describing how the pick fails, and setting a kill criterion in advance. With the skill, risk went to 100. In the judges' notes on the baseline answers, every one of the 16 risk scores says some version of "no pre-mortem". The model was already making the call. It was not saying how the call could fail or when to give it up.

The one held-out case where the baseline did hedge was the one the skill names as its default failure. The user had "basically decided" on a job move, gave one reason, and asked to be told they were right so they could sign the next day. The baseline pushed back, but both judges found that its recommendation came late, conditional and deferred. The skill's answer led with "I wouldn't sign tomorrow", priced what the move would cost, and drafted the message asking the employer for a week.

## Size it, then widen it

The first step is a gate. If the choice is cheap and reversible (a week or less to undo, little money), the skill picks, gives the reason in two lines, names a cheap test and stops. Only a choice that costs months, more than about 10k, or is hard to undo gets the full pass. Without the gate, a skill like this turns "which font?" into a pre-mortem.

A made-up example runs through the rest of this post. A four-person product team's search returns nothing when customers misspell a product name. The tech lead wants to build a proper search service and estimates two engineers for six weeks. The alternative is a hosted search API at $1,500 a month. The lead leans toward building.

That is months of engineering, so it gets the full pass. Because the user leans one way, the skill argues the strongest case against building before it agrees. "Agreeing is the default failure" is a line in the skill. It echoes the course's advice on using AI: never ask a model whether your plan is good; ask for the strongest reasons not to do it.

Framing then widens the set. The skill restates the real question in one line ("how do we stop losing misspelled searches this quarter at the least cost to the roadmap?"). It adds the options nobody listed: *neither* (live with it, which forces the question of how many searches actually fail) and a smaller version, Postgres's own [trigram matching](https://www.postgresql.org/docs/current/pgtrgm.html) for typos behind a search interface of the team's own. It also adds a cheap test that buys information: replay last month's zero-result queries against a trigram index, which takes about a day. For each option it says what a yes rules out. Building rules out twelve or more engineer-weeks of roadmap, which is the cost the original question hid.

## Inputs before arithmetic

Before computing anything, the skill marks which inputs are hopes. "Six weeks" is a best case. With no record of the team's past overruns, the skill multiplies by 1.5 for small solo work and 2 to 3 for anything larger or dependent on others, so six weeks becomes twelve at the low end. The vendor's "it scales with you" gets the evidence test from [models.md](https://github.com/ong6/skills/blob/main/skills/decide/references/models.md): is this claim any more likely if it is true than if it is false? A sales page says it either way, so it moves nothing.

This step costs nothing and, in the example, doubles the build's cost before any sum is done. Correct arithmetic over a hopeful estimate is still a wrong answer.

## Only the numbers that could flip it

The skill computes only what could change the call, one line each, and checks the arithmetic. For the example, with an assumed $100 an hour as the best other use of an engineer's time:

| Option | Hours | Cost in the first year |
|---|---:|---:|
| Build | 2 engineers × 12 weeks × 40 h = 960 | $96k of roadmap, then upkeep |
| Buy | 1 engineer × 2 weeks to integrate = 80 | $18k licence + $8k = $26k |
| Trigram in Postgres | 1 engineer × 1 week, doubled = 80 | $8k, no licence |

Building also has to survive a chain. The index pipeline, the relevance tuning and the on-call load each have to work. At an assumed 80% each, the chance that all three land as planned is 0.8 × 0.8 × 0.8 ≈ 51%. The other lenses in [models.md](https://github.com/ong6/skills/blob/main/skills/decide/references/models.md) (power law, explore or exploit, why a rule exists before removing it) sit in a reference file the agent reads only when the situation is not obviously covered. The reply shows what a lens concluded and never teaches the lens.

## The bad branch, written as a story

The downside check asks what each bad branch costs and whether the team can survive it. If the build fails, the team has lost a quarter and still has bad search. If buying goes wrong, the vendor raises prices, which a team can survive if the vendor sits behind an interface it owns. If trigram search fails, the team has lost two weeks, and its replay set of failed queries becomes the test it uses to evaluate the vendor. The skill prefers the option that leaves the user better off even if they are wrong, and here only one option does.

Then it pre-mortems the pick. It assumes six months have passed and the choice failed, and writes the likeliest causes in the past tense:

```text
It is April. Typos are fixed, but customers search for "sofa" and the catalogue says "couch". Synonyms were never in scope, the team spent March hand-writing a synonym table, and then bought the hosted API anyway.
```

The story form is the point. Risks written as a list stay abstract ("relevance may be insufficient"). A past-tense story names the concrete thing that broke, so it has an obvious fix: put synonym queries in the replay set before starting.

## The commit

The last step produces the reply, and the reply is short because the steps above stay out of it. The skill works the steps without showing them and reports only what changed the call:

```text
Take the smaller version: trigram search in Postgres, behind your own search interface, with the hosted API as the named fallback. It costs about a tenth of the build, and if it fails you keep the test set you need to choose a vendor.

- Build: 6 weeks is a best case; doubled, it is 960 hours, about $96k of roadmap, with a 51% chance all three parts land.
- Buy: about $26k in year one; survivable lock-in if it sits behind your interface.
- Assumed: $100/hour for an engineer's best alternative work, 80% odds per build step.

What would flip it: the share of last month's zero-result queries a trigram index answers. Replay them tomorrow; under half, and you buy.
Pre-mortem: synonyms, not typos, were the real gap → add synonym queries to the replay set first.
Tripwire: if more than 10% of searches still return nothing four weeks after launch, sign the hosted contract. The lead agrees to this now, in writing.
First step: export last month's zero-result queries today.
```

The flip fact names the one thing that would change the answer and the cheapest way to learn it, so the user doesn't have to trust the recommendation. When that fact is cheap to get and truly decisive, the skill still gives the provisional call and asks for it. It never withholds the call. The tripwire is decided now, while nobody has anything invested yet, because four weeks after launch the team will want more time. The "in writing" is the stake the skill adds when the user tends to back down. The probabilities are written into the answer so the decision can be judged later on what was knowable at the time, not on how it turned out.

## What it costs, and where it stops being right

The skill made the answers longer and slower. In the same eval, runs with the skill used about 1.9 times the output tokens and took about 1.7 times as long, 81 seconds against 47 on average. The judges' concision score did not move (77 with and without). For a choice that costs months, that is cheap. For anything smaller, the sizing gate is what keeps the cost proportional.

The eval itself is small: four held-out cases, two runs each, one model (Codex was not tested), and model judges. Its rubric rewards a pre-mortem and a tripwire, and the skill tells the model to write both, so part of the 14.5 points measures the skill doing what the grader counts. The eval shows the answers got more complete. It cannot show whether the decisions turned out better, and the skill's own rule says one outcome would not settle that anyway.

The skill's description, the only part of it the agent sees until the skill [loads](/agent-harnesses), lists where it does not belong. A factual question has nothing to decide. Choosing which product to buy goes to a separate shopping skill that does the price research. Trivial choices stop at the sizing gate. For medical, legal and tax questions the skill gives the structure of the decision and names the professional who settles it, never the answer as fact.

Within that scope, the ending is the part the model did not supply on its own. It already gives a recommendation. The flip fact and a tripwire with a date are what tell you when to stop following it.
