---
title: Job prep is mostly small things, done in the right order
description: An 80/20 plan for job prep with a CS degree. Pick the role, fix LinkedIn and the resume, rehearse the opening and close, then train each technical round.
date: 2026-10-21
updated: 2026-10-21
category: Career
tags: [job-search, interviews, career, linkedin, system-design]
draft: false
---

```uipack The cheap steps come first because each one gates the next: the role decides the profile, the profile and resume get you the call, and the opening and close frame every round. The technical rounds below are ordered by how much they decide an offer, and each one is trained differently. Ordering is my read, not a measurement.
job-prep-order
```

Most job prep goes into the hardest part first. People with CS degrees open a problem list on day one,
grind for weeks, and then miss out on things that would have taken an afternoon to fix: a profile no
recruiter can find, a resume aimed at three jobs at once, an introduction that recites their degree.
I would do it the other way round. Spend the first few hours on the small things that gate everything
after them, then train the technical rounds properly.

The idea underneath all of it is that interviewing is a skill. It is trained the same way a sport is
trained: reps, feedback and a few patterns you learn to recognise. The first attempts feel bad for
everyone. That is the starting point of the training, not a verdict on you.

The steps below are in the order I would do them, which is also the order of how much I think each
one affects whether you get a job.

## 1. Pick one role

Decide what you are interviewing for before you prepare anything: software engineer, forward-deployed
engineer, data engineer, something else. Each role runs a different loop. A backend software engineer
loop leans on coding rounds and system design. A forward-deployed engineer loop adds customer cases,
take-homes and presentations. Data roles lean on SQL, statistics or pipeline design, depending on
whether the team does analytics, science or engineering.

The role decides what you train, which words go on your profile and what the first line of your resume
says. Preparing for three roles at once gives each of them a third of the practice and gives every
reader a profile that describes nobody in particular. Pick one, and allow at most one close neighbour.

## 2. Point LinkedIn at that role

Recruiters search by title, skills and location. If your headline says "Aspiring engineer | Lifelong
learner", you are not in the search they run. Put the role you chose first, add the specialty and the
technologies that define it, and make the rest of the profile prove the headline.

I wrote up the full process separately: [why I optimize LinkedIn once a year](/linkedin-optimization).
The short version is that a profile keeps working while you are busy, and an inbound recruiter has
already matched you to an open role before the first message arrives. In my own search, every offer
started with a recruiter's message; [the numbers are here](/job-search-numbers).

## 3. Write the resume for that role

One page, written for the role from step 1. The top third does most of the work, so the most relevant
experience goes there. Each bullet says what you built, how it worked and what changed because of it.
"Worked on backend services using Java and Kafka" says what you touched. "Built the nightly job that
reconciles refunds against the processor's files, so finance reviews only the mismatches" says what
you did.

Treat every line as a question you will be asked. If you cannot talk about a bullet for two minutes,
including what you would do differently, cut it or rewrite it until you can. Keep titles and dates
identical to LinkedIn; a recruiter will notice when they disagree.

New graduates have the same raw material in a different shape. Internships, a final-year project and
one serious side project, each written as a problem, a mechanism and a result, are enough.

## 4. Rehearse the first and last five minutes

Almost every interview opens with "tell me about yourself" and ends with "do you have any questions
for us?". They are the only parts of the round you know in advance, which makes them the cheapest
minutes to improve. They also set the tone for everything in between.

The frame I use is that an interview is a conversation between two people deciding whether to work
together. You are evaluating them too. A candidate who sounds desperate agrees with everything, asks
nothing and oversells. A candidate who is having a conversation listens, picks up on what the
interviewer said and asks about it.

### A one-minute introduction

Here are two versions from the same fictional backend engineer, interviewing at a fictional payments
company I will call Tallypay.

**The weak version:**

> Hi, so I graduated in computer science in 2021 and joined a fintech as a software engineer. I worked
> on a lot of things there, like Java, Spring Boot, Kafka, some React and AWS. After two years I moved
> to an e-commerce company, where I work on the backend for the checkout team. I'm a fast learner and
> a team player, and I'm looking for new opportunities where I can grow.

It walks through the resume in date order, lists tools without saying what was built with them and
ends on adjectives the interviewer has no reason to believe. Nothing in it gives them a thread to pull.

**The strong version:**

> I'm a backend engineer, about four years in, mostly on checkout and payments at an e-commerce
> company. The project I'm proudest of is refund reconciliation. Finance used to match refunds against
> the processor's settlement files by hand every month, so I built a service that does it every night
> and flags only the mismatches. Now they review a short list instead of a spreadsheet, and we catch
> processor errors the next day instead of at month end.
>
> Before that I spent two years at a fintech, which is where I learned that every money movement has
> to add up.
>
> The common thread is that I like systems where correctness is the product. That's what drew me to
> Tallypay. You're moving payouts to real time, and keeping that reconcilable is the problem I've been
> working on. I'd love to bring that here.

It says the role in the first sentence, tells one story with a mechanism and a result, names a thread
and connects it to this company. It also ends on the story the candidate most wants to be asked about,
which is often where the next ten minutes go.

Don't memorise the words. Memorise the beats (role, one proof story, the thread, why them), say it out
loud, record it once and cut it rather than speaking faster. My own first recorded introduction was a
resume recital much like the weak version. The fix was rehearsal, not talent.

### Questions at the end

Same fictional round. Earlier, the interviewer mentioned that Tallypay is moving merchant payouts from
a nightly batch to real time.

**Questions that end the conversation:**

- "So what does Tallypay do?" Their homepage answers it.
- "What's the salary range, and how many leave days do I get?" These are real questions for the
  recruiter, not for the engineer interviewing you.
- "How did I do?" It puts the interviewer on the spot, and they usually cannot tell you anyway.
- "No, I think you covered everything." It closes the one part of the round you control.

**Questions that keep it going:**

- "You mentioned payouts are moving to real time. What breaks first when you do that: reconciliation
  with the banks, or the fraud checks that used to run overnight?"
- "When a payout goes wrong today, who notices first: the merchant, support or an alert?"
- "What would the person in this role own in the first six months, and what would make you say the
  hire worked?"
- "Where do new engineers usually get stuck in the ledger code?"

The good questions build on something the interviewer said, only someone inside the team can answer
them, and each one invites a follow-up where your own experience fits ("we hit the same problem with
refunds; we ended up doing X"). Prepare two before every interview and ask the one the conversation
has not already answered.

## 5. Train the technical rounds

Six kinds of technical round come up. They overlap, but each is passed in a slightly different way,
so it is worth knowing which one you are walking into. Ask the recruiter for the format; they will
usually tell you.

### System design

Learn one framework and use it every time. [Hello Interview's delivery
framework](https://www.hellointerview.com/learn/system-design/in-a-hurry/delivery) is the one I use:
requirements, core entities, the API, an optional data flow, a high-level design, then deep dives. The framework is what
stops you drawing boxes before you know what the system has to do.

Then make an AI model interview you. Reading designs feels like progress; defending one under
follow-up questions is the actual skill. A prompt like this works:

```text
Interview me for a mid-level backend role. Give me one system design question, such as a payments ledger or a rate limiter, and stay in character as the interviewer. Do not design it for me. After each of my answers, push on the weakest part: scale, failure, consistency or cost. At the end, grade me on requirements, high-level design, deep dives and communication, and tell me the three things to fix.
```

### LeetCode

LeetCode is consistency. It is the most trainable round and the most discouraging one at the start,
when every problem feels new. It stops feeling new because the problems repeat a small set of patterns:
two pointers, sliding windows, binary search, graphs, heaps, dynamic programming. After enough reps you
recognise the pattern from the prompt, and that recognition is most of the round.

Do a few problems most days instead of a lot on weekends. Group them by pattern, time yourself, talk
through your approach out loud as you would in the room, and redo the ones you missed a few days later.

### Low-level design

Low-level design sits in the same vein as LeetCode, but you build a small working program in stages
instead of solving one puzzle: an order book, a key-value store with transactions, a calculator over a
stream of trades. Each stage adds a requirement. In my experience it comes up rarely, and mostly at
trading firms such as Jane Street and Jump.

What passes is clean structure that absorbs the next requirement without a rewrite. If the whole
problem is visible up front, read every part before choosing your data model, then build the first
part end to end with tests before touching the second.

### AI-assisted coding

This is the newest format. You get a coding problem and an AI assistant, and the interviewer watches
how you work with it. They want to see how you prompt, what you ask before you start, and whether you
notice when the AI is wrong.

The failure mode is pasting the whole problem in and accepting what comes back. What works is
clarifying the requirements yourself, writing the plan as types and function signatures, and then
giving the AI small, scoped requests ("fill in this method"). Read every change before accepting it,
run the tests and say out loud when the output is wrong and why. Catching the AI's mistake is often
the strongest moment of the round.

### Codebase debugging

You are handed a medium-sized repository you have never seen and asked to find bugs, explain them and
usually add a feature. The bugs tend to be simple once found: a wrong condition, a unit mix-up, a
retry that runs twice. The round is really about how you read unfamiliar code.

Map the code before touching it. Run the app and the tests first, because a failing test is a free
lead. Follow one request from the entry point to the data layer and say what you see as you go. Then
fix one bug at a time: one hypothesis, a print or a test to confirm it, the smallest fix and a test
that would have caught it.

For every bug, say the impact and rank it. "A retried webhook charges the customer twice" matters more
than a crash, and a crash matters more than slow code. Match the codebase's existing style even when
you would write it differently, and say that you are doing so. Interviewers in this round tend to go
quiet; keep narrating anyway.

### Take-homes

A take-home is graded twice: once on what you built, and again in the review call where you defend it.
Most of the second grade comes from knowing your own code. Be ready to explain every line, especially
any the AI wrote, and prepare answers to the questions that always come: why this design, what you
left out, what breaks at ten times the load and what you would do with another week.

Scope it down to one workflow that works end to end, set a time budget and stop when it runs out. In
the presentation, keep three things visibly separate: what you implemented, what you demonstrated
working and what you are proposing. A short slide deck helps more than people expect. It gives the
call a structure, puts the result on screen early and stops you scrolling through files while the
interviewer waits. Rehearse it out loud and time it.

## Train it like a skill

None of this is a one-off. Do mock interviews out loud, with a friend or an AI model. After every real
interview, write down the questions and the moment it went wrong while you still remember it, and
turn that into the next practice rep. Each debrief makes the next interview slightly easier than the
last.

If you are starting this week, do the steps in order. The role, the profile, the resume and the first
and last five minutes take days, not months, and once they are done, stop polishing them. Put
everything after that into the technical round your target role uses most, every day, until it stops
feeling new.
