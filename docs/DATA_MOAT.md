# LoopKit Data Moat Strategy

> *"Data is only a moat when it's proprietary, compounding, and defensible."*

**Date:** April 2026  
**Stage:** v0.1.0 — Seed planting phase  
**Goal:** Define what data to collect, how to collect it, and how to make it valuable

---

## The Data Moat Test

Before collecting any data, we must pass three tests:

| Test | Question | LoopKit Score |
|------|----------|---------------|
| **Proprietary** | Do we have data others can't get? | 🟡 Partial — users create it in our product |
| **Compounding** | Does more usage = more data = better product? | 🟢 Yes — more loops = better AI synthesis |
| **Defensible** | Can competitors replicate this even with money? | 🟡 Hard but possible — time and behavior data is sticky |

**Verdict:** We have the *potential* for a data moat, but only if we design for it intentionally.

---

## Data Taxonomy

### Tier 1: Core Operational Data (Already Collecting)

This is table stakes. Every tool has this.

| Data Type | Source | Value for Moat | Action |
|-----------|--------|----------------|--------|
| Project briefs | `loopkit init` answers | Low — just user content | Keep minimal |
| Task lists | `tasks.md` | Low — standard task data | Keep minimal |
| Ship logs | `loopkit ship` outputs | Low — just copy | Keep minimal |
| Pulse responses | `loopkit pulse` inputs | Low — raw feedback | Keep minimal |
| Loop logs | `loopkit loop` synthesis | Medium — structured reflection | **Enhance** |

**Why this isn't a moat:** Any competitor can ask users the same questions and get similar data.

---

### Tier 2: Behavioral Signal Data (The Real Moat)

This is what competitors *can't* easily replicate. It's not what users say — it's what they *do*.

#### 2A: Shipping Velocity Patterns

**What to collect:**
```json
{
  "userId": "anon_hash",
  "weekNumber": 16,
  "dateRange": "2026-04-20 to 2026-04-26",
  "tasksCreated": 5,
  "tasksCompleted": 4,
  "tasksSnoozed": 1,
  "tasksCut": 0,
  "shippingScore": 80,
  "commitsMade": 12,
  "daysActive": 4,
  "peakActivityDay": "Wednesday",
  "avgTaskAge": 2.3,
  "staleTasksHandled": 1
}
```

**Why it's valuable:**
- We can answer: "What shipping patterns correlate with eventual success?"
- We can predict: "This user's velocity is declining — intervention needed"
- We can benchmark: "You're in the top 10% of shippers this week"

**Collection method:** Derived from local `.loopkit/` files, aggregated server-side with user consent.

#### 2B: Decision Pattern Data

**What to collect:**
```json
{
  "userId": "anon_hash",
  "loopWeek": 16,
  "aiRecommendation": "Fix onboarding",
  "userDecision": "override",
  "overrideReason": "Enterprise customer waiting for API docs",
  "overrideCategory": "customer_pressure",
  "bipPostShared": true,
  "bipEngagement": 45,
  "nextWeekTasksAlignedWithRecommendation": false
}
```

**Why it's valuable:**
- We can learn: "When users override 'Fix now' for 'Ship', do they regret it?"
- We can improve AI: "Users with >50% override rate eventually churn — adjust tone"
- We can advise: "Founders who ignore 'Fix now' 3 weeks in a row have 80% churn"

**Collection method:** Explicit at `loopkit loop` time. One extra prompt: "How did this decision work out?" (Week 17 follow-up).

#### 2C: Idea Quality Evolution

**What to collect:**
```json
{
  "userId": "anon_hash",
  "projectId": "project_hash",
  "initScores": {
    "icp": 4,
    "problem": 6,
    "mvp": 5,
    "overall": 5
  },
  "validationActionsCompleted": 3,
  "pivotSignals": ["icp_too_broad", "mvp_too_large"],
  "timeToFirstUser": "3_weeks",
  "timeToFirstRevenue": null,
  "projectStatus": "active"
}
```

**Why it's valuable:**
- We can answer: "What initial scores predict project success?"
- We can warn: "Projects with ICP < 5 have 90% failure rate — narrow your focus"
- We can improve scoring: "Our AI was too generous on MVP scores — adjust calibration"

**Collection method:** Derived from brief.json + explicit milestones ("Did you get your first user?" asked at loop time).

#### 2D: Feedback-to-Action Velocity

**What to collect:**
```json
{
  "userId": "anon_hash",
  "pulseResponseId": "resp_123",
  "cluster": "Fix now",
  "daysToAction": 4,
  "actionType": "task_created",
  "actionOutcome": "resolved",
  "userSatisfaction": 8
}
```

**Why it's valuable:**
- We can measure: "How quickly do LoopKit users act on feedback?"
- We can compare: "Users with < 7 day feedback-to-action have 3x retention"
- We can advise: "You have 3 'Fix now' items — average time to action is 12 days"

**Collection method:** Tracked when pulse responses are tagged to sprints + resolution follow-up.

#### 2E: Methodology Adherence

**What to collect:**
```json
{
  "userId": "anon_hash",
  "weekNumber": 16,
  "initUsed": true,
  "trackUsed": true,
  "shipUsed": true,
  "pulseUsed": false,
  "loopUsed": true,
  "loopOnSunday": true,
  "phaseAdherenceScore": 80
}
```

**Why it's valuable:**
- We can prove: "Users who complete all 5 phases weekly have 5x higher retention"
- We can nudge: "You skipped pulse this week — feedback is how you improve"
- We can price: "Power users (100% adherence) derive 10x value — justify Pro tier"

**Collection method:** Automatically derived from command usage logs.

---

### Tier 3: Derived Insight Data (The Product)

This is what we *make* from Tier 2 data. It's our IP.

#### 3A: Founder Archetypes

**What to derive:**
Cluster users into behavioral archetypes:
- **Sprinter:** High velocity, low consistency (Marcus)
- **Marathoner:** Moderate velocity, high consistency (Jordan)
- **Perfectionist:** Low velocity, high task age (Sarah early)
- **Reactor:** Skips init/loop, only reacts to pulse (unhealthy)
- **All-Star:** High velocity + high consistency + full phase adherence

**Why it's valuable:**
- Personalized recommendations: "As a Sprinter, you should focus on consistency this month"
- Content: "The 5 Types of Solo Founders (Data from 1,000 Weeks)"
- Product: Different UI modes for different archetypes

#### 3B: Success Predictors

**What to derive:**
ML model predicting "will this founder still be active in 3 months?"

**Features:**
- Week 1-4 shipping score average
- Phase adherence rate
- Override rate
- Feedback-to-action velocity
- Streak length
- Brief scores

**Why it's valuable:**
- Early intervention: "Your pattern matches founders who churn. Want help?"
- Content: "The #1 predictor of founder success (it's not what you think)"
- Product: Personalized coaching based on risk factors

#### 3C: Industry Benchmarks

**What to derive:**
Aggregated, anonymized benchmarks:
- "Average shipping score for SaaS founders: 62%"
- "Top 10% of shippers complete 8+ tasks/week"
- "Founders who validate before building ship 3x faster"

**Why it's valuable:**
- Gamification: "You're in the top 15% of shippers this week"
- Content: Annual "State of Solo Founders" report
- Sales: "LoopKit users ship 2.3x more consistently than non-users"

---

## Data Collection Implementation

### Privacy-First Design

**Principles:**
1. **Local by default:** Raw data stays in `.loopkit/` on user's machine
2. **Opt-in aggregation:** Users explicitly consent to anonymous data sharing
3. **Aggregated only:** We never share individual data, even anonymized
4. **Exportable:** Users can export all their data anytime
5. **Deletable:** Users can delete all server-side data anytime

### Implementation Plan

#### Phase 1: Minimal Collection (Now) ✅ COMPLETE
**Goal:** Start collecting without user friction

```typescript
// packages/cli/src/analytics/telemetry.ts

interface WeeklyTelemetry {
  anonUserId: string;        // hash of machine ID, not email
  weekNumber: number;
  phaseUsage: {
    init: boolean;
    track: boolean;
    ship: boolean;
    pulse: boolean;
    loop: boolean;
  };
  shippingScore?: number;
  tasksCompleted?: number;
  tasksTotal?: number;
  streakLength?: number;
  loopOverridden?: boolean;
}

// packages/cli/src/analytics/telemetry.ts (IE-8)

interface TelemetryBrief {
  icpCategory: string;       // e.g. "saas founders", "creators"
  problemCategory: string;   // e.g. "content creation", "email outreach"
  mvpCategory: string;       // e.g. "web app", "cli tool"
  weekNumber: number;
  timestamp: string;
}
```

**What we ask users:**
```
Help improve LoopKit for solo founders?

Share anonymous usage data (no project names, no task content):
[Yes] [No]

This helps us answer questions like:
• What shipping patterns lead to success?
• How can we improve AI recommendations?
• What's the average time from idea to launch?
```

**Brief category collection (IE-8 — implemented):**
When telemetry is opted in, `loopkit init` categorizes the founder's ICP, problem, and MVP into standardized categories. These are stored locally as aggregates and synced to Convex for cross-user trending. No raw brief text leaves the machine — only category labels and counts.

#### Phase 2: Enriched Collection (Month 3)
**Goal:** Deeper behavioral signals

Add to telemetry:
- Decision pattern data (override reasons, outcomes)
- Feedback-to-action velocity
- Brief score evolution

Add explicit prompts at key moments:
```
// After loop override
How did last week's override work out?
[Great — I was right] [Okay — mixed results] [Bad — should have listened]

// After 4 weeks
Quick check-in: Have you talked to any potential users yet?
[Yes, 1-5] [Yes, 5-10] [Yes, 10+] [Not yet]
```

#### Phase 3: Insight Generation (Month 6)
**Goal:** Turn data into product value

Features enabled:
- **Personalized AI:** "Based on your pattern, you tend to underestimate MVP scope. Here's a tighter suggestion."
- **Benchmarks:** "You ship faster than 78% of LoopKit founders"
- **Archetype detection:** "You're a Sprinter. Here's how to become a Marathoner."
- **Risk alerts:** "Your shipping score has declined for 2 weeks. Want to talk through blockers?"

#### Phase 4: Content Engine (Month 9)
**Goal:** Publish insights that build brand and attract users

Content:
- Monthly "LoopKit Insights" (aggregated trends)
- Quarterly "State of Solo Founders" report
- Annual retrospective with real data
- Research papers: "What makes solo founders succeed?"

---

## Data Moat Defensibility Analysis

### Can a Competitor Replicate This?

| Aspect | Replication Difficulty | Why |
|--------|----------------------|-----|
| Raw data collection | Easy | Anyone can ask the same questions |
| Behavioral signals | Medium | Requires same product surface area |
| Time-series data | Hard | We get 6-12 month head start |
| Derived insights | Very Hard | Requires data + ML + domain expertise |
| Founder trust | Very Hard | Requires years of delivering value |

**Conclusion:** A well-funded competitor could replicate our data collection in 3-6 months. But they'd be 6-12 months behind on time-series data. And they'd need another 6-12 months to derive meaningful insights. By then, we've compounded.

### Moat Compounding Flywheel

```
More users → More data → Better AI → Better outcomes → More users
     ↑_____________________________________________________|
```

**How it works:**
1. More users = more founder-weeks of data
2. More data = better training for AI synthesis and scoring
3. Better AI = more accurate recommendations, higher user success
4. Higher success = word of mouth, testimonials, case studies
5. Word of mouth = more users

**Timeline to meaningful compounding:** 12-18 months

---

## Metrics Dashboard (Track Weekly)

| Metric | Target (6mo) | Target (12mo) | Current |
|--------|--------------|---------------|---------|
| Opt-in rate for telemetry | 60% | 70% | 0% |
| Avg. founder-weeks per user | 8 | 20 | N/A |
| Data completeness (all 5 phases) | 50% | 70% | N/A |
| AI recommendation accuracy (user-reported) | 65% | 75% | N/A |
| Benchmark queries served | 100/week | 500/week | 0 |
| Content pieces from data | 2 | 12 | 0 |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Users don't opt-in | Medium | High | Make value clear; offer incentives (benchmarks, insights) |
| Privacy concerns | Medium | Medium | Be transparent; local-first; easy export/delete |
| Data quality issues | Medium | High | Validate inputs; clean anomalies; don't overfit |
| Competitor leapfrogs | Low | High | Move fast; publish insights; build brand |
| GDPR/compliance issues | Medium | Medium | EU data stays in EU; clear consent; data minimization |

---

## Next Steps

1. ~~**This week:** Add telemetry module to CLI with opt-in prompt~~ ✅ Done
2. ~~**Next week:** Define data schema and aggregation pipeline~~ ✅ Done
3. ~~**Month 2:** Launch first benchmark feature ("Your shipping score vs. average")~~ ✅ Done
4. ~~**Month 3:** Enrich collection with decision patterns~~ ✅ Done (brief categories)
5. ✅ **Month 3:** Trending Validations (IE-8) — ICP/problem/MVP aggregate tracking ✅ Done
6. ✅ **Month 3:** Competitor Ship Radar (IE-15) — PH/HN launch scanning ✅ Done
7. ✅ **Month 3:** Audit fixes — structured logging, cursor pagination, per-install encryption salt, telemetry compaction, state-machine XML parser, JSON keyword config ✅ Done
8. **Month 6:** Keyword Opportunity Finder (IE-16) — free SEO data
9. **Month 6:** Market Timing Signal (IE-17) — funding/dev/hiring trends
10. **Month 6:** Launch personalized AI recommendations based on data
11. **Month 9:** Publish first "State of Solo Founders" report

---

*Last updated: April 2026 · IE-8 + IE-15 implemented · Audit fixes complete*
