# Indie Hackers Launch Post

> **Where:** https://www.indiehackers.com/post/new
> **Title character limit:** 80
> **Tone:** More personal than HN. IH loves origin stories, real numbers,
> and "here's what I learned." Post the actual story — not a press release.

---

## Title

**I shipped LoopKit — a CLI that helps solo founders close the weekly loop (free + open source)**

Alternatives:
- **LoopKit — a 5-command CLI for solo founders who keep quitting (free)**
- **After 4 abandoned side projects, I built the habit tool I needed**
- **LoopKit: a free, open-source CLI for solo founders shipping weekly**

---

## Body

```
Hey IH 👋

Quick intro: I'm a solo dev. For the last 3 years I've started a
side project, shipped hard for a month, then lost momentum. Four
different projects, same pattern. Quit at week 3, 4, 5, and 4.

Last year I got tired of it and built LoopKit — a CLI that
enforces a weekly shipping loop. Five commands:

  init    — turn an idea into a scored, falsifiable brief
  track   — markdown tasks, git commits close them
  ship    — AI drafts your launch posts
  pulse   — async customer feedback, AI-clustered
  loop    — Sunday ritual: one decision, one post, streak starts

The whole thing is plain-text + git. No Notion. No Jira. No
"weekly check-in" emails. The state of your project is in your
repo, in files you can read.

**The thing I'm most proud of:**

The Sunday `loop` command. It runs AI synthesis on what you
shipped this week, asks you one hard question ("what's the ONE
thing holding you back?"), generates a build-in-public post, and
logs a streak counter. If you skip a Sunday, the streak breaks.

**The thing I'm least proud of:**

The hosted AI features cost money. I priced Solo at $19/mo and
Pro at $39/mo. That works for some founders and not others. I
made bring-your-own-Anthropic-key the escape hatch. If even
that's too much, the CLI-only stuff is genuinely free forever.

**Some real numbers:**

- 626 automated tests passing
- 13,700+ lines across 3 packages (CLI, web, shared)
- 4-minute time-to-first-brief
- Zero data collected without consent
- All my own data lives in `/Users/me/code/.loopkit/` — same place
  as your project

**What's next:**

I'm looking for 10 founders to try it for 4 weeks. If you ship
`loopkit loop` 4 Sundays in a row and it doesn't change anything
about how you work, I'll refund whatever you paid (Solo or Pro).

The free CLI is enough to start. `npx loopkit init` — no install,
runs from npm.

Happy to answer anything. Roast me on the pricing, the name, the
comparison to Notion — I can take it. 🫡
```

---

## What to pin in the first comment

Pin one of these (varies by post energy):

**Option A (default):**
```
Quick links:
• `npx loopkit init` (no install)
• https://loopkit.dev (landing)
• https://github.com/loopkit/loopkit (source)

If you try it and hit a wall, reply here or DM me. I'll fix it.
```

**Option B (if people ask "why?"):**
```
Origin story, since a few people asked:

2021 — newsletter SaaS, quit week 4
2022 — CLI tool for ICs, quit week 3
2023 — build-in-public tracker, quit week 5
2024 — habit tracker, quit week 4

I kept building the same thing: a tool to stop myself from
quitting. LoopKit is the one that worked. The difference
was that this time I made `loop` the central command —
not a setting, not a notification. The Sunday ritual.
```

---

## First-week reply playbook

**On "why not Notion/Jira/Todoist":**
> Fair question. I think they answer a different question. They manage *tasks*. LoopKit manages *weeks*. The "Sunday ritual" is the thing that makes it different — same as how Linear's cycles are different from Todoist's due dates. Try it for 2 weeks and you'll see the difference, or you won't, and that's fine too.

**On "the AI features are expensive":**
> Agreed. That's why the CLI-only path is genuinely free. `loopkit init` and `loopkit track` work without any account or API key. AI synthesis (`init --analyze`, `ship`, `pulse`, `loop`) is the part that costs. Solo at $19/mo is 100 AI calls; Pro at $39/mo is 1000. If that's still too much, the BYO-key path is one extra `loopkit auth --key` and the AI is local-to-you.

**On "is this just a habit tracker?":**
> No, and here's the test: a habit tracker reminds you to do the thing. LoopKit removes the things that *prevent* the thing. `init` removes the "I don't know what to build" freeze. `ship` removes the "writing a launch post takes 45 minutes" freeze. `loop` removes the "I'll think about what to do next week" freeze. Different mechanism, same destination.

**On "isn't 5 commands too many?":**
> Maybe. If 10 founders tell me they only use 2, I'll cut 3. I'm watching the telemetry to see which commands get used. The free tier only has 2 (`init` and `track`) — the other 3 are paid because they cost AI budget.
