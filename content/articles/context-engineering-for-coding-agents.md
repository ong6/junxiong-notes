---
title: Where your tokens actually go in a coding agent
description: How files and tool output fill a coding agent's context, what long-context studies show, and how I would keep a session focused.
date: 2026-09-01
updated: 2026-09-23
category: AI systems
tags: [agents, context, coding-agents, cost, productivity]
---

## The context starts filling before you type

Anthropic publishes an interactive simulation of a Claude Code session filling its context window, with token counts on every block. Before you type anything, this is what has already loaded:

| Block | Tokens |
|---|---:|
| System prompt | 4,200 |
| Project `CLAUDE.md` | 1,800 |
| Auto memory | 680 |
| Skill descriptions | 450 |
| User-level `CLAUDE.md` | 320 |
| Environment info (cwd, shell, OS, git) | 280 |
| MCP tool names, schemas deferred | 120 |
| **Total before you type** | **7,850** |
| Your prompt | 45 |

Source: [Explore the context window](https://code.claude.com/docs/en/context-window), Claude Code docs.

In this example, the user writes 45 of the first 7,895 tokens. Most of the request is already instructions and environment information; file reads and tool output add more as the agent works.

The 120-token line for MCP tools is the interesting one, and it is small only because tool schemas are deferred by default now. Load them eagerly and the number changes shape entirely: Anthropic measured 58 tools across five MCP servers at [roughly 55,000 tokens before the conversation starts](https://www.anthropic.com/engineering/advanced-tool-use), and a heavier catalog at [150,000 tokens, cut to 2,000 by loading on demand](https://www.anthropic.com/engineering/code-execution-with-mcp). If your harness or your org's platform hands every engineer the same twelve integrations by default, that is where your window went. I wrote about how that sprawl happens in [agent integrations in large orgs](/agent-integrations-in-large-orgs).

## Then the reads arrive

The startup cost is fixed and cacheable. The larger variable is what the agent pulls in while working. From the same published trace, a single ordinary auth-token task:

| Event | Tokens |
|---|---:|
| Read `src/api/auth.ts` | 2,400 |
| Read `middleware.ts` | 1,800 |
| Read `auth.test.ts` | 1,600 |
| Read `src/lib/tokens.ts` | 1,100 |
| `npm test` output | 1,200 |
| `grep "refreshToken"` | 600 |
| Two edits plus formatter hooks | 1,220 |

Just under ten thousand tokens of file contents and command output against 45 tokens of instruction. And that is a well-behaved session. A `cat` of a 4,000-line generated client, a `pytest` run that prints every passing test name, an `npm install` log, a stack trace with 200 frames of framework internals — any one of those lands 20k to 50k tokens in the window, permanently, and you pay for it on every subsequent turn.

This matters across turns. The API is stateless. Every turn re-sends the entire conversation from the top, so a bad read at turn 6 is still in the request at turn 60. Total billed input over a session grows with roughly the square of the turn count, not linearly. My arithmetic, not a published figure: a 20k baseline plus 3k of new content per turn bills about 365k tokens over 10 turns and about 17.2M over 100. Doubling the session length costs about 3.6x, and caching changes the price of those tokens without changing the count.

The fix is to give the agent a way to *search* rather than a pile to read. A grep that returns 40 matching lines costs a few hundred tokens; the file it came from costs thousands. The same applies to test output, and it is worth wiring up once:

```bash
# Instead of: npm test
# Feed the agent only what it needs to act on.
npm test 2>&1 | grep -E -A5 '(FAIL|✕|Error:)' | head -100
```

Claude Code's docs suggest [doing this in a `PreToolUse` hook](https://code.claude.com/docs/en/costs#offload-processing-to-hooks-and-skills) so the agent never sees the raw output at all. Any harness with command interception can do the same thing. On a self-hosted model the cost of a long context is memory rather than money, since the KV cache competes with the weights for VRAM — see [local inference hardware](/local-inference-hardware) and [what quantization costs](/quantization-what-it-costs). Either way, the re-sent history is prefill work, which is the cheap-per-token but latency-dominant half of the equation ([prefill vs decode](/prefill-vs-decode)).

## How much context can the model use well?

I would not treat a 200k-token window as a target to fill. Accepting that much text and reliably using every part of it are different things. The studies below test that distinction on specific models and tasks.

The clearest evidence is **NoLiMa** ([arXiv:2502.05167](https://arxiv.org/abs/2502.05167)), which hides a fact in a long document and strips the literal word overlap between the question and the fact, so lexical matching cannot rescue the model. It defines a model's *effective length* as the longest tested context at which it still exceeds 85% of its base score, where the base is its best average across 250-, 500- and 1K-token inputs. Table 3 of the paper:

| Model | Advertised window | Base score | Effective length | Score at 32K |
|---|---|---:|---|---:|
| GPT-4o | 128K | 99.3 | 8K | 69.7 |
| Llama 3.3 70B | 128K | 97.3 | 2K | 42.7 |
| Gemini 1.5 Pro | 2M | 92.6 | 2K | 48.2 |
| Command R+ | 128K | 90.9 | under 1K | 7.4 |
| Claude 3.5 Sonnet | 200K | 87.6 | 4K | 29.8 |

The paper's summary line: "Out of the 13 models, 11 exhibit performance at 32K lengths that is half or less of their base scores." Reasoning does not buy you out of it either. On the hard subset, o1 scores 99.9 at base and 31.1 at 32K.

```vega-lite Every model starts between 87.6 and 99.3. By 32K, four of the five have lost more than half of that. | Source: NoLiMa, arXiv:2502.05167, Table 3.
{"title":{"text":"NoLiMa: base score vs score at 32K context","subtitle":"Same metric and 0-100 scale for both bars. Base is each model's best average over 250-, 500- and 1K-token inputs. On the separate hard subset, o1 falls 99.9 to 31.1."},
 "height":{"step":28},
 "data":{"values":[
   {"model":"GPT-4o","phase":"Base score","v":99.3},
   {"model":"GPT-4o","phase":"Score at 32K","v":69.7},
   {"model":"Gemini 1.5 Pro","phase":"Base score","v":92.6},
   {"model":"Gemini 1.5 Pro","phase":"Score at 32K","v":48.2},
   {"model":"Llama 3.3 70B","phase":"Base score","v":97.3},
   {"model":"Llama 3.3 70B","phase":"Score at 32K","v":42.7},
   {"model":"Claude 3.5 Sonnet","phase":"Base score","v":87.6},
   {"model":"Claude 3.5 Sonnet","phase":"Score at 32K","v":29.8},
   {"model":"Command R+","phase":"Base score","v":90.9},
   {"model":"Command R+","phase":"Score at 32K","v":7.4}]},
 "encoding":{
   "y":{"field":"model","type":"nominal","title":null,
        "sort":["GPT-4o","Gemini 1.5 Pro","Llama 3.3 70B","Claude 3.5 Sonnet","Command R+"],
        "axis":{"labelFontSize":13}},
   "yOffset":{"field":"phase","type":"nominal","sort":["Base score","Score at 32K"]},
   "x":{"field":"v","type":"quantitative","title":"NoLiMa score","scale":{"domain":[0,100]},"axis":{"grid":true}}},
 "layer":[
   {"mark":{"type":"bar"},"encoding":{"color":{"field":"phase","type":"nominal","title":null,
     "scale":{"domain":["Base score","Score at 32K"],"range":["#2a78d6","#eb6834"]}}}},
   {"mark":{"type":"text","align":"left","dx":8,"fontWeight":600,"fontSize":13},
    "encoding":{"text":{"field":"v","type":"quantitative","format":",.3~f"}}}]}
```

**Lost in the Middle** ([arXiv:2307.03172](https://arxiv.org/abs/2307.03172), Liu et al., TACL) is older and more specific: accuracy is highest when the relevant passage sits at the start or the end of the input and sags in between. Their GPT-3.5-Turbo row across 20 documents runs 75.8 at the first position, 53.8 in the middle, 63.2 at the last. The number I keep coming back to is the control: 56.1 with no documents at all. Handing the model twenty documents with the answer buried in the middle scored worse than handing it nothing.

```vega-lite Ranked, the closed-book control lands above the middle position: twenty documents with the answer buried in them scored worse than supplying no documents at all. | Source: Lost in the Middle, arXiv:2307.03172, Liu et al., TACL.
{"title":{"text":"GPT-3.5-Turbo accuracy by answer position, 20 documents","subtitle":"The orange bar is the closed-book control, with no documents supplied at all."},
 "height":{"step":46},
 "data":{"values":[
   {"case":"Answer at first position","v":75.8,"kind":"20 documents supplied"},
   {"case":"Answer at last position","v":63.2,"kind":"20 documents supplied"},
   {"case":"No documents at all","v":56.1,"kind":"Closed-book control"},
   {"case":"Answer in the middle","v":53.8,"kind":"20 documents supplied"}]},
 "encoding":{
   "y":{"field":"case","type":"nominal","sort":"-x","title":null,"axis":{"labelFontSize":13}},
   "x":{"field":"v","type":"quantitative","title":"accuracy (%)","scale":{"domain":[0,80]},"axis":{"grid":true}}},
 "layer":[
   {"mark":{"type":"bar","height":30},
    "encoding":{"color":{"field":"kind","type":"nominal","title":null,
      "scale":{"domain":["20 documents supplied","Closed-book control"],"range":["#2a78d6","#eb6834"]}}}},
   {"mark":{"type":"text","align":"left","dx":8,"fontWeight":600,"fontSize":13},
    "encoding":{"text":{"field":"v","type":"quantitative","format":",.3~f"}}}]}
```

Chroma's [context rot report](https://www.trychroma.com/research/context-rot) (18 models) adds the finding that matters most operationally: "models do not use their context uniformly; instead, their performance grows increasingly unreliable as input length grows." You do not get a gentle slope you can budget against. The same report found that shuffling the haystack to destroy its logical ordering *improved* scores, which should unsettle anyone who thinks of a long context as a well-organised briefing document. It also splits the failure by family — Claude models "tend to abstain when uncertain," while GPT models show "the highest rates of hallucination, often generating confident but incorrect responses." A confident wrong answer can be harder to catch than an explicit refusal.

Anthropic's own guidance calls context an ["attention budget"](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) that gets drawn down. I take that as another reason to select context carefully.

For unrelated tasks, I prefer a fresh session with a short brief. For related work, I would keep the decisions and constraints that still matter and remove output the agent no longer needs.

## What compaction changes

When a harness runs out of room it summarises the history to reclaim space. Two things happen.

First, detail is discarded and you do not choose which. The summary keeps what the summariser thought mattered. Anthropic's own warning is that ["overly aggressive compaction can result in the loss of subtle but critical context whose importance only becomes apparent later"](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents). In practice that means the constraint you gave at turn 3 about never touching the migration files. Their advice follows from it: put durable rules in the instruction file, because conversation history is not storage.

```uipack The blue block is written once and read from cache on every turn. The orange loop grows with every tool call until compaction fires, which throws away detail you did not choose and takes the cached prefix with it.
context-loop
```

Second, the prompt cache. Caching is a strict prefix match, so compaction [invalidates the conversation layer by design](https://code.claude.com/docs/en/prompt-caching#compacting-the-conversation) — the new, shorter history shares no prefix with the old one. One correction to the folk wisdom here: while the cache is still warm, the summarisation call itself reads the old prefix from cache and is cheaper than the context size suggests. It is when you resume a cold session that compaction reprocesses the whole history at full price. The docs are explicit that `/clear` costs nothing by comparison. I go through the prefix-stability mechanics, and how they differ across harnesses, in [prompt caching across harnesses](/prompt-caching-across-harnesses).

Rule I follow: if I want continuity, compact at a task boundary. If I want a fresh start, clear. Either way, I keep durable constraints in files so continuity does not depend entirely on the summary.

## Give the agent a task you can verify

The public numbers on agent-authored code are real, and they are all narrow.

Stripe reports that ["over 1,300 Stripe pull requests merged each week are completely minion-produced, human-reviewed, but containing no human-written code"](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2), up from a thousand ten days earlier. Part 1 notes the code involved ["moves well over $1 trillion per year of payment volume live in production"](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents). The work they describe is bounded: fixing flaky tests, clearing small on-call issues, LLM-assisted migrations across the codebase, running linters. Their pipeline literally has a node called "Fix CI failures".

Monzo reports agents ["authoring ~10% of all merged PRs"](https://monzo.com/blog/building-agent-chip) and "routinely running more than 1800 tasks every day".

In an interview with Bessemer, Shopify's Head of Engineering said that ["engineer productivity has increased by roughly 20%"](https://www.bvp.com/atlas/inside-shopifys-ai-first-engineering-playbook), and in the same interview rejects lines of code and PR count as measures, preferring weekly demos. I would treat that 20% as his estimate rather than a directly comparable measurement.

In an official talk, Booking.com's developer-experience team describes an enablement program across [3,000+ developers](https://www.youtube.com/watch?v=v2GirPD0gf4), taking GenAI adoption from under 10% to over 75%, with 65% of those users on it daily. That 65% refers to daily use among adopters.

The concrete examples include migrations, lint fixes and small issues with a checkable definition of done. That is a useful place to start when choosing work for an agent.

A request like "make the checkout flow better" leaves the agent to choose both the problem and the solution. I would name the failing behaviour and how to verify the fix before asking for code. Writing a good ticket already requires much of that work.

The Stack Overflow 2025 survey found [66% of developers naming "AI solutions that are almost right, but not quite" as their top frustration](https://survey.stackoverflow.co/2025/ai), with 45.2% saying debugging AI-generated code takes longer. Unclear scope can make that problem harder to catch: plausible code reaches review before anyone has agreed how to test it.

## How I would organise a session

**Search, don't dump.** Name the exact file when you know it. When you don't, let the agent grep. Never paste a file you haven't read yourself.

**Keep the instruction file small and stable.** Anthropic's guidance is to [aim for under 200 lines](https://code.claude.com/docs/en/costs#move-instructions-from-claude-md-to-skills). More instructions also mean more material competing for attention. Move workflow-specific instructions into on-demand skills so they cost nothing when you're doing something else. One mechanical trap: in Claude Code, `CLAUDE.md` is [read once at session start](https://code.claude.com/docs/en/prompt-caching#editing-claude-md-mid-session), so a mid-session edit neither breaks the cache nor takes effect. A changed instruction file may need a new session to take effect.

**Use sub-agents for exploration.** A sub-agent can read 40 files in its own window and return a paragraph. Given quadratic growth, every token kept out of the main thread is kept out of every later turn too. Don't overdo it: Anthropic's own [multi-agent post](https://www.anthropic.com/engineering/multi-agent-research-system) reports a 90.2% win on a *research* eval while conceding "most coding tasks involve fewer truly parallelizable tasks than research," and multi-agent setups use about 15x the tokens of a chat. Cognition argues the [other side from experience](https://cognition.com/blog/dont-build-multi-agents): split agents make conflicting implicit decisions and the merge is a mess. Both sides agree on the same line — parallelise reading, never parallelise editing shared files.

**Commit often.** Checkpoints are how you throw away a bad direction without throwing away the session. A Git checkpoint lets you recover the code; conversation rewind is a separate operation that may also let the harness reuse a cached prefix.

**Write the test first.** For a behaviour change, a failing test gives the agent a concrete target and gives me a way to check its work.

## Measuring it at all

I would not use lines of code or PR count as the main measure. Both can rise while review work and defects increase too.

The counter-evidence worth carrying: METR's randomised trial found 16 experienced open-source developers were [19% *slower* with AI tools](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) on 246 issues in repos they knew well, while believing afterwards that they had been 20% faster. Self-report is not a measurement. That is an early-2025 snapshot on mature codebases with high review standards, and it does not generalise to greenfield work, but it should end any argument that settles on "it feels faster."

I would track:

| Instead of | Track |
|---|---|
| Lines written | Time from task start to merged |
| PRs opened | Review rounds per PR |
| Agent adoption % | Change failure rate |
| Tokens spent | Share of PRs merged without a human rewrite |

Cost is worth a glance but not a target. Claude Code's docs put enterprise usage at [around $13 per developer per active day](https://code.claude.com/docs/en/costs), under $30 for 90% of users. I would weigh that cost alongside review time and correctness. A cheaper session is useful only if the result is still worth using.
