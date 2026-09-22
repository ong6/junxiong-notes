---
title: How I think about hardware for local models
description: Bandwidth, capacity, KV cache and MoE active parameters — the four numbers that decide local inference hardware, with sources.
date: 2026-08-28
updated: 2026-09-23
category: AI systems
tags: [hardware, local-llm, apple-silicon, gpu, memory-bandwidth]
---

## Start with memory capacity and bandwidth

Local inference hardware is decided by two numbers: how much memory you have, and how fast you can read it. Capacity decides *which* models load at all. Bandwidth decides how fast tokens come out once they do. There is no consumer product that maximises both, and the gap between the extremes is roughly 30×.

| Hardware | Memory | Bandwidth | Source |
|---|---|---|---|
| Ryzen AI Max+ 395 (Strix Halo) | up to 128GB | 256 GB/s (~215 GB/s measured) | [llm-tracker](https://llm-tracker.info/AMD-Strix-Halo-(Ryzen-AI-Max+-395)-GPU-Performance) |
| NVIDIA DGX Spark (GB10) | 128GB LPDDR5x | ~273 GB/s | [IntuitionLabs](https://intuitionlabs.ai/articles/nvidia-dgx-spark-review) |
| Apple M5 Max | 36–128GB | 460 GB/s, 614 GB/s on the 40-core GPU | [Apple specs](https://www.apple.com/mac-studio/specs/) |
| Apple M3 Ultra | up to 512GB | 819 GB/s | [Trusted Reviews](https://www.trustedreviews.com/versus/apple-m4-max-vs-m3-ultra-4594325) |
| RTX 4090 | 24GB GDDR6X | 1,008 GB/s | [Spheron](https://www.spheron.network/blog/nvidia-rtx-5090-specs/) |
| Apple M5 Ultra | 96 / 256 / 512GB | 1.2 TB/s | [Apple specs](https://www.apple.com/mac-studio/specs/) |
| RTX 5090 | 32GB GDDR7 | 1,792 GB/s | [Spheron](https://www.spheron.network/blog/nvidia-rtx-5090-specs/) |
| H100 SXM | 80GB HBM3 | 3.35 TB/s | [RunPod](https://www.runpod.io/articles/guides/nvidia-h100) |
| B200 | 180GB HBM3e | ~8 TB/s | [RunPod](https://www.runpod.io/articles/guides/nvidia-b200) |

The table shows the capacity and bandwidth tradeoff. A 512GB unified-memory desktop holds a model no consumer GPU can touch, with less bandwidth than a 5090. A 5090 will out-generate it on anything that fits in 32GB and simply cannot run anything that doesn't — once llama.cpp starts pushing layers into system RAM, throughput [collapses rather than degrades gracefully](https://bmdpat.com/blog/llama-cpp-n-gpu-layers-explained-2026), because every offloaded layer now reads over a PCIe link instead of GDDR7.

```vega-lite Bandwidth spans 7x across the consumer range. The 5090 has the highest bandwidth here, but only 32GB of memory. | Sources: llm-tracker (Strix Halo); IntuitionLabs (DGX Spark); Apple specs (M5 Max 40-core GPU, M5 Ultra); Trusted Reviews (M3 Ultra); Spheron (RTX 4090, RTX 5090).
{"title":{"text":"Memory bandwidth, the number that sets decode speed","subtitle":"Consumer parts only \u2014 the H100 and B200 in the table sit an order of magnitude above. Unified memory also buys capacity; the 5090's 1,792 GB/s only reaches 32GB."},
 "height":{"step":46},
 "data":{"values":[
   {"hw":"RTX 5090","v":1792,"kind":"Discrete VRAM"},
   {"hw":"Apple M5 Ultra","v":1200,"kind":"Unified memory"},
   {"hw":"RTX 4090","v":1008,"kind":"Discrete VRAM"},
   {"hw":"Apple M3 Ultra","v":819,"kind":"Unified memory"},
   {"hw":"Apple M5 Max (40-core)","v":614,"kind":"Unified memory"},
   {"hw":"NVIDIA DGX Spark","v":273,"kind":"Unified memory"},
   {"hw":"Ryzen AI Max+ 395","v":256,"kind":"Unified memory"}]},
 "encoding":{
   "y":{"field":"hw","type":"nominal","sort":"-x","title":null},
   "x":{"field":"v","type":"quantitative","title":"GB/s","axis":{"grid":true}}},
 "layer":[
   {"mark":{"type":"bar"},"encoding":{"color":{"field":"kind","type":"nominal","legend":{"title":null,"orient":"bottom"}}}},
   {"mark":{"type":"text","align":"left","dx":8,"fontWeight":600},
    "encoding":{"text":{"field":"v","type":"quantitative","format":",.0f"}}}]}
```

Which axis binds you depends entirely on decode versus prefill. Generation speed tracks bandwidth; prompt processing tracks compute. See [/prefill-vs-decode](/prefill-vs-decode) for why. That split is visible in the DGX Spark numbers: on gpt-oss-120b it does ~1,723 tok/s of prompt processing but only ~38.6 tok/s of generation, against ~124 tok/s of generation from 3× RTX 3090 ([IntuitionLabs](https://intuitionlabs.ai/articles/nvidia-dgx-spark-review)). For a long prompt, that difference matters to the wait before generation starts.

## Leave room for more than the weights

I would budget for the model, its context and any cache I want to keep between requests.

**1. Weights.** The number you look up. Q4 of a 120B MoE is about 63GB ([Unsloth's gpt-oss-120b GGUFs](https://huggingface.co/unsloth/gpt-oss-120b-GGUF) run 62.6–63GB across the 2-bit through 4-bit range, because the MXFP4 MoE weights are already quantized natively). What quantizing costs you in quality is a separate question — [/quantization-what-it-costs](/quantization-what-it-costs).

**2. KV cache, which scales linearly with context** and is wildly architecture-dependent. The per-token cost is `4 × num_kv_heads × head_dim` bytes per attention layer at bf16, summed over layers that actually cache. Sebastian Raschka [publishes the worked numbers per model](https://sebastianraschka.com/llm-architecture-gallery/kv-cache-calculations/):

```
Qwen3 8B            144 KiB/token   (36 layers × 8 KV heads × 128 dim × 4)
Gemma 4 31B         840 KiB/token   (hybrid sliding-window + global)
DeepSeek V3        68.6 KiB/token   (MLA compression)
Qwen3-Next 80B-A3B   24 KiB/token   (only 12 full-attention layers cache)
```

Multiply those out — my arithmetic, from Raschka's per-token figures:

```
Qwen3 8B @ 128K ctx:        131,072 × 147,456 B  = 18.0 GiB KV
  ...against roughly 4.5 GB of Q4 weights.        KV is 4× the model.

Gemma 4 31B @ 128K ctx:     131,072 × 860,160 B  = 105 GiB KV
  ...against roughly 17 GB of Q4 weights.         KV is 6× the model.

Qwen3-Next 80B @ 1M ctx:  1,048,576 ×  24,576 B  = 24 GiB KV
  ...against roughly 45 GB of Q4 weights.         KV is half the model.
```

An 8B model can need more memory for its context than a 31B model needs for its weights. This explains why "a 24GB card runs 8B models" is true for chat and false for a coding agent with 100K of repo in context.

**3. Prompt-cache retention**, which trades memory for latency and can make a large difference to repeat requests. LM Studio's mlx-engine reports a 40K-token context taking ~200 seconds to process cold versus ~5 seconds with cache reuse ([LM Studio](https://lmstudio.ai/blog/mlx-engine-agentic-workloads)). You pay for that in resident memory. More on the harness-level differences in [/prompt-caching-across-harnesses](/prompt-caching-across-harnesses).

**My starting budget:** Q4 weights plus the KV cache at the context length you will actually use, plus ~20% for the OS and cache retention. For most 2026 architectures that lands between 1.5× and 2× the weight size. Do not trust the multiplier — look up your model's KV-per-token and multiply, because hybrid-attention models like Qwen3-Next are 30× cheaper per token than Gemma 4. A config that only just fits the weights cannot use the context window the model card advertises.

```uipack Three claims on memory, summed. Nearly every sizing table budgets the first box and stops there, which is how an "it fits" config loses the context window the model card advertises.
memory-sum
```

## Runtime choice is worth as much as hardware choice

On Apple Silicon the spread between inference runtimes is larger than the spread between adjacent hardware tiers. Measured on a Mac mini M4 Pro 64GB running Qwen3-Coder-30B-A3B: **MLX ~130 tok/s, Ollama ~43 tok/s** ([yage.ai](https://yage.ai/share/mlx-apple-silicon-en-20260331.html)). On an M4 Max 128GB with Qwen3.5-35B-A3B the same writeup measures MLX 130, raw llama.cpp on the Metal backend 89.4, Ollama 43.5.

```vega-lite Two Macs, five measurements: the runtime you install moves throughput further than the machine you bought. | Source: yage.ai, MLX on Apple Silicon, 2026-03-31.
{"title":{"text":"Runtime choice moves decode throughput more than the machine does","subtitle":"Decode tok/s. M4 Max 128GB runs Qwen3.5-35B-A3B; M4 Pro 64GB runs Qwen3-Coder-30B-A3B. llama.cpp was not measured on the M4 Pro. Ollama 0.19 later swapped Metal for MLX \u2014 re-benchmark."},
 "height":{"step":28},
 "data":{"values":[
   {"runtime":"MLX","machine":"M4 Max 128GB","v":130},
   {"runtime":"MLX","machine":"M4 Pro 64GB","v":130},
   {"runtime":"llama.cpp (Metal)","machine":"M4 Max 128GB","v":89.4},
   {"runtime":"Ollama","machine":"M4 Max 128GB","v":43.5},
   {"runtime":"Ollama","machine":"M4 Pro 64GB","v":43}]},
 "encoding":{
   "y":{"field":"runtime","type":"nominal","sort":["MLX","llama.cpp (Metal)","Ollama"],"title":null},
   "yOffset":{"field":"machine","type":"nominal"},
   "x":{"field":"v","type":"quantitative","title":"tokens / sec (decode)","axis":{"grid":true}}},
 "layer":[
   {"mark":{"type":"bar","height":22},"encoding":{"color":{"field":"machine","type":"nominal","legend":{"title":null,"orient":"bottom"}}}},
   {"mark":{"type":"text","align":"left","dx":8,"fontWeight":600,"fontSize":13},
    "encoding":{"text":{"field":"v","type":"quantitative","format":",.4~f"}}}]}
```

In those measurements, the runtime made roughly a threefold difference. I would check that before paying for a faster machine. Ollama shipped 0.19 on 2026-03-30 replacing its llama.cpp Metal backend with MLX ([Ollama](https://ollama.com/blog/mlx)), which should close most of that gap — verify on your own model before assuming it has.

Two caveats worth carrying:

- MLX's advantage is in decode, not prefill. On an M1 Max with a ~650-token prompt the same source measured MLX at 13 tok/s combined against GGUF's 20, with MLX spending 94% of its time in prefill. The gap narrows above ~27B where bandwidth becomes the binding constraint for both.
- Prefix cache reuse [is broken for hybrid-architecture models in mlx-lm](https://github.com/ml-explore/mlx-lm/issues/980) (sliding-window, SSM/Mamba). Since hybrid attention is exactly what makes long context affordable, check this before building a workflow on it.

I would compare runtimes on the machine I already have before buying another one. The figures above are snapshots; a backend update can change the comparison.

## MoE changed the arithmetic

For sparse models, the sizing calculation changes: In a sparse mixture-of-experts model, **throughput tracks active parameters while capacity tracks total parameters.** gpt-oss-120b is 117B total with 5.1B active ([model card](https://huggingface.co/openai/gpt-oss-120b)). It occupies memory like a 120B model and decodes like a 5B one.

The roofline follows directly. My arithmetic, not a measurement:

```
bytes read per token ≈ active_params × bytes_per_param
gpt-oss-120b at MXFP4 (4.25 bits ≈ 0.53 B/param):
  5.1e9 × 0.53  ≈ 2.7 GB per token
ceiling on 1.2 TB/s   = 1200 / 2.7   ≈ 440 tok/s
ceiling on 273 GB/s   =  273 / 2.7   ≈ 100 tok/s
```

Real systems land far below the roofline — the measured DGX Spark number is 38.6 tok/s against that ~100 ceiling, so figure 35–50% realised at best. Use the ratio, not the absolute: it tells you a 400B sparse model with 17B active will generate roughly 3× slower than a 120B/5B one, not 3× *faster than a 400B dense model would be*, which is the intuition people carry over and get wrong.

For the largest sparse models, finding enough memory to load the weights can be the first constraint. GLM-5.2 is 744B total / 40B active; Unsloth's 2-bit dynamic quant is 239GB and they explicitly note it "can directly fit on a 256GB unified memory Mac" ([Unsloth](https://unsloth.ai/docs/models/glm-5.2)). Its 4-bit is 372–475GB. That model cannot fit entirely in 32GB of VRAM.

## Which capacity would I consider?

**24–32GB.** I would consider a used 3090 or a reasonably priced 4090 here. This tier suits smaller models, with the context length limited by how much memory remains after loading the weights. It is easier to justify if I also use the card for games. An M4/M5 Pro laptop covers the same models portably.

**64–128GB unified.** The sweet spot, and where I would point most people. An M5 Max Mac Studio starts at $2,499 ([Apple](https://www.apple.com/newsroom/2026/08/apple-introduces-new-mac-studio-with-m5-max-and-m5-ultra/)) and 614 GB/s at 128GB runs a 120B-class sparse model with real context headroom. The 128GB LPDDR5x boxes (DGX Spark at $4,699, Strix Halo systems) hold the same models at 256–273 GB/s, roughly 2.4× slower on decode. Strix Halo's ~340 tok/s prompt processing on gpt-oss-120b makes long-context agent work unpleasant. Buy the Spark for CUDA compatibility, not for speed.

**256GB.** $5,499 for the base 96GB M5 Ultra plus $4,000 for the 256GB step ([Apple](https://www.apple.com/newsroom/2026/08/apple-introduces-new-mac-studio-with-m5-max-and-m5-ultra/), [9to5Mac](https://9to5mac.com/2026/08/25/apple-unveils-next-generation-mac-studio-with-m5-max-and-m5-ultra/)). This tier exists to run 400–750B sparse models at aggressive quants. Justified only if you have a specific model in that class you need running privately and continuously.

**512GB.** A bet that open weights keep growing faster than memory gets cheap. It buys quality-quant headroom on models that fit 256GB only at 2-bit. Everything else is speculation about models that don't exist yet.

**Rent instead** for anything bursty, and for anything you'd need multiple H100s to serve. Median on-demand H100 pricing is $3.39/GPU-hour across 38 providers ([getdeploying](https://getdeploying.com/gpus/nvidia-h100)); renting lets me try the workload before committing to a machine.

## When I would use an API instead

If your workload is intermittent inference on models that are already available as an API, the economics are not close. gpt-oss-120b runs at roughly $0.03/M input and $0.17/M output on OpenRouter ([OpenRouter](https://openrouter.ai/openai/gpt-oss-120b)). A $9,499 Mac Studio at 256GB buys, at that rate, on the order of 55 billion output tokens of the same model before the hardware has paid for itself — my arithmetic, ignoring electricity, which makes the comparison worse. At 50 tok/s of local generation you would need decades of continuous output to consume that.

Buy hardware when the driver is one of: data that legally cannot leave your machine, a workload running continuously enough that the box is never idle, or wanting a model no provider hosts. I would price those needs separately from the hope of saving on API calls, especially when the RTX 5090's $1,999 MSRP has become a [median street price near $4,700](https://tech-insider.org/gpu-prices-2026/) on GDDR7 shortage.

One more thing to price in. Apple claims the M5 Ultra delivers "up to 4.3x the peak AI compute performance when compared to M3 Ultra" in the [Mac Studio announcement](https://www.apple.com/newsroom/2026/08/apple-introduces-new-mac-studio-with-m5-max-and-m5-ultra/), and "up to 4.5x the peak GPU compute for AI compared to M3 Ultra" in the [chip announcement](https://www.apple.com/newsroom/2026/08/apple-introduces-m6-and-m5-ultra-for-a-big-leap-in-performance-and-ai-compute/) published the same month. I would want to see the workload behind each figure. For single-stream decode, the memory-bandwidth change is more useful to my estimate — bandwidth went up 50%, from 819 GB/s to 1.2 TB/s, and that is the number that moves generation speed. Treat AI-compute multipliers as marketing until someone measures tokens per second, which for prefill-heavy agent workloads may well vindicate them. See [/context-engineering-for-coding-agents](/context-engineering-for-coding-agents) for why prefill dominates that particular workload.
