# LoopKit

**The CLI for solo technical founders shipping weekly**

Define · Develop · Deliver · Feedback · Iterate

---

Five commands. One weekly loop. Define the bet, build against it, ship, collect feedback, and decide the next move from your terminal.

```bash
$ npx loopkit init
```

## The Problem

Solo technical founders are strong builders but weak weekly shippers. The loop — define → develop → deliver → feedback → iterate — was designed for teams. Every tool handles one phase. None connects them from the terminal.

**LoopKit connects them.**

## The Weekly Loop

| Command                        | Phase        | What It Does                                             |
| ------------------------------ | ------------ | -------------------------------------------------------- |
| `loopkit init`                 | Define       | Turn a fuzzy idea into a scored, falsifiable brief       |
| `loopkit track`                | Develop      | Tasks in markdown. Commits close them automatically      |
| `loopkit ship`                 | Deliver      | AI writes your HN post, Twitter thread, and IH update    |
| `loopkit pulse`                | Feedback     | Async feedback, AI-clustered, no meetings required       |
| `loopkit loop`                 | Iterate      | Sunday ritual — one decision, one post, loop closed      |

## Secondary Add-Ons

These commands support the loop, but they are not the product's center of gravity.

| Command                        | What It Does                                             |
| ------------------------------ | -------------------------------------------------------- |
| `loopkit radar`                | Scan PH & HN for competitor launches in your category    |
| `loopkit keywords`             | Find low-competition keywords for content strategy       |
| `loopkit timing`               | Market timing signal — is your space heating up?         |
| `loopkit coach`                | AI coaching based on your shipping patterns              |
| `loopkit revenue`              | Track structured MRR/ARR records                         |
| `loopkit init --template <id>` | Pre-fill & AI-personalize tasks with 9 project templates |

## Quick Start

```bash
# Start with an idea
loopkit init

# Add tasks and build
loopkit track --add "Build the landing page"
git commit -m "feat: add hero section [#1]"  # task auto-closes

# Collect feedback inline
loopkit pulse --add "The onboarding flow is confusing"
loopkit pulse --add "I wish I could export to Notion"

# Ship it on Friday
loopkit ship

# Review on Sunday
loopkit loop
```

## Documentation

| Resource                             | Description                                                      |
| ------------------------------------ | ---------------------------------------------------------------- |
| [Quick Start](docs/QUICK_START.md)   | Get from zero to shipping in 15 minutes                          |
| [User Guide](docs/USER_GUIDE.md)     | Full philosophy, tips, and how to get the most out of LoopKit    |
| [User Stories](docs/USER_STORIES.md) | Every feature mapped to real user needs with acceptance criteria |
| [Scenarios](docs/SCENARIOS.md)       | Happy paths, edge cases, and error recovery flows                |
| [Personas](docs/PERSONAS.md)         | Who LoopKit is built for and how they use it                     |

## How It Works

### `loopkit init` — 4 minutes to clarity

Five questions. AI scoring. A brief that stings when it should.

- ICP score, Problem score, MVP scope score (each 1–10)
- **Overall score** — averaged anchor at a glance
- Riskiest assumption named explicitly
- One async validation action you can do tonight
- **Sunday Reminder**: Provides a helpful hint to set a recurring calendar event or cron job to close your week

### `loopkit track` — zero-overhead task management

- Tasks live in plain markdown (`.loopkit/projects/[name]/tasks.md`)
- Git hook auto-closes tasks when you reference `[#N]` in commits
- Stale task detection after 3 days — keep, snooze, or cut
- Snoozed tasks hidden until the snooze date, then resurfaced automatically
- Cut tasks archived to `cut.md` — never silently deleted
- Shipping score: tasks completed / tasks planned
- **Daily Standup**: `loopkit track --stand` prompts for your #1 focus today and logs it to track daily momentum

### `loopkit ship` — never stare at a blank tweet again

- Reads your brief + completed tasks for AI context
- Generates drafts for Show HN, Twitter, and Indie Hackers
- Per-draft: **use**, **edit in `$EDITOR`**, **regenerate**, or **skip**
- Pre-launch checklist catches what you forgot (runs *after* draft generation to get to value faster)
- AI output remains calibrated by truncating long descriptions
- Auto-triggers `celebrate` confetti, but only if you actually use a draft
- Ship log saved to `.loopkit/ships/YYYY-MM-DD.md`

### `loopkit pulse` — feedback that comes to you

- **Hosted Form & Widget**: Collect feedback async via your own `/pulse/[projectId]` hosted page or an embeddable JS widget on your landing page. Fully supports offline submission with automatic real-time sync.
- Add responses from the CLI: `loopkit pulse --add "user said this"` (automatically deduplicates)
- Embeddable widget displays your actual `projectId` for easy copy-pasting
- AI clusters responses into: Fix now / Validate later / Noise
- Requires 5+ responses for clustering; shows raw list below threshold
- Tag clusters directly to your sprint

### `loopkit loop` — the Sunday ritual

- Aggregates your week: tasks, ship logs, **pulse feedback**, and **previous weeks' context**
- Tracks your consecutive **Loop Streak** (e.g. `🔥 4 consecutive weeks`) and acknowledges streak breaks
- **LoopKit Score™**: Aggregates shipping score, streak multiplier, and feedback into one 0-100 metric
- **Proof Card**: Generates a shareable, ASCII-styled terminal card that auto-copies to your clipboard
- **Revenue**: Log your weekly MRR with `--revenue <amount>`
- AI recommends the single highest-leverage thing for next week
- Smart Unstuck Mode: kicks in if you have 0 tasks, but only after your first week
- Context-aware upgrade prompts at week 4 or 8
- Override rate tracked — warns if you're overriding AI > 50% of the time
- Generates a build-in-public post (280-char checked)
- One decision. One post. Week done.

## Pricing

| Tier | Price      | Includes                                             |
| ---- | ---------- | ---------------------------------------------------- |
| Free | $0/forever | 1 project, full CLI, git sync                        |
| Solo | $19/month  | 5 projects, AI proxy access, Pulse hosted form       |
| Pro  | $39/month  | Unlimited, web dashboard, Pulse widget, BYOK API key |

## Local First, Cloud-Enhanced

All project data lives in `.loopkit/` in your repo. No forced cloud sync. No vendor lock-in.

When you authenticate with `loopkit auth`, your loop logs and ship logs optionally sync to your web dashboard — so you can view trends, benchmarks, and share cards from anywhere. Local data remains the source of truth.

```
.loopkit/
├── config.json
├── projects/
│   └── [project-slug]/
│       ├── brief.md
│       ├── brief.json
│       ├── tasks.md
│       └── cut.md          ← cut tasks archived here
├── ships/
│   └── YYYY-MM-DD.md
├── logs/
│   └── week-N.md
└── pulse/
    └── responses.json
```

## Tech Stack

- **CLI:** Node.js 20+ · Commander · Clack
- **AI:** Vercel AI SDK · Claude (`@ai-sdk/anthropic`)
- **Schemas:** Zod (single source of truth in `@loopkit/shared`)
- **Web:** Next.js 16 · Tailwind v4
- **Backend/Auth:** Convex Database & Convex Auth

## Philosophy

1. **CLI-first, web-optional** — developers live in the terminal
2. **Async by default** — no meetings, no community management
3. **Opinionated over flexible** — fewer decisions = more shipping
4. **AI-augmented, not AI-dependent** — degrades gracefully without a key

---

Built for solo technical founders shipping weekly.

_The best time to ship was yesterday. The second best time is now._
