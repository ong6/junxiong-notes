---
title: "Context, skills, prompt, tools: the four parts of an AI system"
description: A simple model for any AI system. What context, skills, the prompt and tools each do, how they differ, and the open-source tools and docs for each.
date: 2026-11-17
updated: 2026-11-17
category: AI systems
tags: [agents, skills, context, prompting, coding-agents]
draft: false
---

You can think of any AI system as four parts around a model: context, skills, a prompt and tools. Context is what the model knows about your world, skills are how it does a particular kind of job, the prompt is what you want this time, and tools are what it can act on. For each part, here is what it does, how it differs from the other three, and the open-source tool or reference doc I'd read first.

Say you ask a coding agent to "add a rate limit to the login endpoint". That sentence, plus the system prompt the agent ships with, is the prompt. The repo's `AGENTS.md` and a wiki page on how auth works are context. The `code-review` instructions that load only when the agent checks its own diff are a skill. `grep`, the file editor and the test runner are tools.

```uipack The prompt, context and skills are all text the model reads, each arriving at a different time. Tools are the one part it calls out to, and a result comes back.
four-parts
```

| Part | Answers | Open-source tool or standard | Doc to read |
|---|---|---|---|
| Context | What is true here? | [OpenWiki](https://github.com/langchain-ai/openwiki), [AGENTS.md](https://agents.md/) | [OpenWiki docs](https://docs.langchain.com/oss/openwiki/overview) |
| Skills | How do we do this kind of job? | [Agent Skills](https://agentskills.io/home), [anthropics/skills](https://github.com/anthropics/skills) | [Skills in Managed Agents](https://platform.claude.com/docs/en/managed-agents/skills) |
| Prompt | What do I want this time? | none needed | [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) |
| Tools | What can the model act on? | [MCP](https://modelcontextprotocol.io/docs/getting-started/intro) | [Tool use with Claude](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) |

## Context is what the model knows about your world

Everything ends up as tokens in the model's context window, so the word gets used for all of it. Here I mean the narrower thing, the facts the model wasn't trained on, like how your codebase is laid out and the decisions your team already made.

A model starts every session knowing none of that. An agent can rediscover it by reading source files each time, which costs tokens and time on every task, so it is better to write it down once in Markdown and point the agent at it. For this we can use [OpenWiki](https://docs.langchain.com/oss/openwiki/overview), an open-source CLI from LangChain that writes and maintains a Markdown wiki about a codebase:

```bash
npm install -g openwiki
openwiki --init
```

It generates pages under `openwiki/` in the repo covering things like architecture and integrations, then links them from `AGENTS.md` (and `CLAUDE.md` when there is one), so a coding agent reads the wiki first and opens source only where it needs more detail. A second mode, `openwiki personal`, builds a local wiki at `~/.openwiki/wiki` from sources such as git repos, Gmail and Notion.

The entry point is [`AGENTS.md`](https://agents.md/), an open format its site calls a "README for agents". It is one predictable file for build steps and conventions, and over 60,000 open-source projects use it. I'd keep that file short and let it point to the wiki, since whatever loads on every request competes for the model's attention. I went through the numbers behind that in [where your tokens go in a coding agent](/context-engineering-for-coding-agents), and Anthropic's [effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) post is the reference I'd pair with it.

## Skills are how the model does a kind of job

A skill is a folder with a `SKILL.md` file in it. The file holds a name, a description and instructions for one kind of task, and the folder can carry any scripts or reference files the task needs. Anthropic's docs describe skills as "reusable, filesystem-based resources" that "turn a general-purpose agent into a specialist". The [format](https://agentskills.io/home) started at Anthropic and was released as an open standard, so other agent products read the same folders.

What sets a skill apart is when each piece of it loads:

| Piece of the skill | When it loads | Tokens |
|---|---|---|
| Name and description | Always, at startup | About 100 per skill |
| `SKILL.md` body | When a task matches the description | Under 5,000 |
| Bundled files and scripts | When the instructions reference them | None until read; a script's code never loads, only its output |

Source: [Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview#how-skills-work), Claude docs, as of November 2026.

Here is the top of my [`council` skill](https://github.com/ong6/skills/tree/main/skills/council), which sends an agent's work to fresh reviewers until it passes ([write-up](/council-skill)):

```yaml
---
name: council
description: >-
  Explicit-only. Put a deliverable (UI, code, draft, plan, design) through a council of fresh
  reviewer subagents that pick their own metrics, score it out of 10 against references, and drive
  fix-and-rescore rounds until every member meets the target and every stated constraint (default
  8/10, at most 3 rounds). Use only when the user says "council", "use the council" or "put this
  through the council". Not for a single quick edit, an ordinary PR or diff review,
  or feedback about agent behaviour (feedback-loop).
---
```

Those lines are all the model sees of the skill until I say "use the council". Then it reads the body, which holds the whole review loop.

That loading behaviour is also how a skill differs from the other three parts:

- A prompt is written for one conversation. A skill is written once and loads by itself whenever a task matches, so the same guidance never gets retyped.
- A tool gives the model something it can do. A skill gives it a procedure for doing a job with the tools it already has; even a skill's bundled scripts run through the agent's ordinary shell tool.
- Context says what is true about your world. A skill says how a job gets done, which agentskills.io calls procedural knowledge.

On the Claude platform, [Managed Agents](https://platform.claude.com/docs/en/managed-agents/skills) take skills two ways. You attach them through the agent's `skills` array, or keep them in the repo at `.claude/skills/<skill-name>/SKILL.md`, where they are discovered when a session mounts the repository. Pre-built skills for PowerPoint, Excel, Word and PDF are in every workspace, and their source is in [anthropics/skills](https://github.com/anthropics/skills) if you want to see how a production skill is laid out.

## The prompt is what you want this time

The prompt is the text written for this request, a system prompt that sets the role and the standing rules followed by the message with the task. The model knows nothing about you beyond what is in its window, which is why Anthropic's [prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) say to think of it as "a brilliant but new employee who lacks context on your norms and workflows". Their test is to show the prompt to a colleague with minimal context on the task; if they'd be confused, the model will be too. So say what output you want and why a rule exists. The docs' example is that "NEVER use ellipses" works less well than "Your response will be read aloud by a text-to-speech engine, so never use ellipses since the text-to-speech engine will not know how to pronounce them."

One sentence can change a lot. In Anthropic's testing of Claude Fable 5.2 on small coding tasks, the model consolidated duplicated code in under 10 percent of runs when the prompt didn't say whose code it was, and in about 75 percent of runs when [one sentence said the code base was its own](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2#say-who-owns-the-code).

Newer models also have an effort dial that sits beside the prompt. On Fable 5.2 the [effort level](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2#calibrate-effort) "sets how much the model thinks, how many tool calls it makes, how long a turn takes, and how many tokens it uses". The API default is `high`; `low` suits quick, well-specified tasks and `medium` suits interactive coding and chat. The guide says to tune effort alongside the prompt, against your own evals.

Each model reads a prompt a little differently, so Anthropic publishes a prompting guide per model. Fable 5.1 usually followed a line like "answer directly without deliberating". Fable 5.2 keeps thinking at `medium` and above with that line in place, and the guide says to remove it and lower the effort level instead. The guides for the current models:

- [Prompting Claude Fable 5.2](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2) (also covers Mythos 5.2)
- [Prompting Claude Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5)
- [Prompting Claude Sonnet 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5-5)
- [Prompting Claude Haiku 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-haiku-5-5)

Earlier models are in the table at the top of [prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#model-specific-guidance).

## Tools are what the model can act on

A model on its own only produces text. A tool is a function you describe to it with a name, a description and an input schema. This one is from Anthropic's [tool use docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview):

```json
{
  "name": "get_weather",
  "description": "Get the current weather for a given location.",
  "input_schema": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "City and state, e.g. San Francisco, CA"
      }
    },
    "required": ["location"]
  }
}
```

The model doesn't run the function. It decides from the request and the description whether the tool applies, and replies with a structured call, here `get_weather` with `{"location": "San Francisco, CA"}`. Your application runs the lookup and sends the result back, and the model writes its answer from it. Some tools, such as web search and code execution, run on the provider's side. An agent is this loop repeated until the task is done.

[MCP](https://modelcontextprotocol.io/docs/getting-started/intro), the Model Context Protocol, is the open standard for packaging tools so any application can use them. Its docs compare it to a USB-C port, since a server built once works in Claude, ChatGPT, VS Code and Cursor. Published servers are listed in the [MCP Registry](https://registry.modelcontextprotocol.io/), and the [reference servers](https://github.com/modelcontextprotocol/servers) show how one is built.

Tools cost context as well. Loaded up front, every tool's schema sits in the window, and Anthropic measured one setup of five MCP servers at [about 55,000 tokens of tool definitions](https://www.anthropic.com/engineering/advanced-tool-use) before the conversation starts. Claude Code now defers those schemas by default and loads them on demand, which I covered in [where your tokens go in a coding agent](/context-engineering-for-coding-agents#the-context-starts-filling-before-you-type).
