---
title: A model's score belongs partly to its harness
description: Claude Code, DeepSeek and Hermes are three different kinds of thing. What a harness is made of, how far it moves a model's score, and what breaks when one harness runs another.
date: 2026-10-13
updated: 2026-10-13
category: AI systems
tags: [harness, agents, claude-code, hermes, deepseek, evals]
draft: true
---

DeepSeek held one checkpoint of V4.1-Flash fixed and ran it through eight harnesses, changing nothing but the loop around the model. Its DeepSWE score moved from 65.5 in OpenCode to 74.2 in mini-SWE, a loop with a single bash tool, and Claude Code, Codex and pi all landed in between ([DeepSeek](https://arxiv.org/abs/2609.19969)). The same paper puts Opus 5 at 74.0 and Kimi K3 at 67.5 on that benchmark, so swapping the harness moved one model further than the gap between two frontier models. DeepSeek's own conclusion is that "scaffold choice matters at least as much as the effort tier".

So "Claude vs DeepSeek vs Hermes" compares three different kinds of thing. In [the AI stack roadmap](/ai-stack-roadmap) I gave the harness two jobs: choosing which tokens go into the window, and limiting what the agent can damage. Each job turns out to be several layers, and the products people compare cover different ones.

## Three different kinds of thing

- **Claude Code is a harness tied to one model family.** It runs Claude through Anthropic's API or the large clouds, and Anthropic doesn't support pointing it at other models ([Claude Code docs](https://code.claude.com/docs/en/llm-gateway)).
- **DeepSeek is a model family that mostly runs inside other people's harnesses.** Its API has accepted Anthropic's request format since August 2025, which is how Claude Code can drive DeepSeek models ([DeepSeek](https://api-docs.deepseek.com/news/news250821)), and its docs list integrations for eight harnesses, Hermes among them ([DeepSeek](https://api-docs.deepseek.com/quick_start/agent_integrations/hermes)). Since August 2026 it also ships its own MIT-licensed harness, DeepSeek Harness, still in alpha ([GitHub](https://github.com/deepseek-ai/deepseek-harness)).
- **Hermes Agent is a harness for any model, built to stay on.** It keeps memory between sessions, runs scheduled jobs and answers on more than 20 chat platforms ([Hermes docs](https://hermes-agent.nousresearch.com/docs/user-guide/messaging)).

My own setup has all three, at different layers. Claude Code is my coding harness. Hermes is the assistant I reach from my phone, and DeepSeek V4 Pro is a model inside Hermes, its paid fallback. I chose Hermes over OpenClaw for that job. OpenClaw has published hundreds of security advisories this year ([GitHub](https://github.com/openclaw/openclaw/security/advisories)), and Hermes keeps memory, cron and the chat gateways in one process.

## Nine layers, four questions

The vendors now draw the harness as separable parts. Anthropic's Managed Agents split into three swappable pieces: the session log, the harness loop and the sandbox ([Anthropic](https://www.anthropic.com/engineering/managed-agents)). Moonshot's Kimi K3 paper calls a harness "a collection of configurable, composable modules", from tool interfaces and system prompts to memory and subagents ([arXiv](https://arxiv.org/abs/2607.24653)). I group the parts by the question each one answers.

```stack Nine harness layers, bottom-up, in four groups; the sections below take one group each. Evals score a model and its harness together, and traces should record every layer.
harness-layers
```

### Running the model

The **model adapter** speaks the provider's format, and it is where open models break inside closed harnesses. MiniMax found that a harness which dropped the model's earlier reasoning between tool calls cut M2's τ² score from 87 to 64 ([MiniMax](https://minimax.io/news/why-is-interleaved-thinking-important-for-m2)). The **agent loop** calls the model, runs its tool calls and decides when to stop, and its prompt and turn-taking are themselves something the model was or wasn't trained on.

The **tools** give the model actions, and every definition costs context. Anthropic's tool search cut tool-definition tokens by about 85% and raised Opus 4.5's tool-use accuracy from 79.5% to 88.1% ([Anthropic](https://www.anthropic.com/engineering/advanced-tool-use)). pi started from the opposite bet: four tools, and a system prompt plus tool definitions under 1,000 tokens ([Mario Zechner](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/)). Even pi added MCP and tool search in September ([changelog](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/CHANGELOG.md)).

### What the model sees

**Context** is what goes into this window: instruction files, skills loaded on demand, search results and summaries of earlier turns. A Claude Code session holds about 7,850 tokens before you type anything, which I broke down in [where your tokens go in a coding agent](/context-engineering-for-coding-agents). **Memory** is what survives the window, and harnesses cap it hard because it is re-read at the start of every session. Hermes allows 2,200 characters of memory plus 1,375 about the user ([Hermes docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory)), and Claude Code loads the first 200 lines or 25 KB of its memory file ([Claude Code docs](https://code.claude.com/docs/en/memory)).

### What it may touch

**Permissions and the sandbox** bound the blast radius, and permission prompts stop working as a control once people approve almost all of them: about 93% in Anthropic's data ([Anthropic](https://www.anthropic.com/engineering/how-we-contain-claude)). Claude Code now starts in auto mode ([changelog](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)), where a classifier approves actions, and Anthropic measured it letting through 17% of real over-eager actions at a 0.4% false-positive rate ([Anthropic](https://www.anthropic.com/engineering/claude-code-auto-mode)). Codex runs commands in an OS sandbox by default ([Codex docs](https://learn.chatgpt.com/docs/sandboxing)).

**Subagents** buy fresh windows at a price. Claude Code's agent teams use about seven times the tokens of a normal session when teammates run in plan mode ([Claude Code docs](https://code.claude.com/docs/en/costs)), and parallel writers make decisions that conflict. My rule from [the context post](/context-engineering-for-coding-agents) still holds: parallelise reading, never parallelise editing shared files.

### Where it runs, and who is watching

**Surfaces** are where a person meets the agent: a terminal, an editor, a phone, a chat app. They matter because approvals and questions need a person wherever the agent runs, which is why OpenClaw lists 34 chat channels ([OpenClaw](https://docs.openclaw.ai/channels)). The **schedule** runs the agent with nobody there, through cron jobs, heartbeats and hosted sessions. Failures go unnoticed and cost accrues by the hour: Claude Managed Agents bill $0.08 per session-hour on top of tokens ([Anthropic](https://platform.claude.com/docs/en/about-claude/pricing)).

```span Each bar is the run of harness layers a product covers natively, and the solid cell is where I think it is strongest. | Source: each harness's docs and repository, linked from each row.
harnesses
```

The chart splits the field in two. The coding harnesses sit low in the stack, around the adapter, the loop and the sandbox. The assistants, Hermes and OpenClaw, are strongest in memory and surfaces, and neither tries to beat the coding harnesses at code: both can hand a whole turn to Codex instead ([Hermes docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/codex-app-server-runtime), [OpenClaw docs](https://docs.openclaw.ai/concepts/agent-runtimes)).

## Same model, different harness, different score

```vega-lite The one-tool loop beat every full-featured harness, and the top two are the benchmark's own harness and DeepSeek's. | Source: DeepSeek-V4.1-Flash paper (arXiv 2609.19969), Table 4, vendor-reported.
{"title":{"text":"One DeepSeek checkpoint, eight harnesses","subtitle":"DeepSWE v1.1 score for V4.1-Flash at max effort. The model, decoding settings and tasks were fixed; only the harness changed."},
 "height":{"step":40},
 "data":{"values":[
   {"h":"mini-SWE (one bash tool)","v":74.2,"kind":"Benchmark's or DeepSeek's own"},
   {"h":"DeepSeek Harness, Minimal","v":72.6,"kind":"Benchmark's or DeepSeek's own"},
   {"h":"DeepSeek Harness, Standard","v":70.5,"kind":"Benchmark's or DeepSeek's own"},
   {"h":"Claude Code","v":69.8,"kind":"Third-party harness"},
   {"h":"DeepSeek Harness, PTC","v":67.6,"kind":"Benchmark's or DeepSeek's own"},
   {"h":"pi","v":66.2,"kind":"Third-party harness"},
   {"h":"Codex","v":65.6,"kind":"Third-party harness"},
   {"h":"OpenCode","v":65.5,"kind":"Third-party harness"}]},
 "encoding":{
   "y":{"field":"h","type":"nominal","sort":"-x","title":null},
   "x":{"field":"v","type":"quantitative","title":"DeepSWE v1.1 (%)","scale":{"domain":[0,100]},"axis":{"grid":true}}},
 "layer":[
   {"mark":{"type":"bar"},"encoding":{"color":{"field":"kind","type":"nominal","legend":{"title":null,"orient":"bottom"}}}},
   {"mark":{"type":"text","align":"left","dx":8,"fontWeight":600},
    "encoding":{"text":{"field":"v","type":"quantitative","format":".1f"}}}]}
```

Two things widen that spread. mini-SWE is the benchmark's official harness and DeepSeek Harness is DeepSeek's own, so the top scores have home advantage. A full-featured harness may also be paying for planning, web access and delegation that these timed tasks don't reward.

The public Terminal-Bench 2.0 board shows the same pattern with less control. Opus 4.6 scored 58.0 in Claude Code, last of its nine harnesses, and 76.4 in Meta-Harness. GPT-5 scored 49.6 in Codex and 35.2 in the neutral Terminus 2 harness ([Terminal-Bench](https://www.tbench.ai/leaderboard/terminal-bench/2.0)). Container settings alone moved that benchmark by 6 points in Anthropic's tests, and Anthropic says gaps under 3 points deserve skepticism ([Anthropic](https://www.anthropic.com/engineering/infrastructure-noise)).

A controlled table from one lab is worth more than a column of leaderboard rows, and a harness tuned to win a timed benchmark is not necessarily the one to run a two-hour session with hooks and permissions. A model's score is a statement about a model and a harness, so the first question about any score is which harness ran it.

## Labs train for one harness, or for all of them

OpenAI trained its Codex models for its own harness. GPT-5-Codex was "purpose-built for Codex CLI" ([OpenAI](https://openai.com/index/introducing-upgrades-to-codex/)), GPT-5.1-Codex-Max was its first model "natively trained to operate across multiple context windows through a process called compaction" ([OpenAI](https://openai.com/index/gpt-5-1-codex-max/)), and OpenAI tells developers to keep its exact `apply_patch` tool because the model "has been trained to excel at this diff format" ([OpenAI](https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide)). That fits GPT-5 scoring 14 points higher in Codex than in a neutral harness. Since GPT-5.4, OpenAI has folded the Codex models into its general one ([OpenAI](https://openai.com/index/introducing-gpt-5-4/)). Anthropic trains Claude on the published schemas of its bash, editor, memory and computer-use tools, ([Anthropic](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)), and Claude Code is grounded in those same tools ([Anthropic](https://claude.com/resources/articles/harnessing-claudes-intelligence)).

The open-weight labs went the other way, because their models will run in harnesses they don't control. Kimi K3's RL environment "can instantiate mainstream harnesses such as Kimi Code, Claude Code, Codex, OpenClaw, and Hermes" ([arXiv](https://arxiv.org/abs/2607.24653)), and DeepSeek scaled RL for V4.1-Flash by "the number of scaffolds" ([arXiv](https://arxiv.org/abs/2609.19969)). MiniMax explained why: its model's performance would "plummet" when the scaffold changed even slightly ([MiniMax](https://huggingface.co/blog/MiniMax-AI/aligning-to-what)). Claude Code has become a training environment for other labs' models.

Running DeepSeek inside Claude Code works, with a catch at the adapter. DeepSeek's Anthropic-compatible endpoint ignores `cache_control` and applies its own automatic prefix cache instead, and it rejects several content types Claude Code can send ([DeepSeek](https://api-docs.deepseek.com/guides/anthropic_api)). Its reasoning has to be passed back on every tool call, or the API returns an error ([DeepSeek](https://api-docs.deepseek.com/guides/thinking_mode)). The cache arithmetic in [why the same prompt can cost more](/prompt-caching-across-harnesses) stops describing the session the moment you swap the model underneath.

## Adding harness layers

Harnesses now compose in six ways:

| Pattern | What calls what | Example |
|---|---|---|
| Subagents | A loop spawns fresh windows of itself | Claude Code subagents and agent teams, Codex `spawn_agent`, Hermes `delegate_task` |
| Harness as a tool | One agent calls another like a command | OpenAI's Claude Code plugin, with `/codex:review` ([GitHub](https://github.com/openai/codex-plugin-cc)) |
| Harness as a runtime | The outer harness keeps channels, memory and cron; the inner one runs the turn | Hermes on Codex's app-server; OpenClaw's `codex` and `claude-cli` runtimes |
| Editor to agent (ACP) | An editor drives any coding agent over JSON-RPC | 41 agents in the ACP registry used by Zed and JetBrains ([ACP](https://cdn.agentclientprotocol.com/registry/v1/latest/registry.json)) |
| Agent to agent (A2A) | Peers owned by different parties exchange tasks without sharing internals | A2A 1.0, now under the Agentic AI Foundation ([AAIF](https://aaif.io/blog/a2a-joins-aaif)) |
| Hosts and hosted harnesses | A product runs several vendors' harnesses, or runs one in the cloud | VS Code running Claude and Codex beside Copilot ([VS Code](https://code.visualstudio.com/docs/agents/run/agent-harnesses)); Claude Managed Agents |

The direction is towards hosting rather than calling. OpenAI removed `codex mcp-server` in September ([Codex release](https://github.com/openai/codex/releases/tag/rust-v0.154.0)) in favour of its app-server, which is how Hermes and OpenClaw host Codex.

I run two stacks myself. In [Opus orchestrated, GPT agents built](/opus-orchestrating-gpt-agents), one Opus session made every decision and 21 worker sessions did the building, handing work over through goal and status files. At home, Hermes takes a task from my phone and hands long coding jobs to Claude Code running in a terminal session. Hooks record whether a job finished or is waiting, and the result comes back to the chat thread that started it.

## What breaks at the joins

Several failures I hit in the home stack had the same shape: something assumed a person was watching.

- **Dialogs.** A job sat ten hours on Claude Code's "New MCP server found" prompt, which no hook fires for, so Hermes never heard back. The first-run "trust this folder?" prompt hung unattended jobs the same way.
- **Quiet fallbacks.** When my ChatGPT plan stopped accepting the configured model, Hermes fell back to paid DeepSeek without saying so, and every turn ran on it for at least six days. Separately, one rate-limit error from a side-task model marked the whole OpenRouter key as exhausted for an hour, which blocked the fallback too.
- **Wall-clock timers.** Hermes' stall watchdog counts wall-clock time, so a laptop asleep mid-turn looked like a 15-minute hang.

Two more show up in the public docs. A Claude Code subagent inherits its parent's permission mode, so if the parent runs in auto mode or bypasses permissions, the subagent's own setting is ignored ([Claude Code docs](https://code.claude.com/docs/en/sub-agents)). And OpenTelemetry's conventions for agent spans are still marked as in development ([OpenTelemetry](https://github.com/open-telemetry/semantic-conventions-genai)), so a single trace across nested harnesses is something you still assemble yourself.

The fix each time was to turn the human step into something the outer harness can see: a hook and a sweep that report any open dialog as waiting, a check that the configured model is still accepted, a side-task model with more than one upstream, and a power guard. None of them made the agents smarter. They made the stack say when it was stuck.

Every extra layer also costs a handoff. The inner agent starts without the outer one's context, and decisions made on one side are invisible on the other. Cognition's rule after building multi-agent systems is to "share full agent traces", not just messages ([Cognition](https://cognition.ai/blog/dont-build-multi-agents)). The handoff costs money too: a Claude Code subagent doesn't read its parent's prompt cache, because the two prefixes differ ([Claude Code docs](https://code.claude.com/docs/en/prompt-caching)).

## What I would do

Pick the harness for the job before the model: a coding harness for code, an assistant harness for reach and memory, and let the assistant hand coding turns to the coding harness instead of replacing it. Measure your own model and harness pairs on your own tasks, and treat a leaderboard gap under 3 points as noise. When you stack harnesses, keep one decider and single-threaded writes, and never let the agent that did the work grade it. Before adding a layer, list everything the inner harness expects a person to do, such as answer a dialog, notice a fallback or wake the laptop, and give each one a signal the outer harness can read. That list is the real cost of the extra layer.

```notes My notes on the harness layer
ai-stack-roadmap: The whole stack
context-engineering-for-coding-agents: Context
prompt-caching-across-harnesses: Model adapter
opus-orchestrating-gpt-agents: Subagents
agent-integrations-in-large-orgs: Tools and MCP
```
