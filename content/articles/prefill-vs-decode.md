---
title: Prefill and decode want different machines
description: LLM inference has two phases with opposite bottlenecks. Which one you care about decides what hardware to buy.
date: 2026-08-28
updated: 2026-09-23
tags: [inference, gpu, memory-bandwidth, serving, kv-cache]
---

When comparing inference hardware, I want to know how long it takes to read the prompt and how quickly it writes the answer. Those are separate phases, and a machine can be good at one without being good at the other.

**Prefill** takes your whole prompt and pushes it through the model in one shot. A 2,000-token prompt means the first matmul has a 2,000-row activation matrix against each weight matrix. Each weight is loaded from memory once and reused 2,000 times. That is a dense GEMM, it saturates tensor cores, and it sets **time-to-first-token**.

**Decode** produces one token, then the next, then the next. Each step multiplies a *single* row of activations against every weight in the model. Each weight is loaded from memory once and used once. The GPU spends its time waiting on memory and its FLOPs sit idle. Decode sets **inter-token latency**, and therefore the tokens/sec number you actually watch scroll.

That is why I look at prompt-processing and generation benchmarks separately.

```uipack Prefill reads the whole prompt in one compute-bound pass. Decode then loops once per token, re-reading the entire model out of memory every time — which is why the two halves want different hardware.
prefill-decode
```

## The decode arithmetic you can do on a napkin

At batch size 1, decode has to read the whole model out of memory to emit one token. So:

```
tokens/sec ≈ memory bandwidth ÷ bytes read per token
           ≈ memory bandwidth ÷ model file size
```

This is a bandwidth ceiling for the simplified batch-one case. It is a starting estimate, not a prediction of measured speed.

Take Llama-2-7B at `Q4_0`, which is [3.83 GB on disk](https://huggingface.co/TheBloke/Llama-2-7B-GGUF). Apple states 400GB/s for [M1 Max](https://www.apple.com/newsroom/2021/10/introducing-m1-pro-and-m1-max-the-most-powerful-chips-apple-has-ever-built/) and M2 Max, and 800GB/s for [M1 Ultra](https://www.apple.com/newsroom/2022/03/apple-unveils-m1-ultra-the-worlds-most-powerful-chip-for-a-personal-computer/) and [M2 Ultra](https://www.apple.com/newsroom/2023/06/apple-introduces-m2-ultra/). The measured `tg128` figures come from the long-running [llama.cpp Apple Silicon benchmark thread](https://github.com/ggml-org/llama.cpp/discussions/4167).

| Chip | Bandwidth (Apple) | Ceiling, my arithmetic | Measured (llama.cpp) | Fraction of ceiling |
|---|---|---|---|---|
| M1 Max | 400 GB/s | 104 tok/s | 61.19 | 59% |
| M2 Max | 400 GB/s | 104 tok/s | 65.95 | 63% |
| M1 Ultra | 800 GB/s | 209 tok/s | 83.73 | 40% |
| M2 Ultra | 800 GB/s | 209 tok/s | 94.27 | 45% |

The ceiling column is mine: `400e9 / 3.83e9 = 104.4`. It leaves out runtime overhead and other memory traffic.

Two things fall out. Real decode lands at roughly 40–60% of the bandwidth ceiling, so the napkin number is an upper bound you should discount, not a prediction. And the Ultra parts, which are two Max dies fused together at twice the paper bandwidth, return only about **40% more decode throughput** than the Max they're built from (1.37x on M1, 1.43x on M2). If you were buying an Ultra for single-stream generation on the strength of the 800GB/s number, that is the number you should be looking at instead.

```vega-lite Measured decode lands at 40–60% of the arithmetic ceiling, and doubling paper bandwidth (Max to Ultra) buys about 40% more real throughput. | Source: measured tg128 from the llama.cpp Apple Silicon benchmark thread (ggml-org/llama.cpp discussion 4167); bandwidth figures from Apple's M1/M2 Max and Ultra newsroom releases. Ceilings are my own arithmetic.
{"title":{"text":"Napkin ceiling vs measured decode, Llama-2-7B Q4_0","subtitle":"tokens/sec at tg128. Ceiling = memory bandwidth ÷ the 3.83 GB model file size."},
 "height":{"step":46},
 "data":{"values":[
   {"label":"Ceiling, 400 GB/s","v":104,"kind":"Ceiling (arithmetic)"},
   {"label":"M1 Max measured","v":61.19,"kind":"Measured (llama.cpp)"},
   {"label":"M2 Max measured","v":65.95,"kind":"Measured (llama.cpp)"},
   {"label":"Ceiling, 800 GB/s","v":209,"kind":"Ceiling (arithmetic)"},
   {"label":"M1 Ultra measured","v":83.73,"kind":"Measured (llama.cpp)"},
   {"label":"M2 Ultra measured","v":94.27,"kind":"Measured (llama.cpp)"}]},
 "encoding":{
   "y":{"field":"label","type":"nominal","title":null,"sort":["Ceiling, 400 GB/s","M1 Max measured","M2 Max measured","Ceiling, 800 GB/s","M1 Ultra measured","M2 Ultra measured"]},
   "x":{"field":"v","type":"quantitative","title":"tokens / sec","axis":{"grid":true}}},
 "layer":[
   {"mark":{"type":"bar"},"encoding":{"color":{"field":"kind","type":"nominal","title":null}}},
   {"mark":{"type":"text","align":"left","dx":8,"fontWeight":600},
    "encoding":{"text":{"field":"v","type":"quantitative","format":",.4~f"}}}]}
```

The same arithmetic explains why [quantization](/quantization-what-it-costs) buys speed and not just VRAM headroom: cutting a model from FP16 to 4-bit cuts bytes-read-per-token by roughly 4×, which moves the decode ceiling by roughly 4×. Decode is bound by the exact quantity quantization shrinks.

## Why big-FLOPs, small-bandwidth boxes disappoint

NVIDIA's DGX Spark is the cleanest illustration currently shipping. NVIDIA [claims](https://www.nvidia.com/en-us/products/workstations/dgx-spark/) 1 petaFLOP of sparse FP4 on the GB10 superchip, with 128 GB of unified LPDDR5X at **273 GB/s**. The compute figure alone does not tell you how quickly it will generate tokens.

Measured on `gpt-oss-120b` MXFP4 in the [llama.cpp DGX Spark thread](https://github.com/ggml-org/llama.cpp/discussions/16578): **1,956 tok/s prompt processing, 60.57 tok/s generation**. A 32× gap between the two phases on one box, from one set of weights. The two measurements illustrate why the advertised compute figure cannot stand in for a decode benchmark.

```vega-lite Prefill and decode differ by ~32x on the same box, from one set of weights. The advertised compute figure alone does not predict generation speed. | Source: llama.cpp DGX Spark benchmark thread (ggml-org/llama.cpp discussion 16578), gpt-oss-120b MXFP4.
{"title":{"text":"Same box, same weights: prefill vs decode","subtitle":"DGX Spark (GB10), gpt-oss-120b MXFP4, llama.cpp. pp2048 against tg32, tokens/sec."},
 "height":{"step":46},
 "data":{"values":[{"phase":"Prefill (pp2048)","v":1956},{"phase":"Decode (tg32)","v":60.57}]},
 "encoding":{
   "y":{"field":"phase","type":"nominal","sort":"-x","title":null},
   "x":{"field":"v","type":"quantitative","title":"tokens / sec","axis":{"grid":true}}},
 "layer":[
   {"mark":{"type":"bar"},"encoding":{"color":{"field":"phase","type":"nominal","legend":null}}},
   {"mark":{"type":"text","align":"left","dx":8,"fontWeight":600},
    "encoding":{"text":{"field":"v","type":"quantitative","format":",.4~f"}}}]}
```

Apple Silicon has the mirror-image problem. High bandwidth, modest matmul throughput, so a Mac Studio punches above its FLOPs on single-stream decode and falls behind badly on long prompts. Tom's Hardware measured exactly this shape, titling their Mac Studio piece ["M4 Max beats GB10 and Strix Halo in decode throughput, but memory bandwidth isn't everything"](https://www.tomshardware.com/desktops/exploring-apple-silicons-local-ai-performance-with-the-mac-studio-and-m4-max-m4-max-beats-gb10-and-strix-halo-in-decode-throughput-but-memory-bandwidth-isnt-everything). My read: if you paste 40k-token files into a local coding agent, prefill is the wall you'll hit, and it's the wall Apple hardware is worst at. More on the machine-by-machine tradeoffs in [local inference hardware](/local-inference-hardware).

## How batching changes decode

Decode at batch 1 reads `2P` bytes (FP16) to produce one token. Decode at batch 64 reads the same `2P` bytes to produce **64** tokens, because all 64 sequences multiply against the same weights in the same pass. Weight traffic per token falls by 64×. Sharing those weight reads is one reason hosted inference can serve tokens cheaply.

You can find the crossover point with a roofline. NVIDIA's [H100 SXM](https://www.nvidia.com/en-us/data-center/h100/) has 3.35 TB/s of HBM3 and 1,979 FP16 tensor TFLOPS with sparsity, so 989 dense. The ridge point:

```
989e12 FLOP/s ÷ 3.35e12 B/s ≈ 295 FLOP per byte
```

Decode's arithmetic intensity in the weight matmuls is about `B` FLOP/byte at FP16 (2·P·B FLOPs against 2·P bytes read). So you need a batch of roughly **300 concurrent sequences** before an H100 stops being memory-bound during decode. Prefill with a 2,000-token prompt sits at intensity ~2,000 and is compute-bound at batch 1, seven times over.

Which is why batching does much less for prefill. A single 2,000-token prompt already fills the machine; stacking a second one just queues behind the first. Batching converts decode from memory-bound to compute-bound. For prefill it mostly just adds work.

A single local conversation has no other sequences to share those weight reads with. A busy provider can spread that work across many requests. That is one part of the cost difference I would consider when comparing local and hosted inference.

## The KV cache is what grows

Batching decode is limited by memory *capacity*, not just bandwidth, because every active sequence carries a KV cache that grows one entry per layer per token.

Llama 3.3 70B's [config](https://huggingface.co/unsloth/Llama-3.3-70B-Instruct/raw/main/config.json) is 80 layers, 64 attention heads, 8 KV heads, hidden size 8192 (so head dim 128). At FP16:

```
per token = 2 (K and V) × 8 kv_heads × 128 head_dim × 80 layers × 2 bytes
          = 327,680 bytes  ≈ 320 KiB / token
```

At its full 131,072-token context that's **43 GB for one sequence**. Batch 32 at only 8k context each is 86 GB, which already exceeds a single 80 GB H100. Long context turns a bandwidth problem into a capacity problem, and the capacity problem caps your batch size, which drags you back onto the bad side of the decode roofline.

Two fixes are now standard:

- **Grouped-query attention.** Those 8 KV heads serve 64 query heads. Full multi-head attention would need 64 KV heads and 2.56 MiB per token — the same 128k context would cost 343 GB. [GQA](https://arxiv.org/abs/2305.13245) is an 8× cut in KV traffic and footprint, and it's why 128k contexts are servable at all.
- **Paged attention.** vLLM allocates KV in fixed-size pages instead of one contiguous reservation per sequence, so you don't pre-reserve for the worst-case length. The [paper](https://arxiv.org/abs/2309.06180) reports 2–4× throughput at equal latency versus FasterTransformer and Orca, with "near-zero waste" in KV memory. The throughput comes from fitting more sequences, which is the same batching lever again.

Prompt caching is the third lever, and it attacks prefill instead — see [prompt caching across harnesses](/prompt-caching-across-harnesses).

## Scheduling the two phases

Running prefill and decode on the same GPU means they fight. A long prefill occupying the GPU stalls every in-flight decode, and users see the stream freeze.

**Chunked prefill** splits a prompt into fixed-size chunks and slots decode steps in alongside them. [Sarathi-Serve](https://arxiv.org/abs/2403.02310) introduced this as "stall-free scheduling". It is now on by default in vLLM V1, whose [scheduler](https://docs.vllm.ai/en/latest/configuration/optimization.html) batches all pending decodes first, then fills the remaining token budget with prefill chunks. The docs are explicit about why: it gets "better GPU utilization by locating compute-bound (prefill) and memory-bound (decode) requests to the same batch." `max_num_batched_tokens` is the dial — around 2048 favours inter-token latency, above 8192 favours TTFT and raw throughput.

**Disaggregation** goes further and puts the two phases on different machines. [DistServe](https://arxiv.org/abs/2401.09670) made the case that prefill/decode interference costs enough goodput to justify separate GPU pools. Every major stack now ships it: [vLLM](https://docs.vllm.ai/en/latest/features/disagg_prefill/) with KV connectors under `vllm/distributed/kv_transfer`, [SGLang](https://docs.sglang.ai/advanced_features/pd_disaggregation.html) with separate prefill and decode pools, and [TensorRT-LLM](https://nvidia.github.io/TensorRT-LLM/features/disagg-serving.html) under NVIDIA Dynamo. The prefill pool runs high tensor parallelism to chew through matmuls; the decode pool runs lower TP with more replicas for concurrency. KV cache moves between them over RDMA.

For hardware selection, I take this as a reason to measure both phases against the intended workload. A configuration chosen for a busy serving pool may be a poor fit for one local conversation.

## What to buy

| You care about | Optimise for | Watch out for |
|---|---|---|
| Time-to-first-token on long prompts | FLOPs, tensor cores, high TP | Unified-memory machines; prefill is their weak phase |
| Tokens/sec, single stream | Memory bandwidth ÷ quantized model size | Paper FLOPs; Ultra-tier bandwidth that doesn't convert |
| Many concurrent users | VRAM capacity for KV, then bandwidth | Long contexts eating your batch size |
| Cost per token | Someone else's batch | Running one local stream and calling it cheap |

I would use `bandwidth ÷ quantized file size` as a first check, then compare it with measurements for the model and runtime I intend to use. For long prompts and short answers, I would pay particular attention to prefill time. Fast generation does not help much if most of the wait happens before the first token.
