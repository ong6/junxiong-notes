---
title: "Latency or throughput: the one dial behind LLM serving"
description: How batching trades per-user speed for aggregate tokens, from one forward pass to a fleet, and how to choose which side to optimize.
date: 2026-11-04
updated: 2026-11-04
category: AI systems
tags: [inference, serving, batching, latency, kv-cache]
draft: false
---

Anthropic charges [half price](https://docs.anthropic.com/en/docs/build-with-claude/batch-processing) for the same model if you are willing to wait up to 24 hours for the answer. That discount is the latency–throughput trade with a price on it. An LLM server has one basic dial: how many requests share each forward pass. Turn it up and every user's tokens arrive more slowly, while the GPU produces far more tokens in total and each one costs less. Almost every serving technique either moves you along that curve or pushes the curve outward.

I think the useful question is never "how do I make it faster". It is: who is waiting for this output, and how long will they put up with it? Settle that first, then buy as much throughput as that wait allows.

```uipack A request's path from user to GPU and back. Each forward pass reads the weights once and produces one token for every sequence in the batch, so batch size sets both the GPU's total output and each user's per-token latency.
serving-path
```

## The numbers a user actually feels

A streamed response has two latencies, and they come from different places.

- **Time to first token (TTFT)** is queue wait plus prefill, the pass that reads the whole prompt. A long prompt or a busy queue both show up here.
- **Time per output token (TPOT)**, also called inter-token latency, is the time of one decode step. Every sequence in the batch advances one token per step, so the step time is every user's TPOT at once.

End-to-end latency is roughly `TTFT + TPOT × output tokens`. A 500-token answer at 30 ms per token spends 15 seconds streaming, whatever the TTFT. For long outputs, TPOT dominates; for short answers to long prompts, TTFT does.

Throughput has two forms worth keeping apart: tokens per second per GPU, which sets cost, and requests per second, which sets how many users a fleet can hold. The [DistServe](https://arxiv.org/abs/2401.09670) paper adds the number I would actually optimize: **goodput**, the request rate you can serve while staying inside *both* a TTFT and a TPOT target. Raw throughput that blows the latency target is not capacity you can sell.

## One forward pass, many users

The mechanics are in [prefill and decode want different machines](/prefill-vs-decode); the short version is that decode is memory-bound. Each step reads every weight out of memory to produce one token per sequence. With one user, that read produces one token. With 64 users, the same read produces 64.

That is not free, because each sequence also has a KV cache, and decode reads all of it every step. Here is the arithmetic for Llama 3.1 8B on one H100. The [config](https://huggingface.co/unsloth/Meta-Llama-3.1-8B-Instruct/raw/main/config.json) gives 32 layers, 8 KV heads and a head dimension of 128, so at BF16 the KV cache costs `2 × 8 × 128 × 32 × 2 = 128 KiB` per token, or 268 MB for a sequence holding 2,048 tokens. The weights are about 16 GB. Using the [H100 SXM](https://www.nvidia.com/en-us/data-center/h100/)'s 3.35 TB/s of bandwidth and 989 dense BF16 TFLOPS:

```
step time ≈ max( (weights + B × KV per sequence) ÷ bandwidth,  2 × params × B ÷ FLOPS )
```

```uipack One decode step, drawn to scale. The weights are read once no matter how many users share the step, but every sequence adds its own KV cache to the read. At batch 64 the cache is already more than half the traffic. | Numbers: my roofline arithmetic for Llama 3.1 8B (BF16, 2,048-token contexts) on an H100 SXM at 3.35 TB/s.
gpu-batch
```

| Batch | Step time | Per-user tok/s | GPU tok/s | Per-user speed vs batch 1 | GPU output vs batch 1 |
|---|---|---|---|---|---|
| 1 | 4.9 ms | 205 | 205 | 1.0× | 1× |
| 8 | 5.4 ms | 184 | 1,472 | 0.90× | 7× |
| 32 | 7.4 ms | 136 | 4,349 | 0.66× | 21× |
| 64 | 9.9 ms | 101 | 6,450 | 0.49× | 31× |
| 128 | 15.1 ms | 66 | 8,505 | 0.32× | 41× |
| 224 | 22.7 ms | 44 | 9,849 | 0.21× | 48× |

This is my idealized roofline arithmetic, not a measurement. It ignores runtime overhead and attention compute, and real decode lands well under the bandwidth ceiling, so treat the absolute numbers as upper bounds. The shape is the point.

Going from 1 to 64 users halves each user's speed and multiplies the GPU's output 31 times, which cuts cost per token by about the same factor.

```vega-lite Every batch size is a point on one curve. Moving right buys GPU output and cost per token; moving up buys each user speed. The scheduler picks the point. | Source: my idealized roofline arithmetic from the table above (Llama 3.1 8B BF16, 2,048-token contexts, H100 SXM 3.35 TB/s). Upper bounds, not measurements.
{"title":{"text":"The latency–throughput curve for one GPU","subtitle":"Each point is a batch size. Per-user speed against total GPU output, tokens/sec."},
 "width":720,"height":320,
 "data":{"values":[
   {"b":"batch 1","gpu":205,"user":205.2},
   {"b":"batch 8","gpu":1472,"user":184},
   {"b":"batch 32","gpu":4349,"user":135.9},
   {"b":"batch 64","gpu":6450,"user":100.8},
   {"b":"batch 128","gpu":8505,"user":66.4},
   {"b":"batch 224 (KV full)","gpu":9849,"user":44}]},
 "encoding":{
   "x":{"field":"gpu","type":"quantitative","title":"GPU output (tokens/sec, all users)","scale":{"domain":[0,12000]},"axis":{"grid":true}},
   "y":{"field":"user","type":"quantitative","title":"Per-user speed (tokens/sec)","scale":{"domain":[0,240]},"axis":{"grid":true}}},
 "layer":[
   {"mark":{"type":"line","strokeWidth":2.5}},
   {"mark":{"type":"point","filled":true,"size":110}},
   {"mark":{"type":"text","align":"left","dx":9,"dy":-10,"fontWeight":600},"encoding":{"text":{"field":"b"}}}]}
```

Past that, each extra user buys less total output and costs everyone more latency. The table also ends at 224 for a reason: 80 GB minus 16 GB of weights leaves room for about 238 such sequences. The KV cache, not compute, sets the ceiling. In this example the compute term never wins: even at batch 224 the matmuls need 3.6 ms against 22.7 ms of memory traffic. The textbook point where batching makes decode compute-bound sits beyond the memory the cache can fit.

Longer contexts make every row worse. Double the context and the KV term doubles, so per-user speed falls faster and the capacity cap halves.

## From static batches to continuous batching

The naive way to batch is to collect B requests, run them together until all finish, then take the next B. It fails on both axes at once. A request that arrives just after a batch starts waits for the whole batch to finish, which hurts TTFT. Short answers sit idle while the longest one finishes, which wastes slots and hurts throughput.

**Continuous batching** fixes this by scheduling every step instead of every batch. The Orca paper ([OSDI '22](https://www.usenix.org/conference/osdi22/presentation/yu)) called it iteration-level scheduling: after each forward pass, finished sequences leave and waiting ones join. The batch becomes a set of sequences that changes every few milliseconds. vLLM, SGLang and TensorRT-LLM all schedule this way.

Three techniques make it hold up under load:

- **Paged KV memory.** [vLLM](https://arxiv.org/abs/2309.06180) stores the KV cache in fixed-size pages instead of one worst-case reservation per sequence, reporting "near-zero waste" and 2–4× throughput at the same latency against FasterTransformer and Orca. The throughput comes from fitting more sequences, the same capacity ceiling as in the table.
- **Chunked prefill.** A long prompt arriving mid-stream would otherwise stall every in-flight decode while it runs. [Sarathi-Serve](https://arxiv.org/abs/2403.02310) splits prefill into chunks and mixes them into decode steps, reporting 2.6× higher serving capacity than vLLM for Mistral-7B on one A100 under tail-latency limits.
- **Preemption.** When the KV cache fills, the scheduler evicts a sequence, either swapping its cache out or recomputing it later. That keeps the server alive, but the evicted user sees a pause. Frequent preemption tells you the batch limit is set higher than memory can hold.

## The scheduler is where the trade gets made

In an engine like vLLM, the latency–throughput position is a pair of settings. `max_num_seqs` caps the batch, which caps how far down the table you go. `max_num_batched_tokens` caps the tokens processed in one step; vLLM's [tuning guide](https://docs.vllm.ai/en/latest/configuration/optimization.html) puts a small budget around 2048 on the side of inter-token latency and a budget above 8192 on the side of TTFT and throughput. Smaller budgets mean prefill chunks interrupt decodes less; larger ones clear prompts faster and pack more work into each step.

Arrival rate is the setting nobody controls. Little's law gives `requests in the system = arrival rate × time each spends there`, so as traffic rises, either the batch grows or a queue does. Once the batch hits its cap, extra load turns straight into queue wait, which is pure TTFT. Queueing delay also grows sharply, not linearly, as a server approaches full utilization. A fleet that runs every GPU at 100% has, by definition, no slack to absorb a burst. Spare capacity is what you pay for low tail latency.

## Above the GPU: routing and fleets

Once there is more than one replica, the router decides which one a request lands on, and that choice affects both sides.

- **Prefix-aware routing.** If a replica already holds the KV cache for a system prompt or earlier conversation turns, sending the request there skips most of the prefill. That cuts TTFT and frees compute for others. SGLang's [RadixAttention](https://arxiv.org/abs/2312.07104) keeps those prefixes in a tree for reuse, and the paper reports up to 6.4× throughput on workloads like agents and multi-turn chat. On hosted APIs this surfaces as [prompt caching](/prompt-caching-across-harnesses).
- **Disaggregation.** Prefill and decode can run on separate GPU pools, so a burst of long prompts never stalls anyone's stream. DistServe reports serving 7.4× more requests, or meeting a 12.6× tighter latency target, against colocated systems.
- **Tiering.** A provider can run the same model in different modes: interactive traffic with headroom, and a batch tier that fills the idle capacity between bursts. The half-price batch tier at the top of this post is that idle capacity sold at a discount, because nobody is waiting on it.

## Optimizing for latency

| Lever | What it improves | What it costs |
|---|---|---|
| Lower batch cap, more replicas | TPOT, tail latency | Cost per token rises, roughly following the table |
| Run below full utilization | Queue wait, tail TTFT | Paid-for GPUs sit partly idle |
| Speculative decoding | TPOT | Extra compute, wasted on rejected guesses under load |
| Tensor parallelism | TPOT and TTFT for a big model | Communication overhead, fewer replicas per GPU |
| Prefix caching, cache-aware routing | TTFT | Memory held for prefixes |
| Small token budget, chunked prefill | Smooth TPOT under mixed load | Slower prefill for new arrivals |
| Quantized weights | TPOT, since fewer bytes read per step | Some [quality](/quantization-what-it-costs) |

Speculative decoding deserves a note, because its cost depends on where you are on the curve. A small draft model, or extra heads on the main model, guesses several tokens, and the large model checks all of them in one pass. The [original paper](https://arxiv.org/abs/2211.17192) reports 2–3× faster T5-XXL with identical outputs; [Medusa](https://arxiv.org/abs/2401.10774) reports 2.2–3.6×. At small batches, decode leaves compute idle, so the verification pass is nearly free. At large batches that compute is already busy serving other users, and rejected guesses become wasted work. My read is that speculation is a latency tool for lightly loaded servers, and its benefit shrinks as the batch grows.

Streaming is also a latency lever, even though it changes no numbers. It turns a 15-second wait for a whole answer into a short wait for the first words, which the user starts reading while the rest arrives.

## Optimizing for throughput

Throughput work is mostly about fitting more sequences in memory and keeping every step full.

- **Push the batch up to the KV ceiling.** That is the 31× in the table. Raise `max_num_seqs` and the token budget until preemption starts, then back off.
- **Make the KV cache smaller.** Grouped-query attention (built into the model), paged allocation, and a quantized KV cache all raise the ceiling. Shorter contexts help most of all.
- **Prefer replicas over tensor parallelism.** Splitting a model that fits on one GPU across several buys latency and spends throughput on communication.
- **Share prefixes.** A batch job that runs the same instructions over 10,000 documents should prefill those instructions once.
- **Accept long deadlines.** With a 24-hour window, a scheduler can run work at full batch whenever capacity is free, which is why the batch tier can sell at half price.

## Which one to optimize

Ask who is waiting.

**A person reading a stream** needs a short TTFT and a TPOT faster than they read. Past that, faster tokens are invisible, so I would set both as targets and then maximize throughput within them. That is goodput, and it is the right objective for almost every product.

**An agent loop** is latency work in disguise. An agent that makes 30 sequential model calls pays 30 TTFTs and 30 generations before a human sees a result, so per-call latency compounds. Cache-aware routing matters most here, because each call re-sends a prefix the last call already computed.

**A job nobody is watching** (evals, backfills, embeddings, offline labeling) should optimize throughput outright. Latency only matters as a deadline, and a deadline of hours lets the scheduler run at the KV ceiling.

**One user on a local machine** has nothing to batch with. The batch is 1, latency is the only number available, and cost per token is whatever the hardware costs.

The mistake I would watch for is choosing a serving setup from a single benchmark number. A peak tokens-per-second figure was measured at a batch size where each user waits; a single-stream speed was measured on an otherwise idle GPU. Before comparing either, I would write down the TTFT and TPOT a user will accept, then compare setups by how many requests each serves while meeting them. If no one is waiting on the output, skip the latency targets and run the largest batch memory allows.
