---
title: My job search in numbers, and where the interviews came from
description: "Thirteen weeks of my own records: 39 applications, 70 recruiter reach-outs, pass rates by interview round, and which route produced the four offers."
date: 2026-10-21
updated: 2026-10-21
category: Career
tags: [job-search, interviews, recruiting, career]
draft: true
---

```uipack Each route loses people at a different stage. Applications stall at the first human read; in-house recruiter leads almost always become a process; agency leads are filtered twice, by me and then by the client. Equal-sized boxes, so only the counts carry the proportions. | Source: my own application tracker, 24 July to 21 October 2026.
job-search-funnel
```

Getting into a hiring process was the hard part of my job search. Once I was in one, I passed most
rounds. Over 13 weeks of records, from 24 July to 21 October 2026, 4 of my 36 decided applications
reached a screen, test or interview. Of the 31 recruiter leads I took forward, 21 did. Across every
route, I passed 33 of the 39 interview rounds that have a result. All four offers came from
conversations a recruiter started.

I would now spend less time on cold applications and more on making sure the right recruiters can
find me. The numbers below are why, along with where they are too thin to support anything.

## What I counted

Everything here comes from my own tracker: a log of every application, a log of every recruiter lead
and a debrief for each interview I sat. Three definitions carry most of the weight.

A **reply** is a person writing back with a next step. A rejection is counted separately, and
automated receipts don't count at all.
I treat a cold application as silent after 21 days with no reply. Three applications are still inside
that window, so they appear as sent and stay out of every rate.

A **hiring process** starts at the first screen, online test or interview run by the employer. A
pre-screen call with an agency doesn't count, because the employer hasn't seen me yet.

A **reach-out** is one recruiter lead in my log: one recruiter, one role or client. **Taken forward**
means I said yes and my CV or profile went in. Five reach-outs are logged without a note of whether the
recruiter was in-house or at an agency; they appear in the chart as their own row and in the totals.

## Applications against recruiter reach-outs

I sent 39 applications: 37 cold through careers pages and two with a referral. Over the same 13 weeks
I logged 70 recruiter reach-outs: 19 from in-house recruiters, 46 from agencies and five where my notes
don't say which.

```vega-lite An in-house recruiter's lead almost always became a hiring process. A cold application rarely did. | Source: my own application tracker, as of 2026-10-21.
{"title":{"text":"Reached a screen, test or interview, by how it started","subtitle":"Share of applications sent, or of recruiter leads I took forward. Three applications still inside my 21-day wait are left out."},
 "height":{"step":38},
 "data":{"values":[
   {"route":"In-house recruiter","pct":91.7,"label":"11 of 12","kind":"A recruiter reached out"},
   {"route":"Recruiter, type not recorded","pct":66.7,"label":"2 of 3","kind":"A recruiter reached out"},
   {"route":"Agency recruiter","pct":50,"label":"8 of 16","kind":"A recruiter reached out"},
   {"route":"Applied cold","pct":11.8,"label":"4 of 34","kind":"I applied"},
   {"route":"Applied with a referral","pct":0,"label":"0 of 2","kind":"I applied"}]},
 "encoding":{
   "y":{"field":"route","type":"nominal","sort":["In-house recruiter","Recruiter, type not recorded","Agency recruiter","Applied cold","Applied with a referral"],"title":null},
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

Agencies sit in the middle, and they lose people in two places. I declined to send a CV for 30 of the
46 leads, often because the message didn't name the client or the pay band. Of the 16 I took forward,
8 reached a process. The other 8 stopped at the CV, and in some of those I never learned whether the
client saw it at all.

Cold applications split by date in a way I didn't expect. The 20 I sent before 22 September produced
one late reply and one resume-stage rejection. Fifteen of those went out on a single day in
mid-September, mostly to forward-deployed roles at the best-known AI companies, and many asked for more
years than I have. The 14 decided applications I sent from 22 September onward produced four replies.
Three have already become interviews and the fourth has a screen booked. My read is that targeting
mattered, but I rewrote my resume the same week, so I can't separate the two, and 14 is a small sample.

The one reply from the early batch is an odd case. A recruiter got back to me six weeks after I
applied, and my notes don't say whether that was the application resurfacing or a fresh search. I
count it as a reply to the application.

### What changed since my early sample

In my [LinkedIn article](/linkedin-optimization) I quoted an early sample: 10 of 11 in-house recruiter
leads had reached a hiring process, and none of my three applications had replied. When I reconciled my
inbox and email in September, two of those 11 turned out to be agency leads, so that figure no longer
stands as written. With two more months of data, the in-house rate held. It is 11 of the 12 leads I took
forward, or 11 of 19 if I count every in-house reach-out, including the seven I turned down.
Applications moved from zero of three to five replies from 36 decided sends.

## Once I was in a room

The 39 rounds with a result include every route. Six more are pending and eight ended with no result:
six went silent after the round, and two closed for reasons outside the round itself. Neither group is
in any rate below.

```vega-lite I passed most rounds of every type. Half the failures sit in the mixed or unrecorded bucket. | Source: my own interview debriefs and application tracker, as of 2026-10-21.
{"title":{"text":"Interview rounds with a result, by type","subtitle":"Passed and failed only. Six pending rounds and eight that ended without a result are left out."},
 "height":{"step":38},
 "layer":[
   {"data":{"values":[
      {"type":"Recruiter screen","outcome":"Passed","n":8},
      {"type":"Recruiter screen","outcome":"Failed","n":1},
      {"type":"Online or written test","outcome":"Passed","n":3},
      {"type":"Online or written test","outcome":"Failed","n":1},
      {"type":"Live coding","outcome":"Passed","n":3},
      {"type":"Live coding","outcome":"Failed","n":1},
      {"type":"AI-assisted coding or codebase","outcome":"Passed","n":4},
      {"type":"Design, case or take-home","outcome":"Passed","n":6},
      {"type":"Hiring manager or final","outcome":"Passed","n":6},
      {"type":"Other or unrecorded technical","outcome":"Passed","n":3},
      {"type":"Other or unrecorded technical","outcome":"Failed","n":3}]},
    "mark":{"type":"bar"},
    "encoding":{
      "y":{"field":"type","type":"nominal","title":null,"sort":["Recruiter screen","Online or written test","Live coding","AI-assisted coding or codebase","Design, case or take-home","Hiring manager or final","Other or unrecorded technical"]},
      "x":{"field":"n","type":"quantitative","stack":"zero","title":"rounds","axis":{"grid":true,"tickMinStep":1}},
      "color":{"field":"outcome","type":"nominal","scale":{"domain":["Passed","Failed"],"range":["#1baf7a","#eb6834"]},"legend":{"orient":"top","title":null}},
      "order":{"field":"outcome","sort":"descending"}}},
   {"data":{"values":[
      {"type":"Recruiter screen","total":9,"label":"8 of 9"},
      {"type":"Online or written test","total":4,"label":"3 of 4"},
      {"type":"Live coding","total":4,"label":"3 of 4"},
      {"type":"AI-assisted coding or codebase","total":4,"label":"4 of 4"},
      {"type":"Design, case or take-home","total":6,"label":"6 of 6"},
      {"type":"Hiring manager or final","total":6,"label":"6 of 6"},
      {"type":"Other or unrecorded technical","total":6,"label":"3 of 6"}]},
    "mark":{"type":"text","align":"left","dx":8,"fontWeight":600,"fontSize":13},
    "encoding":{
      "y":{"field":"type","type":"nominal","sort":["Recruiter screen","Online or written test","Live coding","AI-assisted coding or codebase","Design, case or take-home","Hiring manager or final","Other or unrecorded technical"]},
      "x":{"field":"total","type":"quantitative"},
      "text":{"field":"label","type":"nominal"}}}]}
```

The chart merges some types to stay readable. The full split:

| Round type | Passed | Failed | Pending | Ended with no result |
|---|---:|---:|---:|---:|
| Recruiter screen | 8 | 1 | 1 | 0 |
| Online or written test | 3 | 1 | 0 | 2 |
| Live coding | 3 | 1 | 0 | 0 |
| AI-assisted coding | 3 | 0 | 2 | 0 |
| Existing codebase or code review | 1 | 0 | 0 | 1 |
| System design | 3 | 0 | 0 | 1 |
| Functional or case | 1 | 0 | 0 | 0 |
| Take-home, with a demo where asked | 2 | 0 | 0 | 0 |
| Hiring manager, behavioural or panel | 3 | 0 | 1 | 1 |
| Final or CTO | 3 | 0 | 1 | 0 |
| Other technical, mixed or format not recorded | 3 | 3 | 1 | 3 |
| **Total** | **33** | **6** | **6** | **8** |

The two pending AI-assisted coding rounds are first rounds at trading firms. Two processes also
include interviews I passed without my notes recording how many there were, so those rounds aren't in
the table.

The timing tells me more than the type does. Four of the five rounds I sat before September failed: the
earliest recruiter screen, an online test, a round that combined coding with design, and a round whose
format I didn't record. Since September, 32 of 34 have passed. I don't have a clean cause. The later set
holds more recruiter screens, manager rounds and final conversations, 14 of the 34, and those are the
rounds I pass most easily. Leaving them out, I still passed 18 of the other 20 later rounds.

The two later failures have something in common. One was a coding question built up in four parts,
where the interviewer gave no hints and I reached part two. My debrief's note on what broke is one word:
pace. The other was a technical conversation about evaluation work, which my debrief doesn't explain.
The earlier design-and-coding round has a clearer lesson. The coding part went fine, but I never raised
the distributed-transaction pattern the design needed, even though I had listed it in my prep.

## What the numbers support

The gap between in-house recruiters and cold applications is the one result I would defend. The
samples are small, but the difference is large enough that they don't erase it.

The agency rate of 8 in 16 is a fair description of my agency leads and nothing more. The early-and-late
split on cold applications is a hint at best, because two things changed in the same week.

The per-round pass rates are anecdotes. Most types have four rounds or fewer, and a 100% on three rounds
says almost nothing. What I take from them is narrower: no round type has been a wall for me, and four
of my six failures came before September.

There are four offers so far: one from an in-house recruiter, two through agencies, and one where my
notes don't record which kind of recruiter it was. None came from an application yet. One process that
began with an application is waiting on the result of its final round. I ended another after passing
its interviews, at the pay conversation.

## What I'm doing with it

My rule for the rest of this search is simple. I keep the profile current so in-house recruiters keep
finding me. I send cold applications only to roles that fit my years of experience, and I send few of
the stretches. For the most-applied-to companies, I'd rather find a referral or write to the hiring
manager than fill in another form, though my two referrals got no reply either. That part is a bet,
not a finding.

If I were starting over, I would fix the profile first and send fewer cold applications to famous
companies. Every offer I have came from a conversation that started on someone else's side.
