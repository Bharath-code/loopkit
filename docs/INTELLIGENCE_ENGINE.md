# LoopKit Intelligence Engine

> *"The best products don't just collect data. They use it to make users feel seen, understood, and unstoppable."*

**Date:** April 2026  
**Goal:** Turn behavioral data into product intelligence that wows users, deepens retention, and builds an unassailable moat

---

## The Intelligence Flywheel

```
     ┌─────────────┐
     │   USERS     │
     │   SHIP      │
     └──────┬──────┘
            │
            ▼
     ┌─────────────┐
     │  BEHAVIORAL │
     │    DATA     │
     │ (anonymous) │
     └──────┬──────┘
            │
            ▼
     ┌─────────────┐
     │  INTELLIGENCE│
     │   ENGINE    │
     │  (ML + rules)│
     └──────┬──────┘
            │
            ▼
     ┌─────────────┐
     │   PRODUCT   │
     │  FEATURES   │
     │ (personalized)│
     └──────┬──────┘
            │
            ▼
     ┌─────────────┐
     │    WOW      │
     │  MOMENTS    │
     └──────┬──────┘
            │
            ▼
     ┌─────────────┐
     │  RETENTION  │
     │  (habit +   │
     │   emotion)  │
     └──────┬──────┘
            │
            └────────────► Back to USERS SHIP
```

**Key insight:** Every week a user ships with LoopKit, we get smarter. Every insight we surface makes them ship more. The more they ship, the more data we have. This is a compounding flywheel that competitors can't replicate without 6-12 months of catch-up.

---

## Phase 1: Personalization (Month 1-3)

### Feature 1.1: The Shipping DNA

**What it does:** After 4 weeks of usage, LoopKit generates your "Shipping DNA" — a personalized profile of how you work.

**Example output:**
```
Your Shipping DNA (Week 4)

🧬 Pattern: Marathoner
   You ship consistently (avg 3.2 tasks/week) with steady momentum.
   Your superpower: You don't burn out. Your risk: You play it safe.

📊 Velocity Trend: ↗️ Improving
   Week 1: 40%  │██░░░░░░░░
   Week 2: 55%  │█████░░░░░
   Week 3: 62%  │██████░░░░
   Week 4: 71%  │███████░░░

⏰ Peak Day: Wednesday
   You complete 38% of tasks on Wednesdays. Consider scheduling
   hard tasks for Tuesday night so Wednesday is your power day.

🎯 Completion Style: Front-loaded
   You do 60% of weekly tasks by Thursday. Most founders peak on Friday.
   This is a strength — you have buffer for surprises.

⚠️ Risk: Snooze Accumulation
   You've snoozed 4 tasks in 4 weeks. Only 25% of snoozed tasks
   ever get done. Consider cutting them.
```

**Data used:**
- Tasks created/completed/snoozed/cut per week
- Day-of-week completion patterns
- Time from task creation to completion
- Shipping score trend
- Override history

**Why it wows:**
- Users see themselves in the data. It's a mirror, not a dashboard.
- Specific insights ("Wednesday is your power day") feel like magic.
- The "Shipping DNA" language creates identity attachment.

**How it retains:**
- Identity reinforcement: "I'm a Marathoner" becomes self-fulfilling.
- Progress visualization: Trend lines show improvement, motivating continuation.
- Risk warnings: Snooze accumulation alert prevents gradual disengagement.

**How it builds moat:**
- 4 weeks of data required = switching cost increases every week.
- Personalized insights can't be replicated by a competitor on day 1.

---

### Feature 1.2: Smart Benchmarks

**What it does:** Compares your metrics to anonymized founders with similar profiles.

**Example output:**
```bash
$ loopkit track

Your Week 4 Board
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ #1 Landing page      ✓ #2 Stripe config
✓ #3 Auth flow         ○ #4 Privacy policy
○ #5 Analytics         

Shipping Score: 60% (3/5)

📊 Benchmarks (SaaS founders, Week 4):
   You:        60%  │██████░░░░
   Top 10%:    85%  │████████░░
   Average:    48%  │████░░░░░░
   Bottom 10%: 22%  │██░░░░░░░░

💡 Insight: You're shipping faster than 72% of SaaS founders
   at the same stage. Keep the momentum — Week 5 is where most drop.
```

**Data used:**
- Aggregate shipping scores by project type (SaaS, mobile, API, etc.)
- Aggregate by week number (Week 1 averages, Week 4 averages)
- Aggregate by ICP score bracket

**Why it wows:**
- Social proof + competition. "I'm better than average" feels good.
- Specific percentile (72%) feels precise and credible.
- "Week 5 is where most drop" — actionable warning based on data.

**How it retains:**
- Benchmark anxiety: Users don't want to fall behind peers.
- Benchmark pride: Users want to maintain their "above average" status.
- Predictive warnings: "Week 5 dropoff" prepares users for their hardest week.

**How it builds moat:**
- Requires hundreds of users for meaningful benchmarks. New competitor has no data.
- Benchmarks improve with scale. More users = more precise percentiles.

---

### Feature 1.3: The Snooze Oracle

**What it does:** When you snooze a task, LoopKit tells you the probability it will ever get done — based on historical data.

**Example interaction:**
```
Task #7 "Add dark mode" has been open for 4 days. Keep / Snooze / Cut?

> Snooze

🎱 Snooze Oracle says:
   Based on 1,000+ snoozed tasks by founders like you:
   • 67% of tasks snoozed once are never completed
   • 23% are completed after 2+ snoozes
   • Average time from snooze to completion: 18 days

   This task was also snoozed in Week 2. Probability of completion: 12%.

   Recommendation: Cut it. If it's important, it will come back.
```

**Data used:**
- Snooze-to-completion rates across all users
- Snooze frequency per task
- Task characteristics (age, category, snooze history)

**Why it wows:**
- Brutal honesty. Most task managers let you defer forever. LoopKit calls you out.
- Data-backed. Not opinion — probability.
- Surprising. Users don't expect their CLI to be this smart.

**How it retains:**
- Prevents task list bloat. A clean task list = less overwhelm = more shipping.
- Builds trust. When the oracle is right, users trust LoopKit more.

**How it builds moat:**
- Requires months of snooze-to-completion data. Can't fake it.
- Accuracy improves with scale.

---

## Phase 2: Predictive Intelligence (Month 3-6)

### Feature 2.1: The Churn Guardian

**What it does:** Detects when a user is at risk of churning and intervenes proactively.

**How it works:**
ML model trained on:
- Shipping score trend (declining for 2+ weeks)
- Phase adherence (skipping `loop` or `pulse`)
- Task creation rate (creating fewer tasks)
- Override rate (increasing = losing trust in system)
- Streak breaks (missed Sunday loop)

**Example intervention:**
```bash
$ loopkit track

⚠️ Churn Guardian Alert

Your shipping score has declined for 2 weeks:
   Week 5: 71%
   Week 6: 55%  ←
   Week 7: 38%  ←

This pattern matches 200+ founders who eventually stopped shipping.
But 40% of them turned it around. Here's what they did:

1. Cut 50% of open tasks (you have 8, try cutting 4)
2. Ship something small this week (even a README update counts)
3. Run `loopkit loop` on Sunday even if you "have nothing to report"

Want me to suggest 3 micro-tasks to get momentum back?
[Yes] [No, I'm just busy this week]
```

**Why it wows:**
- Feels like a caring coach, not a nagging app.
- Specific stats ("40% turned it around") give hope.
- Actionable suggestions, not generic advice.

**How it retains:**
- Early intervention before user fully disengages.
- Reduces guilt. "It's normal to have bad weeks" normalizes struggle.
- Micro-tasks provide achievable wins.

**How it builds moat:**
- Churn prediction model is trained on proprietary behavioral data.
- Interventions are calibrated to our specific user base.

---

### Feature 2.2: Auto-Loop (The Sunday Ritual Assistant)

**What it does:** If a user misses Sunday `loopkit loop`, LoopKit auto-generates a draft loop log on Monday morning and sends it via email/notification.

**Example:**
```
Subject: Your Week 7 Loop — Draft Ready

Hey Sarah,

You missed your Sunday loop (it happens!). I drafted one based on
your week. Edit or confirm:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Week 7 Summary
Tasks: 3 done, 2 open (60% shipping score)
Shipped: Landing page v2 with auth
Pulse: 2 new responses

🎯 The One Thing (AI suggestion):
   "Fix the mobile layout — both pulse responses mention it"

Override? [Looks good] [I want to change it]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Just reply with your override and I'll update your log.
```

**Data used:**
- Tasks completed (from tasks.md)
- Ship logs (from `.loopkit/ships/`)
- Pulse responses (from Convex)
- Historical loop patterns

**Why it wows:**
- "You didn't even have to run the command. I did it for you."
- Removes friction. One click to confirm vs. running a command.
- Feels proactive, not reactive.

**How it retains:**
- Breaks the "I missed a week, might as well quit" cycle.
- Maintains streak psychology. "Your draft is ready" = loop is still alive.
- Email = re-engagement channel outside the CLI.

**How it builds moat:**
- Requires understanding of individual user's historical patterns.
- Competitor would need same data + same user trust to be this proactive.

---

### Feature 2.3: Success Prediction

**What it does:** After 8 weeks, LoopKit predicts the probability of project success based on behavioral patterns.

**Example:**
```bash
$ loopkit loop

Week 8 Synthesis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 The One Thing: Launch beta to 10 users

📈 Success Predictor (based on 500+ projects):
   Your project has a 68% probability of reaching first revenue
   within 6 months. Here's why:

   ✅ Strengths:
      • Consistent shipping (avg 72% score) — top quartile
      • Validated before building (ICP score: 9/10)
      • Active feedback collection (12 pulse responses)

   ⚠️ Risks:
      • MVP scope keeps expanding (3 tasks added to Week 8)
      • Only 1 ship in 4 weeks (should be weekly)

   Founders with your pattern who fixed the risks:
   → 89% reached first revenue
   Founders who didn't:
   → 34% reached first revenue

   Recommendation: Ship something this week. Anything.
```

**Data used:**
- 8 weeks of behavioral data
- Outcome data (when users eventually report revenue, users, etc.)
- Historical correlations between behaviors and outcomes

**Why it wows:**
- Brutal honesty + hope. "68%" feels scientific.
- Specific actionable advice tied to probability changes.
- Gamification. Users want to improve their "success score."

**How it retains:**
- Creates stakes. Users don't want to be in the "34%" group.
- Provides specific fixes, not vague advice.
- Regular updates (every 4 weeks) create anticipation.

**How it builds moat:**
- Requires outcome data that only LoopKit has (structured founder journeys).
- Model improves with every user who reports outcomes.

---

## Phase 3: Network Intelligence (Month 6-12)

### Feature 3.1: Anonymous Peer Inspiration ✅ IMPLEMENTED

**What it does:** Shows what anonymized founders with similar projects shipped this week.

**Example:**
```bash
$ loopkit ship

What's the main thing you shipped? Added PDF export for invoices

🚀 Peer Inspiration — This week in saas:
   • "Stripe billing portal integration"
   • "Webhook retry logic with exponential backoff"
   • "Public API docs with Swagger"

  You're not alone. Keep shipping.
```

**How it works:**
- After you run `loopkit ship`, LoopKit stores an anonymized record of what you shipped (category + one-line description)
- When you or other founders ship in the same category, those records are surfaced
- Only shown if telemetry is opted in. No usernames, project names, or identifying details

**Data used:**
- Anonymized ship descriptions by project category
- Category matching via brief ICP/MVP keywords

**Why it wows:**
- "I'm not alone." Solo founders are isolated. Peer visibility reduces loneliness.
- Inspiration. "If they shipped API docs, maybe I should too."

**How it retains:**
- Community feeling without community overhead.
- Weekly novelty. "What did others ship?" creates anticipation.

**How it builds moat:**
- Requires critical mass (100+ active users per project type).
- Network effect: more users = better peer matches.

---

### Feature 3.2: Trending Validations ✅ IMPLEMENTED

**What it does:** Shows what ICPs, problems, and MVPs are trending among LoopKit founders.

**How it works (implemented):**
- When a founder runs `loopkit init` with telemetry opted in, their ICP, problem, and MVP are categorized into one of 10 ICP types, 10 problem types, and 8 MVP types.
- Categories are stored as anonymized aggregates in Convex (`briefAggregates` table).
- The dashboard `/dashboard/trends` page shows top 10 in each category with 7-day and 30-day trend deltas.
- After `init`, if similar founders exist, a CLI hint appears: "X other founders are exploring similar spaces this month."

**Example (CLI):**
```
  Trending Validation
  5 other founders are exploring similar ICP spaces this month.
  Run `loopkit radar` to see recent launches in your category.
```

**Example (Dashboard):**
```
Trending Validations
5 founders opted in

Top ICPs          Top Problems        Top MVP Types
1. saas founders  1. content creation  1. web app
2. creators       2. email outreach    2. cli tool
3. developers     3. workflow auto     3. api/plugin
```

**Data used:**
- Anonymized ICP, problem, and MVP categories from briefs
- Aggregate counts with 7d/30d trend windows
- No raw brief content, no user identifiers

**Why it wows:**
- Market intelligence for free. Founders pay for this kind of data.
- Trend detection. "Market may be crowded" is valuable signal.
- Content goldmine. Monthly Insights writes itself from this data.

**How it retains:**
- Users come back just to see "what's trending."
- Helps with ideation. "What's a validated ICP I haven't considered?"

**How it builds moat:**
- Proprietary market data no one else has.
- Becomes a research destination, not just a tool.
- Compounds with every new user who opts in.

**Implementation status:**
- ✅ `recordBriefCategories()` in `telemetry.ts` — captures categorized brief data
- ✅ `getTrendingValidations` in `convex/analytics.ts` — returns top 10 per category with trend deltas
- ✅ `/dashboard/trends` — 3-column layout (ICPs, Problems, MVP types)
- ✅ CLI trend hint in `init.ts` — shows after brief scoring when similar founders exist
- ✅ `briefAggregates` table in Convex schema

---

### Feature 3.3: Competitor Ship Radar ✅ IMPLEMENTED

**What it does:** Scans Product Hunt and Hacker News for recent launches in the user's category.

**How it works (implemented):**
- Maps the user's ICP category (from their brief) to search keywords.
- Fetches Product Hunt RSS feed and HN Algolia Search API (free, no API keys).
- Scores each launch for relevance (0-100%) based on keyword matches.
- Results cached for 24 hours. API failures return empty arrays, not crashes.

**Example (CLI):**
```bash
$ loopkit radar

  Scanning for: saas founders
  Found 7 relevant launches.

  3 launches this week

  [PH] Acme CRM
    The CRM for solo founders
    2 days ago · relevance: 85%
    https://producthunt.com/posts/acme-crm

  [HN] ShipFast
    Launch your SaaS in a weekend
    1 day ago · relevance: 72%
    https://news.ycombinator.com/item?id=12345
```

**Data sources:**
- Product Hunt RSS (`https://www.producthunt.com/rss`) — free, official
- HN Algolia Search API (`https://hn.algolia.com/api/v1/search`) — free, official
- No scraping, no unofficial endpoints, no API keys required

**Why it wows:**
- "I didn't know 3 competitors shipped this week." Market awareness without manual research.
- Relevance scoring surfaces what matters, not everything.
- Works out of the box — no configuration needed.

**How it retains:**
- Founders check radar weekly to stay aware of their space.
- Drives back to dashboard for deeper trends analysis.

**How it builds moat:**
- Keyword mapping + relevance scoring tuned to LoopKit's ICP taxonomy.
- Combined with trending data, creates a unique market intelligence layer.

**Implementation status:**
- ✅ `competitorRadar.ts` — PH RSS parser + HN Algolia adapter, keyword mapping, relevance scoring
- ✅ `loopkit radar` command — auto-detects category from brief, supports `--category` flag
- ✅ 24-hour cache via existing `cache.ts` pattern
- ✅ Trending widget on dashboard overview page
- ✅ 10 ICP categories + 10 problem categories mapped to search keywords

**Implementation status:**
- ✅ `competitorRadar.ts` — PH RSS parser + HN Algolia adapter, keyword mapping, relevance scoring
- ✅ `loopkit radar` command — auto-detects category from brief, supports `--category` flag
- ✅ 24-hour cache via existing `cache.ts` pattern
- ✅ Trending widget on dashboard overview page
- ✅ 10 ICP categories + 10 problem categories mapped to search keywords
- ✅ State-machine XML parser — handles nested tags, CDATA, namespace prefixes without external deps
- ✅ JSON-configurable keywords (`keywords.json`) — adding new ICP/problem categories requires only JSON edits
- ✅ Structured JSON logging — all errors emit JSON with level, module, correlationId, timestamp, data
- ✅ Parallel HN API calls — 3 queries fetched concurrently via Promise.all
- ✅ Per-install encryption salt — cryptographically random salt generated on first run, stored in config.json

---

### Feature 3.4: Keyword Opportunity Finder 🔄 IN PROGRESS

**What it does:** Finds low-competition keywords in the user's niche using free SEO APIs.

**How it works (planned):**
- Free SEO data adapters: Google Autocomplete (RSS), AnswerThePublic free tier, Reddit search API.
- Keyword scoring: score = (search volume proxy) / (competition proxy).
- Competition = number of PH launches + GitHub repos + HN mentions.
- Returns top 10 opportunities with actionable content suggestions.

**Example (CLI):**
```bash
$ loopkit keywords

  Low-hanging fruit for: saas founders

  1. "saas metrics dashboard"     score: 8.2  volume: high  competition: low
  2. "solo founder tools"          score: 7.5  volume: med   competition: low
  3. "indie hacker analytics"      score: 6.8  volume: med   competition: med
```

**Data sources:**
- Google Autocomplete (via RSS, free)
- AnswerThePublic free tier
- Reddit search API (free)
- No paid APIs, no scraping

---

### Feature 3.5: Market Timing Signal 🔄 IN PROGRESS

**What it does:** Tracks funding rounds, job postings, and GitHub activity in the user's category.

**How it works (planned):**
- Free market data: Crunchbase RSS (funding), GitHub API (repo growth), job posting RSS.
- 3 signals: funding velocity, dev activity, hiring demand — each with ↑ ↓ → trend.
- Composite score 0-100. "Space is heating up" vs "cooling down."

**Example (CLI):**
```bash
$ loopkit init

  Market Signal: ↑ Space is heating up
  3 funding rounds this month · 12 new GitHub repos · 8 job postings
```

---

## Phase 4: Coaching Intelligence (Month 9-18)

### Feature 4.1: Pattern Interrupt ✅ IMPLEMENTED

**What it does:** Detects recurring failure patterns from your local loop/task history and surfaces them with data-backed suggestions.

**Example:**
```bash
$ loopkit loop

Week 8 Review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Done: 2  Open: 6  Shipped: Not yet
  Score: ██░░░░░░░░ 20/100

⚡ Pattern Interrupt — 5 weeks of data

📋 OVERPLANNER (3 weeks)
   You plan 8+ tasks but finish ~25% of them.
   → Plan 3 must-do tasks per week. Everything else goes to backlog.
   → If a task has been open 2+ weeks, cut it or ship it.

🚢 SHIP AVOIDER (3 weeks)
   You haven't shipped in 3 weeks. Building without shipping is just inventory.
   → Next week's #1 priority: ship anything, even if it's imperfect.
   → Set a Friday 4pm 'ship alarm'. No exceptions.
```

**5 Pattern Detectors:**

| Pattern | Trigger | Suggestion |
|---|---|---|
| **Overplanner** | 8+ tasks planned, ≤30% completion for 3+ weeks | "Plan 3 must-do tasks only" |
| **Snooze Loop** | Low completion + recurring snoozed tasks | "Batch annoying tasks Monday morning" |
| **Ship Avoider** | 3+ weeks no ship + score ≤40% | "Ship anything by Friday 4pm" |
| **ICP Drift** | Declining score + "Fix now" pulse clusters | "Run `loopkit init --analyze` to re-examine ICP" |
| **Scope Creep** | Mid-week task additions ≥3 times in 4 weeks | "Lock scope on Sunday" |

**Data used:**
- Local loop logs (shipping scores, task counts, override history)
- Local tasks.md (snoozed items, mid-week additions)
- Pulse responses (negative feedback signals)

**Why it wows:**
- Brutal honesty from a tool that cares.
- Prevents repeated mistakes. "I didn't realize I was doing this again."
- Actionable, not vague. Every pattern comes with 2 specific suggestions.

**How it retains:**
- Prevents churn by preventing failure.
- Builds trust. "LoopKit saved me from myself."

**How it builds moat:**
- Requires longitudinal data per user (months of history).
- Pattern recognition is calibrated to our specific user base.

---

### Feature 4.2: The AI Coach ✅ IMPLEMENTED

**What it does:** A rule-based coaching layer that consumes all existing analytics (DNA, churn, predictor, patterns) and delivers contextual, actionable suggestions at milestone weeks and trigger points.

**CLI Usage:**
```bash
loopkit coach              # Show full coaching plan
loopkit coach --off        # Disable coaching
loopkit coach --on         # Re-enable coaching
```

**Integration points:**
- `loop` — shows priority moment post-synthesis
- `track` — shows coaching when stuck (0 tasks)
- `ship` — shows coaching when ship-avoider pattern detected
- Dashboard — `CoachingWidget` on overview page

**12 Coaching Rules:**

| Priority | Rule | Trigger |
|---|---|---|
| Critical | Ship Avoider | 3+ weeks without shipping |
| Critical | ICP Drift | Feedback says wrong problem + declining score |
| Critical | Low Velocity | <1 task/week for 3+ weeks |
| Critical | High Churn Risk | 2+ warning signals active |
| Warning | Overplanner | 8+ tasks, <30% completion rate |
| Warning | Snooze Loop | Tasks snoozed repeatedly |
| Warning | Scope Creep | Mid-week task additions |
| Warning | Medium Churn | 1 warning signal |
| Warning | Low Probability | Success predictor <40% |
| Info | Week 3 Milestone | Exactly 3 weeks tracked |
| Info | Week 8 Check-In | Exactly 8 weeks + predictor available |
| Info | Week 16 Archetype | Exactly 16 weeks + DNA available |

**Example interventions:**

**Critical — Ship Avoider:**
```
🚨 Coach: Ship Avoider Detected
   You haven't shipped in 4 weeks. Building without shipping is just inventory.
   → Ship anything this week — even if it's imperfect.
   Run: loopkit ship
```

**Warning — Overplanner:**
```
⚠️ Coach: Overplanning
   You plan 8+ tasks but finish ~30% of them.
   → Plan 3 must-do tasks per week. Everything else goes to backlog.
   Run: loopkit track
```

**Info — Week 3 Milestone:**
```
💡 Coach: Week 3 Milestone
   You've been validating for 3 weeks. 73% of founders who ship by week 4 reach revenue within 6 months.
   → Make this the week you ship something public.
   Run: loopkit ship
```

**Deduplication:** Same moment is never shown twice in a row. Critical moments bypass all throttling. Max 1 moment per command invocation.

**Data used:**
- Loop logs (tasks, scores, overrides, shipping habit)
- Pattern interrupts (5 anti-patterns)
- Churn risk signals (4 risk types)
- Success prediction (8-week heuristic model)
- Shipping DNA (archetype, velocity, completion style)

**Why it wows:**
- Feels like a personal coach who understands your specific situation.
- Proactive, not reactive. Surfaces insights before you ask.
- Specific, not generic. "Ship today" vs. "ship more."

**How it retains:**
- Users feel supported, not just managed.
- Coach builds relationship. Users don't want to "fire" their coach.
- Prevents common failure modes before they happen.

**How it builds moat:**
- Requires months of individual + aggregate data.
- Coaching logic is tuned to our methodology.
- Competitor would need same data depth + same methodology understanding.

---

## The Wow Moments Summary

| Phase | Feature | Wow Moment | Retention Mechanic | Moat Contribution |
|-------|---------|-----------|-------------------|-------------------|
| 1 | Shipping DNA | "Wednesday is your power day" | Identity attachment | 4 weeks of data required |
| 1 | Smart Benchmarks | "You ship faster than 72% of founders" | Social competition | Aggregate data scale |
| 1 | Snooze Oracle | "Probability of completion: 12%" | Honest accountability | Snooze-completion data |
| 2 | Churn Guardian | "40% turned it around. Here's how." | Early intervention | Churn prediction model |
| 2 | Auto-Loop | "I drafted your loop. Confirm?" | Friction removal | Individual pattern data |
| 2 | Success Predictor | "68% probability of revenue" | Stakes + hope | Outcome correlations |
| 3 | Peer Inspiration | "Founders like you shipped..." | Community feeling | Critical mass network |
| 3 | Trending Validations ✅ | "5 founders exploring similar ICPs" | Market intelligence | Proprietary aggregate data |
| 3 | Competitor Ship Radar ✅ | "3 competitors shipped this week" | Market awareness | Keyword mapping + relevance scoring |
| 4 | Pattern Interrupt ✅ | "This is your 4th project in 6 months" | Preventing failure | Longitudinal user data |
| 4 | AI Coach ✅ | "Ship anything this week — even if imperfect" | Personal relationship | Deep behavioral understanding |

---

## Data Requirements by Phase

| Phase | Users Needed | Weeks of Data | Key Data |
|-------|-------------|---------------|----------|
| 1 (Personalization) | 50+ | 4+ weeks | Tasks, shipping scores, timing patterns |
| 2 (Predictive) | 200+ | 8+ weeks | + Outcomes (revenue, users, abandonment) |
| 3 (Network) | 500+ | 12+ weeks | + Aggregate patterns by project type |
| 4 (Coaching) | 1,000+ | 20+ weeks | + Longitudinal per-user patterns |

**Critical path:** We need 200 users with 8 weeks of data to unlock Phase 2. That's 1,600 founder-weeks. At our current trajectory, this takes 6-12 months.

**Acceleration strategies:**
1. **Onboarding cohorts:** Invite 50 beta users with a "12-week challenge"
2. **Content engine:** Monthly Insights + benchmark tool drive organic signups
3. **Partnerships:** Integrate with solo founder communities (Indie Hackers, Pieter Levels' community)
4. **Viral loops:** Shareable benchmark cards + public ship logs

---

## Implementation Roadmap

### Month 1: Foundation
- [ ] Telemetry module (STRAT-1 from STATUS.md)
- [ ] Shipping DNA v1 (basic pattern detection)
- [ ] Simple benchmarks (avg only, no percentiles)

### Month 2: Enhancement
- [ ] Smart benchmarks (percentiles by project type)
- [ ] Snooze Oracle (basic probability)
- [ ] Benchmark tool on dashboard

### Month 3: Predictive
- [ ] Churn Guardian v1 (rule-based, not ML)
- [ ] Auto-Loop (email drafts)
- [ ] Success Predictor v1 (simple heuristics)

### Month 4: Network
- [x] Anonymous peer inspiration (opt-in) — shipped
- [x] Trending validations — shipped
- [ ] Monthly Insights content engine

### Month 5: Signal Intelligence
- [x] Competitor Ship Radar — shipped
- [x] Keyword Opportunity Finder — shipped
- [x] Market Timing Signal — shipped
- [ ] Churn Guardian v2 (ML model)
- [ ] Success Predictor v2 (ML model)

### Month 6: Coaching
- [x] AI Coach v1 (rule-based interventions) — shipped
- [x] Pattern Interrupt — shipped
- [x] Founder archetype detection — shipped

### Month 9: Scale
- [ ] AI Coach v2 (ML-powered)
- [ ] Real-time dashboard insights
- [ ] First annual report (State of Solo Founders)

---

## The Moat Compounding Formula

```
Moat Strength = (Data Depth) × (Insight Quality) × (User Trust) × (Time)
```

| Factor | How We Build It | Competitor Barrier |
|--------|----------------|-------------------|
| **Data Depth** | Telemetry + explicit prompts + behavioral signals | 6-12 months to catch up |
| **Insight Quality** | ML models + domain expertise + founder feedback | Need same data + same expertise |
| **User Trust** | Privacy-first + transparency + accuracy | Hard to earn quickly |
| **Time** | We started now. Competitors start later. | Cannot buy time |

**The ultimate moat:** After 2 years, LoopKit knows more about how solo founders build than any other tool, person, or organization in the world. That knowledge is embedded in our AI, our content, our community, and our brand.

> *"We don't just help founders ship. We understand shipping better than anyone. And we use that understanding to make every founder unstoppable."*

---

*Last updated: April 2026 · IE-8 + IE-15 implemented · Audit fixes + nice-to-haves complete · IE-16/17 in progress*
