---
title: Where your tokens actually go in a coding agent
description: What really fills a coding agent's context window, why long sessions give worse answers, and what separates the engineers who get a speedup.
date: 2026-08-28
updated: 2026-08-28
tags: [agents, context, coding-agents, cost, productivity]
---

## Your prompt is about half a percent of the request

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

Forty-five tokens out of 7,895. That ratio only gets worse from there, because the prompt is the one part that never grows.

The 120-token line for MCP tools is the interesting one, and it is small only because tool schemas are deferred by default now. Load them eagerly and the number changes shape entirely: Anthropic measured 58 tools across five MCP servers at [roughly 55,000 tokens before the conversation starts](https://www.anthropic.com/engineering/advanced-tool-use), and a heavier catalog at [150,000 tokens, cut to 2,000 by loading on demand](https://www.anthropic.com/engineering/code-execution-with-mcp). If your harness or your org's platform hands every engineer the same twelve integrations by default, that is where your window went. I wrote about how that sprawl happens in [agent integrations in large orgs](/agent-integrations-in-large-orgs).

## Then the reads arrive

The startup cost is fixed and cacheable. The part that actually kills you is what the agent pulls in while working. From the same published trace, a single ordinary auth-token task:

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

That last clause is the part people miss. The API is stateless. Every turn re-sends the entire conversation from the top, so a bad read at turn 6 is still in the request at turn 60. Total billed input over a session grows with roughly the square of the turn count, not linearly. My arithmetic, not a published figure: a 20k baseline plus 3k of new content per turn bills about 365k tokens over 10 turns and about 17.2M over 100. Doubling the session length costs about 3.6x, and caching changes the price of those tokens without changing the count.

The fix is to give the agent a way to *search* rather than a pile to read. A grep that returns 40 matching lines costs a few hundred tokens; the file it came from costs thousands. The same applies to test output, and it is worth wiring up once:

```bash
# Instead of: npm test
# Feed the agent only what it needs to act on.
npm test 2>&1 | grep -E -A5 '(FAIL|✕|Error:)' | head -100
```

Claude Code's docs suggest [doing this in a `PreToolUse` hook](https://code.claude.com/docs/en/costs#offload-processing-to-hooks-and-skills) so the agent never sees the raw output at all. Any harness with command interception can do the same thing. On a self-hosted model the cost of a long context is memory rather than money, since the KV cache competes with the weights for VRAM — see [local inference hardware](/local-inference-hardware) and [what quantization costs](/quantization-what-it-costs). Either way, the re-sent history is prefill work, which is the cheap-per-token but latency-dominant half of the equation ([prefill vs decode](/prefill-vs-decode)).

## A full window gives worse answers

This is the part I have to argue with people about, because "200k context" reads like a capacity you can fill. It is a limit, not a working range.

The clearest evidence is **NoLiMa** ([arXiv:2502.05167](https://arxiv.org/abs/2502.05167)), which hides a fact in a long document and strips the literal word overlap between the question and the fact, so lexical matching cannot rescue the model. It defines a model's *effective length* as the longest tested context at which it still exceeds 85% of its base score, where the base is its best average across 250-, 500- and 1K-token inputs. Table 3 of the paper:

| Model | Advertised window | Base score | Effective length | Score at 32K |
|---|---|---:|---|---:|
| GPT-4o | 128K | 99.3 | 8K | 69.7 |
| Llama 3.3 70B | 128K | 97.3 | 2K | 42.7 |
| Gemini 1.5 Pro | 2M | 92.6 | 2K | 48.2 |
| Command R+ | 128K | 90.9 | under 1K | 7.4 |
| Claude 3.5 Sonnet | 200K | 87.6 | 4K | 29.8 |

The paper's summary line: "Out of the 13 models, 11 exhibit performance at 32K lengths that is half or less of their base scores." Reasoning does not buy you out of it either. On the hard subset, o1 scores 99.9 at base and 31.1 at 32K.

```vega-lite Every one of these models starts between 87.6 and 99.3 on the same metric. At 32K, four of the five have lost more than half of it.
{"title":{"text":"NoLiMa score at 32K context","subtitle":"NoLiMa Table 3 (arXiv:2502.05167). Same metric as each model's base score, which runs 87.6-99.3 across these five."},
 "height":{"step":38},
 "data":{"values":[
   {"model":"GPT-4o (base 99.3)","v":69.7},
   {"model":"Gemini 1.5 Pro (base 92.6)","v":48.2},
   {"model":"Llama 3.3 70B (base 97.3)","v":42.7},
   {"model":"Claude 3.5 Sonnet (base 87.6)","v":29.8},
   {"model":"Command R+ (base 90.9)","v":7.4}]},
 "encoding":{
   "y":{"field":"model","type":"nominal","sort":"-x","title":null,"axis":{"labelFontSize":13}},
   "x":{"field":"v","type":"quantitative","title":"score at 32K context","scale":{"domain":[0,100]},"axis":{"grid":true}}},
 "layer":[
   {"mark":{"type":"bar","height":24},"encoding":{"color":{"value":"#2a78d6"}}},
   {"mark":{"type":"text","align":"left","dx":8,"fontWeight":600,"fontSize":13},
    "encoding":{"text":{"field":"v","type":"quantitative","format":",.3~f"}}}]}
```

**Lost in the Middle** ([arXiv:2307.03172](https://arxiv.org/abs/2307.03172), Liu et al., TACL) is older and more specific: accuracy is highest when the relevant passage sits at the start or the end of the input and sags in between. Their GPT-3.5-Turbo row across 20 documents runs 75.8 at the first position, 53.8 in the middle, 63.2 at the last. The number I keep coming back to is the control: 56.1 with no documents at all. Handing the model twenty documents with the answer buried in the middle scored worse than handing it nothing.

```vega-lite Ranked, the control lands above the middle position: twenty documents with the answer buried in them scored worse than supplying no documents at all.
{"title":{"text":"GPT-3.5-Turbo accuracy by answer position, 20 documents","subtitle":"Lost in the Middle (arXiv:2307.03172, Liu et al., TACL). The orange bar is the closed-book control, with no documents supplied."},
 "height":{"step":38},
 "data":{"values":[
   {"case":"Answer at first position","v":75.8,"kind":"20 documents supplied"},
   {"case":"Answer at last position","v":63.2,"kind":"20 documents supplied"},
   {"case":"No documents at all","v":56.1,"kind":"Closed-book control"},
   {"case":"Answer in the middle","v":53.8,"kind":"20 documents supplied"}]},
 "encoding":{
   "y":{"field":"case","type":"nominal","sort":"-x","title":null,"axis":{"labelFontSize":13}},
   "x":{"field":"v","type":"quantitative","title":"accuracy (%)","scale":{"domain":[0,80]},"axis":{"grid":true}}},
 "layer":[
   {"mark":{"type":"bar","height":24},
    "encoding":{"color":{"field":"kind","type":"nominal","title":null,
      "scale":{"domain":["20 documents supplied","Closed-book control"],"range":["#2a78d6","#eb6834"]}}}},
   {"mark":{"type":"text","align":"left","dx":8,"fontWeight":600,"fontSize":13},
    "encoding":{"text":{"field":"v","type":"quantitative","format":",.3~f"}}}]}
```

Chroma's [context rot report](https://www.trychroma.com/research/context-rot) (18 models) adds the finding that matters most operationally: "models do not use their context uniformly; instead, their performance grows increasingly unreliable as input length grows." You do not get a gentle slope you can budget against. The same report found that shuffling the haystack to destroy its logical ordering *improved* scores, which should unsettle anyone who thinks of a long context as a well-organised briefing document. It also splits the failure by family — Claude models "tend to abstain when uncertain," while GPT models show "the highest rates of hallucination, often generating confident but incorrect responses." One of those failures is easy to notice. The other is not.

Anthropic's own guidance calls context an ["attention budget"](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) that gets drawn down, which is a vendor telling you not to use the capacity it sells you. I find that more persuasive than the papers, honestly.

The practical consequence is blunt. A fresh session with a tight brief beats a 200k session that has been running since lunch. Clearing between unrelated tasks is the cheapest quality lever available to you, and it is the one people treat as optional housekeeping.

## What compaction actually costs

When a harness runs out of room it summarises the history to reclaim space. Two things happen.

First, detail is discarded and you do not choose which. The summary keeps what the summariser thought mattered. Anthropic's own warning is that ["overly aggressive compaction can result in the loss of subtle but critical context whose importance only becomes apparent later"](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents). In practice that means the constraint you gave at turn 3 about never touching the migration files. Their advice follows from it: put durable rules in the instruction file, because conversation history is not storage.

```d2 The blue block is written once and read from cache on every turn. The orange loop grows underneath it until compaction fires, which throws away detail you did not choose and takes the cached prefix with it.
direction: down

prefix: FIXED PREFIX\ntool schemas · system prompt\ninstruction file\n\nWritten once. Read from cache. {
  style: { fill: "#e4edf9"; stroke: "#2a78d6"; stroke-width: 2; font-size: 22 }
}

turn: Your prompt {
  style: { stroke: "#6b6459"; fill: transparent; stroke-width: 1; font-size: 22 }
}

grow: THE LOOP THAT GROWS\nfile reads · test output\nedits · hook output\n\nRe-sent in full every turn. {
  style: { fill: "#fbe8de"; stroke: "#eb6834"; stroke-width: 2; font-size: 22 }
}

full: Window full {
  style: { fill: transparent; stroke: "#eb6834"; stroke-width: 2; font-size: 22 }
}

compact: COMPACTION\nhistory summarised {
  style: { fill: "#fbe8de"; stroke: "#eb6834"; stroke-width: 2; font-size: 22 }
}

lost: Detail discarded —\nchosen for you, not by you {
  style: { fill: "#fffdf9"; stroke: "#eb6834"; stroke-width: 2; font-size: 22 }
}

prefix -> turn: every turn { style: { stroke: "#2a78d6"; stroke-width: 2; font-size: 20 } }
turn -> grow { style: { stroke: "#6b6459"; font-size: 20 } }
grow -> grow: each tool call { style: { stroke: "#eb6834"; stroke-width: 2; font-size: 20 } }
grow -> full { style: { stroke: "#eb6834"; stroke-width: 2; font-size: 20 } }
full -> compact { style: { stroke: "#eb6834"; stroke-width: 2; font-size: 20 } }
compact -> lost { style: { stroke: "#eb6834"; stroke-width: 2; font-size: 20 } }
compact -> prefix: cache prefix dies {
  style: { stroke: "#eb6834"; stroke-width: 2; stroke-dash: 4; font-size: 20 }
}
```

Second, the prompt cache. Caching is a strict prefix match, so compaction [invalidates the conversation layer by design](https://code.claude.com/docs/en/prompt-caching#compacting-the-conversation) — the new, shorter history shares no prefix with the old one. One correction to the folk wisdom here: while the cache is still warm, the summarisation call itself reads the old prefix from cache and is cheaper than the context size suggests. It is when you resume a cold session that compaction reprocesses the whole history at full price. The docs are explicit that `/clear` costs nothing by comparison. I go through the prefix-stability mechanics, and how they differ across harnesses, in [prompt caching across harnesses](/prompt-caching-across-harnesses).

Rule I follow: if I want continuity, compact at a task boundary. If I want a fresh start, clear. Compacting to avoid re-explaining is usually slower than re-explaining.

## Scoping is the whole skill

The public numbers on agent-authored code are real, and they are all narrow.

**Published, primary source.** Stripe reports that ["over 1,300 Stripe pull requests merged each week are completely minion-produced, human-reviewed, but containing no human-written code"](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2), up from a thousand ten days earlier. Part 1 notes the code involved ["moves well over $1 trillion per year of payment volume live in production"](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents). The work they describe is bounded: fixing flaky tests, clearing small on-call issues, LLM-assisted migrations across the codebase, running linters. Their pipeline literally has a node called "Fix CI failures".

**Published, primary source.** Monzo reports agents ["authoring ~10% of all merged PRs"](https://monzo.com/blog/building-agent-chip) and "routinely running more than 1800 tasks every day".

**Company claim, secondhand publisher.** Shopify's Head of Engineering told Bessemer that ["engineer productivity has increased by roughly 20%"](https://www.bvp.com/atlas/inside-shopifys-ai-first-engineering-playbook), and in the same interview rejects lines of code and PR count as measures, preferring weekly demos. That 20% is his estimate, not an instrumented number, which is a direct consequence of refusing to instrument it. I'd treat it as a direction.

**Company claim, official talk.** Booking.com's developer-experience team describes an enablement program across [3,000+ developers](https://www.youtube.com/watch?v=v2GirPD0gf4), taking GenAI adoption from under 10% to over 75%, with 65% of those users on it daily. The "65% higher adoption" figure that circulates from this talk is a garble of that daily-use share, and I have left it out.

Notice what none of these are. Nobody published "the agent built the feature." Every headline number is made of work with an edge you can point at: migrations, lint, flaky tests, small issues with a machine-checkable definition of done.

That is the difference between the two engineers. One hands the agent a task with a verifiable boundary and gets a merged PR. The other hands it "make the checkout flow better," gets 900 lines of plausible code, and spends the afternoon reviewing it. Same tool, same model, same repo. My read: scoping ability is doing almost all of the work that people attribute to prompt wording, and it is a skill engineers already have from writing tickets for other humans. They just don't apply it, because the agent doesn't push back the way a junior would.

The Stack Overflow 2025 survey found [66% of developers naming "AI solutions that are almost right, but not quite" as their top frustration](https://survey.stackoverflow.co/2025/ai), with 45.2% saying debugging AI-generated code takes longer. Almost-right is what unscoped work produces. It looks finished, so it reaches review, and the defect is found late by a person instead of early by a test.

## What actually works

**Search, don't dump.** Name the exact file when you know it. When you don't, let the agent grep. Never paste a file you haven't read yourself.

**Keep the instruction file small and stable.** Anthropic's guidance is to [aim for under 200 lines](https://code.claude.com/docs/en/costs#move-instructions-from-claude-md-to-skills). Bigger files don't get followed harder, they get followed less. Move workflow-specific instructions into on-demand skills so they cost nothing when you're doing something else. One mechanical trap: in Claude Code, `CLAUDE.md` is [read once at session start](https://code.claude.com/docs/en/prompt-caching#editing-claude-md-mid-session), so a mid-session edit neither breaks the cache nor takes effect. People lose real time to this.

**Use sub-agents for exploration.** A sub-agent can read 40 files in its own window and return a paragraph. Given quadratic growth, every token kept out of the main thread is kept out of every later turn too. Don't overdo it: Anthropic's own [multi-agent post](https://www.anthropic.com/engineering/multi-agent-research-system) reports a 90.2% win on a *research* eval while conceding "most coding tasks involve fewer truly parallelizable tasks than research," and multi-agent setups use about 15x the tokens of a chat. Cognition argues the [other side from experience](https://cognition.com/blog/dont-build-multi-agents): split agents make conflicting implicit decisions and the merge is a mess. Both sides agree on the same line — parallelise reading, never parallelise editing shared files.

**Commit often.** Checkpoints are how you throw away a bad direction without throwing away the session. Rewinding to a commit is also cheaper than compacting, since it truncates back to a prefix that is still cached.

**Write the test first.** This has nothing to do with TDD purity. A failing test is a machine-readable definition of done, which is the only thing that stops an agent at "looks finished." Everything else on this list matters less than giving the loop a target it can evaluate without you.

## Measuring it at all

Lines of code and PR count are worse than useless here, because agents inflate both by construction and both are trivially gameable by a tool that never gets tired. Shopify's engineering lead rejecting them is the correct instinct.

The counter-evidence worth carrying: METR's randomised trial found 16 experienced open-source developers were [19% *slower* with AI tools](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) on 246 issues in repos they knew well, while believing afterwards that they had been 20% faster. Self-report is not a measurement. That is an early-2025 snapshot on mature codebases with high review standards, and it does not generalise to greenfield work, but it should end any argument that settles on "it feels faster."

What I'd actually track:

| Instead of | Track |
|---|---|
| Lines written | Time from task start to merged |
| PRs opened | Review rounds per PR |
| Agent adoption % | Change failure rate |
| Tokens spent | Share of PRs merged without a human rewrite |

Cost is worth a glance but not a target. Claude Code's docs put enterprise usage at [around $13 per developer per active day](https://code.claude.com/docs/en/costs), under $30 for 90% of users. Against a loaded engineer salary that is noise. Optimise context because it makes the answers better; the bill falling is a side effect.
