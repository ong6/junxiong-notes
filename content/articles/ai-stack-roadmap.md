---
title: The AI stack, one constraint per layer
description: A roadmap of AI from power to product, covering what each layer runs short of, what to learn there, and how image, voice and world models differ.
date: 2026-10-12
updated: 2026-10-20
category: AI systems
toc: false
tags: [roadmap, ai-stack, hardware, inference, post-training, evals, agents]
---

Every layer of the AI stack is organised around something it is short of, and the shortage usually starts lower down. Chips ran out of memory bandwidth, so inference engines batch and cache. The web ran out of good text, so labs buy expert tasks and build RL environments. Models ran out of context, so harnesses decide what goes in.

I use that as my map of the field. When a new product, layer or job title appears, I ask what it is short of and which layer caused the shortage. Tools turn over every few months. The shortages are physical or economic, so they last, and most tools are built around one of them.

This post walks the ten layers from the power plant to the product, with evals, gateways and safety running beside them. Each layer gets the number that shows its constraint, the terms worth learning, what changed in 2025 and 2026, where to go deeper, and one question you should be able to answer before moving on. Products, prices and figures are as of October 2026. The companies building each layer, and who has been buying them, are in the sister post, [who builds the AI stack](/who-builds-the-ai-stack).

```stack Ten layers, bottom-up, each with what it runs short of. Models are built once and served on every request, on the same infrastructure. Evals and gateways run beside the layers they serve, and safety runs across all of them. Choose a layer to jump to its section.
ai-stack-layers
```

## Infrastructure

The bottom four layers are shared: the same power, chips, racks and money serve both training and serving.

### Power and sites

A frontier campus is bought in gigawatts, and the scarce input is steady power delivered to one site on a schedule. A Blackwell NVL72-class rack draws roughly 120–140 kW, and Microsoft designed its Fairwater sites for about 140 kW per rack ([Microsoft](https://blogs.microsoft.com/blog/2025/11/12/infinite-scale-the-architecture-behind-the-azure-ai-superfactory/)). At that density, one gigawatt of IT load is about 7,000 racks. That is my arithmetic: 1 GW ÷ 140 kW.

Grid connections for loads that size take five years or more in PJM and Virginia ([Cleanview](https://cleanview.co/reports/behind-the-meter-data-centers/full-report/colossus)), so builders stopped waiting. xAI's Colossus 2 runs on about 1.3 GW of its own gas turbines with no utility power at all (same source), for roughly 946 MW of IT load ([Epoch](https://epoch.ai/data/ai-data-centers/directory/colossus-2)).

**Learn:** IT power vs facility power (PUE) · interconnection queues · behind-the-meter generation · rack density and direct-to-chip liquid cooling · 800 VDC distribution · load flexibility.

**What changed:** the IEA's April 2026 update put datacentre electricity growth at 17% in 2025, to about 485 TWh, with gas-turbine orders up 70% ([IEA](https://www.iea.org/reports/key-questions-on-energy-and-ai/executive-summary)). Chip deals are now quoted in power: OpenAI–AMD is 6 GW ([OpenAI](https://openai.com/index/openai-amd-strategic-partnership/)) and OpenAI–Broadcom 10 GW ([OpenAI](https://openai.com/index/openai-and-broadcom-announce-strategic-collaboration/)).

**Go deeper:** the IEA's [*Energy and AI*](https://www.iea.org/reports/energy-and-ai); Epoch's [data centre hub](https://epoch.ai/data/data-centers).

**Self-test:** why would a new AI campus build its own gas turbines when the grid is next door?

### Chips and memory

Compute has outrun memory. Microsoft's Maia 200 offers over 10 PFLOPS of FP4 against 7 TB/s of HBM, the high-bandwidth memory stacked beside the chip, roughly 1,400 operations for every byte it can fetch ([Microsoft](https://blogs.microsoft.com/blog/2026/01/26/maia-200-the-ai-accelerator-built-for-inference/)). Generating a token does one or two operations per weight byte, so during decode almost all of that arithmetic sits idle, waiting on memory. I worked through the same roofline in [prefill vs decode](/prefill-vs-decode): bandwidth sets tokens per second, and capacity sets which models fit.

That one ratio explains most of the layer. HBM sits on a CoWoS interposer beside the logic die, which makes HBM and CoWoS the supply chokepoints, and the IEA expects the HBM shortage to last until at least the end of 2027 ([IEA](https://www.iea.org/reports/key-questions-on-energy-and-ai/executive-summary)). Four-bit formats exist to halve the bytes per weight. Inference chips lean on SRAM because that is where bandwidth is cheap: Nvidia licensed Groq's LPU design in December 2025 ([Groq](https://groq.com/newsroom/groq-and-nvidia-enter-non-exclusive-inference-technology-licensing-agreement-to-accelerate-ai-inference-at-global-scale)) and put the Groq 3 LPX rack into full production in August 2026 ([Nvidia](https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Groq-3-LPX-Now-in-Full-Production-With-World-Class-Speed-for-Agentic-AI/default.aspx)).

**Learn:** roofline and arithmetic intensity · HBM capacity and bandwidth · CoWoS packaging · FP8, MXFP4 and NVFP4 · custom ASICs (TPU, Trainium, Maia) against GPUs · why CUDA is a moat.

**What changed:** custom silicon reached multi-gigawatt scale. Anthropic signed a multi-gigawatt TPU deal with Google and Broadcom starting in 2027 ([Anthropic](https://www.anthropic.com/news/google-broadcom-partnership-compute)), and Google split its eighth-generation TPU into a training part (8t) and an inference part (8i) ([Google Cloud](https://cloud.google.com/tpu)).

**Go deeper:** Google DeepMind's [*How to Scale Your Model*](https://jax-ml.github.io/scaling-book/); Chris Miller's *Chip War* for the supply chain.

**Self-test:** why doesn't a chip with twice the FLOPs generate tokens twice as fast?

### Racks and networks

Bandwidth drops at every boundary a byte crosses. A Blackwell GPU reads its own HBM at about 8 TB/s. It reaches the other 71 GPUs in an NVL72 rack at 1.8 TB/s over NVLink, and the next rack at about 0.1 TB/s through an 800 Gb/s network card. The HBM and NVLink figures are [Nvidia's](https://www.nvidia.com/en-us/data-center/gb200-nvl72/); the network figure is unit conversion. A model whose weights and KV cache (the stored attention state of each conversation) fit inside one fast domain runs very differently from one that crosses the slow link on every step.

That is why vendors stopped selling chips. Nvidia sells Vera Rubin as a 72-GPU rack and a five-rack POD ([Nvidia](https://nvidianews.nvidia.com/news/nvidia-vera-rubin-platform)), and AWS sells Trainium3 as a 144-chip UltraServer ([Amazon](https://www.aboutamazon.com/news/aws/trainium-3-ultraserver-faster-ai-training-lower-cost)). What used to be facility detail, such as copper reach, optics, power delivery and liquid cooling, now decides how large a model or a batch runs efficiently.

**Learn:** scale-up vs scale-out vs scale-across · NVLink and TPU interconnect domains · InfiniBand vs Ethernet (Ultra Ethernet) · mapping tensor and expert parallelism onto the fabric · co-packaged optics · 800 VDC racks.

**What changed:** Nvidia's co-packaged-optics Ethernet switch entered production in May 2026 ([Nvidia](https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Vera-Rubin-Ramps-Into-Full-Production-to-Power-Agentic-AI-Factories-Worldwide/default.aspx)). Microsoft runs Fairwater sites about 700 miles apart as one "AI superfactory" over a dedicated network ([Microsoft](https://blogs.microsoft.com/blog/2025/11/12/infinite-scale-the-architecture-behind-the-azure-ai-superfactory/)).

**Go deeper:** the sharding and networking chapters of [*How to Scale Your Model*](https://jax-ml.github.io/scaling-book/).

**Self-test:** why can one 72-GPU rack serve a large mixture-of-experts model more cheaply than nine 8-GPU servers?

### Cloud and capital

A GPU is a fast-depreciating asset bought with borrowed money. Epoch's site estimates imply roughly $35–40B of capex per gigawatt of IT load: $35.8B for Colossus 2's 946 MW ([Epoch](https://epoch.ai/data/ai-data-centers/directory/colossus-2)) and $15.9B for Stargate Abilene's 421 MW ([Epoch](https://epoch.ai/data/ai-data-centers/directory/openai-stargate-abilene)). Over a four-to-five-year hardware life that is $7–10B a year of depreciation per gigawatt, by my arithmetic, whether or not the chips are busy.

So this layer behaves like project finance. Owners want multi-year take-or-pay contracts, and they care about goodput, meaning the work that survives failures. Failures are constant at this scale: Meta's Llama 3 run saw 419 unexpected interruptions in 54 days on 16,384 H100s, about 78% of them hardware ([Llama 3 paper](https://arxiv.org/abs/2407.21783)).

**Learn:** hyperscaler vs neocloud vs lab-owned clusters · on-demand, reserved and take-or-pay contracts · depreciation and useful life · MFU and goodput · Slurm, Kubernetes and Ray · H100-equivalents as a unit.

**What changed:** big-tech capex passed $400B in 2025 and is expected to rise about 75% in 2026 ([IEA](https://www.iea.org/reports/key-questions-on-energy-and-ai/executive-summary)). Vendors now finance their customers. In August 2026 Nvidia signed agreements with six asset managers for platforms meant to mobilise more than $500B ([Nvidia](https://nvidianews.nvidia.com/news/nvidia-partners-with-apollo-blackrock-blackstone-brookfield-goldman-sachs-and-kkr-to-establish-ai-compute-infrastructure-financing-platforms-to-mobilize-over-500-billion-of-third-party-capital)), and AMD gave OpenAI warrants for up to 160M AMD shares ([OpenAI](https://openai.com/index/openai-amd-strategic-partnership/)).

**Go deeper:** SemiAnalysis's [ClusterMAX 3.0](https://newsletter.semianalysis.com/p/clustermax-30-the-industry-standard) rating of GPU clouds; section 3.3 of the [Llama 3 paper](https://arxiv.org/abs/2407.21783) on failures at scale.

**Self-test:** why would a GPU cloud take a three-year contract at a lower price over renting the same GPUs by the hour?

```notes My notes on infrastructure
local-inference-hardware: Chips and memory
predicting-ai-stocks-with-economics: Cloud and capital
```

## Models

These three layers run once per model, and each is short of something different: good text, affordable compute and a training signal.

### Data

Compute keeps growing, and good human text does not. Epoch puts the effective stock of quality public text at about 300T tokens, with a wide 100T–1,000T interval, and expects it to be fully used between 2026 and 2032 ([Epoch](https://epoch.ai/blog/will-we-run-out-of-data-limits-of-llm-scaling-based-on-human-generated-data)). Quality filters already throw away about 90% of a web crawl ([Nemotron-CC](https://arxiv.org/abs/2412.02595)), and 2026 runs train on 20–45T tokens: 20T for Nemotron 3 Ultra ([arXiv](https://arxiv.org/abs/2606.15007)) and 33T for DeepSeek-V4-Pro ([arXiv](https://arxiv.org/abs/2606.19348)).

So the next useful token has to be bought, manufactured or made executable. Bought means licences and expert-written data. Manufactured means rewriting real documents into new forms. Executable means an RL environment: a task, a grader and a sandbox to act in. Epoch reports RL tasks selling for $200–2,000 each and a high-fidelity Slack clone for about $300k ([Epoch](https://epoch.ai/gradient-updates/state-of-rl-envs)). My read is that the price only makes sense because one good task trains across thousands of attempts.

**Learn:** Common Crawl, extraction and filters · deduplication (MinHash) · quality classifiers (FineWeb-Edu, DCLM) · data mixing and decontamination · synthetic rephrasing · expert human data · RL environments and verifiers · provenance and licensing.

**What changed:** the legal question moved from *whether* you trained to *how you got* the data. The $1.5B Bartz v. Anthropic settlement over pirated books received final approval on 20 July 2026 ([Authors Alliance](https://www.authorsalliance.org/2026/07/21/bartz-v-anthropic-settlement-receives-final-approval/)). The first appellate ruling on training, Thomson Reuters v. ROSS, found against fair use on 29 September 2026, though for a narrow, non-generative tool ([Ballard Spahr](https://www.ballardspahr.com/insights/alerts-and-articles/2026/10/third-circuit-addresses-fair-use-in-ai-training-but-leaves-generative-ai-questions-unresolved)). Since 15 September 2026, Cloudflare blocks training bots by default on new domains' ad-bearing pages ([Cloudflare](https://developers.cloudflare.com/changelog/post/2026-07-01-ai-traffic-options/)).

**Go deeper:** Hugging Face's [FineWeb write-up](https://huggingface.co/spaces/HuggingFaceFW/blogpost-fineweb-v1); Epoch's [FAQ on RL environments](https://epoch.ai/gradient-updates/state-of-rl-envs).

**Self-test:** why would a lab pay $2,000 for a single task when the web is free?

### Pretraining

Training compute is about 6 × active parameters × tokens, and loss falls only as a power law in compute ([Chinchilla](https://arxiv.org/abs/2203.15556) is the canonical fit). Each equal step of improvement costs multiplicatively more chip-months, so the layer is a fight over the cost of a useful operation.

Mixture-of-experts is the biggest lever, because a token only pays for the experts it visits. DeepSeek-V4-Pro has 1.6T parameters and activates 49B of them, about 3% ([arXiv](https://arxiv.org/abs/2606.19348)). Memory still has to hold all 1.6T, so MoE moves cost from training compute into serving memory, which becomes the inference layer's problem. Precision is the next lever: Nemotron 3 Ultra was pretrained in NVFP4 at 550B parameters on 20T tokens, and its loss stayed within 0.4% of the BF16 segments ([arXiv](https://arxiv.org/abs/2606.15007)). The Muon optimizer, about twice as compute-efficient as AdamW ([Moonlight](https://arxiv.org/abs/2502.16982)), has spread from Kimi to DeepSeek-V4.

**Learn:** scaling laws · MoE, total vs active parameters · attention variants (GQA, MLA, sparse, hybrid linear) · data, tensor, pipeline, expert and context parallelism · FP8 and FP4 training · Muon · multi-token prediction.

**What changed:** attention went sparse or hybrid to make million-token context affordable. At 1M tokens, DeepSeek-V4 needs 27% of the per-token FLOPs and 10% of the KV cache of V3.2 ([arXiv](https://arxiv.org/abs/2606.19348)).

**Go deeper:** Hugging Face's [Ultra-Scale Playbook](https://huggingface.co/spaces/nanotron/ultrascale-playbook); the [Olmo 3 report](https://arxiv.org/abs/2512.13961), a fully open recipe from data to RL.

**Self-test:** why is a 1.6T-parameter MoE cheap to train per token but expensive to serve?

### Post-training

A pretrained model predicts text. Post-training turns it into something that follows instructions, uses tools and reasons. Since DeepSeek-R1 in January 2025 the main tool has been reinforcement learning with verifiable rewards ([arXiv](https://arxiv.org/abs/2501.12948)), and its constraint is that RL is bound by inference and its signal is sparse. Each training sample is a whole rollout, often run in a sandbox that has to boot and run tests, and it comes back with a few bits of reward. GRPO, the default algorithm family, learns only from groups of attempts whose rewards differ, so a task the model always passes or always fails teaches it nothing.

Dense signals are cheaper. On-policy distillation grades every token of the student's own attempt against a teacher, and Thinking Machines measured it at 9–30× cheaper than continuing off-policy fine-tuning ([Thinking Machines](https://thinkingmachines.ai/blog/on-policy-distillation/)). The 2026 recipe follows: use RL to build specialists, then distil them into one model. DeepSeek-V4 trains maths, code and agent specialists and merges them this way ([arXiv](https://arxiv.org/abs/2606.19348)).

**Learn:** supervised fine-tuning · RLHF and DPO · RLVR and the GRPO family (DAPO, GSPO) · verifiers, reward models and rubric graders · reward hacking · reasoning effort and test-time compute · on-policy distillation · LoRA.

**What changed:** post-training started doing more of the work. Z.ai says scaling post-training is all it did for GLM-5.3, on the same base model as GLM-5.2 ([Interconnects](https://www.interconnects.ai/p/glm-53-how-chinese-labs-keep-stride)). Reward hacking also became a safety problem. Anthropic found that models which learned to hack real coding environments generalised to sabotage, and it now uses inoculation prompting to stop that ([Anthropic](https://www.anthropic.com/research/emergent-misalignment-reward-hacking)). Customer fine-tuning moved to open weights. OpenAI stopped admitting new organisations to self-serve fine-tuning on 7 May 2026 and stops new jobs on 6 January 2027 ([OpenAI](https://developers.openai.com/api/docs/deprecations)). Meanwhile Thinking Machines showed LoRA matching full fine-tuning in RL even at rank 1 ([Thinking Machines](https://thinkingmachines.ai/blog/lora/)).

**Go deeper:** Nathan Lambert's [*RLHF Book*](https://rlhfbook.com/); Thinking Machines' [on-policy distillation](https://thinkingmachines.ai/blog/on-policy-distillation/).

**Self-test:** why does GRPO learn nothing from a task the model always passes?

## Serving and product

These three run on every request, so whatever they cost repeats for as long as the product runs.

### Inference

Every new token re-reads the active weights plus that conversation's KV cache. Batching shares the weight read across every request in the batch, which is why hosted tokens are cheap, but each conversation's cache is its own. Llama 3 70B's cache is about 320 KiB per token at FP16, so a 32k-token conversation holds about 10 GB, and a few long agent sessions can fill a GPU by themselves. I did that arithmetic in [prefill vs decode](/prefill-vs-decode). Nearly every technique in this layer moves fewer bytes per useful token.

The list is long, and it all serves that goal: paged KV memory, prefix caching, quantisation, speculative decoding, sparse attention, and running prefill and decode on separate machines. The DistServe authors wrote in late 2025 that "almost every production-grade" serving framework now splits the two phases ([retrospective](https://hao-ai-lab.github.io/blogs/distserve-retro/)).

**Learn:** prefill vs decode, TTFT vs TPOT · KV cache and PagedAttention · continuous batching · prefix caching · quantisation · speculative decoding · disaggregated serving · cost per task.

**What changed:** the KV cache became a storage tier. In early 2025, 56.3% of DeepSeek's daily input tokens hit an on-disk KV cache ([DeepSeek](https://github.com/deepseek-ai/open-infra-index/blob/main/202502OpenSourceWeek/day_6_one_more_thing_deepseekV3R1_inference_system_overview.md)), and vLLM now offloads KV to host memory, files and peers ([vLLM](https://vllm.ai/blog/2026-09-10-tiered-kv-offloading)). The engines became companies: vLLM's creators raised a $150M seed as Inferact in January 2026 ([TechCrunch](https://techcrunch.com/2026/01/22/inference-startup-inferact-lands-150m-to-commercialize-vllm/)). And the price per token keeps falling at fixed capability, 9–900× a year by Epoch's count ([Epoch](https://epoch.ai/data-insights/llm-inference-price-trends)), while the cost of running frontier models rises 3–18× a year ([MIT FutureTech](https://arxiv.org/abs/2511.23455)). So I budget per task, not per token.

**Go deeper:** the [PagedAttention paper](https://arxiv.org/abs/2309.06180); the [inference chapter](https://jax-ml.github.io/scaling-book/inference/) of *How to Scale Your Model*.

**Self-test:** why does one 32k-token conversation reduce how many users a GPU can serve at once?

### Harness

A model acts only on what is in its context window, and its recall over that window degrades as the window fills. Chroma measured the degradation across 18 models, even on simple tasks ([Chroma](https://research.trychroma.com/context-rot)). The harness is the loop around the model, and its real job is choosing which tokens go in. It loads instructions and tool definitions only when needed, retrieves just in time, compacts or resets, and hands subtasks to subagents with clean windows. Anthropic's code-execution approach to MCP cut one workflow from 150,000 tokens to 2,000 ([Anthropic](https://www.anthropic.com/engineering/code-execution-with-mcp)).

The second constraint is blast radius. An agent can damage whatever it can reach, and Anthropic reports that users approved about 93% of permission prompts ([Anthropic](https://www.anthropic.com/engineering/how-we-contain-claude)). Asking before every step stops working as a control, so sandboxes have to do that job instead.

**Learn:** the agent loop and tool calls · context engineering, compaction and resets · MCP and A2A · progressive disclosure (Agent Skills, AGENTS.md) · subagents · sandboxes and permissions · memory.

**What changed:** MCP and AGENTS.md moved to the Linux Foundation's Agentic AI Foundation in December 2025 ([Linux Foundation](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)). MCP's July 2026 spec dropped session state from its core ([MCP](https://blog.modelcontextprotocol.io/posts/2026-07-28/)). Harnesses also became hosted products, from Claude Managed Agents ([Anthropic](https://www.anthropic.com/engineering/managed-agents)) to OpenAI's dots ([OpenAI](https://openai.com/index/introducing-dots/)).

**Go deeper:** Anthropic's [effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents).

**Self-test:** why can giving an agent more tools make it worse at its task?

### Apps

Output is worth something only once someone has checked it. An AI product's value is capped by how cheap that check is and how fast the answer feels. Coding broke out first because tests and a running app make checking cheap, and on OpenRouter, programming passed half of all tokens during 2025 ([OpenRouter](https://openrouter.ai/state-of-ai)). The rest of the product layer is moving the same way: interfaces the user can inspect instead of walls of text, and models trained to start answering sooner. OpenAI says GPT-6 Instant starts answering 44% sooner on web-search questions ([OpenAI](https://openai.com/index/gpt-6-for-everyone/)).

**Learn:** time to first token and streaming · generative UI · apps inside chat (MCP Apps) · coding agents · delegation and background agents · realtime voice · agentic payments.

**What changed:** chat became a platform. MCP Apps became the first official MCP extension in January 2026, supported by ChatGPT, Claude, Goose and VS Code ([MCP](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/)). Delegation products now give the agent its own computer that the user can audit ([OpenAI](https://openai.com/index/introducing-dots/)).

**Go deeper:** Google Research on [generative UI](https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/).

**Self-test:** why did coding agents break out before legal or finance agents?

```notes My notes on serving and product
prefill-vs-decode: Inference
quantization-what-it-costs: Inference
context-engineering-for-coding-agents: Harness
agent-integrations-in-large-orgs: Harness
agent-harnesses: Harness
four-predictions-for-software-teams: Apps
anthropic-verification-layers: Apps
```

## Beside the stack

Three concerns run beside the layers rather than inside them. Gateways and evals each serve a few layers near the top, and safety spans all ten.

### Gateways and observability

Model prices differ by orders of magnitude, and at the time of writing (October 2026) a cached prefix costs a fraction of normal input: up to 90% off on GPT-6 ([OpenAI](https://openai.com/index/better-prompt-caching-for-gpt-6/)), and 0.05× the input price for Claude Opus and Sonnet 5.5 cache reads ([Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)). Cost, latency and quality are therefore decided call by call: which model, which cached prefix, how many turns. You can only steer that from a point that sees every call, a gateway or router, and you can only debug it from a record of what happened, a trace. This runs beside the layers rather than inside them: it sits on every call, but no layer is built on top of it.

**Learn:** traces and spans (OpenTelemetry GenAI conventions) · gateways and model routers · cascades that try a cheap model first · cache hit rate · cost per successful task.

**What changed:** routing across providers became normal. The a16z and OpenRouter study of more than 100 trillion tokens found open-weight models reached about a third of usage in 2025 ([OpenRouter](https://openrouter.ai/state-of-ai)). Gateways and tracing tools also became acquisition targets, which the [sister post](/who-builds-the-ai-stack) covers.

**Go deeper:** the OpenTelemetry [GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/), the shared vocabulary for traces of model and agent calls.

**Self-test:** when an agent's bill doubles overnight, which number do you check first?

### Evals

A benchmark score is a task set, a grader and a budget. It measures the model only while the tasks are unseen, the cheap grader agrees with an expert, and the budget and harness stay fixed, and optimisation erodes all three. OpenAI stopped reporting SWE-bench Verified in February 2026. It had found that 59.4% of 138 audited hard tasks had tests that reject correct fixes, and that the frontier models it tested could reproduce the reference patches ([OpenAI](https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/)). METR found maintainers would merge only about half of agent PRs that pass the tests ([METR](https://metr.org/notes/2026-03-10-many-swe-bench-passing-prs-would-not-be-merged-into-main/)), and Anthropic measured a 6-point swing on Terminal-Bench 2.0 from container settings alone ([Anthropic](https://www.anthropic.com/engineering/infrastructure-noise)).

Evals now also sit next to post-training, because an eval environment and an RL environment are the same object: Terminal-Bench's Harbor runs both eval runs and RL rollouts ([Terminal-Bench](https://www.tbench.ai/news/announcement-2-0)). A grader good enough to score a model is good enough to train on, and once a lab trains on it, it stops being a fair score.

**Learn:** saturation and contamination · pass@k vs pass^k · budgets and harnesses · LLM-as-judge and judge alignment · arenas · agentic evals · time horizons · error analysis for product evals.

**What changed:** ARC-AGI-3 launched in March 2026 with 135 interactive games: humans score 100% and frontier AI 0.51% ([ARC Prize](https://arcprize.org/blog/arc-agi-3-launch)). METR's time horizons doubled about every 131 days after 2023 ([METR](https://metr.org/blog/2026-1-29-time-horizon-1-1/)), until METR flagged horizons above 16 hours as unreliable ([METR](https://metr.org/time-horizons)).

**Go deeper:** Hamel Husain and Shreya Shankar's [evals FAQ](https://hamel.dev/blog/posts/evals-faq/); METR's [long-tasks paper](https://arxiv.org/abs/2503.14499).

**Self-test:** why did OpenAI stop reporting SWE-bench Verified?

### Safety

Safety is a band across the stack, not a layer. Deployment risk is the likelihood of a failure times its blast radius; training pushes the first down, while capability and access push the second up ([Anthropic](https://www.anthropic.com/engineering/how-we-contain-claude)). The measurements behind release decisions get harder to trust as models notice they are being tested. Anthropic's Opus 5.5 system card reports unverbalised eval awareness in 36% of audit transcripts, against 0.4% of real Claude Code sessions ([system card](https://www-cdn.anthropic.com/fc1b44717c85dc068bc6ba5024219938094694bd/Claude%20Opus%205.5%20System%20Card.pdf)). In April 2026 Anthropic withheld Claude Mythos Preview from general release on cyber-capability grounds and gave it to defenders instead ([Anthropic](https://red.anthropic.com/2026/mythos-preview/)).

**Learn:** responsible scaling policies · interpretability and attribution graphs · chain-of-thought monitoring · containment and prompt injection · eval awareness · the EU AI Act.

**Go deeper:** Anthropic's [*On the Biology of a Large Language Model*](https://transformer-circuits.pub/2025/attribution-graphs/biology.html); the cross-lab paper on [chain-of-thought monitorability](https://arxiv.org/abs/2507.11473).

**Self-test:** why do safety evals get less reliable as models get more capable?

```notes My notes beside the stack
prompt-caching-across-harnesses: Gateways and observability
opus-orchestrating-gpt-agents: Evals
```

## The same stack, six kinds of model

The infrastructure layers do not care what a model produces. Data through inference do, because each kind of model is short of something different.

| Model | Core architecture | Data it lacks | Inference is limited by |
|---|---|---|---|
| Text | Sparse MoE transformer, one token at a time | Good human text | Memory bandwidth and the KV cache |
| Image | Diffusion transformer trained with flow matching | Accurate captions, licensed images | Denoising steps |
| Video | Video diffusion transformer, often with joint audio | Clean, motion-rich clips | Resolution × frames |
| Voice | Full-duplex speech models | Real conversations where people overlap | The ~200 ms gap between human turns |
| World models | Video generation conditioned on actions | Footage labelled with actions | Frame rate, about one GPU per stream |
| Robotics | Vision-language model plus an action head | Hours with a robot or a person | Control rate on the robot |

**Image and video are a step count.** A diffusion model runs its whole network many times per output, so cutting steps by distillation is the main speed lever. Video multiplies the work. Using Wan's video encoder settings ([arXiv](https://arxiv.org/abs/2503.20314)), a 5-second 720p clip is about 75k tokens against 4k for a 1024² image. That is about 18× the tokens and roughly 340× the attention per step. Providers price per second of output: Gemini Omni 1.1 Flash launched in August 2026 at about $0.10 a second at 720p ([Google](https://blog.google/innovation-and-ai/technology/developers-tools/build-with-gemini-omni-1-1-flash/)).

**Voice is a latency budget.** People leave about 200 ms between turns. Moshi targets 160–200 ms ([arXiv](https://arxiv.org/abs/2410.00037)), and ElevenLabs claims about 100 ms to audible speech for Eleven v4 Turbo ([ElevenLabs](https://elevenlabs.io/blog/eleven-v4)). Transcribed speech is plentiful, but recordings of two people talking over each other are not. That is why NVIDIA's PersonaPlex trained on 1,217 hours of real conversation plus synthetic data ([NVIDIA](https://research.nvidia.com/labs/adlr/personaplex/)).

**World models are video with a steering wheel.** Genie 3 generates 720p at 24 fps from user actions and stays consistent for "a few minutes" ([DeepMind](https://deepmind.google/blog/genie-3-a-new-frontier-for-world-models/)). World Labs' RTFM targets one H100 per stream ([World Labs](https://www.worldlabs.ai/blog/rtfm)). The scarce data is video with the actions attached, which games supply for free.

**Robotics pays for every hour.** Each hour of data needs a robot or a person. DROID took 50 collectors 12 months to gather 350 hours ([arXiv](https://arxiv.org/abs/2403.12945)). Generalist's GEN-1 trained on over 500k hours from wearable devices on humans, with no robot data in pretraining ([Generalist](https://generalistai.com/blog/gen-1)).

The interfaces are converging. Google's video flagship is now Gemini Omni rather than a new Veo ([model card](https://deepmind.google/models/model-cards/gemini-omni-flash/)), and Black Forest Labs trained FLUX 3 jointly on image, video and audio ([BFL](https://bfl.ai/blog/flux-3)). The pixels underneath still mostly come from diffusion, and Google's own card describes Omni as combining Gemini with its generative media models. "One model" is often a product boundary, not one network.

## Where I would start

My rule for using this map is to learn the layer your constraint comes from, which is usually somewhere below the one you work in.

If you build agents, learn inference: cache hits and batch size decide your bill and your latency. If you run inference, learn chips and memory, because bandwidth sets your ceiling, and then post-training, because RL is itself an inference workload, run in hundreds of thousands of sandboxes per cluster at the labs that publish it ([Hugging Face](https://huggingface.co/blog/sergiopaniego/rl-environments-2026)), and it looks nothing like chat traffic. If you train models, learn the data layer, since the next gain is more likely a task you can buy or build than a crawl you already have. If you work in infrastructure, the layer below is power, and it is the one layer nobody can speed up with software.
