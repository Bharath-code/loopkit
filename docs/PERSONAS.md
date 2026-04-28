# LoopKit User Personas

> _"The best products are built by people who deeply understand the humans they're building for."_

This document defines the primary user personas for LoopKit. Every feature, command, and interaction pattern should be evaluated against these personas.

---

## Persona 1: Sarah — The Solo Technical Founder

### Profile

| Attribute       | Detail                                                 |
| --------------- | ------------------------------------------------------ |
| **Age**         | 28-35                                                  |
| **Background**  | Former senior engineer at FAANG or high-growth startup |
| **Location**    | Remote — Bali, Lisbon, or Austin                       |
| **Revenue**     | $0-5K MRR (pre-product-market-fit)                     |
| **Tech Stack**  | React/Node, Python, or mobile (Swift/Kotlin)           |
| **Twitter Bio** | "Building in public. Previously @company. DM open."    |

### Story

Sarah left her $300K engineering job to build her own SaaS. She has deep technical skills but has never been a founder. She's read _The Lean Startup_ and follows Pieter Levels and Marc Lou on Twitter. She has 3-4 "ideas" in her Notes app but is paralyzed by fear of building the wrong thing.

She started building a project 6 months ago, got 80% done, then realized nobody wanted it. Now she's terrified of making the same mistake. She needs a system that forces her to validate before building and ships something every week.

### Goals

1. **Validate before building** — Never again spend 6 months on something nobody wants
2. **Ship consistently** — Something public every single week
3. **Build an audience** — Share her journey and attract early adopters
4. **Reach ramen profitability** — $5K MRR to cover her lifestyle

### Pain Points

| Pain               | Current Behavior                                       | Emotional State           |
| ------------------ | ------------------------------------------------------ | ------------------------- |
| Analysis paralysis | Spends weeks "researching" without coding              | Anxious, stuck            |
| No accountability  | Starts projects, abandons them at 80%                  | Frustrated, self-critical |
| Building in vacuum | No feedback loop with real users                       | Isolated, guessing        |
| Scattered tools    | Notion for docs, Trello for tasks, Twitter for updates | Overwhelmed, fragmented   |
| Sunday scaries     | Feels guilty about what she didn't ship                | Defeated, unmotivated     |

### How Sarah Uses LoopKit

**Week 0: `loopkit init`**

- Has an idea for "a Notion alternative for developers"
- Runs `loopkit init notion-dev` and answers the 5 questions
- AI reveals her ICP is too broad (score: 4/10)
- Narrows to "Notion alternative for technical writers at API companies"
- Gets a score of 8/10 with a clear validation plan
- Feels **relief** — she has direction now

**Week 1-2: `loopkit track`**

- Creates tasks.md with her weekly plan
- Commits with `[#1] Set up landing page` — task auto-closes
- Sees shipping score: 60% (3/5 tasks done)
- Gets stale task alert for "Research competitors" — snoozes it

**Week 3: `loopkit ship`**

- Ships the landing page + waitlist
- AI generates HN title, Twitter thread, and IH post
- Uses the Twitter draft verbatim, gets 50 signups
- Saves ship log — her first public launch

**Week 4: `loopkit pulse`**

- Runs `loopkit pulse --share` — gets feedback URL
- Shares in 3 relevant Discord communities
- Gets 12 responses over the week
- AI clusters: "Fix now: can't tell what the product does from landing page"
- Tags it to sprint — Week 5 priority is clear

**Week 5: `loopkit loop`**

- Sunday ritual: sees 80% shipping score, 12 pulse responses
- AI synthesis: "The One Thing: Rewrite hero copy with a clear before/after"
- Accepts recommendation
- BIP post auto-generated: "Week 5: 50 signups, 1 painful lesson about clarity..."
- Posts it, gets engagement, feels momentum

### Success Metrics for Sarah

- Time from idea to first user conversation: < 2 weeks
- Shipping score consistency: > 70% weekly
- Loop override rate: < 30% (she trusts the system)
- Weeks until first paying customer: < 8

---

## Persona 2: Marcus — The Indie Hacker

### Profile

| Attribute       | Detail                                                      |
| --------------- | ----------------------------------------------------------- |
| **Age**         | 24-32                                                       |
| **Background**  | Self-taught developer, dropped out of college or never went |
| **Location**    | Southeast Asia or Eastern Europe (geo-arbitrage)            |
| **Revenue**     | $2K-20K MRR across multiple projects                        |
| **Tech Stack**  | No-code + light code (Next.js, Supabase, Stripe)            |
| **Twitter Bio** | "7 products. 2 hits. Building in public."                   |

### Story

Marcus has already shipped 5-7 projects. Two made money, the rest died. He moves fast — sometimes too fast. He'll build an MVP in a weekend, launch on Product Hunt, and move on if it doesn't get traction in 2 weeks. He's obsessed with shipping velocity but sometimes skips validation.

He doesn't need hand-holding. He needs a system that keeps him honest about validation, helps him manage multiple projects, and automates the boring parts (writing launch copy, collecting feedback, weekly retrospectives).

### Goals

1. **Ship more projects faster** — 1 new project every 4-6 weeks
2. **Kill projects faster** — Kill failures in week 2, not month 6
3. **Reuse what works** — Build a playbook from past projects
4. **Grow audience** — Build in public consistently

### Pain Points

| Pain                       | Current Behavior                         | Emotional State                  |
| -------------------------- | ---------------------------------------- | -------------------------------- |
| Skips validation           | Builds first, validates later (or never) | Overconfident, then disappointed |
| Managing multiple projects | Different repos, different task systems  | Scattered, loses context         |
| Writing launch copy        | Stares at blank screen for 30 mins       | Bored, delays launch             |
| No structured reflection   | Forgets lessons from past projects       | Repeating mistakes               |
| Feedback scattered         | DMs, emails, comments across platforms   | Overwhelmed                      |

### How Marcus Uses LoopKit

**Project A (Active):** AI image generator for designers — Week 3
**Project B (On hold):** Chrome extension for Twitter — Paused at Week 2

**Monday Morning: `loopkit track`**

- Switches to Project A: `loopkit track --project ai-image-gen`
- Sees 4 open tasks, 2 done from last week
- Adds new task: `--add "Implement style transfer endpoint"`
- Shipping score: 50% — needs to catch up

**Wednesday: Context Switch**

- Gets an idea for Project C while showering
- Runs `loopkit init chrome-writer --template saas`
- 10 minutes later: has a scored brief, validation plan, and AI-personalized tasks.md
- Decides to park it for now (score: 6/10, needs more ICP research)
- Back to Project A

**Friday: `loopkit ship`**

- Ships style transfer feature
- Uses AI-generated Twitter thread — edits it slightly
- Launches on Twitter + IH simultaneously
- Gets 200 visitors, 20 signups

**Sunday: `loopkit loop`**

- 3-week streak active
- AI synthesis: "Kill or pivot? Traction is below threshold for Week 3"
- Marcus overrides: "I want to give it 2 more weeks" — records reason
- Override rate now 60% — system warns him gently

**Week 4: `loopkit pulse`**

- Runs `loopkit pulse --share` for Project A
- Embeds widget on landing page
- Gets 8 responses automatically
- AI clusters: "Validate later: want API access" — signals to build API tier

### Success Metrics for Marcus

- Projects started per quarter: 3-4
- Projects killed before Month 2: 70%
- Time from ship to feedback analysis: < 10 minutes
- Audience growth from BIP posts: +10% followers/month

---

## Persona 3: Alex — The First-Time Founder

### Profile

| Attribute        | Detail                                                                          |
| ---------------- | ------------------------------------------------------------------------------- |
| **Age**          | 32-40                                                                           |
| **Background**   | Product manager, consultant, or domain expert (non-engineer or light technical) |
| **Location**     | Major city — NYC, London, SF                                                    |
| **Revenue**      | $0 (pre-launch, may have raised small pre-seed)                                 |
| **Tech Stack**   | Hires freelancers, uses no-code tools                                           |
| **LinkedIn Bio** | "Founder @ [stealth]. Ex-[bigco]. Looking for technical co-founders."           |

### Story

Alex has deep industry expertise (e.g., 10 years in logistics, healthcare, or fintech) and a painful problem they've experienced firsthand. They know the problem is real but don't know how to validate it systematically or what the MVP should look like.

They're considering raising a pre-seed round but investors keep asking "Have you validated this with users?" and they don't have a good answer. They need a framework that forces rigor without requiring technical expertise.

### Goals

1. **Validate the problem** — Talk to 20+ potential users before building
2. **De-risk the idea** — Get evidence to raise money or hire confidently
3. **Learn to ship** — Understand the founder mindset, not just the manager mindset
4. **Build a network** — Find early adopters and potential co-founders

### Pain Points

| Pain                           | Current Behavior                          | Emotional State        |
| ------------------------------ | ----------------------------------------- | ---------------------- |
| Don't know what to build first | Writes long PRDs nobody reads             | Confused, overthinking |
| Can't code the MVP             | Depends on freelancers who need direction | Powerless, frustrated  |
| No validation framework        | Asks friends if it's a good idea          | Biased, insecure       |
| Imposter syndrome              | Compares self to technical founders       | Anxious, doubtful      |
| Investor rejection             | Pitching without traction data            | Demoralized            |

### How Alex Uses LoopKit

**Week 0: `loopkit init`**

- Has an idea: "AI-powered freight matching for small importers"
- Struggles with "Who is your ICP?" — types "small businesses"
- Gets soft warning: "Try to be more specific"
- Refines: "Import/export brokers doing <$5M/year who use WhatsApp to coordinate shipments"
- AI scores ICP 9/10 — the specificity pays off
- Riskiest assumption identified: "Brokers will trust AI over their existing WhatsApp network"
- Validation plan: "Interview 10 brokers, ask about coordination tools and trust"
- Feels **empowered** — has a clear plan for the first time

**Week 1-4: `loopkit track`**

- Tasks are non-technical: "Interview broker #1", "Validate trust assumption", "Draft landing page copy"
- Shipping score is based on validation milestones, not code commits
- Uses `--add` to capture insights from each interview

**Week 5: `loopkit ship`**

- Ships a landing page + Calendly link (built with Webflow)
- AI generates Indie Hackers post about the validation journey
- Gets 5 calls booked from the post

**Week 6: `loopkit pulse`**

- Collects feedback from the 5 calls
- `--add "Broker #3: 'I don't trust algorithms with my client relationships'"`
- AI clusters this as "Validate later: trust concerns" — pattern emerges

**Week 7: `loopkit loop`**

- AI synthesis: "The One Thing: Build a human-in-the-loop feature that lets brokers review matches before sending"
- This becomes the core product insight
- Alex now has validation data to show investors

### Success Metrics for Alex

- User interviews completed in first month: 15+
- Validation insights that changed product direction: ≥ 1
- Investor conversations enabled by traction data: 3+
- Confidence level (self-reported): 3/10 → 7/10

---

## Persona 4: Jordan — The Side Project Shipper

### Profile

| Attribute      | Detail                                    |
| -------------- | ----------------------------------------- |
| **Age**        | 25-34                                     |
| **Background** | Full-time engineer at startup or big tech |
| **Location**   | Anywhere — has a stable day job           |
| **Revenue**    | $0-2K MRR (side income)                   |
| **Tech Stack** | Whatever they're comfortable with         |
| **GitHub Bio** | "Building things on weekends."            |

### Story

Jordan has a day job they don't hate but don't love. They dream of financial independence through side projects. They've started 10+ side projects but finished 2. Life gets in the way — work deadlines, social commitments, Netflix.

They need a lightweight system that fits into 5-10 hours/week, provides accountability, and makes the most of limited time. They don't need complex project management. They need a shipping ritual that keeps them moving.

### Goals

1. **Ship consistently on weekends** — 1 meaningful commit every week
2. **Finish projects** — Get to "launched" not just "started"
3. **Learn in public** — Build an audience as a byproduct
4. **Eventually quit day job** — Reach $5K MRR from side projects

### Pain Points

| Pain                     | Current Behavior                                  | Emotional State          |
| ------------------------ | ------------------------------------------------- | ------------------------ |
| Inconsistent progress    | Ships 3 weeks in a row, then nothing for 2 months | Guilty, cyclical         |
| No accountability        | Nobody knows if they shipped or not               | Isolated, easy to quit   |
| Forgotten context        | Comes back after 2 weeks, forgets where they were | Confused, demotivated    |
| Scope creep              | "I'll just add this one feature..."               | Overwhelmed, never ships |
| Weekend decision fatigue | Sits down Saturday, doesn't know what to work on  | Wastes half the day      |

### How Jordan Uses LoopKit

**Sunday Morning: `loopkit loop`** (The Ritual)

- 9 AM, coffee in hand
- Runs `loopkit loop` — 2-minute data aggregation
- Sees: "Week 3 summary: 2 tasks done, 1 open, shipping score 67%"
- AI recommendation: "Ship the MVP this week — it's 80% done"
- Accepts → writes reason for override (if any) → gets BIP post draft
- Posts to Twitter: "Week 3 of building [X]. This week: shipping the MVP. No more tweaks."
- Feels **accountable** — public commitment made

**Saturday: `loopkit track`**

- Opens laptop, runs `loopkit track`
- Sees exactly what needs to happen: 3 tasks, 1 is snoozed
- Works for 4 hours, commits `[#2] Finalize auth flow`
- Task auto-closes. Shipping score now 80%.

**Sunday Afternoon: `loopkit ship`**

- MVP is live on Vercel
- Runs `loopkit ship` → "What did you ship?" → "MVP with auth + core feature"
- AI generates launch copy
- Uses HN draft, posts to Show HN
- Ship log saved — milestone captured

**Week 4: `loopkit pulse`**

- Gets first real user feedback via shared form
- `--add "User said onboarding is confusing"`
- Only 3 responses — raw mode shows them directly
- Feels **validated** — real people are using it

### Success Metrics for Jordan

- Consecutive weeks with ≥ 1 commit: 8+ (2-month streak)
- Projects taken from init to shipped: 2+/year
- Hours per week on side project: 5-10 (sustainable)
- Side project revenue growth: +20% month-over-month

---

## Persona Summary Matrix

| Dimension           | Sarah (Solo Founder)               | Marcus (Indie Hacker)       | Alex (First-Timer)           | Jordan (Side Project)            |
| ------------------- | ---------------------------------- | --------------------------- | ---------------------------- | -------------------------------- |
| **Primary Goal**    | Product-market fit                 | Shipping velocity           | Validation                   | Consistency                      |
| **Time Available**  | 40-60 hrs/week                     | 40-80 hrs/week              | 20-40 hrs/week               | 5-10 hrs/week                    |
| **Risk Tolerance**  | Low (can't afford another failure) | High (fails fast, moves on) | Low (career transition)      | Medium (safety net from day job) |
| **Tech Skills**     | Expert                             | Expert                      | Beginner-Intermediate        | Intermediate                     |
| **Key Command**     | `init` (rigor)                     | `track` (speed)             | `init` (clarity)             | `loop` (accountability)          |
| **Pain Intensity**  | High (stuck)                       | Medium (scattered)          | High (lost)                  | Medium (inconsistent)            |
| **Pay willingness** | High (needs this to work)          | Medium (sees value)         | High (saves consulting fees) | Low-Medium (nice to have)        |

---

## Anti-Personas (Who LoopKit Is NOT For)

### Enterprise Product Manager

- Manages 10-person teams with Jira, Confluence, and quarterly OKRs
- Needs resource allocation, Gantt charts, and stakeholder reports
- **Why not LoopKit:** Too lightweight, not collaborative, no enterprise features

### Agency Owner

- Manages 5+ client projects simultaneously
- Needs client visibility, billing integration, and team assignment
- **Why not LoopKit:** Single-founder focused, no multi-user support (yet)

### VC-Backed Startup Founder

- Has $2M in the bank, 5-person team, board meetings
- Needs OKR tracking, investor updates, and hiring pipelines
- **Why not LoopKit:** Too early-stage, not team-oriented enough

### Hobbyist Coder

- Codes for fun, no intention of monetizing
- Wants to learn new frameworks, build portfolio pieces
- **Why not LoopKit:** The validation and shipping pressure would feel like work, not play

---

## How to Use This Document

**For Product Decisions:** Before adding any feature, ask: _"Which persona needs this most, and what pain does it solve?"_

**For Copywriting:** When writing CLI output, UI text, or marketing copy, write for **Sarah** (our primary persona). She's smart but overwhelmed. She needs clarity, not cleverness.

**For Prioritization:** Features that help multiple personas ship more consistently should be prioritized over features that only help one persona in edge cases.

**For Onboarding:** The first-run experience should assume **Alex** (first-timer) level of familiarity. Power users like Marcus will figure out advanced features on their own.

---

_Last updated: April 2026_
