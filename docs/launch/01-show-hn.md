# Show HN — Hacker News Launch Post

> **When to post:** Tuesday–Thursday, 8–10am ET. Avoid Mondays and weekends.
> HN penalizes self-promotion that smells like marketing. Lead with the
> problem, not the product. Be honest about what's rough.

---

## Title (80 char max — keep under 80)

**LoopKit – A CLI that gets solo founders to week 7**

Alternatives:
- **Show HN: LoopKit – A weekly shipping loop for solo founders** (longer, clearer "Show" prefix)
- **Show HN: LoopKit – One CLI. Five commands. One weekly shipping loop.**
- **Show HN: LoopKit – I kept quitting projects at week 4, so I built this**

The "I kept quitting" angle is the most HN-native. It signals self-awareness and a real origin story, not a marketing pitch.

---

## Body (text post — links in the comments, not the body)

```
Hi HN,

I'm a solo developer. For 3 years I kept starting projects and quitting
between week 3 and week 5. Not because they were bad ideas — because the
loop broke.

Define → Develop → Ship → Listen → Iterate. Five phases. Each needs a
different tool, a different energy, a different evening. I couldn't hold
all of them in my head at once, so the project drifted.

I built LoopKit to be the thing that holds the loop.

It's a CLI with 5 commands:
  init    — turn an idea into a scored, falsifiable brief in 4 minutes
  track   — markdown tasks. Git commits close them.
  ship    — AI drafts your HN post / Twitter thread / IH update
  pulse   — async feedback that comes to you, AI-clustered
  loop    — Sunday ritual: one decision, one post, loop closed

The whole thing runs locally. Your tasks live in plain markdown files.
Your projects stay in your repo. The AI features use either your own
Anthropic key or a hosted tier ($19/mo Solo, $39/mo Pro, free for the
CLI-only basics).

I shipped v0.2.1 this week. 626 tests, no external services required
to start. Looking for 10 founders to try it for 4 weeks and tell me
what breaks.

`npx loopkit init` — that's the install.

Tech: TypeScript monorepo, Commander.js CLI, Convex for the sync
backend, Next.js for the dashboard. Code is here: <link in first
comment>

Honest things I don't love yet:
- The dashboard is functional, not pretty
- No team mode (intentional — solo founders first)
- AI costs money if you use the hosted tier; bring-your-own-key is
  the escape hatch
- Streaks reset at midnight UTC, not your local midnight

What I'd love feedback on:
1. Does the 5-command model feel right, or is it 4 / 6 / 2?
2. Is the Sunday ritual too prescriptive or not prescriptive enough?
3. What would you cut if you only had 2 commands?

Thanks for reading.
```

---

## First comment (post this immediately after the submission)

```
Thanks for the kind words / tough questions. A few things I should
have said in the post:

• Repo: https://github.com/loopkit/loopkit
• Docs: https://loopkit.dev/docs
• Try it: `npx loopkit init` (no install — runs from npm)
• 4-minute demo: <short loom link or 30s GIF>

Origin story, in case it's useful:
2021: built a SaaS for newsletter writers, quit at week 4
2022: built a CLI for ICs, quit at week 3
2023: built a "build in public" tool, quit at week 5
2024: built a habit tracker, quit at week 4

The pattern was always the same. I'd ship hard for a month, lose
momentum when one phase got hard, never recover. LoopKit is the
narrowest possible thing I could build to fix that pattern for
myself. If it works for 10 other people with the same pattern,
it's a product.

What's the 2-command version? I've thought about it. Probably
`init` (define) and `loop` (close the week). Drop ship / pulse
into the background. If 5 founders tell me they only use 2
commands, I cut the other 3.

Happy to answer any questions.
```

---

## Post-launch checklist (T+24h, T+72h, T+1week)

**T+24h — check the comments, answer every question**
- Don't defend. Don't argue. Just answer.
- If someone hits a real bug, fix it and reply with the fix.
- If the post is at 0 points after 2 hours, do not delete. Reply to
  every comment and let it ride.

**T+72h — write the "what I learned" thread**
- "I posted LoopKit on HN. Here's what worked and what didn't."
- The "what didn't" part is what gets traction in week 2.

**T+1week — email everyone who starred the repo**
- Subject: "You starred LoopKit on HN. Quick question."
- Body: 2 sentences + "what stopped you from running `npx loopkit init`?"
- This is the highest-converting email you'll ever send.

---

## Backup titles (if the first is dead on arrival)

1. Show HN: LoopKit – A weekly ritual for solo founders who keep quitting
2. Show HN: LoopKit – I ship one thing every Sunday or the streak breaks
3. Show HN: LoopKit – The 5-command CLI that beats my Notion graveyard
4. Show HN: LoopKit – Plain-text tasks, git-tracked, AI-assisted launches
