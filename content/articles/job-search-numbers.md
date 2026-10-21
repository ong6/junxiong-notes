---
title: My job search in numbers, and where the interviews came from
description: "Thirteen weeks of my own records: 39 applications, 70 recruiter reach-outs, pass rates by interview round, and which route produced seven offers."
date: 2026-10-21
updated: 2026-10-21
category: Career
tags: [job-search, interviews, recruiting, career]
draft: false
---

Over 13 weeks of job hunting I got seven offers, and every one started with a recruiter messaging me. My cold applications produced four interview processes and no offer yet. Here is the whole search in one picture.

```uipack All 109 leads, left to right: who started each one, the route, the first outcome and the result inside a hiring process. Each band is as wide as its count; green began with a recruiter's message, blue with my own application. All seven offers sit on the green side, and my applications produced four hiring processes and no offer yet. Of the processes that ended in a rejection, three failed on a technical round, three on a behavioural or HR round, and one at a stage I didn't record. | Source: my own application tracker, as of 2026-10-21.
job-search-sankey
```

Getting into a hiring process was the hard part. Once I was in one, I passed most rounds: 38 of the
44 that have a result. Over the records, from 24 July to 21 October 2026, 4 of my 36 decided
applications reached a screen, test or interview. Of the 31 recruiter leads I took forward, 21 did.

Based on these numbers, recruiters gave me a far higher chance than my own applications did. I still
think cold applications are fine to send. The numbers below show why I no longer expect them to carry
the search, and where the samples are too thin to say more.

## What I counted

Everything here comes from my own tracker: a log of every application, a log of every recruiter lead
and a debrief for each interview I sat. A few definitions carry most of the weight.

A **reply** is a person writing back with a next step. A rejection is counted separately, and
automated receipts don't count at all. I treat a cold application as silent after 21 days with no
reply. Three applications are still inside that window, and one more has its first screen booked, so
all four sit under "still waiting" and stay out of every rate.

A **hiring process** starts at the first screen, online test or interview run by the employer. A
pre-screen call with an agency doesn't count, because the employer hasn't seen me yet.

A **reach-out** is one recruiter lead in my log: one recruiter, one role or client. **Taken forward**
means I said yes and my CV or profile went in. "Declined by me" covers the leads I turned down before
that point, plus one I dropped the same day I sent the CV.

## Applications against recruiter reach-outs

I sent 39 applications: 37 cold through careers pages and two with a referral. Over the same 13 weeks
I logged 70 recruiter reach-outs: 19 from in-house recruiters and 51 from agencies.

```vega-lite An in-house recruiter's lead almost always became a hiring process. A cold application rarely did. | Source: my own application tracker, as of 2026-10-21.
{"title":{"text":"Reached a screen, test or interview, by how it started","subtitle":"Share of applications sent, or of recruiter leads I took forward. Applications still waiting are left out."},
 "height":{"step":38},
 "data":{"values":[
   {"route":"In-house recruiter","pct":91.7,"label":"11 of 12","kind":"A recruiter reached out"},
   {"route":"Agency recruiter","pct":52.6,"label":"10 of 19","kind":"A recruiter reached out"},
   {"route":"Applied cold","pct":11.8,"label":"4 of 34","kind":"I applied"},
   {"route":"Applied with a referral","pct":0,"label":"0 of 2","kind":"I applied"}]},
 "encoding":{
   "y":{"field":"route","type":"nominal","sort":["In-house recruiter","Agency recruiter","Applied cold","Applied with a referral"],"title":null},
   "x":{"field":"pct","type":"quantitative","title":"% that reached a screen, test or interview","scale":{"domain":[0,100]},"axis":{"grid":true}}},
 "layer":[
   {"mark":{"type":"bar"},"encoding":{"color":{"field":"kind","type":"nominal","scale":{"domain":["A recruiter reached out","I applied"],"range":["#1baf7a","#2a78d6"]},"legend":{"orient":"top","title":null}}}},
   {"mark":{"type":"text","align":"left","dx":8,"fontWeight":600,"fontSize":13},"encoding":{"text":{"field":"label","type":"nominal"}}}]}
```

The in-house route is the clearest result. I took 12 of those 19 leads forward and 11 became a hiring
process. The twelfth was a role I dropped myself the same day. If both routes converted at the same
rate, a split as lopsided as 11 of 12 against 4 of 34 would turn up about once in a million draws
(Fisher's exact test, my arithmetic). The comparison still flatters inbound a little. I only sent a CV
after a recruiter's message had passed my own filter, and seven of the 19 didn't.

Agencies sit in the middle, and they lose people in two places. I declined 32 of the 51 leads before
sending anything, often because the message didn't name the client or the pay band. Of the 19 I took
forward, 10 reached a process. Eight of the other nine went quiet after the CV, and in some of those I
never learned whether the client saw it at all. The ninth was rejected at the resume stage.

Cold applications split by date in a way I didn't expect. The 20 I sent before 22 September produced
one late reply and one resume-stage rejection. Fifteen of those went out on a single day in
mid-September, mostly to forward-deployed roles at the best-known AI companies, and many asked for more
years than I have. The 14 decided applications I sent from 22 September onward produced four replies.
Three have already become interviews and the fourth has a screen booked for today. Targeting may
explain part of it, but I rewrote my resume the same week, so I can't separate the two, and 14 is a
small sample.

The one reply from the early batch is an odd case. A recruiter got back to me six weeks after I
applied, and I count it as a reply to that application.

### What changed since my early sample

In my [LinkedIn article](/linkedin-optimization) I quoted an early sample: 10 of 11 in-house recruiter
leads had reached a hiring process, and none of my three applications had replied. When I reconciled my
inbox and email in September, two of those 11 turned out to be agency leads, so that figure no longer
stands as written. With two more months of data, the in-house rate held. It is 11 of the 12 leads I took
forward, or 11 of 19 if I count every in-house reach-out, including the seven I turned down.
Applications moved from zero of three to five replies from 36 decided sends.

## Once I was in a room

The 44 rounds with a result include every route. Five more are pending and six ended with no result:
four went silent after the round, and two closed for reasons outside the round itself. Neither group is
in any rate below.

```vega-lite I passed most rounds of every type. No type has more than two failures. | Source: my own interview debriefs and application tracker, as of 2026-10-21.
{"title":{"text":"Interview rounds with a result, by type","subtitle":"Passed and failed only. Five pending rounds and six that ended without a result are left out."},
 "height":{"step":38},
 "layer":[
   {"data":{"values":[
      {"type":"Recruiter screen","outcome":"Passed","n":8},
      {"type":"Recruiter screen","outcome":"Failed","n":2},
      {"type":"Online or written test","outcome":"Passed","n":3},
      {"type":"Online or written test","outcome":"Failed","n":1},
      {"type":"Live coding","outcome":"Passed","n":3},
      {"type":"Live coding","outcome":"Failed","n":1},
      {"type":"AI-assisted coding or codebase","outcome":"Passed","n":5},
      {"type":"Design, case or take-home","outcome":"Passed","n":7},
      {"type":"Hiring manager or final","outcome":"Passed","n":7},
      {"type":"Hiring manager or final","outcome":"Failed","n":1},
      {"type":"Other or unrecorded technical","outcome":"Passed","n":5},
      {"type":"Other or unrecorded technical","outcome":"Failed","n":1}]},
    "mark":{"type":"bar"},
    "encoding":{
      "y":{"field":"type","type":"nominal","title":null,"sort":["Recruiter screen","Online or written test","Live coding","AI-assisted coding or codebase","Design, case or take-home","Hiring manager or final","Other or unrecorded technical"]},
      "x":{"field":"n","type":"quantitative","stack":"zero","title":"rounds","axis":{"grid":true,"tickMinStep":1}},
      "color":{"field":"outcome","type":"nominal","scale":{"domain":["Passed","Failed"],"range":["#1baf7a","#eb6834"]},"legend":{"orient":"top","title":null}},
      "order":{"field":"outcome","sort":"descending"}}},
   {"data":{"values":[
      {"type":"Recruiter screen","total":10,"label":"8 of 10"},
      {"type":"Online or written test","total":4,"label":"3 of 4"},
      {"type":"Live coding","total":4,"label":"3 of 4"},
      {"type":"AI-assisted coding or codebase","total":5,"label":"5 of 5"},
      {"type":"Design, case or take-home","total":7,"label":"7 of 7"},
      {"type":"Hiring manager or final","total":8,"label":"7 of 8"},
      {"type":"Other or unrecorded technical","total":6,"label":"5 of 6"}]},
    "mark":{"type":"text","align":"left","dx":8,"fontWeight":600,"fontSize":13},
    "encoding":{
      "y":{"field":"type","type":"nominal","sort":["Recruiter screen","Online or written test","Live coding","AI-assisted coding or codebase","Design, case or take-home","Hiring manager or final","Other or unrecorded technical"]},
      "x":{"field":"total","type":"quantitative"},
      "text":{"field":"label","type":"nominal"}}}]}
```

The chart merges some types to stay readable. The full split, grouped the way the diagram at the top
groups failures:

| Kind | Round type | Passed | Failed | Pending | Ended with no result |
|---|---|---:|---:|---:|---:|
| Screen, HR or behavioural | Recruiter screen | 8 | 2 | 1 | 0 |
| | Hiring manager, behavioural or panel | 4 | 1 | 0 | 1 |
| | Final or CTO conversation | 3 | 0 | 1 | 0 |
| | *Subtotal* | *15* | *3* | *2* | *1* |
| Technical | Online or written test | 3 | 1 | 0 | 2 |
| | Live coding | 3 | 1 | 0 | 0 |
| | AI-assisted coding | 3 | 0 | 2 | 0 |
| | Existing codebase or code review | 2 | 0 | 0 | 0 |
| | System design | 4 | 0 | 0 | 0 |
| | Functional or case | 1 | 0 | 0 | 0 |
| | Take-home, with a demo where asked | 2 | 0 | 0 | 0 |
| | Other technical, mixed or format not recorded | 5 | 1 | 1 | 3 |
| | *Subtotal* | *23* | *3* | *3* | *5* |
| **Total** | | **38** | **6** | **5** | **6** |

Counted by process rather than by round, seven hiring processes ended in a rejection: three on a
technical round, three on a behavioural, HR or recruiter-screen round, and one at a stage my notes
don't record. Those are
the three failure nodes at the right of the diagram.

The two pending AI-assisted coding rounds are first rounds at trading firms. One process also includes
interviews I passed without my notes recording how many there were, so those rounds aren't in the
table.

The timing tells me more than the type does. Of the eight rounds I had sat by 7 September, four
failed: two recruiter screens, an online test and a round that combined coding with design. Of the 36
since, 34 passed. I don't have a clean cause. The later set holds more recruiter screens, manager rounds
and final conversations, 14 of the 36. Leaving them out, I still passed 21 of the other 22 later
rounds.

The two later failures were different kinds. One was a coding question built up in four parts, where
the interviewer gave no hints and I reached part two. My debrief's note on what broke is one word: pace.
In the other, I passed the technical screen and was then turned down because I didn't have the
background the role needed. I still find it odd that I was put through the interview at all if that
was going to decide it.
The earlier design-and-coding round has a clearer lesson. The coding part went fine, but I never raised
the distributed-transaction pattern the design needed, even though I had listed it in my prep.

## What the numbers support

The gap between in-house recruiters and cold applications is the one result I would defend. The
samples are small, but the difference is large enough that they don't erase it.

The agency rate of 10 in 19 is a fair description of my agency leads and nothing more. The
early-and-late split on cold applications is a hint at best, because two things changed in the same
week.

The per-round pass rates are anecdotes. Most types have five rounds or fewer, and a 100% on four rounds
says almost nothing. What I take from them is narrower: no round type has been a wall for me, and four
of my six failures came by early September.

There are seven offers so far: four from in-house recruiters and three through agencies. None came
from an application yet. One process that began with an application is waiting on the result of its
final round, and two more are still interviewing. I ended another after passing its interviews, at the
pay conversation.

## What I'm doing with it

Based on these numbers, recruiters gave me a far higher chance than my own applications. Of the leads I
took forward, 21 of 31 became a hiring process, against 4 of 36 applications. I still think cold
applications are fine to send, and they did produce four processes. Recruiter-started conversations
converted far better, and that is where all seven offers began.
