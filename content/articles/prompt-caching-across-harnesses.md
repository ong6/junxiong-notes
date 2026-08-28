---
title: Prompt caching, and why the same prompt costs 10x more on some days
description: How prefix caching actually bills, what silently breaks it, and a worked cost example across Claude Code, Codex, Cursor and the raw API.
date: 2026-08-28
updated: 2026-08-28
tags: [prompt-caching, cost, agents, inference]
---

Add a `Generated at {timestamp}` line to the top of a system prompt and your input spend can multiply overnight. The prompt is otherwise identical. The code is identical. Nothing errors, nothing logs a warning, and the only visible symptom is the invoice.

That failure is the whole topic. Prompt caching is one of the few inference-cost levers that is free when it works and invisible when it doesn't.

## One rule, and everything else follows

A transformer's prefill computes key/value tensors for every input token. Prompt caching stores those tensors and reuses them when a new request starts with byte-identical text. OpenAI's cookbook puts the mechanism plainly: the model "reuses the cached tensors and only computes attention for the new tokens" ([Prompt Caching 201](https://developers.openai.com/cookbook/examples/prompt_caching_201)).

The consequence is that a cache hit needs an **exact prefix match**, not a similar one, and not a fuzzy one. Change byte 400 of a 200,000-token prompt and tokens 400 through 200,000 are all recomputed at full price. There is no per-file, per-section, or per-document caching underneath. Anthropic's Claude Code docs say it in one sentence: "The match is exact, so a change anywhere in the prefix recomputes everything after it. There is no per-file or per-segment caching" ([code.claude.com](https://code.claude.com/docs/en/prompt-caching)).

```d2 The API matches from token 0. An exact prefix hit is read at 0.1x; an edit anywhere forces everything below it to be recomputed at full price.
direction: right

hit: CACHE HIT · prefix byte-identical {
  style: { fill: transparent; stroke: "#2a78d6"; stroke-width: 2; font-size: 21 }
  h1: 1 · System\n0.1x { style: { fill: "#e4edf9"; stroke: "#2a78d6"; stroke-width: 2; font-size: 21 } }
  h2: 2 · Context\n0.1x { style: { fill: "#e4edf9"; stroke: "#2a78d6"; stroke-width: 2; font-size: 21 } }
  h3: 3 · History\n0.1x { style: { fill: "#e4edf9"; stroke: "#2a78d6"; stroke-width: 2; font-size: 21 } }
  h4: 4 · New turn\nwrite { style: { stroke: "#6b6459"; fill: transparent; stroke-width: 1; font-size: 21 } }
  h1 -> h2 { style: { stroke: "#2a78d6"; stroke-width: 2; font-size: 19 } }
  h2 -> h3 { style: { stroke: "#2a78d6"; stroke-width: 2; font-size: 19 } }
  h3 -> h4 { style: { stroke: "#6b6459"; font-size: 19 } }
}

miss: CACHE MISS · one byte edited in layer 2 {
  style: { fill: transparent; stroke: "#eb6834"; stroke-width: 2; font-size: 21 }
  m1: 1 · System\n0.1x { style: { fill: "#e4edf9"; stroke: "#2a78d6"; stroke-width: 2; font-size: 21 } }
  m2: 2 · Context\nfull price { style: { fill: "#fbe8de"; stroke: "#eb6834"; stroke-width: 2; font-size: 21 } }
  m3: 3 · History\nfull price { style: { fill: "#fbe8de"; stroke: "#eb6834"; stroke-width: 2; font-size: 21 } }
  m4: 4 · New turn\nfull price { style: { fill: "#fbe8de"; stroke: "#eb6834"; stroke-width: 2; font-size: 21 } }
  m1 -> m2 { style: { stroke: "#eb6834"; stroke-width: 2; font-size: 19 } }
  m2 -> m3 { style: { stroke: "#eb6834"; stroke-width: 2; font-size: 19 } }
  m3 -> m4 { style: { stroke: "#eb6834"; stroke-width: 2; font-size: 19 } }
}
```


That is why the ordering advice is not a style preference. Content must be laid out in descending order of stability:

1. System prompt and tool definitions (change on deploy)
2. Retrieved documents, repo context, few-shot examples (change per session)
3. Conversation history (changes per turn)
4. The user's actual question (changes per request)

Anything volatile placed above something stable destroys the cache for the stable thing. A timestamp at position 0 makes the entire prompt uncacheable, forever, silently.

## Three vendors, three interfaces to the same idea

All three major APIs do prefix caching. They disagree about who places the breakpoint and who pays for the write. Checked 2026-08-28.

| | Anthropic | OpenAI | Google (Gemini) |
|---|---|---|---|
| How it turns on | Explicit `cache_control` breakpoints, or one top-level auto breakpoint | Implicit by default; explicit `prompt_cache_breakpoint` on GPT-5.6+ | Implicit by default on 2.5+; explicit cache objects available |
| Breakpoints | Max 4 per request | Auto at end of latest eligible message (5.6+) | n/a for implicit |
| Minimum prefix | 512 tok (Opus 5, Fable 5), 1,024 (Opus 4.8, Sonnet 5), up to 4,096 (Opus 4.6, Haiku 4.5) | 1,024 visible input tokens (GPT-5.6+), 2,048 earlier | 2,048 (Gemini 2.5), 4,096 (3.x) |
| Read price | 0.1x base input | 0.1x base input (GPT-5.6+) | 0.1x base input |
| Write price | 1.25x (5m TTL), 2x (1h TTL) | 1.25x (GPT-5.6+); no write charge on earlier models | No write charge; hourly **storage** fee |
| TTL | 5 min default, 1 hour opt-in | 30 min default on 5.6+; `in_memory` (~5-10 min) or `24h` on earlier | Implicit is opportunistic; explicit caches have a TTL |

Sources: [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing), [Anthropic prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), [OpenAI prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching), [Gemini caching](https://ai.google.dev/gemini-api/docs/caching), [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing).

```vega-lite Reads are a tenth of base input, writes a small premium over it. The whole game is moving token volume from the top two bars to the bottom one.
{"title":{"text":"What an input token costs, as a multiple of the base rate","subtitle":"Published multipliers; the 1h and 5m write tiers are Anthropic's. Sources: Anthropic pricing; OpenAI prompt caching, GPT-5.6+. Google charges no write premium and bills hourly storage instead. Checked 2026-08-28."},
 "height":{"step":38},
 "data":{"values":[
   {"kind":"Cache write, 1h TTL","v":2,"d":"2.0x","g":"write"},
   {"kind":"Cache write, 5m TTL","v":1.25,"d":"1.25x","g":"write"},
   {"kind":"Uncached input","v":1,"d":"1.0x","g":"base"},
   {"kind":"Cache read","v":0.1,"d":"0.1x","g":"read"}]},
 "encoding":{
   "y":{"field":"kind","type":"nominal","sort":"-x","title":null,"axis":{"labelFontSize":13,"labelLimit":260}},
   "x":{"field":"v","type":"quantitative","title":"multiple of base input rate","axis":{"grid":true}}},
 "layer":[
   {"mark":{"type":"bar","height":24},"encoding":{"color":{"field":"g","type":"nominal","legend":null,"scale":{"domain":["read","base","write"],"range":["#1baf7a","#2a78d6","#eb6834"]}}}},
   {"mark":{"type":"text","align":"left","dx":8,"fontWeight":600,"fontSize":13},
    "encoding":{"text":{"field":"d","type":"nominal"}}}]}
```


Two differences actually change how you write code.

**Google bills storage, not writes.** Gemini's context caching charges the cached rate at 10% of input plus a per-hour storage fee, e.g. $1.00 per million tokens per hour on 3.5 Flash. That inverts the calculus: on Anthropic and OpenAI you worry about paying the write premium too often, on Google you worry about paying rent on a cache nobody reads.

**OpenAI has a routing problem the others don't expose.** Cache hits require your request to land on a machine that holds the prefix, so OpenAI gives you `prompt_cache_key` to pin related requests together. Their cookbook reports one customer going from 60% to 87% hit rate by setting it, and warns that a single prefix+key combination saturates at roughly 15 requests per minute before traffic spills to other machines and misses. If you run high-QPS traffic on OpenAI and haven't thought about that key, that's probably where your money is.

## The arithmetic

Take a plausible agent loop on Claude Opus 5 at the published rates ($5/MTok input, $0.50/MTok cache read, $6.25/MTok 5-minute cache write, $25/MTok output — [pricing page](https://platform.claude.com/docs/en/about-claude/pricing), checked 2026-08-28):

- 30,000-token stable prefix: system prompt, tool definitions, project context
- 20 turns, each appending ~2,000 tokens of tool results and user input
- 500 output tokens per turn

Every turn resends everything before it, so total input across the session is 980,000 tokens either way. What differs is the rate each token is billed at.

| | Tokens | Rate | Cost |
|---|---:|---:|---:|
| **No caching** | 980,000 uncached | $5.00 | **$4.90** |
| **Cached** — reads | 912,000 | $0.50 | $0.456 |
| **Cached** — writes | 68,000 | $6.25 | $0.425 |
| **Cached total** | | | **$0.88** |

That's 5.6x on input for a session that ran identical text through the model. Output cost ($0.25) is unchanged by caching, so the session total moves from $5.15 to $1.13.

The 5.6x isn't the ceiling. Because reads bill at exactly one tenth of base input, the asymptote is 10x, approached as the stable prefix grows relative to per-turn additions. A 100-turn session against a 100K-token repo context gets much closer to it than this example does. My read: for coding agents, cache read tokens routinely make up 90%+ of input volume and under 50% of input cost, and that ratio is the single best health metric you have.

**Now break it once.** Same session, but you switch models on turn 11. The turn-11 request has 50,000 tokens of history and none of it hits, so it writes 50,000 tokens at $6.25/MTok = **$0.31 for one turn**, against $0.037 for a healthy turn 11. That single keystroke costs 8.5x a normal turn, and the session's input bill rises from $0.88 to $1.16, up 31%.

```vega-lite Caching cuts input cost 5.6x on this workload. One model switch mid-session claws back a third of the saving.
{"title":{"text":"Input cost for the same 980,000-token modelled session","subtitle":"The model switch happens at turn 11. Arithmetic over published Claude Opus 5 rates ($5 input, $0.50 cache read, $6.25 5-minute cache write per MTok), not a measurement. Token counts are a modelled workload. Output cost excluded."},
 "height":{"step":38},
 "data":{"values":[
   {"case":"No caching","v":4.90,"d":"$4.90"},
   {"case":"Cached, one model switch","v":1.16,"d":"$1.16"},
   {"case":"Cached, prefix intact","v":0.88,"d":"$0.88"}]},
 "encoding":{
   "y":{"field":"case","type":"nominal","sort":"-x","title":null,"axis":{"labelFontSize":13,"labelLimit":260}},
   "x":{"field":"v","type":"quantitative","title":"input cost, USD","axis":{"grid":true}}},
 "layer":[
   {"mark":{"type":"bar","height":24},"encoding":{"color":{"field":"case","type":"nominal","legend":null}}},
   {"mark":{"type":"text","align":"left","dx":8,"fontWeight":600,"fontSize":13},
    "encoding":{"text":{"field":"d","type":"nominal"}}}]}
```


(These are arithmetic on published prices, not measurements from my own logs. The token counts are a modelled workload.)

## What each harness does with your history

Every harness resends the full conversation on every turn. They differ in how carefully they preserve the prefix while doing it.

**Claude Code** is the most explicit about this, and its docs are worth reading even if you use something else. It orders each request system prompt → project context → conversation, and publishes the full list of what invalidates each layer. The non-obvious entries:

- `/model` and `/effort` both change the cache key, not the prompt text. Switching either re-reads the entire history with zero hits.
- Editing CLAUDE.md mid-session does *not* invalidate the cache, because it also doesn't apply. It's loaded once at session start and takes effect on the next `/clear`, `/compact`, or restart.
- Skills, slash commands, `/recap` and plan mode all append as messages, so they're cache-safe by construction.
- `/rewind` truncates back to a prefix that is already cached; `/compact` builds a new one. Given the choice, rewind.
- Cache scope is effectively per-machine and per-directory, because the system prompt embeds the working directory, platform and shell. Two git worktrees of the same repo do not share a cache.

TTL is configurable there via `promptCacheTtl` / `CLAUDE_CODE_PROMPT_CACHE_TTL`, and on an API key the main conversation defaults to 5 minutes rather than the 1 hour a subscription gets.

**Codex CLI** takes the append-only route and pins `prompt_cache_key` to the thread, so turns in one session route to the same cached prefix. A [third-party writeup](https://codex.danielvaughan.com/2026/04/21/codex-cli-prompt-caching-maximise-cache-hits-cost-reduction/) measured 80-90% hit rates and 40-55% input cost reduction across sessions, and notes that `/compact` resets the cache because the prefix changes. Treat those as one person's numbers, not vendor-published ones. The actionable part is verifiable from OpenAI's own docs: dynamic content in AGENTS.md (generated line counts, timestamps) sits in the prefix and breaks it, and MCP servers connecting mid-session change the tool list.

**Cursor** passes provider caching through and bills you for both halves. Its [pricing docs](https://cursor.com/docs/account/pricing) show a per-model Input / Cache write / Cache read table with cache writes at 1.25x and reads at 10% for Anthropic models. You have far less control here: Cursor owns the system prompt, decides what rules and MCP descriptions go into the prefix, and decides when to trim context. The lever you do have is not attaching and detaching things mid-conversation.

**Raw API** is the only place you control all of it, and the only place you can get it badly wrong. If you're building your own loop, the two things that matter more than breakpoint placement are keeping the system prompt frozen and serializing tool definitions deterministically (`sort_keys=True`, no set iteration).

## Failure modes, ranked by how often I've hit them

**Prefix drift from injected state.** A date, a user ID, a feature flag, a "you have N credits remaining" line. Anything interpolated into the system prompt is at position 0 and costs you the entire prompt. On Claude Opus 5 and Opus 4.8 there's a clean fix: append `{"role": "system", "content": "..."}` to `messages[]` instead of editing top-level `system`. It sits after the cached history and invalidates nothing.

**Non-deterministic serialization.** `json.dumps()` without `sort_keys`, iterating a `set`, a library that reorders keys between versions. The prompt is logically identical and byte-different, which is the only thing the cache cares about.

**Compaction and context editing.** Both rewrite history, which by definition destroys the conversation-layer prefix. The turn *after* compaction is cheap, since the new history is short. The expensive one is compaction itself when it runs cold: Anthropic notes that a mid-session `/compact` reads your prefix from cache and costs a fraction of what the context size suggests, but after a break longer than the TTL there's nothing to read and the summarization request reprocesses the full history uncached.

**Expiry mid-session.** The TTL clock runs from the *start* of the request. A four-minute generation leaves about one minute of a five-minute entry. Agent loops with long tool calls or slow human review drift past the window without anyone noticing, and every re-warm is a full write.

**Parallel fan-out.** N identical requests fired simultaneously all miss, because an entry only becomes readable once the first response starts streaming. Send one, wait for first token, then fire the rest.

**Resuming an old session after an upgrade.** New harness version means a new system prompt, which means the entire resumed history sits behind a different prefix. The first turn back into a long conversation can be the most expensive request you send all week.

## The check that would have caught mine

Log `cache_read_input_tokens` and `cache_creation_input_tokens` on every response and alert when the ratio inverts. In a healthy loop, reads grow turn over turn and writes stay roughly the size of the last exchange. If creation is near the full conversation size on every request, something upstream is rewriting your prefix.

Make it an assertion, not a dashboard. Send the same request twice in CI and fail the build if the second one reports zero cache reads. Caching regressions don't announce themselves — the requests keep succeeding, and you find out on the invoice six weeks later.

If you're structuring the prefix itself, [context engineering for coding agents](/context-engineering-for-coding-agents) is the other half of this problem: what goes in the window at all, before you worry about what order it's in.
