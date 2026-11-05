---
title: Why my writing read as AI-written, and what we changed
description: "Two of my own slides read like a model wrote them. Here's what my coding agents and I found when we went looking for why, in the slides and in this blog."
date: 2026-11-05
updated: 2026-11-05
category: AI systems
tags: [writing, agents, evals, slides]
draft: true
---

I looked at two slides from my own design system and felt they read as AI-written.

```text
REVIEWS
Answer-first reviews were decided in one meeting, not three
Same teams and the same six months; only the order of the slides changed.
```

```text
SEARCH
Search answers in 198 ms at p95, twice as fast as March
One index replaced five, and the cache serves the rest.
```

The label on top does nothing for me. The headline is a sentence I'd have to read off the screen,
and that's a problem since I don't present from a script. I talk from the points on the slide.
That first summary line also balances two halves on a semicolon, which the generic copy in our
tests kept doing too.

When the agents audited the 23 posts on this blog, they found 47 "X, not Y" contrasts and 37
inline disclaimers like "my arithmetic, not a measurement". There were 121 bold labels. And 15 of
the 23 posts ended on a "What I would do" section with a quotable last line.

I'd written some of that in myself. The writing guide in my own design system used "X, not Y" in
its model examples, and my rule to "end on the decision" is where the "What I would do" ending
came from. At some point I'd also banned em dashes. That cut them from 1.40 to 0.28 per 1,000
words, and the contrasts and disclaimers didn't move. The posts that held up
best were the ones built on my own data, like the job search and trading ones. The generic guides
read worst.

For the slides, the agents catalogued 66 decks (26 tech talks, 24 from well-known presenters, 16
business and pitch decks) and 14 landing pages. None of the 26 tech talks stacked a label, a
full-sentence headline and a summary line the way mine did. We went with a short spoken title of two
to five words over a few fragments that carry the numbers. I say the full sentence out loud.

```text
Review decisions: 3 meetings → 1
Same teams, same 6 months
Only change: the answer moved to slide 1
```

Then we tested the writing rules behind it. Each round, one agent wrote copy with the rules and
another wrote the same copy with none. Fresh judge agents scored both out of 10 without knowing
which was which. Ours won three of the five rounds. The widest gap was 8 against 6 in round 1, and
no round got to 9. From round 3 each pair went to two judges in opposite orders. In one of those
rounds both judges gave 8 to whichever deck they read first and 7 to the other, and swapping the
order cancelled it out.

Round 1 caught an invented reassurance in our copy. Round 2 caught a "TODO" left on a slide, and
titles that were labels with no point. In round 3 our "gap" lines, like "we haven't costed a fix
yet", read as made-up facts. The word "lifted" also claimed a cause from a before and after. Round
4's speaker notes repeated the slides word for word, and the ask said "Approve by 15 January
2027". Approve what? Round 5 printed "not a controlled test" three times, until it read like a
stock phrase. Every fix tended to cause the next problem. Banning invention made the copy thin.

The generic copy failed differently. It kept inventing things, and it wrote lines like "a signal,
not proof" and "not a side task".

The agents also read 48 posts by 24 writers I admire, 18 published AI-written posts, and 3 posts
they generated fresh with "write a blog post about X". The fresh ones had zero "delve" or
"crucial". Per 1,000 words, though, the AI-written posts ran 13.8 headings and 18.8 list items,
against 3.8 and 0 in the human ones. They had 26 bold phrases to the human posts' 1. More than half
the human posts, 26 of 48, had no headings at all, and 22 of the 24 writers use "I" at least five
times per 1,000 words. Only 3 of the 48 had a table, and 37 asked at least one
question. All 3 fresh posts ended on a recap. Em dashes on their own told us nothing,
since one Simon Willison post has 59. So the newer models mostly stopped using the giveaway words
and kept the giveaway structure.

Before round 3 we wrote one guide for everything I put out, so rounds 3 to 5 were really testing
it. It drops the closing "What I would do" and the "X, not Y" framing. Sources go in links and
captions instead of disclaimers in the middle of a sentence. Questions are fine when I'm actually weighing them, and
headings only show up on long posts. The pre-publish check runs a script that counts tells, plus a
plain grep for ", not ". The script alone missed my short ", not Y" form, the one that shows up 47
times on this blog.

I don't know whether a person reading this would notice the difference. Every judge so far has been
an AI agent, and the guide hasn't been tested over time.
