---
title: What to actually buy to run open models locally
description: Bandwidth, capacity, KV cache and MoE active parameters — the four numbers that decide local inference hardware, with sources.
date: 2026-08-28
updated: 2026-08-28
tags: [hardware, local-llm, apple-silicon, gpu, memory-bandwidth]
---

## Two axes, and most people optimise the wrong one

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

The shape of that table is the whole argument. A 512GB unified-memory desktop holds a model no consumer GPU can touch, at a third of a 5090's bandwidth. A 5090 will out-generate it on anything that fits in 32GB and simply cannot run anything that doesn't — once llama.cpp starts pushing layers into system RAM, throughput [collapses rather than degrades gracefully](https://bmdpat.com/blog/llama-cpp-n-gpu-layers-explained-2026), because every offloaded layer now reads over a PCIe link instead of GDDR7.

```vega-lite Bandwidth spans 7x across the consumer range, and the fastest box is the one with the least capacity. Sources: llm-tracker (Strix Halo), IntuitionLabs (DGX Spark), Apple specs (M5 Max 40-core GPU, M5 Ultra), Trusted Reviews (M3 Ultra), Spheron (RTX 5090).
{"title":{"text":"Memory bandwidth, the number that sets decode speed","subtitle":"Unified memory also buys capacity; the 5090's 1,792 GB/s only reaches 32GB."},
 "height":{"step":38},
 "data":{"values":[
   {"hw":"RTX 5090","v":1792,"kind":"Discrete VRAM"},
   {"hw":"Apple M5 Ultra","v":1200,"kind":"Unified memory"},
   {"hw":"Apple M3 Ultra","v":819,"kind":"Unified memory"},
   {"hw":"Apple M5 Max (40-core)","v":614,"kind":"Unified memory"},
   {"hw":"NVIDIA DGX Spark","v":273,"kind":"Unified memory"},
   {"hw":"Ryzen AI Max+ 395","v":256,"kind":"Unified memory"}]},
 "encoding":{
   "y":{"field":"hw","type":"nominal","sort":"-x","title":null,"axis":{"labelFontSize":13}},
   "x":{"field":"v","type":"quantitative","title":"GB/s","axis":{"grid":true}}},
 "layer":[
   {"mark":{"type":"bar","height":24},"encoding":{"color":{"field":"kind","type":"nominal","legend":{"title":null,"orient":"bottom"}}}},
   {"mark":{"type":"text","align":"left","dx":8,"fontWeight":600,"fontSize":13},
    "encoding":{"text":{"field":"v","type":"quantitative","format":",.0f"}}}]}
```

Which axis binds you depends entirely on decode versus prefill. Generation speed tracks bandwidth; prompt processing tracks compute. See [/prefill-vs-decode](/prefill-vs-decode) for why. That split is visible in the DGX Spark numbers: on gpt-oss-120b it does ~1,723 tok/s of prompt processing but only ~38.6 tok/s of generation, against ~124 tok/s of generation from 3× RTX 3090 ([IntuitionLabs](https://intuitionlabs.ai/articles/nvidia-dgx-spark-review)). Same box, world-class at one phase, mediocre at the other.

## The "will it fit" calculation almost everyone gets wrong

Three things claim memory. Nearly every online sizing table counts one of them.

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

An 8B model can need more memory for its context than a 31B model needs for its weights. This is the single most common sizing error I see, and it is why "a 24GB card runs 8B models" is true for chat and false for a coding agent with 100K of repo in context.

**3. Prompt-cache retention**, which trades memory for latency and is the difference between an always-on box feeling instant and feeling broken. LM Studio's mlx-engine reports a 40K-token context taking ~200 seconds to process cold versus ~5 seconds with cache reuse ([LM Studio](https://lmstudio.ai/blog/mlx-engine-agentic-workloads)). You pay for that in resident memory. More on the harness-level differences in [/prompt-caching-across-harnesses](/prompt-caching-across-harnesses).

**The rule that falls out:** budget Q4 weights plus the KV cache at the context length you will actually use, plus ~20% for the OS and cache retention. For most 2026 architectures that lands between 1.5× and 2× the weight size. Do not trust the multiplier — look up your model's KV-per-token and multiply, because hybrid-attention models like Qwen3-Next are 30× cheaper per token than Gemma 4. A config that only just fits the weights cannot use the context window the model card advertises.

```d2 Three claims on memory, summed. Nearly every sizing table budgets the first box and stops there, which is how an "it fits" config loses the context window the model card advertises.
direction: down

w: 1 · Q4 WEIGHTS\n63 GB for a 120B MoE\n\nThe only line most\nsizing tables count. {
  style: { fill: "#e4edf9"; stroke: "#2a78d6"; stroke-width: 2; font-size: 22 }
}

kv: 2 · KV CACHE\nat your real context\n\nGemma 4 31B @ 128K = 105 GiB\nQwen3-Next 80B @ 1M = 24 GiB {
  style: { fill: "#fbe8de"; stroke: "#eb6834"; stroke-width: 2; font-size: 22 }
}

os: 3 · ~20% OS +\nprompt-cache retention\n\n40K ctx back in 5s, not 200s. {
  style: { fill: "#fbe8de"; stroke: "#eb6834"; stroke-width: 2; font-size: 22 }
}

sum: TOTAL RESIDENT\n= 1.5–2× the weight size {
  style: { fill: "#e0f4ec"; stroke: "#1baf7a"; stroke-width: 2; font-size: 22 }
}

ok: Advertised context\nis usable {
  style: { stroke: "#6b6459"; fill: transparent; stroke-width: 1; font-size: 22 }
}

no: Cut context, or\nquantise harder {
  style: { stroke: "#eb6834"; fill: "#fffdf9"; stroke-width: 2; font-size: 22 }
}

w -> kv: plus { style: { stroke: "#6b6459"; stroke-width: 2; font-size: 20 } }
kv -> os: plus { style: { stroke: "#6b6459"; stroke-width: 2; font-size: 20 } }
os -> sum: equals { style: { stroke: "#6b6459"; stroke-width: 2; font-size: 20 } }
sum -> ok: fits RAM { style: { stroke: "#1baf7a"; stroke-width: 2; font-size: 20 } }
sum -> no: over budget { style: { stroke: "#eb6834"; stroke-width: 2; font-size: 20 } }
```

## Runtime choice is worth as much as hardware choice

On Apple Silicon the spread between inference runtimes is larger than the spread between adjacent hardware tiers. Measured on a Mac mini M4 Pro 64GB running Qwen3-Coder-30B-A3B: **MLX ~130 tok/s, Ollama ~43 tok/s** ([yage.ai](https://yage.ai/share/mlx-apple-silicon-en-20260331.html)). On an M4 Max 128GB with Qwen3.5-35B-A3B the same writeup measures MLX 130, raw llama.cpp on the Metal backend 89.4, Ollama 43.5.

```vega-lite One machine, one model, 3x apart — the entire difference is which runtime you installed. Source: yage.ai, 2026-03-31.
{"title":{"text":"Same machine, same model: runtime is worth a hardware tier","subtitle":"One M4 Max 128GB, Qwen3.5-35B-A3B, decode throughput. Ollama 0.19 later swapped Metal for MLX \u2014 re-benchmark."},
 "height":{"step":38},
 "data":{"values":[
   {"runtime":"MLX","v":130},
   {"runtime":"llama.cpp (Metal)","v":89.4},
   {"runtime":"Ollama","v":43.5}]},
 "encoding":{
   "y":{"field":"runtime","type":"nominal","sort":"-x","title":null,"axis":{"labelFontSize":13}},
   "x":{"field":"v","type":"quantitative","title":"tokens / sec (decode)","axis":{"grid":true}}},
 "layer":[
   {"mark":{"type":"bar","height":24},"encoding":{"color":{"field":"runtime","type":"nominal","legend":null}}},
   {"mark":{"type":"text","align":"left","dx":8,"fontWeight":600,"fontSize":13},
    "encoding":{"text":{"field":"v","type":"quantitative","format":",.4~f"}}}]}
```

Picking the convenient runtime cost you 3× throughput. That is more than the entire generational jump from M4 Max to M5 Ultra on many models. Ollama shipped 0.19 on 2026-03-30 replacing its llama.cpp Metal backend with MLX ([Ollama](https://ollama.com/blog/mlx)), which should close most of that gap — verify on your own model before assuming it has.

Two caveats worth carrying:

- MLX's advantage is in decode, not prefill. On an M1 Max with a ~650-token prompt the same source measured MLX at 13 tok/s combined against GGUF's 20, with MLX spending 94% of its time in prefill. The gap narrows above ~27B where bandwidth becomes the binding constraint for both.
- Prefix cache reuse [is broken for hybrid-architecture models in mlx-lm](https://github.com/ml-explore/mlx-lm/issues/980) (sliding-window, SSM/Mamba). Since hybrid attention is exactly what makes long context affordable, check this before building a workflow on it.

**My read:** if you buy Apple Silicon for inference and run Ollama out of habit, you have wasted roughly a tier of hardware. Install MLX first, benchmark second, buy third.

## MoE changed the arithmetic

This is the fact that invalidates most pre-2025 sizing advice. In a sparse mixture-of-experts model, **throughput tracks active parameters while capacity tracks total parameters.** gpt-oss-120b is 117B total with 5.1B active ([model card](https://huggingface.co/openai/gpt-oss-120b)). It occupies memory like a 120B model and decodes like a 5B one.

The roofline follows directly. My arithmetic, not a measurement:

```
bytes read per token ≈ active_params × bytes_per_param
gpt-oss-120b at MXFP4 (4.25 bits ≈ 0.53 B/param):
  5.1e9 × 0.53  ≈ 2.7 GB per token
ceiling on 1.2 TB/s   = 1200 / 2.7   ≈ 440 tok/s
ceiling on 273 GB/s   =  273 / 2.7   ≈ 100 tok/s
```

Real systems land far below the roofline — the measured DGX Spark number is 38.6 tok/s against that ~100 ceiling, so figure 35–50% realised at best. Use the ratio, not the absolute: it tells you a 400B sparse model with 17B active will generate roughly 3× slower than a 120B/5B one, not 3× *faster than a 400B dense model would be*, which is the intuition people carry over and get wrong.

The practical consequence is that capacity, not bandwidth, has become the binding constraint on high-end local inference. GLM-5.2 is 744B total / 40B active; Unsloth's 2-bit dynamic quant is 239GB and they explicitly note it "can directly fit on a 256GB unified memory Mac" ([Unsloth](https://unsloth.ai/docs/models/glm-5.2)). Its 4-bit is 372–475GB. Nothing with 32GB of VRAM participates in that conversation at any price.

## The ladder, opinionated

**24–32GB.** A used 3090 or a 4090 if you find one sane. This tier runs 8–30B models at high speed and nothing else, and the KV arithmetic above means "30B" really means "30B at modest context." Buy here only if you already game on the card. An M4/M5 Pro laptop covers the same models portably.

**64–128GB unified.** The sweet spot, and where I would point most people. An M5 Max Mac Studio starts at $2,499 ([Apple](https://www.apple.com/newsroom/2026/08/apple-introduces-new-mac-studio-with-m5-max-and-m5-ultra/)) and 614 GB/s at 128GB runs a 120B-class sparse model with real context headroom. The 128GB LPDDR5x boxes (DGX Spark at $4,699, Strix Halo systems) hold the same models at 256–273 GB/s, roughly 2.4× slower on decode. Strix Halo's ~340 tok/s prompt processing on gpt-oss-120b makes long-context agent work unpleasant. Buy the Spark for CUDA compatibility, not for speed.

**256GB.** $5,499 for the base 96GB M5 Ultra plus $4,000 for the 256GB step ([Apple](https://www.apple.com/newsroom/2026/08/apple-introduces-new-mac-studio-with-m5-max-and-m5-ultra/), [9to5Mac](https://9to5mac.com/2026/08/25/apple-unveils-next-generation-mac-studio-with-m5-max-and-m5-ultra/)). This tier exists to run 400–750B sparse models at aggressive quants. Justified only if you have a specific model in that class you need running privately and continuously.

**512GB.** A bet that open weights keep growing faster than memory gets cheap. It buys quality-quant headroom on models that fit 256GB only at 2-bit. Everything else is speculation about models that don't exist yet.

**Rent instead** for anything bursty, and for anything you'd need multiple H100s to serve. Median on-demand H100 pricing is $3.39/GPU-hour across 38 providers ([getdeploying](https://getdeploying.com/gpus/nvidia-h100)); a full day of experimentation costs less than a GPU fan.

## Where buying is plainly the wrong call

If your workload is intermittent inference on models that are already available as an API, the economics are not close. gpt-oss-120b runs at roughly $0.03/M input and $0.17/M output on OpenRouter ([OpenRouter](https://openrouter.ai/openai/gpt-oss-120b)). A $9,499 Mac Studio at 256GB buys, at that rate, on the order of 55 billion output tokens of the same model before the hardware has paid for itself — my arithmetic, ignoring electricity, which makes the comparison worse. At 50 tok/s of local generation you would need decades of continuous output to consume that.

Buy hardware when the driver is one of: data that legally cannot leave your machine, a workload running continuously enough that the box is never idle, or wanting a model no provider hosts. Those are real reasons. "It'll pay for itself" is not one, and neither is a GPU market where the RTX 5090's $1,999 MSRP has become a [median street price near $4,700](https://tech-insider.org/gpu-prices-2026/) on GDDR7 shortage.

One more thing to price in. Apple claims the M5 Ultra delivers "up to 4.3x the peak AI compute performance when compared to M3 Ultra" in the [Mac Studio announcement](https://www.apple.com/newsroom/2026/08/apple-introduces-new-mac-studio-with-m5-max-and-m5-ultra/), and "up to 4.5x the peak GPU compute for AI compared to M3 Ultra" in the [chip announcement](https://www.apple.com/newsroom/2026/08/apple-introduces-m6-and-m5-ultra-for-a-big-leap-in-performance-and-ai-compute/) published the same month. Two numbers, same comparison, same vendor. That gap is a useful reminder of what these multipliers are: peak compute is not what decodes your tokens — bandwidth went up 50%, from 819 GB/s to 1.2 TB/s, and that is the number that moves generation speed. Treat AI-compute multipliers as marketing until someone measures tokens per second, which for prefill-heavy agent workloads may well vindicate them. See [/context-engineering-for-coding-agents](/context-engineering-for-coding-agents) for why prefill dominates that particular workload.
