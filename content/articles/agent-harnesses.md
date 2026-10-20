---
title: Claude Code, DeepSeek Harness and Hermes are built three different ways
description: One closed loop, a plugin kernel and a gateway daemon. Six ways to build an agent harness, what each lets you change, and why the score follows the plugins the model sees.
date: 2026-10-13
updated: 2026-10-20
category: AI systems
tags: [harness, agents, architecture, claude-code, deepseek-harness, hermes]
draft: false
---

Claude Code, DeepSeek Harness and Hermes Agent are built three different ways, and the build decides what you can change. Claude Code is one closed loop with fixed places to attach things. DeepSeek Harness is a plugin kernel in which "every part of the product is a plugin, including the model adapter, the tool registry, the session log, and the agent loop itself… There is no privileged core to patch" ([DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md)). Hermes is an always-on gateway that runs a loop for each turn.

That build is what let DeepSeek run an unusual test. It held one checkpoint of V4.1-Flash fixed and changed only which plugins its harness loaded. Its DeepSWE score went from 72.6 with a single bash tool, to 70.5 with the standard set of 26 tools, to 67.6 with nearly the same tools presented as code ([DeepSeek](https://arxiv.org/abs/2609.19969)). Comparing harnesses is comparing architectures more than features: each one decides whether you can change the model, the loop, the tools, or where the agent runs.

```uipack Three ways to build a harness. Claude Code seals the loop and the model into one binary and lets you attach things from outside. DeepSeek Harness makes everything, the loop included, a plugin chosen by a preset. Hermes keeps an always-on gateway that runs a fresh loop for each turn.
harness-architectures
```

## One closed loop: Claude Code

Claude Code runs one loop, "gather context, take action, and verify results", and the same loop sits behind every surface ([Claude Code docs](https://code.claude.com/docs/en/how-claude-code-works)). The Agent SDK is not a second harness: it is "a library that runs the Claude Code binary" ([Claude Code docs](https://code.claude.com/docs/en/agent-sdk/overview)).

Everything else attaches at fixed points. Tools come from MCP servers. Hooks fire on 33 events and can block a tool call, rewrite its arguments or replace its result ([Claude Code docs](https://code.claude.com/docs/en/hooks)). Skills load only when invoked, subagents get their own windows, and plugins bundle all of these. Since October, mods go further: in-process middleware that can rewrite tool calls, system-prompt sections and model steps, and some of Claude Code's own features now ship as mods ([Claude Code docs](https://code.claude.com/docs/en/plugins/mods/overview)).

What you cannot replace is the middle. Anthropic doesn't support routing Claude Code to non-Claude models ([Claude Code docs](https://code.claude.com/docs/en/llm-gateway)), the engine is closed source, and the loop can be wrapped or intercepted but not swapped out. That is a deliberate trade. Anthropic trains Claude on the published schemas of its bash, text-editor and memory tools ([Anthropic](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)), and Claude Code is grounded in those same tools ([Anthropic](https://claude.com/resources/articles/harnessing-claudes-intelligence)). You get a model and a harness built around the same tools, and you give up the right to change either.

## A plugin kernel: DeepSeek Harness

DeepSeek Harness is built on Cordis, a plugin runtime in which each plugin registers services, listens to typed events and has its registrations undone when it is unloaded ([DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-primer.md)). Nothing sits above the plugins. The agent loop is one plugin, each model adapter is a plugin, every tool is a plugin, and the Web UI, the SDK and the ACP server are each a bundle of plugins. A profile stacks bundles and YAML patches, and each session gets a preset, which is a list of plugins.

The modes in DeepSeek's paper are presets ([DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/bundle/web-app/presets)):

- **Minimal** is one persistent bash tool and a one-line prompt, with no instructions file, compaction or runtime context. It is the composition DeepSeek uses for RL training ([DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/bug-fix/2026-08-10-minimal-preset-owns-rl-composition.md)).
- **Standard** adds file, search, planning, skills, compaction, delegation and web tools.
- **PTC**, programmatic tool calling, keeps Standard's tools except one, but shows the model a single `run_code` tool and a generated TypeScript interface, so the model writes a short program that calls the tools ([DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/feature/2026-06-15-ptc.md)).
- **Agent Team** is a separate bundle, off by default, with a lead, named teammates and a shared task board.

Other harnesses plug in too. Through experimental bridges, DeepSeek Harness can load Claude Code's hooks and mods as plugins ([DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/claude-code-mods.md)). It can hand a subtask to a real, unattended Claude Code or Codex session ([DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent-claude-code/README.md)), and it reaches other labs' models through pi's provider library ([DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/llm/llm-pi-ai/README.md)). The agent can even extend its own harness: in Creator mode it writes a bundle and installs it, and the new tools appear in the same running session ([DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/practice/dynamic-cordis.md)).

The cost is size and stability. The repository holds more than 300 packages ([GitHub](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages)), the README warns "THERE WILL BE COMPATIBILITY-BREAKING CHANGES" ([GitHub](https://github.com/deepseek-ai/deepseek-harness#readme)), plugins run as trusted code, and the safety note says the project "must not be treated as secure" ([DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness/blob/master/SAFETY.md)). The design fits how DeepSeek trains. Its V4.1-Flash paper scales RL across several harnesses at once, and a kernel lets one codebase produce every harness variant it trains on as well as every product surface.

## A gateway daemon: Hermes Agent

Hermes is built around a process that never stops. "One AIAgent class serves CLI, gateway, ACP, batch, and API server" ([Hermes docs](https://hermes-agent.nousresearch.com/docs/developer-guide/architecture)). The gateway owns the chat-platform adapters, sessions, user authorisation, cron and delivery. For each message it runs a turn of the agent with that session's history, and it keeps recent agents cached so their [prompt prefixes stay warm](/prompt-caching-across-harnesses) ([Hermes docs](https://hermes-agent.nousresearch.com/docs/developer-guide/gateway-session-lifecycle)). Memory is two small files frozen into the prompt when a session starts ([Hermes docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory)), and Hermes writes and patches its own skills after a multi-step task ([Hermes docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills)).

The loop is the part it is willing to give away. With the Codex runtime turned on, commands, edits and sandboxing all run inside Codex, and "Hermes becomes the shell around it" ([Hermes docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/codex-app-server-runtime)). OpenClaw is the same type with more channels and a looser default: sandboxing is off unless you turn it on ([OpenClaw docs](https://docs.openclaw.ai/gateway/sandboxing)).

That matches how I use it. Hermes is the assistant I reach from my phone, and long coding jobs go to Claude Code. In this type the gateway is the product, and the coding loop is something it hosts.

## Six shapes, and what each lets you change

The three anchors are three of six shapes, and many harnesses combine two:

| Shape | Built around | Easy to change | Fixed | Examples |
|---|---|---|---|---|
| One closed loop | One vendor binary | Tools, hooks, skills, mods | The model and the loop | Claude Code, its Agent SDK |
| Plugin kernel | A runtime where all is a plugin | Anything, from configuration | Little, but nothing is stable yet | DeepSeek Harness |
| Gateway daemon | An always-on process | The model, the loop, the channels | The always-on host and what it exposes | Hermes Agent, OpenClaw |
| Minimal core | A tiny loop | Anything, by writing an extension | Little, but no permissions or sandbox | pi, mini-SWE |
| Engine behind a protocol | A server every client talks to | The client: terminal, IDE, app or harness | The protocol, now a public contract | Codex app-server, OpenCode, Goose |
| Decoupled hosted parts | Separate session, harness and sandbox | For Anthropic, each part; for you, configuration and tools | Who hosts it, and the model | Claude Managed Agents |

Each of the other three buys something specific. A minimal core buys [a small context](/context-engineering-for-coding-agents#the-context-starts-filling-before-you-type) you can see all of: pi's prompt and tool definitions fit under 1,000 tokens ([Mario Zechner](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/)), and everything else is a TypeScript extension loaded into its process ([pi](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/how-pi-works.md)). An engine behind a protocol buys one loop behind every client: every Codex surface talks to one app-server over JSON-RPC ([OpenAI](https://openai.com/index/unlocking-the-codex-harness/)), OpenCode's terminal UI is a client of its own server ([OpenCode docs](https://opencode.ai/docs/server/)), and Goose made ACP its default interface ([Goose](https://goose-docs.ai/blog/2026/04/08/goose-acp-and-new-tui)). Decoupled hosted parts buy recovery and speed: Anthropic split Managed Agents into session, harness and sandbox, so a crashed harness restarts from the session log, and median time to first token fell by about 60% ([Anthropic](https://www.anthropic.com/engineering/managed-agents)).

Sandboxing is not a shape, because it cuts across all of them. Codex sandboxes commands by default ([Codex docs](https://learn.chatgpt.com/docs/sandboxing)), Claude Code's sandbox is opt-in and covers only the shell ([Claude Code docs](https://code.claude.com/docs/en/sandboxing)), DeepSeek Harness reuses Codex's mode names, OpenClaw leaves it off by default, and pi has none.

The shapes also stack. A gateway hosts an engine when Hermes runs Codex's app-server, a kernel delegates to a closed loop when DeepSeek Harness hands a task to Claude Code, and a hosted harness can run any loop. My own stack is a gateway driving a closed loop: Hermes takes a task from my phone and hands long coding jobs to Claude Code in a terminal session, and hooks report back whether a job finished or is waiting.

## What breaks between layers

The failures in that stack that cost me most sat between layers, where one couldn't see another's state:

- **Dialogs.** A Claude Code job sat ten hours on a "New MCP server found" prompt, which no hook fires for, so Hermes never heard back. The first-run "trust this folder?" prompt hung unattended jobs the same way.
- **Quiet fallbacks.** When my ChatGPT plan stopped accepting the configured model, Hermes fell back to DeepSeek V4 Pro, a paid model on OpenRouter, without saying so, for at least six days. Separately, one rate-limit error from a side-task model marked the whole OpenRouter key as exhausted for an hour, which blocked that fallback too.
- **Wall-clock timers.** Hermes' stall watchdog counts wall-clock time, so a laptop asleep mid-turn looked like a 15-minute hang.

The fix each time was to make one layer's state visible to the next: a hook and a sweep that report any open dialog as waiting, a check that the configured model is still accepted, a side-task model with more than one upstream, and a power guard. None of them made the agents smarter. They made the stack say when it was stuck.

## Same kernel, different plugins, different score

```vega-lite Three presets of one plugin kernel span 5 points, more than half of the spread across all eight configurations. | Source: DeepSeek-V4.1-Flash paper (arXiv 2609.19969), Table 4, vendor-reported.
{"title":{"text":"One checkpoint, eight harness configurations","subtitle":"DeepSWE v1.1 for DeepSeek-V4.1-Flash at max effort. Model, decoding and tasks were fixed; only the harness changed."},
 "height":{"step":36},
 "data":{"values":[
   {"h":"mini-SWE (one bash tool)","v":74.2,"kind":"Another harness"},
   {"h":"DeepSeek Harness, Minimal","v":72.6,"kind":"A DeepSeek Harness preset"},
   {"h":"DeepSeek Harness, Standard","v":70.5,"kind":"A DeepSeek Harness preset"},
   {"h":"Claude Code","v":69.8,"kind":"Another harness"},
   {"h":"DeepSeek Harness, PTC","v":67.6,"kind":"A DeepSeek Harness preset"},
   {"h":"pi","v":66.2,"kind":"Another harness"},
   {"h":"Codex","v":65.6,"kind":"Another harness"},
   {"h":"OpenCode","v":65.5,"kind":"Another harness"}]},
 "encoding":{
   "y":{"field":"h","type":"nominal","sort":null,"title":null},
   "x":{"field":"v","type":"quantitative","title":"DeepSWE v1.1 (%)","scale":{"domain":[60,80]},"axis":{"grid":true,"tickCount":5}}},
 "layer":[
   {"mark":{"type":"point","filled":true,"size":160},"encoding":{"color":{"field":"kind","type":"nominal","sort":["A DeepSeek Harness preset","Another harness"],"legend":{"title":null,"orient":"bottom"}}}},
   {"mark":{"type":"text","align":"left","dx":12,"fontWeight":600},
    "encoding":{"text":{"field":"v","type":"quantitative","format":".1f"}}}]}
```

Inside one kernel, the three presets moved the same checkpoint by 5 points on DeepSWE and by almost as much on Terminal-Bench 2.1, where they scored 90.6, 85.8 and 85.8 ([DeepSeek](https://arxiv.org/abs/2609.19969)). That is more than half of the 8.7-point spread across all eight configurations. PTC differs from Standard mainly in how the tools are shown to the model, and it cost 2.9 points. The two setups with a single bash tool lead both benchmarks, while four versions of Claude Code in the same paper sit within 1.4 points of each other. DeepSeek Harness is the one harness where changing that composition is a YAML edit, and DeepSeek published what happened when it did.

Three caveats keep this honest. DeepSeek itself reads the table as evidence that the model's skills transfer across harnesses, not as a ranking of them. Minimal is also the composition DeepSeek trained on most, so the table can't separate the plugins from the training. And the direction reverses on long work: DeepSeek's Agent Team, a richer plugin set trained to delegate, beat a single agent at every deadline it tested, 30.04% against 20.39% on ProgramBench at 8 hours (vendor-reported and preliminary, in the same paper). Code-calling tools pay off where many calls feed a result the model doesn't need to read: Anthropic measured 37% fewer tokens on complex research tasks ([Anthropic](https://www.anthropic.com/engineering/advanced-tool-use)). Coding is mostly single reads and edits whose output the model has to see, which is where DeepSeek's own notes say PTC doesn't help.

## What I would do

Choose the shape by what you need to change. If you want a model and a harness built around the same tools and don't need to swap either, a closed loop like Claude Code is the strongest default for coding. If you need to recompose the loop itself, its tools, its prompt and how tools are presented, a plugin kernel like DeepSeek Harness is the only shape where all of that is a YAML edit, at the price of alpha software. If you need an agent that lives on your phone and runs on a schedule, use a gateway daemon, and let it host a coding loop instead of competing with one. Whichever you pick, measure the composition rather than the brand: the same harness moved 5 points with a different plugin list.
