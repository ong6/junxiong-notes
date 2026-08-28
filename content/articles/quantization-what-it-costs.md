---
title: What quantization actually costs you
description: Formats, measured quality loss, the speed you get back, and why the KV cache is the part quantization never shrinks.
date: 2026-08-28
updated: 2026-08-28
tags: [quantization, open-weights, local-llm, inference]
---

Quantization is the field with the widest gap between what people repeat and what anyone has measured. "Q4 is basically lossless" gets said constantly, usually by someone quoting a perplexity number from a 2023 forum post about a model that no longer exists. The real answer depends on which format, which layers, and which task, and there is now enough published measurement to give it properly.

## The formats

| Format | Bits | Where it runs | How it decides precision |
|---|---|---|---|
| GGUF k-quants (`Q4_K_M`, `Q5_K_M`, `Q6_K`) | ~3.4–6.6 effective | llama.cpp, Ollama, LM Studio | Super-blocks with quantized scales; `_M`/`_S` variants keep attention and `feed_forward.w2` at higher width |
| GGUF i-quants (`IQ2_XXS`, `IQ3_S`, `IQ4_XS`) | ~2.1–4.3 | llama.cpp | Codebook lookup plus an importance matrix from calibration data |
| GPTQ | 3–4 | vLLM, TGI, ExLlama | Layer-wise error minimisation using approximate second-order (Hessian) information |
| AWQ | 4 | vLLM, TGI | Scales up the ~1% of weight channels with the largest activations before quantizing |
| NF4 (bitsandbytes) | 4 | Transformers, PEFT | Quantile bins under a normal prior, plus double-quantized scales |
| MXFP4 | 4.25 | vLLM, llama.cpp, MLX | 4-bit float (E2M1) in blocks of 32 with a shared 8-bit exponent |
| Unsloth dynamic (`UD-*`) | ~1.6–8 mixed | llama.cpp and anything reading GGUF | Per-layer width chosen by measured sensitivity, not a uniform setting |

[GPTQ](https://arxiv.org/abs/2210.17323) (Frantar et al., 2022) quantizes one layer at a time and corrects the remaining weights for the error already introduced, which is why it can hit 3–4 bits on a 175B model in about four GPU hours. [AWQ](https://arxiv.org/abs/2306.00978) (MLSys 2024 best paper) took the opposite route: look at activation magnitudes, find the ~1% of channels that matter, and scale them up so rounding hurts them less. No backpropagation, no reconstruction, which is why it generalises off its calibration set better than GPTQ does.

[NF4](https://arxiv.org/abs/2305.14314) came out of QLoRA. Its 16 levels are placed so each bin holds equal probability mass under a standard normal rather than being evenly spaced. Weights are roughly normal, so this is a better use of 16 codes. NF4 exists mainly to make fine-tuning fit in memory; as a serving format it is slower than a Marlin-kernel GPTQ or AWQ model on the same hardware.

MXFP4 is the odd one, because for `gpt-oss` it is not a compression step applied afterwards. OpenAI post-trained with the MoE weights already in MXFP4, and those weights are [90%+ of the parameter count](https://arxiv.org/pdf/2508.10925), so the 120B fits on a single 80GB GPU and the 20B in 16GB. There is no fp16 reference version of those tensors to be worse than.

### Dynamic quants are the actual recent development

Everything above except the `_M`/`_S` split applies one width to the whole model. Unsloth's dynamic quants pick a width per layer from measured sensitivity, so a nominal "2-bit" build is 2-bit in the layers that tolerate it and 4- or 6-bit in the ones that don't. This is why models that "cannot fit" now fit.

The measurement that convinced me is Unsloth's [Qwen3.5-35B-A3B GGUF table](https://unsloth.ai/docs/models/qwen3.5/gguf-benchmarks), which reports mean KL-divergence against the reference for the same model quantized by several people:

| Build | Disk | Perplexity | Mean KLD |
|---|---|---|---|
| Unsloth `Q8_K_XL` | 36.04 GB | 6.5352 | 0.0026 |
| Unsloth `Q6_K_XL` | 28.22 GB | 6.5392 | 0.0041 |
| Unsloth `Q5_K_XL` | 23.22 GB | 6.5489 | 0.0069 |
| Unsloth `UD-Q4_K_XL` | 19.17 GB | 6.5918 | **0.0137** |
| bartowski `Q4_K_M` | 19.77 GB | 6.6097 | **0.0182** |
| Unsloth `Q3_K_XL` | 16.06 GB | 6.7245 | 0.0308 |
| Unsloth `Q2_K_XL` | 12.04 GB | 7.0438 | 0.0970 |
| Unsloth `IQ2_XXS` | 9.09 GB | 7.7160 | 0.1846 |
| bartowski `IQ2_XXS` | 8.15 GB | 9.3427 | 0.3457 |

The two bolded rows are the point. The dynamic build is 0.6 GB *smaller* than the uniform `Q4_K_M` and 25% closer to the reference distribution. At 2 bits the gap widens to nearly 2×. Layer-width selection buys more at low bit counts, which is exactly where you need it.

## PTQ vs QAT

Post-training quantization is everything above: take finished weights, calibrate on a few hundred thousand tokens, write out a smaller file. Minutes to hours, no training loop.

Quantization-aware training simulates the rounding during training so the weights learn to survive it. Google shipped this for Gemma 3 with [~5,000 QAT steps against the non-quantized checkpoint's own probabilities](https://developers.googleblog.com/en/gemma-3-quantized-aware-trained-state-of-the-art-ai-to-consumer-gpus/) (April 2025), and reported that it **cut the Q4_0 perplexity drop by 54%** versus plain PTQ, taking the 27B from 54 GB to 14.1 GB.

QAT is worth it if you publish the weights and can amortise the training cost over every download. It is almost never worth it if you are quantizing someone else's model for your own use — a good dynamic PTQ build closes most of that gap for free. Unsloth [reports their dynamic quants reaching lower KL-divergence than Gemma 3's QAT builds](https://unsloth.ai/blog/dynamic-v2) at comparable size, and while that is a vendor claim about their own product, the third-party KLD table above makes it plausible.

## What it costs, measured

Three numbers get used, and they do not measure the same thing.

**Perplexity** is the one everyone quotes, and it understates the damage. Its failure mode is that per-token differences from the reference cancel out in the average. [Accuracy is Not All You Need](https://arxiv.org/abs/2407.09141) (Microsoft Research, 2024) documents this: quantized models produce large numbers of *flips*, answers changing from right to wrong and wrong to right in roughly equal proportion, so the aggregate score barely moves while the model's actual behaviour has shifted. Flips correlate with KL-divergence at Spearman 0.981 on MMLU, and with perplexity much less well.

**KL-divergence against the fp16 reference** is the metric I'd use if I could only have one. It measures distributional distance per token, so cancellation is not possible, and it is what the credible quant publishers now report.

**Task benchmarks** are the ground truth, and they show the damage is not evenly distributed. From [a unified llama.cpp evaluation on Llama-3.1-8B-Instruct](https://arxiv.org/abs/2601.14277) (Kurt, January 2026):

| Quant | Size cut | PPL (F16 = 7.32) | GSM8K | MMLU | HellaSwag |
|---|---|---|---|---|---|
| F16 | — | 7.32 | 77.63 | 63.50 | 72.51 |
| Q8_0 | 46.9% | 7.33 | 77.48 | 63.43 | 72.52 |
| Q5_K_M | 64.4% | 7.40 | 78.54 | 62.80 | 72.33 |
| Q4_K_M | 69.4% | 7.56 | 77.41 | 62.43 | 72.35 |
| Q3_K_M | 75.0% | 7.96 | 73.16 | 62.01 | 73.41 |
| Q3_K_S | 77.2% | 8.96 | **68.31** | 59.31 | 71.87 |

Read the bottom row across. Perplexity rises 22%, HellaSwag falls 0.6 points, MMLU falls 4.2, GSM8K falls **9.3**. Multi-step arithmetic degrades roughly fifteen times harder than sentence completion at the same bit width, and no single perplexity number tells you that. The paper also finds schemes with *identical* perplexity diverging on instruction-following, which is the flips phenomenon showing up in a different dataset.

```vega-lite Four-bit costs almost nothing on any of the three tasks. One tier lower, arithmetic falls roughly fifteen times harder than sentence completion. | Source: Kurt, January 2026, unified llama.cpp evaluation of Llama-3.1-8B-Instruct (arxiv.org/abs/2601.14277). Deltas are my arithmetic against that paper's F16 row.
{"title":{"text":"Same model, same bit width, very different damage","subtitle":"Accuracy points lost against F16, Llama-3.1-8B-Instruct. Lower is better."},
 "height":{"step":46},
 "data":{"values":[
   {"label":"GSM8K (arithmetic) · Q3_K_S","v":9.3,"quant":"Q3_K_S"},
   {"label":"GSM8K (arithmetic) · Q4_K_M","v":0.22,"quant":"Q4_K_M"},
   {"label":"MMLU (knowledge) · Q3_K_S","v":4.2,"quant":"Q3_K_S"},
   {"label":"MMLU (knowledge) · Q4_K_M","v":1.07,"quant":"Q4_K_M"},
   {"label":"HellaSwag (completion) · Q3_K_S","v":0.6,"quant":"Q3_K_S"},
   {"label":"HellaSwag (completion) · Q4_K_M","v":0.16,"quant":"Q4_K_M"}]},
 "encoding":{
   "y":{"field":"label","type":"nominal","title":null,
        "sort":["GSM8K (arithmetic) · Q3_K_S","GSM8K (arithmetic) · Q4_K_M","MMLU (knowledge) · Q3_K_S","MMLU (knowledge) · Q4_K_M","HellaSwag (completion) · Q3_K_S","HellaSwag (completion) · Q4_K_M"]},
   "x":{"field":"v","type":"quantitative","title":"accuracy points lost","axis":{"grid":true}}},
 "layer":[
   {"mark":{"type":"bar"},"encoding":{"color":{"field":"quant","type":"nominal","title":null,"scale":{"domain":["Q4_K_M","Q3_K_S"],"range":["#2a78d6","#eb6834"]}}}},
   {"mark":{"type":"text","align":"left","dx":8,"fontWeight":600},
    "encoding":{"text":{"field":"v","type":"quantitative","format":".2~f"}}}]}
```

One honesty note on that table: Q5_K_M scores 78.54 on GSM8K against the F16 baseline's 77.63. Quantization did not make the model better at arithmetic. That is benchmark noise, and it is a useful reminder that sub-point differences in these tables mean nothing.

On the GPU-serving side, Red Hat/Neural Magic's [half-million-evaluation study](https://developers.redhat.com/articles/2024/10/17/we-ran-over-half-million-evaluations-quantized-llms) found all schemes recovering over 99% of baseline average on OpenLLM v1, with HumanEval recovery at **99.9% for 8-bit and 98.9% for 4-bit**. Their 4-bit W4A16 results drop more on AIME and GPQA-Diamond than elsewhere, which is the same reasoning-first pattern.

## The ladder

**8-bit is close to free.** Q8_0 moved perplexity by 0.01 and every task score by less than 0.2 points in the table above. Mean KLD around 0.003. If you have the memory, stop thinking about it.

**4-bit is the sweet spot, and it is not free.** Expect roughly 1–3 points on reasoning-heavy tasks and near-zero on everything else. This is the default for a reason.

**3-bit is where reasoning starts to break** while the model still sounds completely fine. This is the dangerous tier, because the failure is invisible in chat and shows up in arithmetic, tool arguments, and long code edits.

**Sub-3-bit is a different proposition.** Unsloth's [Aider Polyglot runs on DeepSeek V3.1](https://unsloth.ai/docs/basics/dynamic-3.0-ggufs/unsloth-dynamic-ggufs-on-aider-polyglot) put real numbers on it:

| Build | Disk | Aider pass-2 (non-reasoning) |
|---|---|---|
| Full precision | 671 GB | 71.6% |
| Dynamic 4-bit | 387 GB | 69.7% |
| Dynamic 3-bit | 300 GB | 68.4% |
| Dynamic 2-bit | 255 GB | 65.8% |
| Dynamic 1-bit | 206 GB | 55.7% |

```vega-lite Read down the bars: the fall is gentle to 2-bit, then it drops. The knee sits just below 2-bit, where 49 GB of savings costs 10 points. | Source: Unsloth, Aider Polyglot runs on DeepSeek V3.1 dynamic GGUFs (unsloth.ai/docs/basics/dynamic-3.0-ggufs/unsloth-dynamic-ggufs-on-aider-polyglot).
{"title":{"text":"DeepSeek V3.1: Aider Polyglot pass-2 by bit depth","subtitle":"Unsloth dynamic GGUFs, non-reasoning mode. Bars in bit-depth order, not rank order."},
 "height":{"step":46},
 "data":{"values":[
   {"build":"Full precision (671 GB)","v":71.6},
   {"build":"Dynamic 4-bit (387 GB)","v":69.7},
   {"build":"Dynamic 3-bit (300 GB)","v":68.4},
   {"build":"Dynamic 2-bit (255 GB)","v":65.8},
   {"build":"Dynamic 1-bit (206 GB)","v":55.7}]},
 "encoding":{
   "y":{"field":"build","type":"nominal","title":null,
        "sort":["Full precision (671 GB)","Dynamic 4-bit (387 GB)","Dynamic 3-bit (300 GB)","Dynamic 2-bit (255 GB)","Dynamic 1-bit (206 GB)"]},
   "x":{"field":"v","type":"quantitative","title":"Aider Polyglot pass-2 (%)","axis":{"grid":true}}},
 "layer":[
   {"mark":{"type":"bar"},"encoding":{"color":{"field":"build","type":"nominal","legend":null}}},
   {"mark":{"type":"text","align":"left","dx":8,"fontWeight":600},
    "encoding":{"text":{"field":"v","type":"quantitative","format":".1f"}}}]}
```

Going 4-bit → 2-bit costs 3.9 points and saves 132 GB. Going 2-bit → 1-bit costs 10.1 points and saves 49 GB. The curve has a knee and it sits just below 2-bit. Unsloth's own [Dynamic 3.0 documentation](https://unsloth.ai/docs/basics/dynamic-3.0-ggufs) says the same thing more bluntly: below their `UD-Q2_K_XL` tier, models degrade badly on tool-calling and agentic use, loop, and return empty responses.

My read: sub-3-bit only makes sense on models large enough that the alternative is not running the model at all. A 1-bit 400B beats a 4-bit 30B on most work. A 1-bit 30B is worse than a 4-bit 8B and you should not build anything on it.

## What quantization buys beyond capacity

Decoding one token requires reading every weight the token touches out of memory. That makes decode memory-bandwidth-bound rather than compute-bound, which is the mechanism [/prefill-vs-decode](/prefill-vs-decode) covers. Halving the bytes per weight halves the bytes read per token, so quantization buys throughput on the same hardware, not only the ability to load the model.

The Llama-3.1-8B CPU measurements in [Kurt's paper](https://arxiv.org/abs/2601.14277) show generation going from **2.83 tok/s at F16 to 5.12 at Q4_K_M and 9.91 at Q3_K_S** on a dual Xeon 8488C. I trust the direction and the rough magnitude; I do not trust the fine ordering, since Q5_0 beats Q4_K_S in that same table, which cannot be a bandwidth effect and is more likely kernel quality or thread contention. On GPUs the story is cleaner, with [Neural Magic reporting](https://developers.redhat.com/articles/2024/10/17/we-ran-over-half-million-evaluations-quantized-llms) ~2.4× single-stream speedup for W4A16 and ~1.8× for W8A8.

## What it does not shrink: the KV cache

Weight quantization does nothing to the KV cache. Cache size scales with context length, batch size, and attention-layer count, and at long context it can rival or exceed the weights. A model that fits at 4-bit with a 4K context may not fit at 128K.

The lever is separate. llama.cpp and vLLM both quantize K and V independently. On the quality side, a [measurement on Qwen 2.5 Coder 7B](https://smcleod.net/2024/12/bringing-k/v-context-quantisation-to-ollama/) moved perplexity from 8.3891 to 8.3934 going from f16 to q8_0 KV, a change of 0.0043. That is nothing, and it halves the cache. The same write-up puts an 8B model's 32K cache at ~6 GB f16, ~3 GB q8_0, ~2 GB q4_0.

q4_0 KV is a real trade rather than a free one, and its cost is architecture-dependent — reported deltas span roughly -0.7% to +3% perplexity depending on the model. Run `Q8_0` KV by default and treat `q4_0` as a long-context-only measure you verify on your own workload. Note also that quantized KV wants a Flash Attention path with dequant in-kernel; without it you may lose more speed than the memory is worth.

## Picking a format for your runtime

The serving stack decides this more than quality does.

| Runtime | Load this | Don't bother with |
|---|---|---|
| llama.cpp / Ollama / LM Studio | GGUF `UD-Q4_K_XL` or `Q4_K_M`; `Q5_K_M` if memory allows | AWQ, GPTQ, NF4 (not loadable) |
| vLLM on Ampere/Ada/Hopper | AWQ or compressed-tensors W4A16 for latency; FP8 W8A8 on Ada/Hopper for throughput | bitsandbytes for serving — it loads, it is slow |
| vLLM on Turing | GPTQ (AWQ needs Turing+, Marlin has gaps) | FP8, which needs Ada or newer |
| MLX on Apple Silicon | MLX 4-bit or 6-bit community builds; mixed-precision variants where published | GGUF, unless you specifically want llama.cpp |

vLLM's [hardware compatibility matrix](https://docs.vllm.ai/en/latest/features/quantization/) is worth reading before you download 200 GB of the wrong thing: AWQ needs Turing or newer, llm-compressor FP8 needs Ada or Hopper, and bitsandbytes works nearly everywhere while being the wrong choice for serving nearly everywhere.

```d2 Two questions decide the download, and neither is about quality: which runtime you serve on, then which GPU generation it sits on. Source: vLLM quantization compatibility matrix.
direction: down

q1: WHICH RUNTIME? {
  style: { stroke: "#6b6459"; fill: transparent; stroke-width: 1; font-size: 22 }
}

gguf: GGUF\n\nUD-Q4_K_XL or Q4_K_M\nDynamic bits per layer {
  style: { fill: "#e0f4ec"; stroke: "#1baf7a"; stroke-width: 2; font-size: 22 }
}

mlx: MLX\n\n4-bit or 6-bit\nUnified memory, Apple only {
  style: { fill: "#e0f4ec"; stroke: "#1baf7a"; stroke-width: 2; font-size: 22 }
}

q2: WHICH GPU\nGENERATION? {
  style: { fill: "#fbe8de"; stroke: "#eb6834"; stroke-width: 2; font-size: 22 }
}

q1 -> gguf: llama.cpp\nOllama { style: { stroke: "#6b6459"; font-size: 20 } }
q1 -> q2: vLLM / TGI { style: { stroke: "#eb6834"; stroke-width: 2; font-size: 20 } }
q1 -> mlx: Apple Silicon { style: { stroke: "#6b6459"; font-size: 20 } }

turing: Turing\n\nGPTQ only\nNo AWQ kernels {
  style: { fill: "#e4edf9"; stroke: "#2a78d6"; stroke-width: 2; font-size: 22 }
}

ampere: Ampere\n\nAWQ / W4A16\nThe common default {
  style: { fill: "#e4edf9"; stroke: "#2a78d6"; stroke-width: 2; font-size: 22 }
}

hopper: Ada+\n\nFP8 W8A8\nNative FP8 tensor cores {
  style: { fill: "#e4edf9"; stroke: "#2a78d6"; stroke-width: 2; font-size: 22 }
}

q2 -> turing { style: { stroke: "#eb6834"; stroke-width: 2 } }
q2 -> ampere { style: { stroke: "#eb6834"; stroke-width: 2 } }
q2 -> hopper { style: { stroke: "#eb6834"; stroke-width: 2 } }
```

MLX quantizes with group sizes of 64 for 4/6-bit and 32 for 2/3-bit, and the community convention is to keep embeddings and the final projection at higher width than the body — the same sensitivity principle as dynamic GGUF, applied by hand. Apple Silicon's practical constraint is that MLX and GGUF are separate ecosystems, so the model you want may only exist in one of them on any given day.

## What I'd actually do

Take the largest model that fits at 4-bit dynamic with room for a full-context KV cache at q8_0, and prefer a dynamic build over a uniform one at equal file size, because the KLD data says you get it for free. Reach below 3-bit only when the model is large enough that the alternative is not running it. Test on your own reasoning and tool-calling traffic rather than on perplexity, because perplexity is the number that will tell you everything is fine right up until the agent starts mangling JSON arguments.

Related: [/local-inference-hardware](/local-inference-hardware) for what fits on what, [/prefill-vs-decode](/prefill-vs-decode) for why fewer bytes per token means faster decode, and [/context-engineering-for-coding-agents](/context-engineering-for-coding-agents) for keeping the context small enough that the KV cache question stops being the binding one.
