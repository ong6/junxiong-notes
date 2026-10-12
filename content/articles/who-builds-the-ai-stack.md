---
title: Who builds the AI stack, and who is buying it
description: 158 AI companies placed on the stack and sorted by size, and why 2026's buyers were companies already on the same request path.
date: 2026-10-12
updated: 2026-10-12
category: AI systems
tags: [ai-stack, landscape, inference, evals, agents, hardware]
---

In 2026 the AI stack started consolidating along its request paths. Companies that already owned one step of a customer's request, such as the chip, the cloud, the database, the monitor or the payment, bought the AI specialist sitting next to them on that path. Stripe agreed to buy OpenRouter, the model router ([Stripe](https://stripe.com/newsroom/news/stripe-agrees-to-acquire-openrouter)). Dynatrace agreed to buy Arize, the eval and tracing company ([Dynatrace](https://www.dynatrace.com/news/press-release/dynatrace-to-acquire-arize/)). Nvidia agreed to buy Hugging Face, where developers pick the models its chips run ([Semafor](https://semafor.com/article/09/03/2026/nvidia-to-buy-hugging-face-for-nearly-13-billion)). Cloudflare, whose network already sits in front of websites, bought Replicate, a hosted inference service ([Cloudflare](https://www.cloudflare.com/en-gb/press/press-releases/2025/cloudflare-to-acquire-replicate-to-build-the-most-seamless-ai-cloud-for-developers/)). And SpaceX, which merged with xAI in February ([TechRepublic](https://techrepublic.com/article/news-spacex-cursor-acquisition/)), closed its purchase of Cursor in August ([Cursor](https://cursor.com/blog/joining-spacex)).

I wanted to see that on one page, so I placed 158 companies on the ten layers from [the roadmap](/ai-stack-roadmap). Evals and gateways, which run beside those layers, get columns of their own because whole companies live there. The chart opens with 39 of them: the companies that span the most layers and the ones this post discusses. Expand it to see all 158, choose a layer or a size to see everyone in it, or find a company by name. Choose **Deals** to see only the 19 companies in a deal. Eight of those 19 went to buyers that are not in the chart at all: an infrastructure fund, a data-security company, a database, a documentation platform, two network-security companies, a payments company and a monitoring company.

```span Each bar is the run of layers a company sells into, and the solid cell is its main layer. Long bars are companies that span the stack. | Source: company sites and deal announcements, linked from each row.
ai-stack
```

## How to read it

The main layer is where I judge a company to be strongest, by what it is known for and what it mostly sells. The tinted cells are other layers it sells into. A badge marks a deal: **→** and the buyer for an acquisition, drawn dashed while the sale is agreed but not closed, **↝** and the licensee for a licence-and-hire deal, and *shut* for a company that closed. Open any row for a one-line note and the source behind the placement.

Rows inside each layer are sorted by size. I use market cap for public companies, the last reported valuation for private ones, the deal price for acquired ones, and the parent's market cap for divisions such as AWS. Large is $50B and up, mid is $5–50B, and small is under $5B. 54 rows are not sized: 45 private companies that have not published a valuation, six non-profits or open projects, and three units of larger companies, whose notes name the parent. They show a dash instead of an estimate.

The selection is for relevance, not completeness. Every layer has at least six companies, and pretraining has the most (31) because each model type has its own labs. I picked several companies *because* of their deals, so the 19 rows carrying a deal badge are a list, not a rate. The data is a [YAML file in the site's repository](https://github.com/ong6/junxiong-notes/blob/main/content/data/ai-stack.yaml), and corrections are welcome as issues or pull requests.

Size and span go together. Eleven companies sell into four or more layers, and eight of them are worth more than $50B. The exceptions are Hugging Face, which Nvidia agreed to buy, Modal and Prime Intellect.

## Chipmakers are moving up

Nvidia has the longest bar. Its main layer is chips, but it also sells networking, a GPU cloud, open models in the Nemotron family, the NeMo training stack and the Dynamo serving stack. It went further up in the last ten months. It licensed Groq's inference-chip design and hired its founders in December 2025 ([Groq](https://groq.com/newsroom/groq-and-nvidia-enter-non-exclusive-inference-technology-licensing-agreement-to-accelerate-ai-inference-at-global-scale)). It bought SchedMD, the company behind the Slurm scheduler, the same month ([Nvidia](https://blogs.nvidia.com/blog/nvidia-acquires-schedmd/)). And it agreed to buy Hugging Face, where developers pick open models.

AMD is following the same path from a smaller base. It agreed to buy Taalas, an inference-chip startup, in August ([AMD](https://ir.amd.com/news-events/press-releases/detail/1296/amd-acquires-taalas-to-advance-compute-solutions-for-rapidly)) and World Labs in September. Qualcomm bought Modular, which makes a hardware-neutral inference engine ([NAND Research](https://www.nand-research.com/qualcomm-acquires-modular-for-its-hardware-agnostic-ai-software-layer/)).

My read is that the chipmakers' largest customers are now also their competitors. Google has TPUs, AWS has Trainium, Microsoft has Maia, and OpenAI is co-designing accelerators with Broadcom ([OpenAI](https://openai.com/index/openai-and-broadcom-announce-strategic-collaboration/)). A chip vendor stays the default by owning the software and the places where developers choose models, so a customer who switches chips loses more than the chip.

## Inference clouds are moving into training

The serving layer's bars stretch left, into post-training. Together AI, Fireworks AI and Modal all sell fine-tuning beside inference. Fireworks released its own model, Ember-1, post-trained from Kimi K3 to use fewer reasoning tokens ([Vercel](https://vercel.com/changelog/ember-1-from-fireworks-now-available-on-ai-gateway)). CoreWeave, a GPU cloud, bought Weights & Biases ([CoreWeave](https://coreweave.com/blog/coreweave-completes-acquisition-of-weights-biases)) and OpenPipe, whose RL fine-tuning now runs as a CoreWeave product ([CoreWeave](https://coreweave.com/news/coreweave-launches-first-publicly-available-serverless-reinforcement-learning-capability-to-build-reliable-ai-agents)). Thinking Machines came from the other side: it is a lab whose fine-tuning API, Tinker, now also serves its own Inkling model ([Thinking Machines](https://thinkingmachines.ai/tinker/)).

The price of a token at fixed capability falls 9–900× a year ([Epoch](https://epoch.ai/data-insights/llm-inference-price-trends)), so serving someone else's open model is the part of this layer that gets cheaper fastest. My read is that a model tuned on a customer's data keeps the customer where it was trained, and that matters more now OpenAI is leaving the market. It stopped admitting new organisations to self-serve fine-tuning in May and stops new jobs in January 2027 ([OpenAI](https://platform.openai.com/docs/deprecations)).

## Tooling is being absorbed by the platforms it plugs into

Gateways, tracing and evals changed hands faster than any other part of the chart:

| Company | What it did | Buyer | What the buyer already sells |
|---|---|---|---|
| Weights & Biases | Experiment tracking and evals | CoreWeave, 2025 | GPU cloud |
| Langfuse | Open-source tracing | ClickHouse, 2026 ([ClickHouse](https://clickhouse.com/blog/clickhouse-acquires-langfuse-open-source-llm-observability)) | Analytics database |
| Helicone | Gateway and observability | Mintlify, 2026 ([Mintlify](https://www.mintlify.com/blog/mintlify-acquires-helicone)) | Documentation platform |
| Promptfoo | Evals and red-teaming | OpenAI, agreed 2026 ([OpenAI](https://openai.com/index/openai-to-acquire-promptfoo/)) | Models and an agent platform |
| Portkey | AI gateway | Palo Alto Networks, 2026 ([Palo Alto](https://paloaltonetworks.com/company/press/2026/palo-alto-networks-completes-acquisition-of-portkey-to-secure-ai-agents)) | Security |
| Galileo | Agent evals and guardrails | Cisco, agreed 2026 ([Cisco](https://blogs.cisco.com/news/cisco-announces-the-intent-to-acquire-galileo)) | Networking and security |
| Arize | Evals and tracing | Dynatrace, agreed 2026, $915M | Application monitoring |
| OpenRouter | Model router | Stripe, agreed 2026 | Payments |

Seven of the eight buyers already sold something that sits on the same request path: a database the traces land in, a monitor that watches the app, a firewall in front of it, or the payment behind it. The exception is Mintlify, a documentation platform, which put Helicone into maintenance mode after the sale ([Mintlify](https://www.mintlify.com/blog/mintlify-acquires-helicone)). In the roadmap I called this layer a side rail rather than a layer, because nothing above it consumes what it produces. That is also why it is hard to sell alone. A trace or a gateway is valuable to whoever already owns the path, and that is who bought them.

## Labs are stretching both ways

The frontier labs started at pretraining and now reach in both directions. OpenAI leads the Stargate sites, is co-designing a chip with Broadcom, and ships ChatGPT and Codex on top. SpaceX now covers power (Colossus 2 runs on its own turbines ([Cleanview](https://cleanview.co/reports/behind-the-meter-data-centers/full-report/colossus))), a cluster it rents to other labs, the Grok models, and Cursor. Google's bar covers chips, cloud, models, an agent SDK and the Gemini app, and it was already that long before 2025.

The labs also buy what their own products depend on. Anthropic bought Bun, the JavaScript runtime that Claude Code runs on ([Bun](https://bun.com/blog/bun-joins-anthropic)), and Meta paid more than $14B for 49% of Scale AI ([Wikipedia](https://en.wikipedia.org/wiki/Scale_AI)).

## What is still independent

Three groups have stayed mostly on their own so far:
- **Data vendors.** Surge, Mercor and Handshake sell expert data and RL tasks to every lab at once, and owning one would cost a lab the others' business.
- **Model labs for one modality.** ElevenLabs in voice, Black Forest Labs in images and Runway in video are still independent. The exceptions are World Labs, which AMD agreed to buy, and Hume, whose team and technology Google DeepMind took in a licence-and-hire deal ([TechCrunch](https://techcrunch.com/2026/01/22/google-reportedly-snags-up-team-behind-ai-voice-startup-hume-ai)).
- **Harness infrastructure.** Sandboxes (E2B, Daytona), browser infrastructure (Browserbase) and vector databases (Pinecone, turbopuffer) are still standalone.

My prediction is that harness infrastructure goes the way tracing did. A sandbox or a hosted browser is a feature of whoever runs the agent, the same way a trace is a feature of whoever runs the request. Modal already sells sandboxes beside inference, and the labs already ship hosted agents with their own computers. That is a guess, and the chart's next revision will show whether it held.

## What I would do with this

If you are choosing a vendor in any of these layers, assume it may belong to its neighbour within a year. Before I signed, I would check three things. First, whether the data export works today, not on the roadmap. Second, whether the product is open source or self-hostable: Langfuse and Arize's Phoenix are, which made their sales much less risky for the people using them. Third, what the likely buyer already sells, because after a sale the product gets pushed toward whatever that company sells.
