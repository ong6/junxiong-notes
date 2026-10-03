---
title: Opus orchestrated, GPT agents built, and nobody graded their own work
description: How Claude Opus ran GPT-5.6 coding agents through a nine-hour build, and why the quality came from reviewers, not from the workers' self-scores.
date: 2026-10-03
updated: 2026-10-03
category: AI systems
tags: [agents, orchestration, coding-agents, code-review, multi-agent]
project:
  name: Next Clear Look
  href: https://github.com/ong6/next-clear-look
  detail: The app the agents built — when Sentinel-2 next gets a clear look at a place on Earth.
---

Every worker agent in this build scored its own output between 8.8 and 9.9 out of 10. Independent reviewers scored the same work between 6 and 8.1, and found twelve defects in the engine alone, including a likelihood model that could never return a number. The quality in the finished app came from an orchestrator that refused to accept those self-scores.

I gave Claude Opus 5.5 one instruction: research five domains for a project that is visually striking, deep on the backend and genuinely useful; pick the best idea; then use three GPT agents to develop and build it until it is polished. Opus ran for about nine and a half hours, started 21 agent sessions and produced [Next Clear Look](https://github.com/ong6/next-clear-look), which predicts when a Sentinel-2 satellite will next pass over an area, measures how clear the recent images of that exact polygon were, and estimates the chance of a clear look in the next two weeks. I checked in once. The full record, with every number below, is in [how it was built](https://github.com/ong6/next-clear-look/blob/main/docs/how-it-was-built.md).

## One decider, many writers

The roles never blurred. Opus planned the work, wrote every goal, made every technical decision, merged the branches and decided what was accepted. The workers were GPT-5.6 coding agents, each running in its own terminal session. Reviewers were fresh Claude sub-agents that had not written the work they judged.

A worker's goal file had the same shape every time: a two-line intent, the exact deliverables, the paths it may write, how to verify, and when to stop. When it finished, it wrote a `STATUS` file — `done` or `blocked`, a self-score, and the deliverables — and ended its turn. Opus read the file, not the chat. A blocked worker asked a technical question and Opus answered it. Workers never waited on me.

That split matters because the workers are good at depth inside a goal and poor at judging the goal itself. Everything that compared one piece of work with another stayed with the orchestrator.

## Fan out wide, then judge across the fan

Five research agents ran in parallel, one each for space and Earth observation, mobility, energy and climate, life sciences, and internet infrastructure. Each had to fetch every data source an idea depended on and save a sample, so an idea built on a dataset that needed a login or a purchase fell out early.

Twenty-five ideas came back. Their self-scores sat between 46 and 52 out of 60, which made them useless for ranking across domains: every agent had rated its best idea as roughly the best idea anywhere. Opus built its own comparison table and picked the satellite idea for two reasons it could defend: a 3D globe with moving spacecraft reads in ten seconds to anyone, and the backend has three independent hard problems — orbit propagation and swath geometry, cloud statistics from partial reads of satellite images, and a probability model.

## Specs first, conflicts ruled once

Three agents then wrote specifications in parallel: the engine's architecture and OpenAPI contract, the product spec and design system, and the data, replay and quality plan. That took about twenty minutes. The engine agent's spike already checked the core claim against reality: predicted passes matched five of five real acquisitions over Singapore with a median timing error of 0.27 seconds.

Before any code, a Claude reviewer cross-read the three specs and found 28 conflicts, seven of them blocking. The same Singapore area had three different polygons. A Compose network could not publish its port. The fixture budget could not hold the history the likelihood model needed. No keyless source of historical orbital elements existed. Opus ruled each one in a numbered [decision log](https://github.com/ong6/next-clear-look/blob/main/docs/decisions.md), and every later goal cited it.

Writing three specs in parallel was cheap. Reconciling them was the work, and it had to happen while they were still text.

## Three writers, three clones, one merge loop

Each building agent worked in its own clone on its own branch and owned a list of paths. The engine agent published the contract first so the web agent could build against generated examples. A loop merged every pushed branch into `main` every five minutes: 56 merges, no conflicts.

The most useful step was a dry run before the first merge. The data agent merged the engine's unfinished branch into a throwaway branch and recorded real satellite data through it. It found 18 seam problems, 12 of them on the engine side: wrong environment variable names, a hash that was never checked, an ephemeris file the astronomy library refused to open. Each went to the engine agent as a one-line message while both kept working.

## The self-score problem

This is the part that mattered most. Every round ended with the worker scoring itself, and every round was judged again by a reviewer that had not written it.

| Round | Self-score | Independent result |
|---|---:|---|
| Engine, first implementation | 9 | 12 defects; acquisition rate 0.38 against an observed ~0.90 |
| Web, first hero pass | 9.3 | A second satellite drawn at an invented offset; the pass lit at the wrong hour |
| Web, visual round 1 | 9.7 | 7.0; the main visual effect was invisible against the Earth |
| Platform, all 17 gates green | 9.8 | Repository 6/10 with four critical issues |

The engine's 0.38 came from assuming each satellite repeats its ground track every five days. It repeats every ten, so the model expected 165 passes over three years where about 70 were possible, and counted the difference as missed acquisitions. The tests were green because they tested what the agent believed.

The 6/10 repository is the instructive one. Every gate passed. But drawing an area on the globe was a stub that invented its own vertices from the current preset's centre, the README described a map layer and an image-reading optimisation that did not exist, there was no licence, and the screenshot baselines existed only for macOS, so CI would have failed on its first Linux run. A green test suite and a 9.8 self-score described a product whose headline interaction was fake.

The loop ran to the end. After the third round and Opus's own final pass, a fresh reviewer scored the repository 7.5 and found one false claim left in the README: identical requests did not produce identical event streams, because job IDs counted every job already stored. Opus fixed the code and added a test instead of softening the sentence.

The reviewers worked because of how they were briefed, not because they were smarter. Each got the goal, the binding decisions and the complete output; in an earlier build, a partial copy had made a reviewer report evidence as missing when it existed. Each was told the bar in one sentence, asked for a score out of ten, and required to reproduce defects with a script and cite a file and line. The lowest score counted. Work was accepted at 8 or above with no critical issue, and after three rounds on the same part Opus stopped delegating and finished it itself.

## Keeping long sessions alive

Long agent sessions fail quietly. A watchdog checked each session every minute. It interrupted one model call that had been silent for eight minutes and one command that had hung for 101 minutes, and nudged idle sessions that still had open work. When a session fell to about 20% of its context, the watchdog had it commit its work and write a handoff file of at most 80 lines. A fresh session started from that file. Every new round also started a fresh session, so no worker carried stale goals or old decisions forward.

## Where the orchestrator was wrong

Opus made mistakes too, and found them the same way: by reading evidence instead of trusting its own plan.

It set a rule for the replay clock that required the next Singapore pass to fall two to four hours after the recording, which blocked recording for most of the day. The data agent reported `blocked` with the arithmetic, and the rule was amended. It set a catalogue budget so tight that the recorder shrank four preset areas to boxes two to eight kilometres wide; the Rotterdam preset no longer contained the port it was named after. Opus caught that in the fixture report, raised the budget and had them re-recorded at 130 to 497 square kilometres. And its own visual direction for the globe was not enough: the product only became striking after a dedicated art-direction review that specified camera poses, materials and lighting values.

The first push to GitHub failed too. One workflow step was pinned to an action commit that does not exist, a plausible-looking hash no agent had checked, and the five browser gates timed out because hosted runners render the WebGL globe in software. Opus verified every pin against GitHub, moved the browser gates to a documented workstation run, and kept the other twelve gates in CI.

## What I would keep

If I keep one rule from this build, it is that the agent that wrote the work never grades it. Budget a fresh reviewer for every round, hand it the whole output and a one-sentence bar, and let the lowest score decide. The GPT agents were fast and capable, and they wrote nearly all of the code. Their nine and a half hours of output became worth publishing only because something else read it.
