# LoopKit — Complete Product Requirements Document

> **The Solo Founder's Shipping OS**
> Define · Develop · Deliver · Learn · Repeat

---

**Version:** 3.0
**Author:** Bharath
**Date:** April 2026
**Status:** Ready to Build

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Ideal Customer Profile](#3-ideal-customer-profile)
4. [Product Vision & Principles](#4-product-vision--principles)
5. [Pricing Strategy](#5-pricing-strategy)
6. [Financial Analysis](#6-financial-analysis)
7. [Go-To-Market Strategy](#7-go-to-market-strategy)
8. [Technical Architecture](#8-technical-architecture)
9. [Command Specifications](#9-command-specifications)
   - [9.1 loopkit init](#91-loopkit-init)
   - [9.2 loopkit track](#92-loopkit-track)
   - [9.3 loopkit ship](#93-loopkit-ship)
   - [9.4 loopkit pulse](#94-loopkit-pulse)
   - [9.5 loopkit loop](#95-loopkit-loop)
10. [Success Metrics](#10-success-metrics)
11. [Risks & Mitigations](#11-risks--mitigations)
12. [Roadmap](#12-roadmap)
13. [Execution Checklist](#13-execution-checklist)

---

## 1. Executive Summary

Solo technical founders face a structural problem: the entire product loop — define, develop, deliver, get feedback, iterate — was designed for teams. Every tool, every framework, every piece of startup advice assumes a co-founder, a PM, a marketing person, or at minimum the social energy to talk to 20 strangers a week.

LoopKit is the missing OS for the solo founder who is technical, introverted, and done abandoning products before they compound.

It is a CLI-first tool with a lightweight web dashboard that closes every phase of the shipping loop in a single workflow. No context switching between Notion, Linear, Twitter, and Google Forms. No live meetings required to get feedback. No blank-page anxiety on launch day.

**The core insight:** for a solo introverted founder, the GTM must be baked into the product itself. Every interaction with LoopKit generates a distribution artifact — a brief, a launch post, a build-in-public update. The product markets itself through usage.

| Metric | Target |
|---|---|
| Target market | ~2.1M solo technical founders globally |
| TAM | $840M/year |
| SAM | $126M/year |
| SOM (Year 3) | $1.5M ARR |
| Pricing | Free / $19 / $39 per month |
| Break-even | ~10 paid users |
| Net margin (Year 3) | ~93% |
| ₹1 Crore milestone | Month 15–18 (~450 paid users) |

---

## 2. Problem Statement

### 2.1 The Solo Founder Trap

The loop is conceptually simple: Define → Develop → Deliver → Feedback → Iterate. In practice each phase has a different energy profile. Most solo founders are strong in Develop, weak in Deliver and Feedback, and have no system connecting any of them.

| Phase | Required Skill | Bottleneck for Introverts |
|---|---|---|
| Define | Product thinking | Over-analysis, no external validation |
| Develop | Engineering | Strongest — but easy to hide here permanently |
| Deliver | Marketing + launch | Highest friction, most avoided |
| Feedback | Community + listening | Most energy-intensive, most skipped |
| Iterate | Prioritization | No framework for what to do next |

The result: most solo founders ship great code that the market never finds. The context-switching alone is the bottleneck — not skill, not intelligence, not work ethic.

### 2.2 What Does Not Exist

- **Notion/Linear/Jira** — built for teams, require maintenance overhead that kills solo momentum
- **Product Hunt/Twitter** — reactive, social-energy-heavy, not systematic
- **YC advice** — assumes co-founder and social confidence
- **Indie Hacker tools** — fragmented; no single loop connects define → ship → feedback → iterate
- **Nothing** connects git commits → task completion → launch post → feedback → next sprint in one workflow

### 2.3 The Gap

> There is no tool that treats the entire shipping loop as a single workflow for a single person who prefers code over conversation.

---

## 3. Ideal Customer Profile

### 3.1 Primary ICP — The Solo Technical Founder

| Attribute | Description |
|---|---|
| Role | Solo founder, indie hacker, or 1–2 person technical startup |
| Technical depth | Mid-to-senior software engineer (3+ years) |
| Stack | JavaScript/TypeScript, Python, Go, Rust — CLI-comfortable |
| Stage | Pre-revenue to $5K MRR; actively shipping or trying to |
| Geography | Global; primarily US, India, EU, SE Asia |
| Personality | Introvert or ambivert; prefers async; builds in public |
| Pain level | 9/10 — has tried and failed to close the loop alone |
| WTP | $15–$50/month for tools that save time and reduce friction |

### 3.2 Secondary ICP — The Technical Freelancer

- Freelance developers managing 2–5 client projects simultaneously
- Needs structured workflow but cannot justify team PM software
- Values: time-to-invoice, project clarity, professional communication
- Will upgrade to Pro for client-facing export features

### 3.3 Anti-ICP

- Teams of 4+ — they need proper PM tools
- Non-technical founders — CLI is a blocker
- Enterprise — wrong sales motion entirely

### 3.4 Canonical Persona

```
Name:       The Shipping-Stuck Developer (Bharath archetype)
Age:        25–35
Stack:      TypeScript, Next.js, CLI tools, Cloudflare
Problem:    Ships great code, struggles to complete the feedback loop
Behaviour:  3–5 half-shipped products, active on Twitter/X and GitHub
Goal:       First ₹1 Crore online; replace job income within 2 years
Quote:      "I know how to build it. I just don't know how to make people care."
```

---

## 4. Product Vision & Principles

### 4.1 Vision

LoopKit is the shipping OS for solo founders — the one tool that connects every phase of building a product, from raw idea to paid customer, without requiring social energy, team coordination, or expensive subscriptions.

### 4.2 Core Principles

1. **CLI-first, web-optional** — developers live in the terminal
2. **Async by default** — no live meetings, no community management required
3. **Opinionated over flexible** — fewer decisions means more shipping
4. **AI-augmented, not AI-dependent** — Claude does the heavy lifting, human stays in control
5. **One loop, end-to-end** — no tool switching between phases

### 4.3 Out of Scope (v1)

- Team collaboration — v2+
- Mobile app — CLI and web only
- CRM or sales pipeline
- Zapier/Make integrations
- VS Code extension — separate track post-PMF

---

## 5. Pricing Strategy

### 5.1 Why $9 Is Wrong

At $9/month you need 1,111 paid users to hit $10K MRR. At $19 you need 526. At $39 you need 256. A solo founder cannot support 1,111 users alone. Beyond scale, $9 signals "side project" to buyers. Your ICP pays $29/month for Raycast and $49/month for Linear without blinking. AI costs alone can reach $0.50–$2.00 per active user per month — at $9, margins collapse under growth.

### 5.2 Recommended Tiers

| Tier | Price | Limits | Target |
|---|---|---|---|
| Free | $0/month | 1 project, no AI features, no web dashboard | Top of funnel |
| Solo | $19/month | 5 projects, full CLI + AI, 500 feedback responses/mo | Primary ICP |
| Pro | $39/month | Unlimited projects, web dashboard, client export | Freelancers |
| Annual Solo | $152/year | Same as Solo (20% off) | Committed users |
| Annual Pro | $312/year | Same as Pro (20% off) | Freelancers |
| LTD (launch week) | $149 one-time | Cap 100 licenses | Runway funding |

### 5.3 Psychological Rationale

- **$19** clears the "lunch money" threshold — less than one lunch out per week
- **$39** is the "tool budget" threshold — what developers pay for productivity tools
- **Annual** converts churn risk into guaranteed revenue; push hard on this
- **LTD** creates urgency at launch; 100-license cap prevents underselling

---

## 6. Financial Analysis

### 6.1 Monthly Operating Costs

| Cost Item | Provider | Monthly Cost |
|---|---|---|
| Claude API (Haiku) | Anthropic | $20–$80 |
| Web hosting | Vercel | $0–$20 |
| Database | Convex | $0–$25 |
| Auth | Better Auth | $0 |
| Email | Resend | $0–$20 |
| Analytics | Posthog | $0 |
| Domain + SSL | Cloudflare | ~$1 |
| Miscellaneous | Various | $10–$20 |
| **Total** | | **$40–$190/month** |

Costs are near-zero fixed. AI API usage scales directly with active users — costs grow with revenue, not ahead of it.

### 6.2 Break-Even

| Metric | Value |
|---|---|
| Fixed monthly overhead (max) | $190/month |
| Variable cost per user (AI + infra) | ~$1.50/user/month |
| ARPU (blended 80% Solo, 20% Pro) | ~$22.40/month |
| Gross margin per user | ~$20.90 (93%) |
| Break-even paid users | **~10 users** |

Ten paying users makes this profitable from Day 1.

### 6.3 Revenue Projections

| Month | Paid Users | MRR (USD) | MRR (INR) |
|---|---|---|---|
| Month 1 | 5 | $100 | ₹8,350 |
| Month 3 | 35 | $735 | ₹61K |
| Month 6 | 120 | $2,520 | ₹2.1L |
| Month 12 | 520 | $10,900 | ₹9.1L |
| Month 18 | 1,100 | $23,100 | ₹19.3L |
| Month 24 | 2,000 | $42,000 | ₹35.1L |

₹1 Crore milestone requires ~$10K MRR sustained = ~450 paid users. Achievable by Month 15–18 with consistent build-in-public distribution.

### 6.4 Profit Margins

| Stage | MRR | Monthly Costs | Net Margin |
|---|---|---|---|
| Month 3 | $735 | $190 | 74% |
| Month 6 | $2,520 | $280 | 89% |
| Month 12 | $10,900 | $750 | 93% |
| Month 24 | $42,000 | $2,100 | 95% |

---

## 7. Go-To-Market Strategy

### 7.1 Philosophy

GTM must be baked into the product. Every `loopkit loop` output is a build-in-public post. Every `loopkit ship` run generates the launch announcement. The product markets itself through usage — no content calendar, no community management required.

### 7.2 Three Distribution Channels

**Channel 1: Existing Open Source Audience (Highest ROI)**
- git-scope users are the warm lead list — already developers, already trust your work
- One tweet to git-scope audience targets 200 signups Day 1
- README badge in git-scope linking to LoopKit
- Use LoopKit to generate git-scope release notes — meta-proof

**Channel 2: Build-in-Public (Compound ROI)**
- `loopkit loop` generates a BIP post every Sunday — product markets through usage
- Weekly "What I Shipped" posts on Twitter/X
- One Indie Hackers post at launch, one at each revenue milestone
- Show HN on launch day: "I built a CLI shipping OS for solo founders"

**Channel 3: Targeted Precision Outreach**
- Search Twitter for: "shipped nothing this week", "too many side projects", "context switching kills me"
- Genuine replies — link to LoopKit only when directly relevant
- 5 high-quality replies per week beats 50 generic ones

### 7.3 Launch Sequence

| Week | Action | Goal |
|---|---|---|
| Week 1 | Private beta — 20 personal invites | 10 active testers |
| Week 2 | Collect feedback, ship fixes | Validated core loop |
| Week 3 | Show HN + git-scope tweet | 500 signups, 30 paid |
| Week 4 | Product Hunt launch | 1,000 visitors, 50 paid |
| Month 2 | Weekly BIP updates | Compound organic growth |
| Month 3 | First IH milestone post | Community credibility |
| Month 6 | Dev.to / Hashnode article | SEO + long-tail discovery |

### 7.4 Conversion Assumptions

| Stage | Rate |
|---|---|
| Visitor → Install | 8% |
| Install → Active (7-day) | 40% |
| Active → Paid (30-day) | 12% |
| Paid → Annual | 35% |
| Monthly churn | 3.5% |

---

## 8. Technical Architecture

### 8.1 Stack

| Layer | Technology | Rationale |
|---|---|---|
| CLI runtime | Bun | Fast startup, no Node version conflicts |
| CLI framework | Ink (React for CLI) | Rich terminal UI |
| Web dashboard | Next.js 14 (App Router) | Established, Vercel-native |
| Database | Convex | Realtime sync, generous free tier |
| Auth | Better Auth | Open source, no vendor lock-in |
| AI | Claude Haiku | Cheapest capable model, fast |
| Payments | Polar.sh | Developer-friendly, no entity required to start |
| Hosting | Vercel | Free tier covers MVP |
| Analytics | Posthog | Privacy-friendly, generous free tier |

### 8.2 Data Architecture

- All project data stored locally in `.loopkit/` — no forced cloud sync
- Optional cloud sync for web dashboard (Pro feature)
- Feedback responses stored in Convex — realtime, no polling
- Analytics events sent to Posthog — opt-in

### 8.3 File Structure

```
.loopkit/
├── config.json
├── projects/
│   └── [project-slug]/
│       ├── brief.md          # init output
│       ├── tasks.md          # track source of truth
│       ├── draft.json        # init resume state
│       └── cut.md            # removed tasks archive
├── ships/
│   └── YYYY-MM-DD.md         # ship logs
└── logs/
    └── week-N.md             # loop decision logs
```

---

## 9. Command Specifications

---

### 9.1 loopkit init

**Phase:** Define
**Time to complete:** 3–5 minutes
**Tier:** Free (questions + brief) / Paid (AI scoring + full analysis)

**Purpose:** Turns a fuzzy idea into a sharp, falsifiable brief before any code is written. Not a config generator — a clarity forcing function.

**Core Job:** Take a founder's raw idea and return one thing they didn't have before: the riskiest assumption named explicitly.

---

#### 9.1.1 Question Design

Each question is engineered to create a specific type of thinking. Five questions only — not configurable. The opinions are the product.

---

**Question 1 — Product Name**

```
What's the product called? (doesn't have to be final)
```

**Why this works:**
Naming forces commitment. A founder who cannot name it is too early for init. The parenthetical removes perfectionism paralysis. This is the warm-up — costs no energy but starts the session.

**Friction level:** Low
**AI uses it for:** File path, project slug, brief header. Nothing else.
**Bad answer pattern:** None — any answer is valid here.

---

**Question 2 — The Problem (not the solution)**

```
Describe the problem in one sentence — not your solution, the actual pain.
```

**Why this works:**
The "not your solution" instruction is critical. Without it, founders write "I want to build X that does Y" — which is a solution, not a problem. The one-sentence constraint forces distillation. If they cannot distill it, the problem is not clear enough to build against.

**Friction level:** Medium
**AI uses it for:** Problem score, the bet framing, solution-in-disguise detection.
**Bad answer pattern:** "An AI tool that generates proposals" → this is a solution. AI detects this and scores problem lower with a note.
**Soft validation:** If answer contains "I want to build" or "A tool that" → prompt: "That sounds like a solution. What's the pain the user feels before your product exists?"

---

**Question 3 — Who Has This Problem the Worst**

```
Who has this problem the worst? Be specific — role, context, how often they hit this pain.
```

**Why this works:**
The sub-prompt "role, context, frequency" is a thinking scaffold that prevents "anyone who needs this" answers. Specificity is testable: can you find 5 of these people on Twitter in 10 minutes? If yes: 8+/10 ICP. If maybe: 6–7. If no: below 5.

**Friction level:** High (by design)
**AI uses it for:** ICP score, ICP note, the "findable in 10 minutes" test.
**Bad answer pattern:** "Freelance developers" → ICP score 4. "Senior freelancers, $3K+ projects, 2–5 proposals/month" → ICP score 9.

---

**Question 4 — Why Haven't They Solved It Already**

```
Why hasn't this person solved it already? What's actually stopping them?
```

**Why this is the most important question:**
This exposes the riskiest assumption in the entire product. Three answer types reveal three different product risks:

| Answer Type | What It Reveals |
|---|---|
| "Nothing really, they're just lazy" | Weak problem — low urgency |
| "Existing tools are too complex" | Real wedge — usability opportunity |
| "They don't know this solution exists" | Distribution problem, not product problem |
| "It costs too much currently" | Pricing/positioning opportunity |

**Friction level:** Highest (intentional)
**AI uses it for:** Primary input to riskiest assumption field.
**Design note:** The discomfort a founder feels sitting with this question for 2 minutes is more valuable than 2 hours of coding. The friction is the product working.

---

**Question 5 — What Does Done Look Like for MVP**

```
What does "done" look like for the MVP? Describe what a user does and what they get.
```

**Why this works:**
"User does X and gets Y" forces outcome thinking. It prevents laundry-list answers. The AI applies the 7-day test: can this be built by one person in a week? If it requires multiple inputs, outputs, and user states → scope creep flagged before a line of code is written.

**Friction level:** Medium
**AI uses it for:** MVP score and the "MVP in plain English" output field.
**7-day test:** One input → one output, no auth, no dashboard, no settings = 9/10. Anything with "and also..." = scope warning.

---

#### 9.1.2 System Prompt

```
You are a senior product advisor embedded inside LoopKit, a CLI tool
for solo technical founders. Your job is to analyze a founder's raw
idea answers and return a sharp, honest brief.

## your personality
- You are a skeptical but constructive PM who has seen 500 products fail
- You do NOT validate ideas — you stress-test them
- You find the ONE weakest assumption and name it directly
- You are concise. No padding, no filler, no "Great question!"
- You write in plain English. No jargon, no buzzwords
- You care about the founder succeeding, which means being honest

## your task
Given 5 raw answers from a founder, produce a structured brief with:
1. THE BET — reframe what they said as a falsifiable hypothesis (1 sentence)
2. ICP SCORE (1-10) — how specific and findable is their target user?
3. ICP NOTE — max 2 sentences
4. PROBLEM SCORE (1-10) — how concrete, measurable, and painful is this?
5. PROBLEM NOTE — max 2 sentences
6. MVP SCOPE SCORE (1-10) — how clear and shippable is the MVP in 7 days?
7. MVP NOTE — max 2 sentences
8. RISKIEST ASSUMPTION — the single thing most likely to make this fail
9. VALIDATE BEFORE YOU BUILD — one specific async action (no meetings)
10. MVP IN PLAIN ENGLISH — the feature set in 2 sentences max

## scoring rules
ICP:
  9-10 = named role + frequency + trigger event (findable in 10 min on Twitter)
  7-8  = role + context (findable with effort)
  5-6  = role only (too broad to target)
  1-4  = "anyone who..." or "developers" (not a real ICP)

PROBLEM:
  9-10 = measurable cost (time lost, money lost, deals lost)
  7-8  = felt pain with evidence or analogies
  5-6  = assumed pain with no evidence
  1-4  = "it would be nice if..." (not a real problem)

MVP SCOPE:
  9-10 = 1 input → 1 output, shippable in 3 days by one person
  7-8  = shippable in 7 days by one person
  5-6  = needs more scoping before building
  1-4  = too broad to ship in a month

## critical rules
- NEVER say "Great!", "Awesome!", "Love this idea", or any validation filler
- NEVER suggest adding more features to the MVP
- NEVER soften the riskiest assumption — state it directly and plainly
- If ICP score is below 6, call it out and give a sharper alternative ICP
- If MVP has more than 1 core feature, tell them to cut it
- The validate action must be something they can do alone tonight — no "talk to 10 customers"
- If Q2 answer is a solution not a problem, flag it: "That's a solution. What's the pain before your product exists?"
- Max 250 words total in your entire output

## output format
Return ONLY valid JSON. No markdown fences. No preamble. No explanation outside the JSON.

{
  "bet": "string",
  "icpScore": number,
  "icpNote": "string",
  "problemScore": number,
  "problemNote": "string",
  "mvpScore": number,
  "mvpNote": "string",
  "riskiestAssumption": "string",
  "validateAction": "string",
  "mvpPlainEnglish": "string"
}
```

---

#### 9.1.3 Few-Shot Examples

These are injected into every API call as context to calibrate scoring distribution. Without them, the model scores everything 7/10.

---

**Example 1 — Strong idea (scores well, but still finds the risk)**

Input:
```
Name: ProposalAI
Problem: Freelance devs lose deals because their proposals look amateur
ICP: Senior freelancers, $3K+ projects, 2-5 proposals/month
Why unsolved: Templates feel generic, clients notice, customising takes as long as writing fresh
MVP: Fill a 5-field form, get a complete SOW PDF in under 60 seconds
```

Expected output:
```json
{
  "bet": "Freelance devs at $3K+ lose deals to cheaper competitors who look more professional on paper — and a 60-second AI SOW closes that gap.",
  "icpScore": 9,
  "icpNote": "Specific role, price point, and frequency. Findable on Upwork in 10 minutes. Don't let this drift to 'all freelancers'.",
  "problemScore": 9,
  "problemNote": "Deals lost is a real, measurable cost. The template-feels-generic insight is credible and specific.",
  "mvpScore": 7,
  "mvpNote": "Good constraint. Define the 5 fields before writing code — scope will creep otherwise. What exactly goes in the SOW?",
  "riskiestAssumption": "Clients respond better to AI-generated proposals than ones that feel personal and handwritten — this may not be true.",
  "validateAction": "Post in r/freelance: 'Do you use a template or write proposals fresh? What's made you win or lose a deal?' — 20 replies in 48 hours.",
  "mvpPlainEnglish": "One form with 5 fields. One PDF output. No accounts, no dashboard, no settings. That's the entire v1."
}
```

---

**Example 2 — Weak ICP (harsh but constructive)**

Input:
```
Name: TaskFlow
Problem: People forget tasks and lose productivity
ICP: Anyone who has a lot of tasks to manage
Why unsolved: Existing apps are too complex
MVP: A simple to-do app with AI prioritization
```

Expected output:
```json
{
  "bet": "People with many tasks would use a simpler to-do app if it had AI prioritization — but this bet is too vague to test.",
  "icpScore": 2,
  "icpNote": "'Anyone with tasks' is every human alive. Pick one: solo founders? surgeons? students? Come back with a real person.",
  "problemScore": 4,
  "problemNote": "'Lose productivity' is not a measurable cost. What specifically are they losing — hours, money, deals, sleep?",
  "mvpScore": 5,
  "mvpNote": "'Simple to-do with AI prioritization' is two things. What is the exact input and exact output of the AI step?",
  "riskiestAssumption": "People don't use existing to-do apps because they're too complex — not because the habit itself is hard to form.",
  "validateAction": "Search Twitter for 'todoist' complaints. Read 20 replies. The real reason people churn from to-do apps is in there.",
  "mvpPlainEnglish": "Pick a specific person first. This brief is not ready to build against."
}
```

---

**Example 3 — MVP scope creep (good problem, bad scope)**

Input:
```
Name: SalesCoach AI
Problem: Sales reps freeze when they hear tough objections on calls
ICP: B2B SaaS AEs doing 5+ demos/week
Why unsolved: Training happens offline, not in the moment
MVP: Real-time objection detection + response cards + call recording + CRM sync + manager dashboard
```

Expected output:
```json
{
  "bet": "B2B SaaS AEs lose deals when they freeze on objections — and in-call response cards fix this better than offline training.",
  "icpScore": 8,
  "icpNote": "Specific role and frequency. Findable on LinkedIn. Consider adding deal size for tighter targeting.",
  "problemScore": 9,
  "problemNote": "'Freeze on objections' is a real, in-the-moment pain. The offline training gap is a sharp and specific insight.",
  "mvpScore": 2,
  "mvpNote": "You listed 5 features. That is a 3-month build minimum. Pick ONE: objection detection + response cards only. Cut everything else.",
  "riskiestAssumption": "AEs will use a real-time tool during a live call — they may find it too distracting to glance at cards while talking.",
  "validateAction": "Record yourself handling a fake objection with and without a response card visible. Does the card help or distract? That's your real question.",
  "mvpPlainEnglish": "One Chrome extension. Detects objection keywords. Shows one response card. No recording, no CRM, no dashboard."
}
```

---

#### 9.1.4 User Journey

| Step | What Happens | Emotional State |
|---|---|---|
| 1 | Founder has a fuzzy idea, runs `loopkit init` instead of opening VS Code | Uncertain energy |
| 2 | Greeted: "This takes 4 minutes. Be honest, not optimistic." | Expectant — tone is set |
| 3 | Questions 1–3 flow quickly | Building momentum |
| 4 | Q4 causes them to pause and think | Productive discomfort |
| 5 | "Analyzing your brief..." — 3–5 second visible wait | Anticipation |
| 6 | Brief lands — two simultaneous reactions: "yes, exactly" and "hadn't thought of that" | Clarity + mild sting = trust |
| 7 | Brief saved to `.loopkit/projects/[name]/brief.md` — owned, not locked | Ownership feeling |
| 8 | Free users see scores, paid users see full notes — soft upsell visible | Aware, not resentful |
| 9 | "Next: run `loopkit track` to start building against it." | Momentum maintained |

---

#### 9.1.5 Acceptance Criteria

**AC-INIT-01: Happy path — full completion with AI analysis**

```
Given:  User has loopkit installed, runs `loopkit init`, answers all 5 questions
When:   All 5 answers submitted, AI analysis returns
Then:
  - Brief renders in terminal with: 3 scores, bet, risk, validate action, MVP plain english
  - File saved to .loopkit/projects/[slug]/brief.md
  - brief.md is valid markdown openable in any editor
  - Next command suggestion shown
  - Total elapsed time under 5 minutes
  - JSON parse errors do not surface to user
```

**AC-INIT-02: Abandoned session (Ctrl+C)**

```
Given:  User is on question 3 of 5
When:   User presses Ctrl+C
Then:
  - Graceful exit: "Session paused. Run `loopkit init [name]` to resume."
  - Partial answers saved to .loopkit/projects/[name]/draft.json
  - On resume: starts from the exact question where they left off
  - No data lost under any exit condition
```

**AC-INIT-03: Project name collision**

```
Given:  Project "proposalai" already exists in .loopkit/projects/
When:   User enters "proposalai" as name on a new init
Then:
  - Prompt: "proposalai already exists. [o]verwrite / [v] new version / [r]esume?"
  - Overwrite: replaces brief.md, archives old as brief.v1.md with timestamp
  - New version: saves as brief.v2.md
  - Resume: loads draft.json and continues from last question
```

**AC-INIT-04: AI API unavailable**

```
Given:  User completes all 5 questions
When:   Network error or 429 from Anthropic API
Then:
  - "AI analysis unavailable. Saving your answers and skipping scoring for now."
  - brief.md saved with raw answers only, scores shown as "—"
  - "Run `loopkit init --analyze [name]` when online to add scores later"
  - Does NOT re-prompt all 5 questions
  - Does NOT crash or show raw error
```

**AC-INIT-05: One-word or empty answer on Q2–Q5**

```
Given:  User submits answer with fewer than 5 words on a substantive question
When:   Enter pressed
Then:
  - Soft warning: "That's pretty short. Add more? [y/skip]"
  - Skip is always allowed — never blocked
  - If skipped: AI output for that field shows "insufficient input — revisit this"
  - Does NOT repeat the question automatically
```

**AC-INIT-06: Solution-framed answer on Q2**

```
Given:  User answers Q2 with "An AI tool that generates proposals automatically"
When:   AI analyzes the answer
Then:
  - Problem note includes: "That reads as a solution. What's the pain before your product exists?"
  - Problem score capped at 5/10 maximum
  - Does NOT fail silently or ignore the issue
```

---

#### 9.1.6 Success Metrics

| Metric | Target | Signal If Missed |
|---|---|---|
| Session completion rate | ≥70% of started sessions reach Q5 | Q4 too hard — add hint text |
| Time to complete | p50 < 5 minutes | Questions too long — trim prompts |
| Re-run rate (7-day) | ≥30% | Output not valuable enough — improve AI prompt |
| Upgrade trigger rank | #1 reason for paid upgrade | AI notes not differentiated enough |
| AI regeneration rate | <15% | Prompt quality is high |

---

#### 9.1.7 Error States

| Error | User-Facing Message |
|---|---|
| No config found | "No config found. Running first-time setup..." — auto-runs setup silently |
| ANTHROPIC_API_KEY missing | "AI analysis requires an API key. Set ANTHROPIC_API_KEY or run `loopkit auth`." |
| Invalid JSON from AI | Retry once silently. If second fails: show raw text output. Never crash. |
| Disk write failure | "Could not save brief to .loopkit/. Check folder permissions." Print full brief to stdout. |
| API key invalid (401) | "API key rejected. Run `loopkit auth` to reconfigure." |

---

### 9.2 loopkit track

**Phase:** Develop
**Time:** Always-on (zero active overhead)
**Tier:** Free

**Purpose:** Lightweight task management that syncs with git commits. Tasks live in plain markdown. Work closes them automatically. Zero overhead.

**Core Job:** Make the developer's progress visible to themselves without requiring any behavior change beyond their existing commit workflow.

---

#### 9.2.1 System Design

**Source of truth:** `.loopkit/projects/[name]/tasks.md`

Tasks are plain markdown checkboxes. The file is git-committable. Editing it directly in any editor works identically to using the CLI.

```markdown
# ProposalAI — Tasks

## This Week
- [ ] #1 Build SOW generation endpoint
- [x] #2 Set up Convex schema — closed via abc1234 on 2026-04-14
- [ ] #3 Add PDF export with puppeteer
- [ ] #4 Build 5-field intake form

## Backlog
- [ ] #5 Add auth with Better Auth
- [ ] #6 Build landing page
```

**Git hook mechanism:**
`loopkit track` installs a `commit-msg` hook at `git init` time. On every commit, the hook scans the message for `[#N]` patterns and closes matching tasks. Hook must add < 100ms to commit time.

---

#### 9.2.2 User Journey

| Step | What Happens | Emotional State |
|---|---|---|
| 1 | Monday: add tasks via CLI or direct file edit — both work | Starting fresh |
| 2 | During coding: commit with `[#3]` in message — task closes automatically | Zero context switch |
| 3 | `loopkit track` shows week board: done/open/blocked + shipping score % | Visible momentum |
| 4 | Friday: `loopkit track --week` shows full week summary | Progress is real and documented |
| 5 | Task untouched for 3 days: "Still relevant? [keep/snooze/cut]" prompt | Friction that surfaces blockers early |
| 6 | Week data feeds into `loopkit loop` on Sunday automatically | Loop closed |

---

#### 9.2.3 Acceptance Criteria

**AC-TRACK-01: Git commit closes task automatically**

```
Given:  Task #3 "Build SOW endpoint" exists and is open
When:   User runs: git commit -m "feat: sow generation [#3]"
Then:
  - Task #3 marked done in tasks.md with timestamp and commit SHA
  - Shipping score recalculated
  - Terminal shows: "✓ Task #3 closed via commit abc1234"
  - Git hook adds < 100ms to commit time
  - tasks.md remains valid markdown after update
```

**AC-TRACK-02: Direct file edit parity**

```
Given:  User edits tasks.md directly in their editor (not via CLI)
When:   User runs `loopkit track` next time
Then:
  - New tasks detected and auto-assigned sequential IDs
  - No data loss or format corruption from direct edit
  - Both editing paths (CLI and direct) produce identical results
  - File format preserved exactly as written
```

**AC-TRACK-03: Stale task (3+ days)**

```
Given:  Task #5 created Monday, no commits reference it by Thursday
When:   User runs `loopkit track` on Thursday
Then:
  - Task displayed with amber indicator and "3 days" age label
  - Prompt: "Still relevant? [k]eep / [s]nooze 3d / [c]ut"
  - Snooze: hidden from view for 3 days, not deleted, resurfaces automatically
  - Cut: moved to cut.md with optional reason recorded
  - No task silently deleted
```

**AC-TRACK-04: No git repo**

```
Given:  User runs loopkit track in folder with no .git directory
When:   Any track command runs
Then:
  - Tasks work fully in manual mode
  - Warning shown once: "No git repo — auto-close from commits disabled."
  - Suggestion: "Run `git init` to enable commit-to-task sync."
  - Never hard-fails — degrades gracefully
```

**AC-TRACK-05: Multiple tasks in one commit**

```
Given:  Tasks #2 and #4 exist and are open
When:   User runs: git commit -m "closes [#2] and [#4]"
Then:
  - Both tasks marked done with same commit SHA
  - Both timestamps recorded accurately
  - Shipping score updates once, not twice
```

**AC-TRACK-06: Weekly summary**

```
Given:  User has been tracking tasks for a full week
When:   `loopkit track --week` runs
Then:
  - Shows: tasks planned vs completed, commits made, shipping score %
  - Shipping score = (closed tasks / total tasks created this week) * 100
  - Comparison to previous week if available
  - Data formatted for consumption by `loopkit loop`
```

---

#### 9.2.4 Success Metrics

| Metric | Target | Signal If Missed |
|---|---|---|
| Auto-close rate | ≥60% of tasks closed via commit ref | Commit format unclear — improve hint in tasks.md |
| Weekly active retention | ≥65% of users tracking 2+ consecutive weeks | Not building habit — add Sunday reminder nudge |
| Stale task action rate | ≥80% of stale prompts acted on (not dismissed) | Prompt too easy to dismiss — require one keypress |
| Commit hook latency | < 100ms added overhead | Hook doing too much — profile and optimize |
| File edit parity issues | 0 data corruption reports | Parser needs hardening |

---

#### 9.2.5 Error States

| Error | User-Facing Message |
|---|---|
| tasks.md parse failure | "tasks.md has formatting issues on line N. Run `loopkit track --repair` to auto-fix." Never silently discard tasks. |
| Duplicate task IDs | Auto-reassign IDs on next run: "Duplicate task IDs found and resolved. Check tasks.md to confirm." |
| Git hook permission denied | "Could not install git hook. Fix: `chmod +x .git/hooks/commit-msg`" |
| tasks.md not found | Auto-create empty tasks.md with scaffold. "Created tasks.md — add your first task." |
| Commit SHA not resolvable | Log warning silently, close task anyway. SHA is metadata, not a blocker. |

---

### 9.3 loopkit ship

**Phase:** Deliver
**Time:** ~60 seconds per run
**Tier:** Paid (AI draft generation)

**Purpose:** Turns a shipped feature into three distribution artifacts in under 60 seconds. Removes every excuse not to launch.

**Core Job:** Generate the announcement so the founder only has to edit and post. Remove the "I don't know what to write" blocker permanently.

---

#### 9.3.1 System Prompt

```
You are a launch copywriter inside LoopKit, writing distribution content
for a solo technical founder who builds in public.

## context you receive
- Product brief (bet, ICP, problem, MVP definition)
- List of tasks closed this week
- One sentence from founder: what they shipped
- Platform target: "hn" | "twitter" | "ih"

## your output by platform

### show HN (platform: "hn")
- Title: "Show HN: [product] — [one-line description]"
- Body: 3–5 short paragraphs. Technical and honest. What it does, why you
  built it, what's interesting technically or as a product insight.
  No hype. No "game-changer". End with a genuine question for the
  HN community.
- Max 500 words

### twitter thread (platform: "twitter")
- 3 tweets. Each standalone-readable.
- Tweet 1: hook — the problem or the insight. No "🧵 thread:" opener.
- Tweet 2: what you built and why.
- Tweet 3: what you learned or what's next. End with a call to try it.
- Each tweet under 280 characters
- No thread emoji. No "1/3" markers.

### indie hackers update (platform: "ih")
- Narrative format. First person. Honest about what worked and what didn't.
- Structure: what I shipped → what I learned → what I'm doing next
- Include a specific number or metric if available (users, responses, commits)
- Max 300 words

## critical rules
- NEVER use: "game-changer", "revolutionary", "excited to announce", "thrilled"
- Write like a developer writing for other developers — honest, specific, direct
- The ICP from the brief shapes who you're writing for
- If no metric is available, don't invent one — say what you observed instead
- Twitter tone: conversational. HN tone: technical. IH tone: honest and narrative.

## output format
Return ONLY valid JSON, no markdown fences:
{
  "hn": { "title": "string", "body": "string" },
  "twitter": { "tweets": ["string", "string", "string"] },
  "ih": { "body": "string" }
}
```

---

#### 9.3.2 Pre-Launch Checklist

Before AI drafts are generated, `loopkit ship` runs an automated checklist:

| Check | How Verified | Action If Fail |
|---|---|---|
| README updated | Git diff check — README modified in last 7 days | Show inline: last updated N days ago |
| Landing page live | HTTP GET to configured URL — expects 200 | "Could not reach [url]. [s]kip / [r]etry / [e]nter URL" |
| Analytics present | Scrape landing page HTML for posthog/gtag script tag | Show Posthog snippet inline |
| Feedback widget installed | Check for loopkit pulse snippet in page HTML | Show pulse setup command |

Checklist never blocks shipping. Each failed item shows a fix. User chooses to fix or continue.

---

#### 9.3.3 User Journey

| Step | What Happens | Emotional State |
|---|---|---|
| 1 | Friday — feature merged. Runs `loopkit ship` | Satisfied but tired |
| 2 | LoopKit reads brief.md + closed tasks silently | Minimal effort required |
| 3 | One question: "What's the main thing you shipped? (one sentence)" | Fast — 10 seconds |
| 4 | Pre-launch checklist runs — pass/fail visible | Friction that protects them |
| 5 | Three drafts generated in parallel | Three things done in 30 seconds |
| 6 | Each draft shown: [u]se / [e]dit / [r]egenerate / [s]kip | Control maintained |
| 7 | Edit opens $EDITOR — save and return to terminal | In flow, no context switch |
| 8 | Ship log saved to `.loopkit/ships/YYYY-MM-DD.md` | Momentum documented |
| 9 | "Next: run `loopkit loop` Sunday to close the week." | Loop pointed forward |

---

#### 9.3.4 Acceptance Criteria

**AC-SHIP-01: Happy path — full ship with three drafts**

```
Given:  brief.md exists, at least 1 task closed this week, "what shipped" answered
When:   `loopkit ship` runs to completion
Then:
  - Checklist shows pass/fail for all 4 items
  - HN post: title + body, technically honest, under 600 chars
  - Twitter: 3 tweets, each under 280 chars, first tweet standalone-readable
  - IH update: narrative, first person, mentions specific detail
  - All three saved to .loopkit/ships/YYYY-MM-DD.md
  - Total time from command to drafts shown: under 60 seconds
```

**AC-SHIP-02: Checklist item fails — missing analytics**

```
Given:  No analytics script detected on landing page HTML
When:   Checklist runs
Then:
  - Red indicator: "analytics: not detected"
  - Posthog script snippet shown inline for copy-paste
  - Option: "[c]ontinue anyway / [f]ix first"
  - Does NOT block shipping — user decides
  - Checklist state saved to ship log regardless
```

**AC-SHIP-03: No brief.md — graceful degradation**

```
Given:  User runs `loopkit ship` without having run init first
When:   Command runs
Then:
  - "No brief found. Run `loopkit init` first for better AI output."
  - Falls back to 3 inline questions: product name, what shipped, who it's for
  - Generates all three drafts from inline answers — degraded but functional
  - Saves minimal brief automatically
  - Does NOT fail or refuse to generate drafts
```

**AC-SHIP-04: User edits draft in $EDITOR**

```
Given:  HN draft shown, user presses [e]
When:   Editor opens, user edits, saves and exits
Then:
  - Edited content shown in terminal for confirmation
  - "Looks good? [y/n]" — n re-opens editor
  - Approved draft saved to ships/[date].md
  - Respects $EDITOR env var; falls back to nano; falls back to inline line-edit
```

**AC-SHIP-05: All drafts skipped**

```
Given:  User skips all three platform drafts with [s]
When:   All three are skipped
Then:
  - Ship log saved with checklist state and "what shipped" answer
  - No drafts in log file
  - "Logged. No drafts generated." — no judgment, no re-prompt
  - Data still available for `loopkit loop` Sunday
```

---

#### 9.3.5 Success Metrics

| Metric | Target | Signal If Missed |
|---|---|---|
| Weekly ship rate | 1 ship/week per active user | Users not in Friday habit — add day-of nudge |
| Draft use rate (as-is or light edit) | ≥50% | AI output quality poor — improve prompt or context gathering |
| Draft regeneration rate | <40% | If >40%: prompt needs improvement — this is a product signal |
| Checklist pass rate (all green) | ≥70% | Users launching without analytics/feedback — add setup guide |
| Time from command to 3 drafts | < 30 seconds | API latency — switch to streaming output |

---

#### 9.3.6 Error States

| Error | User-Facing Message |
|---|---|
| AI draft is generic | Always show [r]egenerate. Track rate — if >40%, prompt needs work. |
| Landing page URL unreachable | "Could not reach [url]. [s]kip check / [r]etry / [e]nter different URL" |
| $EDITOR not set, nano not found | Fall back to inline line-by-line edit in terminal. Never block. |
| Ship log already exists for today | "A ship log exists for today. [o]verwrite / [a]ppend / [s]kip?" |
| Parallel API calls fail partially | Show whichever drafts succeeded. Offer retry for failed platforms. |

---

### 9.4 loopkit pulse

**Phase:** Feedback
**Time:** Setup once (~2 min), passive collection thereafter
**Tier:** Free (collection) / Paid (AI clustering)

**Purpose:** Async feedback collection that comes to the founder. No surveys, no interviews, no chasing. One widget. One question. AI-clustered answers in the terminal.

**Core Job:** Give introverted founders a sustainable feedback loop that requires zero social energy.

---

#### 9.4.1 System Prompt (Feedback Clustering)

```
You are a product analyst inside LoopKit. Your job is to cluster raw
user feedback responses into actionable groups for a solo founder.

## your task
Given a list of raw feedback responses, produce:
1. Three clusters with labels, representative quotes, and action priority
2. A confidence score for the clustering
3. Any responses that did not fit a cluster (outliers)

## cluster labels (always these three — do not invent new ones)
- "Fix now" — pain points that are actively blocking usage or causing churn
- "Validate later" — feature requests or improvements worth exploring post-PMF
- "Noise" — too vague, off-topic, or not actionable for a solo founder right now

## clustering rules
- A cluster must have at least 2 responses to be valid
- If fewer than 5 total responses: return raw list, no clustering
- "Fix now" should rarely have more than 2 items — force prioritization
- Each cluster: title, 2-3 representative quotes (under 15 words each),
  1-sentence pattern description, and count
- Confidence score: (responses clearly clustered / total) as a decimal

## critical rules
- NEVER invent quotes — use only what was submitted
- NEVER put everything in "Fix now" — this defeats the purpose
- If all responses are vague, put all in "Noise" and say so plainly
- Max 200 words total output

## output format
Return ONLY valid JSON, no markdown fences:
{
  "clusters": [
    {
      "label": "Fix now" | "Validate later" | "Noise",
      "count": number,
      "pattern": "string",
      "quotes": ["string", "string"]
    }
  ],
  "outliers": ["string"],
  "confidence": number,
  "note": "string"
}
```

---

#### 9.4.2 Widget Design

The feedback widget is a JS snippet embedded in the founder's product. It must be invisible until triggered and lightweight to load.

**Trigger conditions (configurable, default: option 1):**
1. After first core action completed (founder defines the event)
2. After 2 minutes of active session
3. On exit intent (last resort — most annoying)

**Widget behavior:**
- Small floating tab on right edge, labelled "feedback"
- One question only: "What almost stopped you from finishing this?"
- Free text input, 500 char max
- Submit → "Thanks — this helps." → widget closes
- Does not re-appear to same user for 7 days (localStorage flag)
- Shadow DOM isolated — no CSS leakage into host page
- Load overhead: < 80ms
- Works without cookies

---

#### 9.4.3 User Journey

| Step | What Happens | Emotional State |
|---|---|---|
| 1 | `loopkit pulse setup` generates JS snippet + embed URL | Under 2 minutes to live |
| 2 | Founder pastes one script tag into product HTML | Minimal effort |
| 3 | Widget appears in product — unobtrusive floating tab | User barely notices |
| 4 | User submits feedback | Founder gets passive signal |
| 5 | Optional system notification: "New pulse response." | Zero interruption default |
| 6 | Saturday: `loopkit pulse` shows responses + AI clusters | Clarity without a meeting |
| 7 | Each cluster: [t]ag to sprint / [s]nooze 2 weeks / [i]gnore | Feedback becomes action |
| 8 | Tagged clusters appear as tasks in `loopkit track` | Feedback-to-task loop closed |

---

#### 9.4.4 Acceptance Criteria

**AC-PULSE-01: Widget renders and collects response**

```
Given:  JS snippet pasted into product, user visits and submits feedback
When:   User submits widget form
Then:
  - Response stored in Convex within 500ms
  - User sees: "Thanks — this helps."
  - Widget closes automatically
  - Widget does NOT re-appear to same user for 7 days
  - Response visible in `loopkit pulse` CLI within 60 seconds
  - No personal data collected beyond the text response
```

**AC-PULSE-02: AI clusters 10+ responses**

```
Given:  10 or more responses collected this week
When:   `loopkit pulse` runs
Then:
  - Three labeled buckets shown: Fix now / Validate later / Noise
  - Each bucket: count, 2-3 representative quotes, 1-line pattern
  - Confidence shown: "8/10 responses clearly clustered, 2 ambiguous"
  - Raw responses accessible via `loopkit pulse --raw`
  - Outlier responses shown separately
```

**AC-PULSE-03: Fewer than 5 responses — no false clustering**

```
Given:  Only 3 responses collected this week
When:   `loopkit pulse` runs
Then:
  - Raw responses shown without clustering
  - "Not enough responses to cluster reliably (3/5 minimum). Showing raw."
  - No AI API call made — saves cost, avoids hallucinated patterns
  - Tip shown: "Your widget may need better placement."
```

**AC-PULSE-04: Feedback tagged to sprint**

```
Given:  User presses [t] on a cluster during pulse review
When:   Action confirmed
Then:
  - New task created in tasks.md: "[from pulse] [cluster title]"
  - Source cluster ID linked in task metadata
  - Visible in `loopkit track` immediately
  - Cluster marked as "actioned" in pulse history
  - Original responses remain accessible
```

**AC-PULSE-05: Widget submission fails (network down)**

```
Given:  User submits widget response, Convex write fails
When:   Network error on submit
Then:
  - User still sees "Thanks — this helps." (never show error to user)
  - Response stored in localStorage
  - Retry attempted on next page load (up to 3 times)
  - If all retries fail: response logged to console.warn only
```

---

#### 9.4.5 Success Metrics

| Metric | Target | Signal If Missed |
|---|---|---|
| Widget response rate | ≥8% of impressions → submission | Question too hard or widget too hidden |
| Cluster-to-task rate | ≥40% of clusters tagged to sprint | Clustering not compelling — improve AI notes |
| Weekly pulse check | ≥70% of paid users checking pulse weekly | Not part of Saturday habit — add reminder |
| Widget load overhead | < 80ms | Script too heavy — audit and trim |
| Convex write success rate | ≥99.5% | Infrastructure issue — add retry logic |

---

#### 9.4.6 Error States

| Error | User-Facing Message |
|---|---|
| Convex write fails | User sees "Thanks." Retry silently in background. Never expose error to user. |
| Widget CSS conflict with host page | Shadow DOM isolation prevents this. If still occurs: flag as bug, fix same day. |
| AI clustering returns malformed JSON | Fall back: show raw responses with "Clustering failed — showing raw feedback." |
| No responses ever collected | After 7 days with 0 responses: "No responses yet. Is your widget placed after a user action?" |
| Rate limit on Convex | Queue locally, flush on reconnect. Never drop a response. |

---

### 9.5 loopkit loop

**Phase:** Iterate
**Time:** ~5 minutes (Sunday ritual)
**Tier:** Paid (AI synthesis)

**Purpose:** Closes the week and opens the next. Turns a week of scattered data into one decision and one post-ready build-in-public update.

**Core Job:** The founder closes their laptop feeling ahead rather than behind — one thing decided for next week, one post ready to publish.

---

#### 9.5.1 System Prompt

```
You are a weekly strategist inside LoopKit. You synthesize a solo founder's
week of data into one clear decision and one honest build-in-public post.

## context you receive
- Product brief (bet, ICP, riskiest assumption)
- Tasks completed this week and their descriptions
- Pulse feedback clusters from this week
- Ship log from Friday (what was launched, if anything)
- Week number (to track trajectory)

## your output

### the one thing (most important)
Look at what got done, what feedback came in, and what was shipped.
Identify the single highest-leverage action for the coming week.

Ranking logic:
1. If "Fix now" pulse cluster exists → address that first
2. If nothing was shipped this week → shipping beats building new features
3. If riskiest assumption is still unvalidated → validate it before building further
4. Otherwise → the next task that most directly moves the core bet forward

State your recommendation in one sentence. Give one-sentence rationale.
Be direct. Do not hedge.

### build-in-public post
Write a Twitter/X post in this structure:
"Week [N] of building [product].

Shipped: [what actually shipped — specific]
Learned: [one genuine insight from this week]
Next: [the one thing from above]"

Rules:
- Under 280 characters total
- Specific over vague ("Added PDF export" not "Made progress on features")
- Honest — if nothing shipped, say so
- No hashtags unless #buildinpublic at the end only
- No emoji

## critical rules
- ONE recommendation only — never a list of options
- If pulse and track conflict (users want X, plan says Y) — surface the tension
  explicitly before giving a recommendation: "Tension: [X] vs [Y]. Recommending
  [Z] because [reason]."
- If override rate from previous weeks is tracked and high — note: "Note: your
  last N recommendations were overridden. Consider whether the AI context needs updating."
- Never validate inaction — if the founder shipped nothing and has no blockers,
  say so plainly
- Max 150 words total

## output format
Return ONLY valid JSON, no markdown fences:
{
  "oneThing": "string",
  "rationale": "string",
  "tension": "string | null",
  "bipPost": "string"
}
```

---

#### 9.5.2 User Journey

| Step | What Happens | Emotional State |
|---|---|---|
| 1 | Sunday morning — runs `loopkit loop` | Reflective, coffee in hand |
| 2 | Week in numbers renders instantly from local data (< 1 second) | Progress made visible |
| 3 | "Synthesizing your week..." — AI call in progress | Anticipation |
| 4 | One-thing recommendation shown with rationale | Relief — decision made |
| 5 | [a]ccept → task set as #1 in track. [c]hange → type own. [s]kip → no task | Control with low friction |
| 6 | BIP post draft shown — edit or approve | Marketing done in 30 seconds |
| 7 | Loop log saved to `.loopkit/logs/week-N.md` | Compound value over time |
| 8 | "Week N complete. See you next Sunday." | Ritual closed |

---

#### 9.5.3 Acceptance Criteria

**AC-LOOP-01: Full loop with all data sources**

```
Given:  Tasks tracked, pulse has responses, ship log exists from Friday
When:   `loopkit loop` runs on Sunday
Then:
  - Week summary renders in under 1 second (local data, no API)
  - AI synthesis completes in under 8 seconds
  - One-thing recommendation shown with rationale (1 sentence each)
  - [a]ccept → task appears in track as #1 priority immediately
  - BIP post draft shown, under 280 characters, specific
  - Loop log saved to .loopkit/logs/week-N.md
  - Total session time under 5 minutes
```

**AC-LOOP-02: No tracking data — first week**

```
Given:  User installed LoopKit this week, no track or pulse data
When:   `loopkit loop` runs
Then:
  - "No tracking data yet — that's fine for week 1."
  - 2 inline questions: "What did you make progress on?" + "What's next week's one thing?"
  - Saves answers as loop log
  - Generates BIP post from inline answers
  - Never shows empty dashboard — always produces output
```

**AC-LOOP-03: Founder overrides AI recommendation**

```
Given:  AI suggests "fix onboarding" but founder has a critical bug to fix
When:   Founder presses [c] to change recommendation
Then:
  - "What's your one thing instead?" — free text input
  - Optional: "Why different? (helps improve future suggestions)"
  - Override reason recorded in loop log
  - Override rate tracked as product signal
  - Founder's choice saved as week's #1 task with no friction
  - If override rate > 50% over 4 weeks: show note in next loop
```

**AC-LOOP-04: Mid-week check-in (not Sunday)**

```
Given:  User runs `loopkit loop` on Wednesday
When:   Command runs
Then:
  - "Mid-week check-in mode (full loop runs Sunday)."
  - Shows partial week data: tasks done so far, pulse responses so far
  - No AI synthesis called (saves cost)
  - Option: "Run full synthesis anyway? [y/n]"
  - If y: runs synthesis, notes "mid-week" in output
```

**AC-LOOP-05: Tension between pulse and track**

```
Given:  Pulse "Fix now" cluster says "onboarding is broken", track plan says "build feature X"
When:   AI synthesizes
Then:
  - Tension surfaced explicitly: "Tension: users flagging onboarding vs your plan to build X."
  - ONE recommendation given despite the tension, with stated tradeoff
  - Founder can override with [c]hange if they disagree
  - Tension noted in loop log for future reference
```

**AC-LOOP-06: BIP post generation**

```
Given:  Week data and one-thing recommendation exist
When:   BIP post generated
Then:
  - Post under 280 characters
  - Contains: week number, what shipped (specific), one insight, one next action
  - No hashtags except optional #buildinpublic at end
  - No emoji
  - Specific language: "Added PDF export" not "Made progress on features"
  - If nothing shipped: honest — "Shipped nothing this week. Here's why and what changes next week."
```

---

#### 9.5.4 Success Metrics

| Metric | Target | Signal If Missed |
|---|---|---|
| Sunday run rate | ≥75% of paid users running loop on Sunday | Not a habit — add Sunday morning nudge notification |
| AI recommendation accept rate | ≥60% accepted as-is | AI context insufficient — add more data to synthesis |
| BIP post use rate | ≥45% used or lightly edited | Post quality poor — improve prompt, check character limits |
| 4-week streak rate | ≥40% with 4 consecutive Sunday loops | Habit not formed — add streak visualization |
| Synthesis latency | < 8 seconds | Use streaming output — never show blank screen with spinner |

---

#### 9.5.5 Error States

| Error | User-Facing Message |
|---|---|
| AI synthesis > 10 seconds | Stream tokens as they arrive. Never show spinner for 10 seconds with no output. |
| Loop log already exists for this week | "A loop log exists for week N (created Thursday). [o]verwrite / [a]ppend?" |
| No previous loop logs | Show current week only — no trajectory comparison. "Week 1 baseline set." |
| AI returns conflicting tension with no recommendation | Fallback: show the two options and ask founder to pick one. Never leave them with no output. |
| BIP post over 280 characters | Auto-trim to 280 with "..." and offer [e]dit to fix manually. |

---

## 10. Success Metrics

### 10.1 North Star Metric

**Weekly Active Shippers** — a user who runs at least one loopkit command per week across two or more different phases (e.g., track + ship, or pulse + loop).

This measures whether LoopKit is actually closing the loop, not just installed and forgotten.

**Target:** 500 Weekly Active Shippers by Month 6.

### 10.2 Milestone Metrics

| Milestone | Metric | Target | Timeline |
|---|---|---|---|
| Ramen profitable | $500 MRR | 25 paid users | Month 2 |
| PMF signal | 40% "very disappointed" in Sean Ellis survey | 40 responses | Month 3 |
| First ₹1L MRR | ~$1,200 MRR | 60 paid users | Month 4 |
| ₹1 Crore run rate | ~$10K MRR | 450 paid users | Month 15–18 |
| Sustainable | < 5% monthly churn + > $5K MRR | Both conditions | Month 12 |

### 10.3 Per-Command Health Metrics

| Command | Key Metric | Target |
|---|---|---|
| init | Session completion rate | ≥70% |
| init | Upgrade conversion | #1 trigger |
| track | Weekly active retention | ≥65% |
| track | Auto-close rate | ≥60% |
| ship | Weekly ship rate | 1/week per active user |
| ship | Draft use rate | ≥50% |
| pulse | Widget response rate | ≥8% of impressions |
| pulse | Cluster-to-task rate | ≥40% |
| loop | Sunday run rate | ≥75% paid users |
| loop | 4-week streak rate | ≥40% |

---

## 11. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Low initial adoption | Medium | High | Leverage git-scope audience; LTD creates urgency |
| AI API costs spike | Low | Medium | Rate-limit free tier AI usage; cache common prompts |
| Competition from Notion AI | Medium | Medium | CLI-first moat; they won't build a terminal tool |
| High churn from inactive users | High | Medium | `loopkit loop` creates Sunday ritual that reduces passive churn |
| Scope creep kills shipping | High | High | 5-command MVP lock; no new commands until $1K MRR |
| Burnout from solo maintenance | Medium | High | At $2K MRR, fund a part-time VA or community moderator |
| git hook installs break repos | Low | High | Never modify existing hooks; append-only; always check permissions first |

---

## 12. Roadmap

### Phase 1 — MVP (Days 1–7)

| Day | Task |
|---|---|
| 1 | `loopkit init` — AI PRD generator, local markdown output |
| 2 | `loopkit track` — task list + git commit sync |
| 3 | `loopkit ship` — pre-launch checklist + AI post generator |
| 4 | `loopkit pulse` — feedback widget JS snippet + CLI puller |
| 5 | `loopkit loop` — weekly review + AI next-action |
| 6 | Polish CLI UX, colors, help text, great README |
| 7 | npm publish, landing page live, Show HN post |

### Phase 2 — Post-PMF (Month 2–3)

- Polar.sh payment integration — Solo and Pro tiers
- Web dashboard v1 — project overview and feedback inbox
- Annual plan with 20% discount
- LTD sale — 100 licenses at $149

### Phase 3 — Growth (Month 4–6)

- Multi-project support for Pro users
- Client export mode — professional reports for freelancers
- GitHub integration — auto-close tasks from PR merges
- GitLog integration — ship log becomes changelog automatically

### Phase 4 — Scale (Month 7–12)

- Team features — share loop with a co-founder or VA
- VS Code extension for task tracking inside editor
- Affiliate program — 30% commission, developer-to-developer
- API access for power users

---

## 13. Execution Checklist — First 30 Days

| # | Task | Day | Done |
|---|---|---|---|
| 1 | Write README before any code | 0 | ☐ |
| 2 | Scaffold CLI with Bun + TypeScript | 1 | ☐ |
| 3 | Ship `loopkit init` with AI scoring | 1 | ☐ |
| 4 | Ship `loopkit track` with git sync | 2 | ☐ |
| 5 | Ship `loopkit ship` with AI post generator | 3 | ☐ |
| 6 | Ship `loopkit pulse` feedback widget | 4 | ☐ |
| 7 | Ship `loopkit loop` weekly review | 5 | ☐ |
| 8 | Polish CLI, add colors, test end-to-end | 6 | ☐ |
| 9 | npm publish + landing page live | 7 | ☐ |
| 10 | Show HN post + git-scope tweet | 7 | ☐ |
| 11 | Collect first 10 feedback responses | 10 | ☐ |
| 12 | First paying customer | 14 | ☐ |
| 13 | Add payment gate for AI features | 14 | ☐ |
| 14 | Product Hunt launch | 21 | ☐ |
| 15 | First `loopkit loop` public BIP post | 7 | ☐ |
| 16 | $500 MRR | 30–45 | ☐ |

---

## Appendix — Product-Minded Engineering Rules

Before adding any feature, answer these three questions:

1. **Does this remove a reason not to pay?** → If yes, prioritize immediately.
2. **Does this increase the value of what users already have?** → If yes, queue for next sprint.
3. **Does this add something nobody has asked for?** → If yes, park for 90 days.

The weekly rhythm:

```
Mon–Thu  → Build. One focused feature or fix. 2-day max per task.
Friday   → Ship. Deploy + loopkit ship.
Saturday → Observe. Check analytics, read pulse. No coding.
Sunday   → Loop. Run loopkit loop. Decide next week's one thing.
```

The README is the product spec. Write it before writing code. If you cannot explain a feature in two sentences, do not build it.

---

> *The best time to ship was yesterday. The second best time is today.*
>
> `loopkit init`