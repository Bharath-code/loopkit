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

### Feature 3.1: Anonymous Peer Inspiration

**What it does:** Shows what anonymized founders with similar projects shipped this week.

**Example:**
```bash
$ loopkit loop

Week 12 Synthesis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 The One Thing: Implement API rate limiting

👥 Founders like you (SaaS, Week 12) shipped this week:
   • "Stripe billing portal integration" (shipping score: 80%)
   • "Webhook retry logic with exponential backoff" (score: 75%)
   • "Public API docs with Swagger" (score: 90%)

   Most common task added this week: "Add basic auth to API"

   Feeling stuck? See what others prioritized:
   [View Week 12 SaaS Leaderboard]
```

**Data used:**
- Anonymized task lists by project type and week number
- Anonymized ship logs
- Aggregate "most common tasks" per week/project type

**Why it wows:**
- "I'm not alone." Solo founders are isolated. Peer visibility reduces loneliness.
- Inspiration. "If they shipped API docs, maybe I should too."
- Gentle competition. Leaderboards motivate without being toxic.

**How it retains:**
- Community feeling without community overhead.
- Weekly novelty. "What did others ship?" creates anticipation.
- Social proof. "Most common task = validated priority."

**How it builds moat:**
- Requires critical mass (100+ active users per project type).
- Network effect: more users = better peer matches.

---

### Feature 3.2: Trending Validations

**What it does:** Shows what ICPs, problems, and MVPs are trending among LoopKit founders.

**Example (Monthly Insights content + dashboard widget):**
```
🔥 Trending in April 2027

Most validated ICP this month:
   "Technical writers at API companies" (+340% from March)
   Most common problem: "API docs get out of sync with code"

Most shipped MVP category:
   "Chrome extensions for productivity" (+120%)

Emerging pattern:
   23 founders are building AI-powered email assistants.
   Average ICP score: 6.2 (lower than usual — market may be crowded)

💡 Idea: If you're considering this space, narrow your ICP.
   "AI email assistant for sales teams" scores 8.4 on average.
```

**Data used:**
- Brief scores and ICP descriptions
- Project categorization (AI, SaaS, mobile, etc.)
- Validation outcomes

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

---

## Phase 4: Coaching Intelligence (Month 9-18)

### Feature 4.1: Pattern Interrupt

**What it does:** Detects when a user is repeating a past mistake and interrupts the pattern.

**Example:**
```bash
$ loopkit init side-project

🛑 Pattern Interrupt

This is your 4th project in 6 months. Your pattern:
   Project 1: 8 weeks, then abandoned
   Project 2: 5 weeks, then abandoned
   Project 3: 3 weeks, then abandoned
   Project 4: Starting now...

Founders with this pattern have a 15% success rate.
The #1 cause: ICP too broad (avg score: 4.2/10)

Your new project's ICP score: 5/10

Recommendation: Spend 30 minutes narrowing your ICP before building.
Run `loopkit init --narrow` for guided ICP refinement.

Still want to proceed? [Yes, I'm committed] [Refine ICP first]
```

**Data used:**
- Historical project data per user
- Abandonment patterns
- ICP scores of failed vs. successful projects

**Why it wows:**
- Brutal honesty from a tool that cares.
- Prevents repeated mistakes. "I didn't realize I was doing this again."
- Actionable alternative ( `--narrow` flag).

**How it retains:**
- Prevents churn by preventing failure.
- Builds trust. "LoopKit saved me from myself."

**How it builds moat:**
- Requires longitudinal data per user (months of history).
- Pattern recognition is calibrated to our specific user base.

---

### Feature 4.2: The AI Coach

**What it does:** A proactive coaching layer that surfaces personalized advice based on your specific patterns.

**Example interventions:**

**Week 3 (early):**
```
💡 Coach says: You're validating well (3 user interviews).
   But you haven't added validation tasks to your track plan.
   Run: `loopkit track --add "Interview user #4"`
   This keeps validation visible in your shipping score.
```

**Week 8 (mid):**
```
💡 Coach says: Your shipping score is strong (78%) but you haven't
   shipped anything public in 3 weeks. Internal progress is good,
   but external validation is critical.

   Suggestion: Ship a landing page update this week.
   Even small public ships maintain momentum and collect feedback.
```

**Week 16 (late):**
```
💡 Coach says: You've been in "iterate mode" for 8 weeks.
   Your pulse responses show users want API access.
   But your tasks focus on UI polish.

   Tension detected: User feedback ≠ your task list.
   Consider pivoting 50% of this week's tasks to API v1.
```

**Data used:**
- All behavioral data
- Pulse feedback themes
- Task-to-feedback alignment
- Historical patterns of successful founders

**Why it wows:**
- Feels like a personal coach who understands your specific situation.
- Proactive, not reactive. Surfaces insights before you ask.
- Specific, not generic. "Add validation to track" vs. "validate more."

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
| 3 | Trending Validations | "Market may be crowded" | Market intelligence | Proprietary trend data |
| 4 | Pattern Interrupt | "This is your 4th project in 6 months" | Preventing failure | Longitudinal user data |
| 4 | AI Coach | "Tension detected: feedback ≠ tasks" | Personal relationship | Deep behavioral understanding |

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
- [ ] Anonymous peer inspiration (opt-in)
- [ ] Monthly Insights content engine
- [ ] Trending validations (content only)

### Month 5: ML
- [ ] Churn Guardian v2 (ML model)
- [ ] Success Predictor v2 (ML model)
- [ ] Smart task prioritization

### Month 6: Coaching
- [ ] AI Coach v1 (rule-based interventions)
- [ ] Pattern Interrupt
- [ ] Founder archetype detection

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

*Last updated: April 2026*
