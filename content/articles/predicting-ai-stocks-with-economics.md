---
title: Predicting the future of AI stocks with economics
description: People adopted AI faster than the internet, but only about 2% of households pay for it. Where the money flows, and how I would position for the bull case.
date: 2026-10-07
updated: 2026-10-07
category: Trading
tags: [ai-economics, investing, semiconductors, power, memory]
draft: false
---

If half of American households pay for AI by the mid-2030s, that alone will not justify what is
being spent to build it. The four biggest cloud companies plan to spend
[$725 billion on capex in 2026](https://www.tomshardware.com/tech-industry/big-tech/big-techs-ai-spending-plans-reach-725-billion),
and the households at the other end will pay a few tens of billions a year. I think the bull case
for AI stocks is real, but it pays the companies selling scarce inputs to the build-out before it
pays anyone selling AI to consumers.

This is my read, worked from public numbers. It is not financial advice.

## People adopted it faster than the internet. They did not start paying faster.

A chart from [How to AI](https://how-to-ai.guide) has been going around. It shows how long each
technology took to go from 2% of America to 50%: about 6.5 years for the smartphone, 7.5 for the
internet, 15 for the car and 19 for the computer. It puts AI at year zero, with 2.2% of Americans
paying for it in April 2026.

Two different curves get mixed together here.

**Use** has been faster than anything on that chart. A St. Louis Fed survey found that
[39% of US adults aged 18 to 64 had used generative AI by August 2024](https://www.nber.org/papers/w32966),
less than two years after ChatGPT launched. The same study puts the internet at about 20% two
years in and the personal computer at 20% after three. AI needed no new device, no new cable and
no new habit beyond typing into a box, so it spread on hardware people already owned.

**Paying** is a different story. The 2.2% comes from
[PNC Bank's card data](https://www.techdogs.com/tech-news/td-newsdesk/only-22-of-pnc-households-pay-for-genai-as-monthly-spend-climbs-to-31):
2.2% of PNC households paid for a generative AI subscription in May 2026, spending about $31 a
month on average, up from about $22 two years earlier. That is PNC's own customers, not a national
survey, and it misses AI paid for through a bundle or an employer. Even so, it is about three and a
half years after ChatGPT launched, and the paying share is where the internet's was in 1994.

The reason is simple: the free tier is good enough for most people. Smartphones and the
internet had no free version, so using them and paying for them were the same thing. With AI,
every paid plan competes with a capable free one.

My read is that paying reaches half of US households in roughly 7 to 9 years, around 2033 to
2035. That is close to the internet's pace, not faster. Most of that payment will come through
bundles (phone plans, Google One, Microsoft 365, iCloud) rather than a separate ChatGPT bill.
A fast case of about five years needs bundling to happen by default. A slow case, 12 years or
more, looks like music, where many people never pay.

## What half of America paying is worth

The [Census Bureau](https://fred.stlouisfed.org/series/TTLHH) counts about 135 million US
households. The arithmetic below is mine:

| | Today | At 50% paying |
|---|---|---|
| Households paying | 2.2% × 135M ≈ 3M | 50% × 135M ≈ 67M |
| Monthly spend | $31 | $25–35, as cheaper tiers spread |
| US consumer revenue per year | ≈ $1.1B | ≈ $20–28B |

That is roughly a twentyfold increase in US consumer spending on AI. It is also about 3% of a
single year of the big four's capex. Consumer subscriptions do not pay for the build-out. Whether
AI investment earns a return depends on businesses paying for agents and API usage.

## The inputs cost more than the revenue, for now

Revenue can grow twentyfold and still lose money if the inputs grow faster. Right now they do.

Training is the first cost. [Epoch AI estimates](https://epoch.ai/blog/how-much-does-it-cost-to-train-frontier-ai-models)
that the hardware and energy cost of the final training run for frontier models has grown about
2.4 times a year since 2016, putting the largest runs above a billion dollars by 2027. A frontier
model is also a depreciating asset: the next one makes it worth much less within a year or two.

Serving is the second cost, and it scales with users. Every person who pays for a plan also uses
compute every day. According to a company presentation
[reported by the FT via Reuters](https://www.thestar.com.my/tech/tech-news/2026/09/19/openai-forecasts-cash-burn-near-280-billion-by-2030-ft-reports),
OpenAI expects about $840 billion in cumulative revenue from 2026 to 2030 and about $856 billion
in spending on computing power and infrastructure over the same period, for $278 billion of
negative free cash flow.

That is the mechanism behind my position. When the companies selling AI spend more on compute
than they collect, the money is not lost. It goes to the people selling them compute, power and
memory. Adoption raises demand for those inputs whether or not the AI companies end up
profitable.

## Where the scarcity is

A bull case for inputs needs the inputs to be scarce. If they were easy to make, prices would fall
and the extra demand would go to the customer. Three are clearly scarce today.

**Power.** A data centre is useless until it is connected to power, and the turbines that power it
are booked years ahead. GE Vernova's
[gas turbine backlog and slot reservations reached 100 GW](https://www.industrialinfo.com/iirenergy/industry-news/article/ge-vernovas-global-natural-gas-turbine-reservations-and-order-backlog-grows-to-100-gw--356705)
in the first quarter of 2026, in a quarter when it shipped 4 GW.

**Memory.** AI accelerators need high-bandwidth memory (HBM), which only three companies make. SK
Hynix's chief executive
[told Reuters](https://www.gadgetreview.com/2027-could-be-memorys-worst-supply-year-yet-sk-hynix-ceo-warns)
that 2027 will be "the worst year in the industry's history from the supply perspective". Not
everyone agrees: a Bloomberg Intelligence analyst cited in the same piece expects possible
oversupply in 2028, once the three makers' new factories come online.

**Chips and the machines that make them.** Leading-edge AI chips come from a few designers, one
main foundry and one company that makes the lithography machines.

## How I would position for the bull case

My core stays a global index fund, which already holds the large AI names. The bull case belongs
in a satellite: a fixed share of new money, added steadily, not a lump sum. I would weight it
towards power and chips, and keep memory small.

| Play | Examples | Upside | Downside |
|---|---|---|---|
| Power generation | GE Vernova, Siemens Energy, Constellation, Vistra | The slowest bottleneck to fix. Turbines and nuclear plants take years to add, so pricing power lasts. Doesn't depend on which AI lab wins. | Utilities are regulated, so returns can be capped. Stocks already price in a lot of data-centre demand. If chips get more efficient per watt, demand forecasts get cut. |
| Grid equipment | Eaton, Schneider Electric, Quanta Services | Transformers, switchgear and grid construction are needed for every new data centre, and for electrification generally. | Lower ceiling than chips. Order books are cyclical, and a pause in capex shows up quickly in new orders. |
| Memory (HBM) | SK Hynix, Micron, Samsung | Sold out, prices rising, and AI makes up a growing share of the mix. | The most cyclical part of semiconductors. Every shortage has ended in a glut, and the 2028 oversupply warning is a real one. Expect 50%+ drawdowns at the turn. |
| Chips and equipment | Nvidia, Broadcom, TSMC, ASML | Every AI dollar runs through them. A semiconductor fund covers the group in one holding. | Already the most crowded trade. Customers designing their own chips squeezes margins. Taiwan concentration and export controls are single points of failure. |
| Data-centre plumbing | Vertiv, Arista Networks | Cooling and networking demand grows with every rack. | Small, expensive companies with thin moats. These stocks fall hardest when capex guidance slips. |
| Cloud platforms | Microsoft, Alphabet, Amazon, Meta | They own the customers, and they collect both the enterprise revenue and the consumer bundles. | They are the ones paying the $725 billion. If revenue lags, their free cash flow takes the hit first. |
| Model labs | OpenAI, Anthropic | The highest upside if one of them wins. | Mostly private. Retail investors get exposure only through the platforms' stakes, and the labs are the ones burning cash. |

One risk sits under every row. Input sellers win while the build-out continues, and the build-out
continues only while enterprise revenue keeps up with capex. If that stalls, capex gets cut, and
the stocks that rose most on it fall most. Memory and data-centre plumbing would go first, then
chips. Power holds up best, because the grid needed the investment anyway.

So I would not try to call the top. I would hold the inputs in a satellite I can add to steadily,
keep the core in the index, and watch one number each quarter: whether the platforms' AI revenue
is growing faster than their capex. When it stops, the bull case for the inputs has peaked.
