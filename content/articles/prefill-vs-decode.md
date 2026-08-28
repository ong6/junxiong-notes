---
title: Prefill and decode want different machines
description: LLM inference has two phases with opposite bottlenecks. Which one you care about decides what hardware to buy.
date: 2026-08-28
updated: 2026-08-28
tags: [inference, gpu, memory-bandwidth, serving, kv-cache]
---

## Two phases, opposite bottlenecks

Every request to an LLM runs in two phases, and they stress completely different parts of a machine.

**Prefill** takes your whole prompt and pushes it through the model in one shot. A 2,000-token prompt means the first matmul has a 2,000-row activation matrix against each weight matrix. Each weight is loaded from memory once and reused 2,000 times. That is a dense GEMM, it saturates tensor cores, and it sets **time-to-first-token**.

**Decode** produces one token, then the next, then the next. Each step multiplies a *single* row of activations against every weight in the model. Each weight is loaded from memory once and used once. The GPU spends its time waiting on memory and its FLOPs sit idle. Decode sets **inter-token latency**, and therefore the tokens/sec number you actually watch scroll.

Same weights, same kernels, and the hardware you'd buy to make each one fast is nearly the opposite.

```d2 Prefill reads the whole prompt in one compute-bound pass. Decode then loops once per token, and every pass re-reads the entire model out of memory — which is why the two halves want different hardware.
direction: down

prompt: Prompt\nN tokens {
  style: { stroke: "#6b6459"; fill: transparent; stroke-width: 1; font-size: 22 }
}

prefill: PREFILL\ncompute-bound\n\nOne N-row GEMM over every token\nat once. Saturates FLOPs. {
  style: { fill: "#e4edf9"; stroke: "#2a78d6"; stroke-width: 2; font-size: 22 }
}

step: DECODE\nmemory-bandwidth-bound\n\nOne 1-row matmul. One token out. {
  style: { fill: "#fbe8de"; stroke: "#eb6834"; stroke-width: 2; font-size: 22 }
}

mem: Read EVERY weight\n+ the whole KV cache {
  style: { fill: "#fffdf9"; stroke: "#eb6834"; stroke-width: 2; font-size: 22 }
}

prompt -> prefill: all N tokens { style: { stroke: "#6b6459"; font-size: 20 } }
prefill -> step: first token · TTFT { style: { stroke: "#6b6459"; stroke-width: 2; font-size: 20 } }
step -> mem: every pass { style: { stroke: "#eb6834"; stroke-width: 2; font-size: 20 } }
mem -> step: KV cache +1 {
  style: { stroke: "#eb6834"; stroke-width: 2; stroke-dash: 4; font-size: 20 }
}
```

## The decode arithmetic you can do on a napkin

At batch size 1, decode has to read the whole model out of memory to emit one token. So:

```
tokens/sec ≈ memory bandwidth ÷ bytes read per token
           ≈ memory bandwidth ÷ model file size
```

That's it. That's the ceiling. Nothing about FLOPs appears in it.

Take Llama-2-7B at `Q4_0`, which is [3.83 GB on disk](https://huggingface.co/TheBloke/Llama-2-7B-GGUF). Apple states 400GB/s for [M1 Max](https://www.apple.com/newsroom/2021/10/introducing-m1-pro-and-m1-max-the-most-powerful-chips-apple-has-ever-built/) and M2 Max, and 800GB/s for [M1 Ultra](https://www.apple.com/newsroom/2022/03/apple-unveils-m1-ultra-the-worlds-most-powerful-chip-for-a-personal-computer/) and [M2 Ultra](https://www.apple.com/newsroom/2023/06/apple-introduces-m2-ultra/). The measured `tg128` figures come from the long-running [llama.cpp Apple Silicon benchmark thread](https://github.com/ggml-org/llama.cpp/discussions/4167).

| Chip | Bandwidth (Apple) | Ceiling, my arithmetic | Measured (llama.cpp) | Fraction of ceiling |
|---|---|---|---|---|
| M1 Max | 400 GB/s | 104 tok/s | 61.19 | 59% |
| M2 Max | 400 GB/s | 104 tok/s | 65.95 | 63% |
| M1 Ultra | 800 GB/s | 209 tok/s | 83.73 | 40% |
| M2 Ultra | 800 GB/s | 209 tok/s | 94.27 | 45% |

The ceiling column is mine: `400e9 / 3.83e9 = 104.4`. Check it yourself.

Two things fall out. Real decode lands at roughly 40–60% of the bandwidth ceiling, so the napkin number is an upper bound you should discount, not a prediction. And the Ultra parts, which are two Max dies fused together at twice the paper bandwidth, return only about **40% more decode throughput** than the Max they're built from (1.37x on M1, 1.43x on M2). If you were buying an Ultra for single-stream generation on the strength of the 800GB/s number, that is the number you should be looking at instead.

```vega-lite Measured decode lands at 40–60% of the arithmetic ceiling, and doubling paper bandwidth (Max to Ultra) buys about 40% more real throughput.
{"title":{"text":"Napkin ceiling vs measured decode, Llama-2-7B Q4_0","subtitle":"Ceilings are my arithmetic (bandwidth ÷ 3.83 GB file size); measured tg128 from the llama.cpp Apple Silicon benchmark thread."},
 "height":{"step":38},
 "data":{"values":[
   {"label":"Ceiling, 400 GB/s","v":104,"kind":"Ceiling (arithmetic)"},
   {"label":"M1 Max measured","v":61.19,"kind":"Measured (llama.cpp)"},
   {"label":"M2 Max measured","v":65.95,"kind":"Measured (llama.cpp)"},
   {"label":"Ceiling, 800 GB/s","v":209,"kind":"Ceiling (arithmetic)"},
   {"label":"M1 Ultra measured","v":83.73,"kind":"Measured (llama.cpp)"},
   {"label":"M2 Ultra measured","v":94.27,"kind":"Measured (llama.cpp)"}]},
 "encoding":{
   "y":{"field":"label","type":"nominal","title":null,"sort":["Ceiling, 400 GB/s","M1 Max measured","M2 Max measured","Ceiling, 800 GB/s","M1 Ultra measured","M2 Ultra measured"],"axis":{"labelFontSize":13}},
   "x":{"field":"v","type":"quantitative","title":"tokens / sec","axis":{"grid":true}}},
 "layer":[
   {"mark":{"type":"bar","height":24},"encoding":{"color":{"field":"kind","type":"nominal","title":null}}},
   {"mark":{"type":"text","align":"left","dx":8,"fontWeight":600,"fontSize":13},
    "encoding":{"text":{"field":"v","type":"quantitative","format":",.4~f"}}}]}
```

The same arithmetic explains why [quantization](/quantization-what-it-costs) buys speed and not just VRAM headroom: cutting a model from FP16 to 4-bit cuts bytes-read-per-token by roughly 4×, which moves the decode ceiling by roughly 4×. Decode is bound by the exact quantity quantization shrinks.

## Why big-FLOPs, small-bandwidth boxes disappoint

NVIDIA's DGX Spark is the cleanest illustration currently shipping. NVIDIA [claims](https://www.nvidia.com/en-us/products/workstations/dgx-spark/) 1 petaFLOP of sparse FP4 on the GB10 superchip, with 128 GB of unified LPDDR5X at **273 GB/s**. That is datacenter-class compute bolted to laptop-class memory.

Measured on `gpt-oss-120b` MXFP4 in the [llama.cpp DGX Spark thread](https://github.com/ggml-org/llama.cpp/discussions/16578): **1,956 tok/s prompt processing, 60.57 tok/s generation**. A 32× gap between the two phases on one box, from one set of weights. The petaFLOP shows up in the first number and is entirely absent from the second.

```vega-lite Prefill and decode differ by ~32x on the same box, from one set of weights. Source: llama.cpp DGX Spark thread.
{"title":{"text":"Same box, same weights: prefill vs decode","subtitle":"DGX Spark, gpt-oss-120b MXFP4, llama.cpp DGX Spark thread. pp2048 against tg32."},
 "height":{"step":38},
 "data":{"values":[{"phase":"Prefill (pp2048)","v":1956},{"phase":"Decode (tg32)","v":60.57}]},
 "encoding":{
   "y":{"field":"phase","type":"nominal","sort":"-x","title":null,"axis":{"labelFontSize":13}},
   "x":{"field":"v","type":"quantitative","title":"tokens / sec","axis":{"grid":true}}},
 "layer":[
   {"mark":{"type":"bar","height":24},"encoding":{"color":{"field":"phase","type":"nominal","legend":null}}},
   {"mark":{"type":"text","align":"left","dx":8,"fontWeight":600,"fontSize":13},
    "encoding":{"text":{"field":"v","type":"quantitative","format":",.4~f"}}}]}
```

Apple Silicon has the mirror-image problem. High bandwidth, modest matmul throughput, so a Mac Studio punches above its FLOPs on single-stream decode and falls behind badly on long prompts. Tom's Hardware measured exactly this shape, titling their Mac Studio piece ["M4 Max beats GB10 and Strix Halo in decode throughput, but memory bandwidth isn't everything"](https://www.tomshardware.com/desktops/exploring-apple-silicons-local-ai-performance-with-the-mac-studio-and-m4-max-m4-max-beats-gb10-and-strix-halo-in-decode-throughput-but-memory-bandwidth-isnt-everything). My read: if you paste 40k-token files into a local coding agent, prefill is the wall you'll hit, and it's the wall Apple hardware is worst at. More on the machine-by-machine tradeoffs in [local inference hardware](/local-inference-hardware).

## Batching is why the API is cheap and your Mac is not

Decode at batch 1 reads `2P` bytes (FP16) to produce one token. Decode at batch 64 reads the same `2P` bytes to produce **64** tokens, because all 64 sequences multiply against the same weights in the same pass. Weight traffic per token falls by 64×. This is the entire economic basis of hosted inference.

You can find the crossover point with a roofline. NVIDIA's [H100 SXM](https://www.nvidia.com/en-us/data-center/h100/) has 3.35 TB/s of HBM3 and 1,979 FP16 tensor TFLOPS with sparsity, so 989 dense. The ridge point:

```
989e12 FLOP/s ÷ 3.35e12 B/s ≈ 295 FLOP per byte
```

Decode's arithmetic intensity in the weight matmuls is about `B` FLOP/byte at FP16 (2·P·B FLOPs against 2·P bytes read). So you need a batch of roughly **300 concurrent sequences** before an H100 stops being memory-bound during decode. Prefill with a 2,000-token prompt sits at intensity ~2,000 and is compute-bound at batch 1, seven times over.

Which is why batching does much less for prefill. A single 2,000-token prompt already fills the machine; stacking a second one just queues behind the first. Batching converts decode from memory-bound to compute-bound. For prefill it mostly just adds work.

Your local single stream never gets any of this. You pay full weight-read cost for every single token. A provider amortises that read across hundreds of users, which is how per-token prices land where they do while your Mac Studio does one conversation at a time.

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

## What production stacks actually do about it

Running prefill and decode on the same GPU means they fight. A long prefill occupying the GPU stalls every in-flight decode, and users see the stream freeze.

**Chunked prefill** splits a prompt into fixed-size chunks and slots decode steps in alongside them. [Sarathi-Serve](https://arxiv.org/abs/2403.02310) introduced this as "stall-free scheduling". It is now on by default in vLLM V1, whose [scheduler](https://docs.vllm.ai/en/latest/configuration/optimization.html) batches all pending decodes first, then fills the remaining token budget with prefill chunks. The docs are explicit about why: it gets "better GPU utilization by locating compute-bound (prefill) and memory-bound (decode) requests to the same batch." `max_num_batched_tokens` is the dial — around 2048 favours inter-token latency, above 8192 favours TTFT and raw throughput.

**Disaggregation** goes further and puts the two phases on different machines. [DistServe](https://arxiv.org/abs/2401.09670) made the case that prefill/decode interference costs enough goodput to justify separate GPU pools. Every major stack now ships it: [vLLM](https://docs.vllm.ai/en/latest/features/disagg_prefill/) with KV connectors under `vllm/distributed/kv_transfer`, [SGLang](https://docs.sglang.ai/advanced_features/pd_disaggregation.html) with separate prefill and decode pools, and [TensorRT-LLM](https://nvidia.github.io/TensorRT-LLM/features/disagg-serving.html) under NVIDIA Dynamo. The prefill pool runs high tensor parallelism to chew through matmuls; the decode pool runs lower TP with more replicas for concurrency. KV cache moves between them over RDMA.

The important part for a buyer: the people who serve models at scale concluded the two phases want **physically different hardware allocations**. That is the strongest available evidence that the split is real and not a modelling curiosity.

## What to buy

| You care about | Optimise for | Watch out for |
|---|---|---|
| Time-to-first-token on long prompts | FLOPs, tensor cores, high TP | Unified-memory machines; prefill is their weak phase |
| Tokens/sec, single stream | Memory bandwidth ÷ quantized model size | Paper FLOPs; Ultra-tier bandwidth that doesn't convert |
| Many concurrent users | VRAM capacity for KV, then bandwidth | Long contexts eating your batch size |
| Cost per token | Someone else's batch | Running one local stream and calling it cheap |

Two rules I'd give anyone shopping. First, compute `bandwidth ÷ quantized file size`, discount to 50%, and treat that as your realistic ceiling before you read a single review. Second, if your workload is long prompts and short answers (coding agents, document QA, RAG), you are buying a prefill machine, and bandwidth is the wrong headline number to be optimising.
