# LoopKit

**The Solo Founder's Shipping OS**

Define · Develop · Deliver · Learn · Repeat

---

Five commands. One loop. The entire shipping cycle closed from your terminal.

```
$ npx loopkit init
```

## The Problem

Solo founders are strong builders but weak shippers. The loop — define → develop → deliver → feedback → iterate — was designed for teams. Every tool handles one phase. None connects them.

**LoopKit connects them.**

## The Loop

| Command | Phase | What It Does |
|---|---|---|
| `loopkit init` | Define | Turn a fuzzy idea into a scored, falsifiable brief |
| `loopkit track` | Develop | Tasks in markdown. Commits close them automatically |
| `loopkit ship` | Deliver | AI writes your HN post, Twitter thread, and IH update |
| `loopkit pulse` | Feedback | Async feedback, AI-clustered, no meetings required |
| `loopkit loop` | Iterate | Sunday ritual — one decision, one post, loop closed |

## Quick Start

```bash
# Start with an idea
loopkit init

# Add tasks and build
loopkit track --add "Build the landing page"
git commit -m "feat: add hero section [#1]"  # task auto-closes

# Ship it on Friday
loopkit ship

# Review on Sunday
loopkit loop
```

## How It Works

### `loopkit init` — 4 minutes to clarity

Five questions. AI scoring. A brief that stings when it should.

- Problem score, ICP score, MVP scope score (each 1–10)
- Riskiest assumption named explicitly
- One async validation action you can do tonight

### `loopkit track` — zero-overhead task management

- Tasks live in plain markdown (`.loopkit/projects/[name]/tasks.md`)
- Git hook auto-closes tasks when you reference `[#N]` in commits
- Stale task detection after 3 days
- Shipping score: tasks completed / tasks planned

### `loopkit ship` — never stare at a blank tweet again

- Reads your brief + completed tasks
- Generates drafts for Show HN, Twitter, and Indie Hackers
- Pre-launch checklist catches what you forgot
- 60 seconds from command to three drafts

### `loopkit pulse` — feedback that comes to you

- Share a feedback link with your users
- AI clusters responses into: Fix now / Validate later / Noise
- Tag clusters directly to your sprint
- Zero social energy required

### `loopkit loop` — the Sunday ritual

- Aggregates your week: tasks, feedback, ship logs
- AI recommends the single highest-leverage thing for next week
- Generates a build-in-public post
- One decision. One post. Week done.

## Pricing

| Tier | Price | Includes |
|---|---|---|
| Free | $0/forever | 1 project, full CLI, git sync |
| Solo | $19/month | 5 projects, AI features, pulse clustering |
| Pro | $39/month | Unlimited, web dashboard, BYOK API key |

## Local First

All project data lives in `.loopkit/` in your repo. No forced cloud sync. No vendor lock-in. Your data is yours.

```
.loopkit/
├── config.json
├── projects/
│   └── [project-slug]/
│       ├── brief.md
│       ├── brief.json
│       └── tasks.md
├── ships/
│   └── YYYY-MM-DD.md
└── logs/
    └── week-N.md
```

## Tech Stack

- **CLI:** Node.js + Commander + Clack
- **AI:** Vercel AI SDK + Claude
- **Web:** Next.js 15
- **Database:** Convex (for pulse responses)

## Philosophy

1. **CLI-first, web-optional** — developers live in the terminal
2. **Async by default** — no meetings, no community management
3. **Opinionated over flexible** — fewer decisions = more shipping
4. **AI-augmented, not AI-dependent** — you stay in control

---

Built by a solo founder, for solo founders.

*The best time to ship was yesterday. The second best time is now.*
