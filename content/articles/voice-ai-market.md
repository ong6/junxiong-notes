---
title: "Voice AI in 2026: the market, the economics and the next five years"
description: Who sells what in voice AI, what a minute of an AI phone agent costs, where agents still fail, and where I think the money goes over five years.
date: 2026-10-19
updated: 2026-10-19
category: AI systems
tags: [voice-ai, agents, economics, landscape, predictions]
draft: true
---

Every part of a voice agent got cheaper over the last two years, but the price a business pays per minute barely moved. Retell, one of the larger voice-agent platforms, listed a range of $0.08–0.31 a minute in September 2024 ([Wayback](https://web.archive.org/web/20240901192127/https://www.retellai.com/pricing)) and lists $0.07–0.31 today ([Retell](https://www.retellai.com/pricing)). Over the same period, speech-to-text accurate to about 2% word error rate fell to $1.67 per 1,000 minutes ([Artificial Analysis](https://artificialanalysis.ai/speech-to-text/non-streaming)), and Google's native audio model costs $0.005 a minute in and $0.018 out ([Google](https://ai.google.dev/gemini-api/docs/pricing)).

That gap says where the value in this market sits. Buyers keep spending the savings on better models because what they pay for is a call that ends with the problem solved. My read is that over the next five years the money goes to whoever can resolve the call, the companies that sell a resolved conversation and the few labs with the best voice and reasoning, and that the ~$0.05 a minute orchestration fee in the middle stops existing as a line on the bill.

## Who is in the market

A phone agent is a stack, and most companies sell one or two layers of it.

| Layer | What it sells | Main companies |
|---|---|---|
| Speech models | Speech-to-text, text-to-speech, speech-to-speech | ElevenLabs, OpenAI, Google, xAI, Cartesia, Deepgram, AssemblyAI, Alibaba, Inworld, Rime |
| Telephony and transport | Numbers, SIP trunks, WebRTC | Twilio, Telnyx, Bandwidth, LiveKit, Daily (Pipecat) |
| Orchestration platforms | The pipeline that connects them, billed per minute | Retell, Vapi, Bland, Synthflow |
| Contact-centre software | Seats and routing, now with AI agents | NiCE (Cognigy), Genesys, Five9, Amazon Connect, Salesforce Agentforce |
| Customer-service agents | A resolved conversation | Sierra, Decagon, Parloa, PolyAI, Wonderful, Intercom Fin, Zendesk |
| Vertical agents | One industry's calls | Hippocratic and Assort (healthcare), HappyRobot (freight), Salient (lending), SoundHound (restaurants) |
| Consumer assistants | A device or app you talk to | ChatGPT voice, Gemini Live, Siri, Alexa+, Meta glasses |

The sizes vary a lot. ElevenLabs sold employee shares at a $22B valuation in September ([Tech.eu](https://tech.eu/2026/09/30/elelvenlabs-doubles-valuation-to-22bn-with-300m-employee-tender-offer/)), on revenue Sacra estimates at ~$600M a year ([Sacra](https://sacra.com/c/elevenlabs/)). Sierra raised $950M at about $15.8B in May ([Sacra](https://sacra.com/c/sierra/)). Retell has raised about $5M and Sacra estimates its run-rate at $80M ([Sacra](https://sacra.com/c/retell-ai/)). Vapi raised a $50M Series B at about $500M, by one unnamed source ([TechCrunch](https://techcrunch.com/2026/05/12/vapi-hits-500m-valuation-as-amazon-ring-chose-its-ai-platform-over-40-rivals/)).

Twilio is the best public read on the whole market. Its voice revenue grew 20% in Q1 2026, the fastest in 19 quarters, with self-service voice up 45% ([CMSWire](https://www.cmswire.com/customer-experience/twilios-q1-2026-voice-ai-hits-a-five-year-high-as-cx-orchestration-race-intensifies/)). In Q2 its CEO said "most AI activity continues to be in voice" ([transcript](https://gloom.sh/stocks/twlo/transcripts/q2-2026)). Twilio carries the calls for Bland, Sierra and others, so it earns on AI voice whichever platform wins.

## What one minute of a voice agent costs

Here is one minute of an inbound US support call, priced from Retell's list prices in each year, next to the cheapest build I could assemble from wholesale prices in 2026.

| Line | 2024 | 2025 | 2026, frontier LLM | 2026, cheap LLM | 2026, cheapest wholesale |
|---|---|---|---|---|---|
| Telephony | $0.010 | $0.015 | $0.015 | $0.015 | $0.005 |
| Speech, voice and platform fee | $0.100 | $0.070 | $0.070 | $0.070 | ~$0.020 |
| LLM | $0.050 | $0.040 | $0.064 | $0.008 | ~$0.002 |
| **Total** | **$0.16** | **$0.125** | **$0.149** | **$0.093** | **~$0.03** |

The wholesale column uses Telnyx telephony, Deepgram speech-to-text, Rime's voice and a small cached model, with self-hosted orchestration. It is my estimate, but each line is a published price.

The LLM line shows the mechanism. It went from $0.05 for GPT-4o in 2024 to $0.064 for a Claude 5 Sonnet-class model in 2026, because buyers moved to newer models as soon as they shipped. The cheap tier fell below the cost of the phone line, yet the top of Retell's range is still $0.31, because each new premium model fills the space the last one left.

At the top of the market, prices have stopped falling. OpenAI's realtime audio price has not moved since August 2025, and gpt-realtime-2 raised text output from $16 to $24 per million tokens. xAI's voice agent reportedly went from $0.05 to $0.08 a minute. Google's pricing page lists its 3.8 text-to-speech models doubling in price on 1 January 2027 ([Google](https://ai.google.dev/gemini-api/docs/pricing)). GPUs got more expensive too: one-year H100 contracts went from $1.70 to $2.35 an hour between October 2025 and March 2026 ([IntuitionLabs](https://intuitionlabs.ai/articles/h100-rental-prices-cloud-comparison)). Real-time voice suffers more from that than batch work, because a call holds capacity through every pause and cannot wait in a queue.

The price that matters is the one the agent competes with. A US customer-service rep's median wage is $20.59 an hour ([BLS](https://www.bls.gov/ooh/office-and-administrative-support/customer-service-representatives.htm)). With occupancy and overhead, I estimate a handled minute at $0.60–1.00 in the US and $0.20–0.35 in Manila.

```vega-lite An AI phone agent at list price costs a tenth to a fifth of a US agent per minute, and about half of a Manila agent. The cheapest wholesale build is a tenth of offshore. | Source: Retell pricing page (Oct 2026); wholesale build from Telnyx, Deepgram and Rime list prices; human ranges are estimates from the BLS median wage and vendor rate cards.
{"title":{"text":"Cost per handled minute, US support call","subtitle":"USD. Bars are ranges. Human figures include occupancy and overhead."},
 "height":{"step":38},
 "data":{"values":[
   {"who":"US agent","lo":0.60,"hi":1.00,"type":"Human","label":"$0.60–1.00"},
   {"who":"Philippines agent","lo":0.20,"hi":0.35,"type":"Human","label":"$0.20–0.35"},
   {"who":"India agent","lo":0.15,"hi":0.30,"type":"Human","label":"$0.15–0.30"},
   {"who":"AI agent, platform list price","lo":0.093,"hi":0.149,"type":"AI","label":"$0.09–0.15"},
   {"who":"AI agent, cheapest wholesale","lo":0.026,"hi":0.031,"type":"AI","label":"~$0.03"}]},
 "encoding":{
   "y":{"field":"who","type":"nominal","title":null,"sort":null,"axis":{"labelFontSize":13}},
   "x":{"field":"lo","type":"quantitative","title":"USD per minute","scale":{"domain":[0,1.1]},"axis":{"grid":true,"format":"$.2f"}}},
 "layer":[
   {"mark":{"type":"bar","height":22},"encoding":{"x2":{"field":"hi"},"color":{"field":"type","type":"nominal","title":null,
     "scale":{"domain":["Human","AI"],"range":["#eb6834","#2a78d6"]}}}},
   {"mark":{"type":"text","align":"left","dx":8,"fontWeight":600,"fontSize":13},
    "encoding":{"x":{"field":"hi","type":"quantitative"},"text":{"field":"label"}}}]}
```

## Platform fees now cost as much as whole speech stacks

The orchestration platforms charge for the pipeline and pass the model costs through. Vapi charges $0.05 a minute ([Vapi](https://vapi.ai/pricing)) and Retell $0.055. Platforms resell LLM tokens at roughly cost: my uncached estimate for GPT-4o, $0.052 a minute, matches the $0.05 Retell charged for it in 2024. So the fee is where the margin is, and it is now the largest single line in a cheap stack.

Three other companies now sell the speech stack itself for about that fee:

- Telnyx sells a voice engine at $0.05 a minute that includes speech-to-text and the voice, on its own carrier network and GPUs ([Telnyx](https://telnyx.com/pricing/voice-ai-agents)).
- OpenAI's GPT-Live-1, released to the API on 10 September, costs $0.05 a minute plus the backend model and takes calls directly over SIP ([OpenAI](https://developers.openai.com/api/docs/models/gpt-live-1.md)). Its named phone partners are Twilio, Telnyx, Bandwidth, LiveKit and Daily ([OpenAI](https://developers.openai.com/api/docs/guides/voice-sip)). No orchestration platform is on the list.
- Amazon Connect charges $0.038 a minute for voice with its Nova Sonic speech model included ([AWS](https://aws.amazon.com/connect/pricing)).

ElevenLabs sells its agent platform at $0.08 a minute plus the LLM ([ElevenLabs](https://elevenlabs.io/pricing/api)), and Deepgram has its own Voice Agent API. So the model makers are moving down, the carriers are moving up, and the contact-centre vendors are bundling speech into their own price.

The platforms are growing anyway. Retell went from about $5M of run-rate at the start of 2025 to an estimated $80M. Amazon Ring routes all of its inbound calls through Vapi, and chose it over more than 40 vendors for "granular control over agent behavior in live calls" ([TechCrunch](https://techcrunch.com/2026/05/12/vapi-hits-500m-valuation-as-amazon-ring-chose-its-ai-platform-over-40-rivals/)). That quote names what the fee actually pays for: control over the agent's behaviour, which the speech pipeline does not provide.

## Where voice agents fail today

Voice agents work well on narrow, scripted calls and badly on everything else. OfOne, the drive-thru startup Deepgram bought in January, claims more than 95% of orders handled without a human ([Business Wire](https://www.businesswire.com/news/home/20260113406092/en/Deepgram-Raises-130M-Series-C-at-1.3B-Valuation-to-Power-the-Voice-AI-Economy/)). A drive-thru has a fixed menu and one task. An independent tally of five PolyAI case studies found containment, the share of calls finished without a human, between 15% and 70%, with a median of about 56% ([JustCall](https://justcall.io/blog/ai-voice-agent-benchmarks-2026.html)). Sierra's own figure is about 70% ([Sacra](https://sacra.com/c/sierra/)).

The public reversals come from the cases in between. Klarna's CEO said its AI push "went too far" and the company began hiring humans again ([Entrepreneur](https://www.entrepreneur.com/business-news/klarna-ceo-reverses-course-by-hiring-more-humans-not-ai/491396)). Commonwealth Bank of Australia reversed 45 redundancies tied to a voice bot after a union challenge showed call volumes were rising ([Bloomberg](https://www.bloomberg.com/news/articles/2025-08-21/commonwealth-bank-reverses-job-cuts-decision-over-ai-chatbots)). Taco Bell rethought its drive-thru rollout after the "18,000 waters" prank ([Computing](https://www.computing.co.uk/news/2025/ai/taco-bell-scales-back-ai-tests-after-customer-complaints)). McDonald's ended its IBM test after order errors and is now trying again with Google at five sites ([Restaurant Business](https://restaurantbusinessonline.com/financing/mcdonalds-gives-drive-thru-voice-ai-another-shot)). An SEC filing showed off-site humans were involved in more than 70% of Presto's drive-thru orders ([Gizmodo](https://gizmodo.com/secret-behind-ai-drive-thrus-fast-food-humans--1851085269)).

Most of those failures are about what the agent knows and is allowed to do, rather than how well it hears. A billing call needs the caller verified, the account looked up, a refund policy applied, the refund written to a system of record, and a human brought in when the case falls outside policy. Speech-to-speech models are worst at that part:

- When Artificial Analysis launched its speech-to-speech index in June, every model scored below 53% on its agentic tool-use tasks ([Artificial Analysis](https://artificialanalysis.ai/articles/announcing-the-artificial-analysis-speech-to-speech-index)).
- A March test of 278 simulated customer-service calls with noise and accents found speech-to-speech agents finished 26–38% of tasks, against 85% for a text agent on the same tasks ([JustCall](https://justcall.io/blog/speech-to-speech-vs-cascaded-voice-agents.html)). The method is not published, so I treat it as a direction, not a number.
- The voices of native speech models also rate lower. On the Artificial Analysis TTS arena, GPT-Realtime-2's voice scores 1078 Elo, level with the free 82M-parameter Kokoro and far below Eleven v4 at 1332 ([Artificial Analysis](https://artificialanalysis.ai/text-to-speech/leaderboard)).

The gap is closing quickly. OpenAI claims GPT-Live-1 completes 86.2% of tasks on Tau3-Voice, against 45.7% for its previous model ([Unite.ai](https://unite.ai/openais-gpt-live-1-arrives-in-the-api-at-0-05-per-minute)). That is OpenAI's own figure, but how GPT-Live-1 gets there matters more than the score. It is a full-duplex voice layer that hands reasoning and tool calls to a separate text model, billed separately ([OpenAI](https://developers.openai.com/api/docs/models/gpt-live-1.md)).

## Why most production agents still go through text

Most production agents in 2026 still chain speech-to-text, an LLM and text-to-speech. Every vendor and eval company I read says so, and they all have an interest. Their reasons are the ones an engineer would give. With text in the middle, every turn has a transcript you can test against. You can swap the voice without touching the reasoning, cache the prompt, choose a cheaper model for simple calls, and call tools with the same models you already evaluate.

GPT-Live-1 keeps the text model and replaces only the speech end. I call that a half-cascade: a duplex front end handles turn-taking, interruptions and the voice, and a text model behind it does the reasoning, tool calls and policy. I expect both today's chained pipelines and pure speech-to-speech to converge on that shape, because it keeps the part that has to be correct in text, where it can be tested.

```uipack A production voice agent. The speech layer on the left can be swapped for a cheaper or better one, or for a single duplex model. Whether the call resolves depends on the harness on the right: what the reasoning model can look up, change, refuse and hand off, and the evals that check it.
voice-agent-harness
```

## What the harness does

If the speech layer is swappable, what a voice-agent company sells is the harness around the model. The market's spending and acquisitions are going into that harness:

| Harness part | Evidence |
|---|---|
| Turn-taking and interruptions | Inworld bought Ultravox in October for its turn-taking technology ([GeekWire](https://www.geekwire.com/2026/seattle-voice-ai-startup-ultravox-formerly-known-as-fixie-acquired-by-inworld/)). Twilio uses Deepgram's Flux for turn detection and added adjustable interruption sensitivity. |
| Caller context and memory | Twilio launched Conversation Memory at SIGNAL; one analyst wrote that the context layer "is designed not to be" replaceable ([BlogGeek](https://bloggeek.me/twilio-signal-2026/)). Retell added pre- and post-call workflows ([Retell](https://www.retellai.com/changelog/retell-workflows-brex-top-25-and-more)). |
| Evals and simulation | Coval raised a $28M Series A to test voice agents, with Twilio investing ([Coval](https://www.coval.ai/blog/coval-raises-28m-series-a)). Retell's Conductor generates edge-case tests. |
| Control over behaviour | Ring chose Vapi for control over the agent in live calls. |
| Compliance | Vapi charges $2,000 a month for HIPAA. Since 2 August, the EU AI Act requires telling callers they are talking to an AI and marking synthetic audio, with fines up to €15M or 3% of turnover ([Goodwin](https://www.goodwinlaw.com/en/insights/publications/2026/08/alerts-technology-dpc-eu-ai-act-transparency-obligations-now-in-force)). In the US, AI voices have counted as artificial voices under the robocall rules since February 2024 ([Cooley](https://cooley.com/news/insight/2024/2024-02-15-fcc-ai-generated-robocalls-illegal-under-the-tcpa)). |
| Human handoff | At the 56–70% containment rates above, a third or more of calls still end with a person. The handoff has to carry the context so the caller does not start again. |

Each row is engineering that is specific to one customer's systems and policies. That is why companies in this market hire forward-deployed engineers, and why I think per-resolution pricing will hold its margin. A business that pays for resolved calls is paying for the integration work the vendor did, which a competitor cannot copy by switching models.

## How the market values these companies

Investors already price the companies that sell resolutions far above the infrastructure companies.

```vega-lite The companies that sell a resolved conversation are valued at 45–105x revenue. Public SaaS trades at about 3x. | Source: valuations and revenue from Sacra, Tech.eu, TechCrunch, SiliconANGLE, Globes, Bloomberg Law and Newcomer (via ValueAdd VC); SaaS median from Aventis Advisors. Revenue figures mix company claims and estimates.
{"title":{"text":"Valuation as a multiple of annual revenue run-rate","subtitle":"Latest round or tender over the latest revenue figure, 2026."},
 "height":{"step":38},
 "data":{"values":[
   {"co":"Sierra ($15.8B / >$150M)","v":105},
   {"co":"Wonderful ($5B / $55M)","v":91},
   {"co":"Parloa ($3B / >$50M)","v":60},
   {"co":"Decagon ($4.5B / >$100M)","v":45},
   {"co":"ElevenLabs ($22B / ~$600M)","v":37},
   {"co":"Public SaaS median","v":3.2}]},
 "encoding":{
   "y":{"field":"co","type":"nominal","title":null,"sort":"-x","axis":{"labelFontSize":13}},
   "x":{"field":"v","type":"quantitative","title":"x revenue","axis":{"grid":true}}},
 "layer":[
   {"mark":{"type":"bar","height":24}},
   {"mark":{"type":"text","align":"left","dx":8,"fontWeight":600,"fontSize":13},
    "encoding":{"text":{"field":"v","type":"quantitative","format":".3~f"}}}]}
```

The multiples assume these companies are competing for labour budgets rather than software budgets. Gartner put the world's contact-centre agents at about 17 million ([Gartner](https://www.gartner.com/en/newsroom/press-releases/2022-08-31-gartner-predicts-conversational-ai-will-reduce-contac)). At $15–25K a year fully loaded, that is roughly $250–400B of labour, against a contact-centre software market of about $8–9B. A vendor charging $0.10 a minute is priced against a $0.20–1.00 human, which is how its revenue can grow past the software market it sells into.

Pricing is moving to the resolution. Intercom charges $0.99 per outcome ([Intercom](https://www.intercom.com/learning-center/intercom-pricing)). Zendesk started outcome pricing at $1.50 a resolution ([CX Today](https://cxtoday.com/zendesk-unveils-industry-first-outcome-based-pricing-model)). Sierra charges for resolved conversations, saved cancellations and upsells, and usually not for escalations ([Sierra](https://sierra.ai/blog/outcome-based-pricing-for-ai-agents)).

The arithmetic is tight for voice. A four-minute resolved call costs $0.40–0.60 in per-minute infrastructure today. At a 60–70% resolution rate, the infrastructure behind each billable resolution is $0.60–1.00, so $0.99 leaves almost nothing. I expect voice resolutions to price at $1.50–2.50, close to what a six-minute call costs in Manila ($1.20–2.10).

## What happens to call centres

The stock market has already sold the outsourcers. Teleperformance fell from about €225 in 2023 to around €45 this spring, and Bloomberg called it "one of AI's first victims" ([Bloomberg](https://www.bloomberg.com/news/articles/2026-02-24/bears-again-target-teleperformance-one-of-ai-s-first-victims)). Concentrix took a $1.05B goodwill write-down in September ([MarketBeat](https://www.marketbeat.com/instant-alerts/transcript-concentrix-q3-earnings-call-highlights-2026-09-29/)).

Employment has not fallen yet. The Philippine outsourcing industry added about 80,000 jobs in 2025 to reach about 1.9 million, though its industry body cut its 2028 target from 2.5 million to 1.85–2.14 million ([Context.ph](https://context.ph/2026/09/23/it-bpm-sector-eyes-50-5b-revenue-2-14m-jobs-by-2028/)). Cavell forecasts global contact-centre agent demand rising from 15.3 million in 2025 to 16.8 million in 2029 ([CX Today](https://www.cxtoday.com/contact-center/bombshell-study-finds-that-global-contact-center-agent-roles-will-increase-not-decrease-over-the-next-three-years/)). Gartner predicts that by 2027 half of the companies planning big service headcount cuts will drop those plans ([Gartner](https://www.gartner.com/en/newsroom/press-releases/2025-06-10-gartner-predicts-50-percent-of-organizations-will-abandon-plans-to-reduce-customer-service-workforce-due-to-ai)). The counterexample is Salesforce, which says it cut support staff from 9,000 to about 5,000 with its own agents ([TechRadar](https://techradar.com/pro/salesforce-says-it-cuts-4-000-support-jobs-and-replaced-them-with-ai)).

My read is that cheaper calls are creating calls that were not made before, such as after-hours inbound, follow-ups and reminders, so AI is taking most of the growth while humans keep the hard calls. Twilio's voice growth is the best evidence for that, and it is indirect. The outsourcers' seat-based business model is in trouble. The companies themselves can still do well if they sell outcomes with AI doing most of the work and humans handling the exceptions.

## The next five years

These are estimates, with the assumptions shown.

**Today.** About 15 million agents working ~1,600 hours a year at ~70% occupancy handle about a trillion minutes a year. Voice is still a bit over half of service interactions, so call it ~550 billion human voice minutes. From the call volumes Retell, Vapi, Bland and the others report, I put AI at 15–30 billion minutes, or 3–5% of the total.

**2031, base case.** Voice volume grows about 30% as cheaper calls create new ones, and AI handles 35–40% of it. Around 60% of AI calls stay on commodity per-minute pricing at $0.05–0.07 all-in, worth $8–10B. The other 40% are sold per resolution at about $1.20 blended per call, worth $25–30B. After double counting between layers, that is a ~$30B market, about ten times today's.

| | Bear | Base | Bull |
|---|---|---|---|
| Market in 2031 | $10–12B | ~$30B | $60B+ |
| AI share of voice minutes | 15–20% | 35–40% | 55–65% |
| Price per voice resolution | ~$1, the chat price | $1.50–2.50 | $2–3 |
| Human seats vs 2026 | +5% | Flat | −25% |
| What gets us there | Containment stalls near 50% on real traffic, more public reversals, disclosure rules hit outbound calling | Agentic task success above 85% by 2028; outcome pricing becomes standard | Gartner's 80% of common issues resolved by 2029 comes true; assistants start placing calls for consumers |
| My probability | 20% | 55% | 25% |

By layer, I expect:

- **Speech models split in two.** OpenAI, Google and xAI hold the top of the speech-to-speech index, and the lead changed hands within months ([Artificial Analysis](https://artificialanalysis.ai/speech-to-speech)). Below the top, Alibaba, StepFun and open-weight models such as Kokoro and Fish Audio keep pushing commodity prices toward zero. ElevenLabs is the one independent I expect to keep premium pricing, because the voice is the part the caller can actually hear. Specialist transcription companies such as AssemblyAI and Speechmatics have not raised since 2022–23 and look like acquisition targets.
- **Telephony is the safest layer.** The $0.005–0.015 a minute for the phone line is the one cost no model improvement removes, and it grows with total volume. Twilio is the clearest winner today.
- **The orchestration fee disappears as a line item by 2028.** It either gets bundled into an all-in commodity minute, as Telnyx already does, or replaced by workflow, seat and outcome pricing. Platforms that become the harness for their customers keep their margin. Platforms that stay a per-minute toll get bought at infrastructure multiples.
- **Vertical agents hold their pricing better than horizontal ones.** Assort (healthcare, $1.2B, [MobiHealthNews](https://www.mobihealthnews.com/news/assort-health-lands-120m-scale-patient-journey-ai-agents)) and HappyRobot (freight, $1.2B, [Fortune](https://fortune.com/2026/08/04/happyrobot-worth-1-2-billion-founder-says-just-getting-started/)) are protected by their integration into the EHR or freight system, not by their voice. Horizontal customer-service agents without that integration compete with Salesforce, Zendesk, Intercom and the labs' own marketplaces.
- **Contact-centre vendors shift their mix.** NiCE's AI revenue is growing 52% and Five9's 78% ([CMSWire](https://www.cmswire.com/customer-experience/five9-raises-full-year-ai-outlook-to-60-growth-after-strong-q2/)), but seat revenue shrinks as containment rises. I expect them to buy agent companies, as NiCE did with Cognigy.

## Predictions

Each has a date so I can check it later. The percentages are my confidence.

1. At least one of Vapi, Retell or Bland is acquired by the end of 2027. 60%.
2. By the end of 2028, neither Retell nor Vapi lists a standalone platform fee of $0.05 a minute or more. 70%.
3. At the end of 2029, frontier speech-to-speech from OpenAI or xAI still costs at least $0.04 a minute, while Google-class native audio costs $0.01 or less. 65%.
4. By the end of 2027, at least two of Intercom, Zendesk, Salesforce and Sierra publish per-resolution voice pricing between $1.50 and $2.50. 70%.
5. ElevenLabs files for or completes an IPO by the end of 2028, above its $22B tender price. 55%.
6. Gartner's prediction of 80% of common service issues resolved without a human by 2029 misses: independent measurements of inbound voice containment in 2029 have a median of 65% or less. 70%.
7. Philippine outsourcing employment is still at least 1.9 million at the end of 2029. 65%.
8. By the end of 2028, every major voice-agent platform defaults to a duplex speech front end over a text reasoning model. 75%.

The signals I will watch over the next 18 months are Twilio's voice growth each quarter, Retell's and Vapi's pricing pages, whether OpenAI lifts GPT-Live-1's concurrency limits, agentic task scores on noisy calls, and the first EU enforcement against an undisclosed voice agent.

## What would prove me wrong

The strongest case against this view is that the labs take the whole stack. OpenAI already has the duplex front end, direct SIP, the reasoning model, a marketplace that lists Sierra, and about 900 million weekly ChatGPT users. Google has the cheapest native audio and sells through Five9 and Siri. If voice customer service becomes a product the labs sell directly, the orchestration fee goes to zero instead of being repackaged, and the horizontal customer-service agents lose their multiples because the lab or the CRM sells the resolution with the model margin already inside. The independent value left would be vertical integration and telephony.

The signal is GPT-Live-1's limits. Today it caps a Build-tier account at 50 concurrent sessions and a Grow-tier account at 500, with calls capped at two hours ([OpenAI](https://developers.openai.com/api/docs/models/gpt-live-1.md)). A contact centre needs thousands of concurrent calls, controls and someone to call at 3am. If OpenAI ships those in 2027, I am wrong about the middle of the stack.

The number that decides most of this is the resolution rate on real, noisy, tool-heavy inbound calls in 2028. Above 80%, the labour pool moves fast and both the labs and the agent companies win. Around 60%, we get the base case: half-cascade agents with humans behind them. Below 50%, voice AI ends up as a $10B feature inside contact-centre software. When I look at a voice AI company, the question I ask is what it still owns if its speech model is swapped for a competitor's.
