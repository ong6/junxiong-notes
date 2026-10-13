# Handoff: the AI workflow post

Started 2026-10-13. Not drafted yet. This is the plan, the evidence and what changed in the setup
while preparing it, so a later session can pick it up cold.

## The post

For notes.junxiong.dev, written with the `write-a-blog` skill (now linked into this repo on the
company Mac). Follow the frontmatter of the existing articles in `content/articles/`.

Working title: "Most of my prompts are spoken". The one arguable sentence: most of what I send
coding agents is dictated, and a second model rewrites it into a prompt before the agent sees it,
so the input layer matters more than prompt wording.

Skills get a passing mention, not a section that features them. Something like: when a job keeps
coming back, I choose to make it a skill, and the prompt then says what to do while the skill says
how I do it.

## Outline

1. **Opening claim.** Most prompts are spoken. Lead with the numbers once they cover every Mac (see
   Evidence).
2. **Why raw speech is a bad prompt.** The ask is buried mid-sentence, firm and tentative get mixed,
   and the speech model mishears my accent ("scale" for skill, "PID" for PRD, "death harness" for
   dev harness). One before/after. The dev-harness example in the store's `agent-prompt.md` is the
   best candidate. TODO: confirm it came from a real dictation before calling it one.
3. **The rewrite layer.** Parakeet transcribes locally, GPT-5.6 Terra rewrites with my agent prompt,
   and the result is pasted. What it will not do: add requirements, or turn "maybe" into "must".
   The labels it uses (Context, Constraints, Done when, Open questions, How to work) and why "Done
   when" and "Open questions" carry the most weight. "Transcribe as is" as the escape hatch.
4. **Two kinds of fixes.** This came out of today's tuning and is the most concrete mechanism in
   the post. Fixes that need context (is "scale" a skill or a scale?) stay in the model's prompt.
   Heard forms that are never real words go into Muesli's dictionary, which runs after the model
   with no context. The test for which side a word goes on: "Scareful" can't go in the dictionary
   because at Muesli's fuzzy threshold it also matches "careful".
5. **Skills, briefly.** The one-paragraph mention above. Link to
   `context-engineering-for-coding-agents` for what each loaded skill costs in context.
6. **Where it breaks.** The vocabulary needs a monthly review. The rewrite can be confidently wrong.
   Muesli only stores the cleaned text, so the review sees the mistakes that got through, not the
   ones that were fixed.
7. **Ending.** One decision for the reader. Draft: fix the input before you tune the agent.

Link, don't repeat: `context-engineering-for-coding-agents.md` (token cost) and
`opus-orchestrating-gpt-agents.md` (long runs with an orchestrator).

## Evidence so far

From the company M3 Pro only. Dictation history is per Mac (Muesli's iCloud sync is off), so the
opening numbers need the other Macs too.

- 212 dictations from 2026-09-24 to 2026-10-12, about 15,500 words.
- 176 dictations (13,579 words) went into VS Code, 30 (1,693 words) into the Codex app, and 4 into
  Chrome. Muesli labels the Codex app "ChatGPT", but its bundle id is `com.openai.codex`, so
  almost everything went to coding agents. TODO: confirm the VS Code dictations are Claude Code
  sessions.
- The drop from 41 dictations on 2026-10-02 to 1–5 a day after 2026-10-08 is most likely work
  moving to another Mac. Check before reading anything into it.
- Skill use across both Macs (from `skills-private/usage/`): cv 25, web-extract 23,
  interview-prep 18, feedback-loop 12, job-search 12, 25 skills used at least once. Background
  only, since skills are not featured.

To collect the same numbers on another Mac:

```sh
sqlite3 -readonly "$HOME/Library/Application Support/Muesli/muesli.db" \
  "select target_app_name, target_app_bundle_id, count(*), sum(word_count), min(timestamp), max(timestamp)
   from dictations where deleted_at is null group by 1, 2 order by 3 desc;"
```

## Setup changes made on 2026-10-13

All of these are in the store under `life/tech/mac-setup/muesli/` and reach every Mac on its next
`./sync-muesli.py`.

- **Mishearings split between prompt and dictionary.** `vocabulary.md` now has an *Always replace*
  table (27 heard forms, such as Grumplane, datancy, Telenex and "death harness") that the sync
  writes into Muesli's `custom_words` at a 0.95 threshold. Each was checked against
  `/usr/share/dict/words` and every past dictation, with no false matches. Context-dependent fixes
  stay in the prompt. The prompt went from 10,760 to 10,149 characters. Dictionary words added in
  the app survive syncs: the store's entries have ids derived from the word, and only those are
  replaced.
- **Skills linked into this repo on the company Mac.** Its profile in `life/tech/machines.json` was
  project scope with the store as the only repo, so sessions here had none of the writing skills.
  `junxiong-notes` is now in its repo list, and the links are kept out of git by
  `.git/info/exclude`. The M4 Pro already uses user scope, so it was unaffected.
- **Dropped:** a lighter ChatGPT-specific prompt. Those dictations go to the Codex app, so the
  agent format is right for them. Muesli passes the target app to the model as `<APP-CONTEXT>`, so
  a per-app rule is possible later if dictation into chat or Lark grows.
- **Already handled before today:** the repo and skill names in the prompt are generated from the
  folders on every sync, so they don't drift.

## Next steps

1. Run the query above on the other Macs and add up the totals.
2. Settle the two TODOs above.
3. Draft with `write-a-blog`, then `npm run lint` and `npm run build`.
