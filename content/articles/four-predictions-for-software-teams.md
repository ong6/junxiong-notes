---
title: Four predictions for how software teams will change
description: Smaller teams but more of them, internal tools that compete with SaaS, more self-hosted models, and engineers who own product decisions.
date: 2026-09-24
updated: 2026-09-25
category: Career
tags: [predictions, engineering-teams, saas, self-hosting, local-llm]
draft: false
---

I expect software teams to get smaller over the next few years, and I expect companies to have more
of them. The other three predictions here follow from the same cause: writing code is getting cheaper
faster than deciding what to build, running it or being accountable for it.

Some of this I already see at the large tech company where I work. The rest is my read. I am writing it down so I
can check later which parts I got wrong.

## Teams get smaller, and companies have more of them

A team used to be sized by the hours of implementation its roadmap needed. If a feature took three
engineers a quarter, you hired three engineers. With coding agents, one engineer can carry much more
of that implementation, so the headcount a feature needs goes down.

Coordination cost does not go down. Every extra person adds another opinion to reconcile, another
review to wait on and another calendar to fit around. When the implementation hours shrink,
coordination becomes a larger share of the work, and the cheapest way to cut it is a smaller team. A
team of three that can agree on a Tuesday afternoon will beat a team of eight that needs a planning
meeting.

That does not mean companies need fewer engineers overall. Most companies have a backlog of
things that were never worth staffing: the internal dashboard, the migration nobody owns, the second
product line that would take a full team to try. When a small team can take on one of those, the
company can start it. So I expect the same headcount to be spread across more teams, each owning a
narrower thing.

Where I work, the first signs are already visible. Dedicated QA roles are being cut, and engineers own
testing for what they ship. Teams are also being restructured so that one team owns a scope from end
to end, across the frontend, the backend and the data pipelines, instead of one team per layer. Both
changes remove a hand-off. A layer team has to wait for the layer beside it; a scope team does not.

The cost is more boundaries. More teams means more interfaces, more ownership questions and more
places where two teams build the same thing without knowing. Shared platforms matter more in that
world, not less: a catalogue of who owns what, one way to get credentials, one place to look for an
existing tool before building a new one. I wrote about that for agents in
[how agent integrations get built inside large organisations](/agent-integrations-in-large-orgs), and
the same argument applies to teams.

This stops being true for work that is big by nature. A payments core, a regulated system or anything
with a heavy on-call load still needs enough people to cover it, however fast they write code.

## Internal tools start competing with SaaS

A SaaS product is priced to cover every feature every customer needs. Most companies use a slice of
it. When building that slice in-house took a quarter of engineering time, buying was the obvious
answer. When a developer can build a working version of the slice in a week or two, the comparison
changes.

The candidates are narrow tools: an approval workflow, a feedback form with a dashboard behind it, a
simple CRM for one team, an internal status page. They are the kind of products where a company pays
per seat for a large feature set and uses three screens. An internal copy can fit the business
exactly, use data that already sits inside the company, and skip the procurement and security review
that a new vendor needs.

What does not get cheaper is everything after the first version. Someone has to patch it, answer when
it breaks, handle access control and keep it running after the person who built it moves teams. SaaS
vendors carry that cost for you, and it is most of what you are paying for. An internal tool that
nobody owns becomes the next migration nobody owns.

My rule would be to build when the tool is narrow, the data is already internal, and the team that
uses it is also willing to maintain it. I would buy when a failure has legal or financial
consequences, when the product depends on a network of other customers, or when the domain itself is
hard, like payroll or tax. SaaS vendors whose product is mostly a thin workflow over a database will
feel this first.

My company has always built a lot of its own internal tools, so the habit is not new there. What has
changed is the pace. We now build them far faster than before, and a tool that would have waited
for a quarter's planning now gets built because someone needed it that week.

## More companies self-host models

Open-weight models are now good enough for a large share of everyday tasks: classification,
extraction, summarising internal documents, embeddings and search. Those tasks run constantly, at
predictable volume, and often touch data a company would rather not send to a third party.

That combination makes self-hosting worth pricing out. A predictable workload can be sized onto fixed
hardware, and the data never leaves the company's network. Hardware and quantization have also moved
enough that a useful model no longer needs a data centre; I went through the numbers that matter in
[how I think about hardware for local models](/local-inference-hardware) and
[what changes when you quantize a model](/quantization-what-it-costs).

The demand for that hardware is already showing up. Orders for Apple's new M5 Ultra Mac Studio have
delivery dates as late as the end of January 2027, a wait of 16 to 18 weeks, which reporting puts
down to high demand on top of a DRAM and NAND shortage
([eTeknix](https://www.eteknix.com/apple-mac-studio-m5-ultra-faces-delivery-delays-of-up-to-18-weeks-due-to-memory-shortage/)).
A desktop whose main selling point is a large pool of unified memory is hard to buy right now. I
read a good part of that demand as people who want to run large models on their own machines.

I do not expect frontier APIs to lose their place. The hardest reasoning and coding work will still
go to the strongest hosted model. What I expect is routing: a small self-hosted model handles the
high-volume, low-difficulty work, and the API handles the rest. The tradeoff is operational. A
self-hosted model is another service to deploy, monitor, upgrade and keep on call, and a team that
does not want that job should keep paying per token.

## Software engineers become more product-focused

If code is cheaper to write, the scarce part of the job moves to deciding what to build and checking
that it solved the problem. The first three predictions push in that direction too. When the QA
role goes away, the engineer decides what "working" means for the user. A small team
rarely has a dedicated product manager, so the engineers talk to users. An internal tool has its
users down the corridor, and the engineer who built it is the one they message. A company routing
work between models needs someone who understands which answers are good enough for the business.

In practice, I think the engineers who do well will be the ones who can take a vague request from a
colleague, work out the smallest thing that fixes it, ship it and measure whether it helped. Writing
a clear spec, cutting scope and saying no to features become engineering skills rather than something
handed over from another role.

If I am right, the question to ask about your own work is how much of it is deciding and how much is
typing. I would move toward the deciding side now: own a feature end to end, sit in on the
conversations with the people who use it, and treat the code as the part that is getting easier.
