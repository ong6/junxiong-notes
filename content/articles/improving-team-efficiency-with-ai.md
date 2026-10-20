---
title: Improving team efficiency at a high level
description: Giving everyone an AI tool makes individuals faster, not teams. Eight levels where a team's AI effort pays off, and why checking work sets the pace.
date: 2026-10-20
updated: 2026-10-20
category: AI systems
tags: [teams, harness, agents, verification, adoption]
draft: false
---

Giving every engineer an AI coding tool makes individuals faster and usually leaves the team about as fast as it was. The code an agent writes still has to be understood, checked, reviewed and shipped, and those steps were sized for human-speed output. If an agent writes a change in minutes and a reviewer needs an hour to trust it, the team ships at reviewer speed. I think most of the efficiency a team can get from AI sits in those later steps, not in the model or the prompt.

When people plan AI adoption they tend to name two levels: their own workflow, and shared tooling such as MCP servers that connect agents to internal systems. Both matter. They are also the two ends of a longer stack, and the levels in between are where teams stall.

## The levels

| Level | What it is | What makes it faster |
|---|---|---|
| 1. Personal | One person's prompts, Skills and habits | A small instruction file, plan before editing, reusable Skills, parallel sessions |
| 2. Team harness | What every agent in a repo is told and given | Shared instruction file, team Skills, a written definition of done |
| 3. Verification | How agent output earns trust | Fast tests, generated tests, CI that explains failures, risk tiers for merging |
| 4. Environment | Where agents run | Ready-made dev environments and sandboxes that start reliably and don't queue |
| 5. Tooling | What agents can reach | MCP servers and Skills for the systems the work touches, in one registry |
| 6. Process | How work is shaped | Agent-sized tasks, review of evidence, humans approving rather than typing |
| 7. Measurement | Whether any of it helped | Cycle time, human minutes per change, rework rate |
| 8. Governance and enablement | Rules and spread | Clear data rules, scoped permissions, a place to share what worked |

The order is roughly the order I would invest in, with one exception: verification (level 3) limits throughput from the first week, so it deserves attention before the levels above it are finished.

## Checking the work sets the pace

An agent's output is only useful once someone trusts it. That trust comes from evidence: a test that passed, a type check, a reviewer who read the diff. When the evidence is thin, a human reads every line, and the team's speed is the speed of that reading.

Agents are also uneven. They are good at finding and explaining things: why a build failed, what a diff changes, which commit probably caused an incident. They are weaker at changing things safely, because a fix can compile and still be wrong. So I would automate diagnosis first and repair second. A CI job that posts a correct explanation of a failure saves time on every red build and cannot break anything. A CI job that pushes fixes needs a narrow scope, a rerun, and a person who can revert.

The practical work is unglamorous:

- Make the test suite fast enough that an agent can run it on every change.
- Have agents write tests, and have humans review the tests more carefully than the code, because the tests are what the next change will be trusted against.
- Split changes into [risk tiers](/anthropic-verification-layers#5-human-approval-scaled-by-risk). A copy edit or dependency bump that passes checks can merge with a light review; a change to payments or permissions keeps a full one.

Every check you add lets you remove a human step without losing confidence. That trade is where most of the time goes.

## The team harness

A team harness is the context and capability every agent in a repo starts with: an [`AGENTS.md`](https://agents.md) or `CLAUDE.md` at the root, scoped rules in subfolders, a few team Skills, and a definition of done. One person writing it improves every agent session on the team, which makes it the cheapest large win on the list.

The common worry is that a shared harness will force one workflow on people who work differently. It does if you put workflow in it. It doesn't if it holds only what is true no matter who runs the agent.

[Harnesses](/agent-harnesses) already separate these layers. Claude Code, for example, as of October 2026, loads a personal `~/.claude/CLAUDE.md` with "personal preferences for all projects" alongside the project file. Its docs say the project file should hold "build and test commands, coding standards, architectural decisions" and focus on "project-level standards rather than personal preferences" ([Claude Code docs](https://code.claude.com/docs/en/memory)). Most other agent tools have a similar user-level and project-level split.

| Team layer: facts about the repo | Personal layer: how you like to work |
|---|---|
| How to build, test and run it locally | Whether to plan first or edit straight away |
| Architecture and where things live | Subagents, parallel sessions, review style |
| Patterns that are banned and why | Tone, verbosity, commit message habits |
| What "done" means: tests, docs, checks | Your own Skills and shortcuts |
| Guardrails: files and systems not to touch | Which model and effort level to use |

Skills make the split easier. A Skill's body "loads only when it's used" ([Claude Code docs](https://code.claude.com/docs/en/skills)), so a team Skill library adds options without adding rules. Someone who never uses the release Skill never pays for it.

My test for whether a line belongs in the team file: would a new hire need it on their first day, whatever their habits? If yes, it goes in. If it describes how to work rather than what is true, it goes in a Skill or a personal file. Then keep the file small. Prune lines the agents ignore, and lines that have gone stale, because [a long instruction file is followed less reliably than a short one](/context-engineering-for-coding-agents#how-i-would-organise-a-session).

## Environments

Agents that run in the background need an environment that is ready when they start: dependencies installed, test data seeded, credentials scoped to the task. If that environment is flaky or the queue is long, people go back to running agents on their laptops, one at a time, while watching them. Background work only pays off when starting a run is boring.

## Tooling

This is the MCP level: connecting agents to the ticket tracker, the logs, the metrics, the deploy system. It matters, and I've written separately about [how those integrations get built in large organisations](/agent-integrations-in-large-orgs). I would build it after the levels above, because by then you know which workflows need which systems. Tools built first tend to be general, and general tools are the ones nobody adopts.

## Redesigning the work

Once the harness, checks and environments hold up, the work itself can change. Requirements get split into tasks an agent can finish and prove. Agents run in the background while people do something else. Reviewers read evidence first, such as the tests, the trace and the risk tier, and read the diff where the evidence is weak.

Doing this earlier mostly moves the queue. If you hand agents ten parallel tasks and review is still line by line, you have ten pull requests waiting instead of one.

## Measuring what changed

Token spend and the share of code written by AI measure activity. They go up whether or not the team got faster, so I would not report either as a result. The numbers that tell you something:

- **Cycle time** from task start to merged change.
- **Human minutes per merged change**, including prompting, waiting and review.
- **Rework**: reverts, follow-up fixes, and bugs found after release.

Human minutes per change is the most useful one, because it points at the weak level. A lot of time spent prompting points to the harness. A lot spent reviewing points to verification. A lot spent waiting points to the environment.

## Governance and enablement

People use tools they are sure they're allowed to use. Write down which data may go to which tool, make sure an agent never has more access than the person running it, and make the approved path the easy one. Then give teams one place to share what worked: a Skill, a harness file, a before-and-after number. Adoption spreads by copying a working example far more than by mandate.

## Where I would start

Pick one workflow the team runs often and knows well: small feature requests, failing CI builds, or bug triage.

1. Write the team harness for that repo.
2. Add the checks that let agent output in that workflow be trusted without reading every line.
3. Measure cycle time and human minutes per change for a few weeks before and after.
4. Package what worked, the harness, the Skills and the checks, as tooling other teams can copy.

That order gives you a result you can show before you ask anyone to adopt anything. Starting with the platform asks teams to believe it will help; starting with one workflow lets them see it.
