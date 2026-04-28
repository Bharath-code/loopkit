# LoopKit Documentation

Welcome to the LoopKit documentation. This directory contains everything you need to understand, use, and improve LoopKit.

## For End Users

| Document                             | Purpose                                     | Read This If...                                                              |
| ------------------------------------ | ------------------------------------------- | ---------------------------------------------------------------------------- |
| **[QUICK_START.md](QUICK_START.md)** | 15-minute getting started guide             | You just installed LoopKit and want to ship something today                  |
| **[USER_GUIDE.md](USER_GUIDE.md)**   | Complete product philosophy and usage guide | You want to understand _why_ LoopKit works and how to get the most out of it |

## For Product & Design

| Document                               | Purpose                                        | Read This If...                                                     |
| -------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------- |
| **[PERSONAS.md](PERSONAS.md)**         | User personas with goals, pains, and journeys  | You're building features, writing copy, or prioritizing the roadmap |
| **[USER_STORIES.md](USER_STORIES.md)** | User stories with acceptance criteria          | You're implementing features or writing tests                       |
| **[SCENARIOS.md](SCENARIOS.md)**       | All interaction scenarios including edge cases | You're doing QA, designing flows, or handling support               |

## For Strategy & Growth

| Document                                               | Purpose                                                       | Read This If...                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **[MOAT.md](MOAT.md)**                                 | Competitive moat analysis using the 7 Powers framework        | You're thinking about long-term defensibility and competitive strategy |
| **[DATA_MOAT.md](DATA_MOAT.md)**                       | Data collection strategy for building a proprietary data moat | You're designing telemetry, benchmarks, or the annual report           |
| **[COMPETITIVE_ANALYSIS.md](COMPETITIVE_ANALYSIS.md)** | Tool-by-tool competitive comparison on moat dimensions        | You're positioning against Notion, Linear, or other PM tools           |
| **[CONTENT_STRATEGY.md](CONTENT_STRATEGY.md)**         | State of Solo Founders content engine and 12-month calendar   | You're planning content, PR, or brand building                         |
| **[INTELLIGENCE_ENGINE.md](INTELLIGENCE_ENGINE.md)**   | How behavioral data becomes product intelligence              | You're building features that wow users and deepen retention           |

## Feature Status

| Feature                                   | Status         | Commands                                             | Dashboard            |
| ----------------------------------------- | -------------- | ---------------------------------------------------- | -------------------- |
| Core Loop (init/track/ship/pulse/loop)    | ✅ Shipped     | CLI                                                  | Full                 |
| Auth + Payments                           | ✅ Shipped     | `loopkit auth`                                       | Login/Signup         |
| Telemetry + Benchmarks                    | ✅ Shipped     | `loopkit telemetry`                                  | `/benchmarks`        |
| Intelligence Engine Phase 1-2             | ✅ Shipped     | DNA, benchmarks, oracle, churn, auto-loop, predictor | Overview, Benchmarks |
| **IE-8: Trending Validations**            | ✅ **Shipped** | Hint in `init`                                       | `/trends`            |
| **IE-15: Competitor Ship Radar**          | ✅ **Shipped** | `loopkit radar`                                      | Overview widget      |
| **IE-16: Keyword Opportunity Finder**     | ✅ **Shipped** | `loopkit keywords`                                   | `/keywords`          |
| **IE-17: Market Timing Signal**           | ✅ **Shipped** | `loopkit timing`                                     | Overview widget      |
| **IE-9: Pattern Interrupt**               | ✅ **Shipped** | Shown in `loop`                                      | Overview widget      |
| **IE-7: Anonymous Peer Inspiration**      | ✅ **Shipped** | Shown in `ship`                                      | Overview widget      |
| **IE-10: AI Coach v1**                    | ✅ **Shipped** | `loopkit coach`                                      | Overview widget      |
| **F5: Project Templates**                 | ✅ **Shipped** | `loopkit init --template`                            | —                    |
| **F5-AI: AI-Personalized Task Scaffolds** | ✅ **Shipped** | `loopkit init` (auto)                                | —                    |

## Document Relationships

```
PERSONAS.md ─── informs ───► USER_STORIES.md ─── maps to ───► features
     │                              │
     │                              ▼
     │                        SCENARIOS.md
     │                              │
     ▼                              ▼
USER_GUIDE.md ◄─────────── end user documentation
     ▲
     │
QUICK_START.md ─── entry point for new users
```

## How to Use These Documents

**As a new user:** Start with QUICK_START.md → USER_GUIDE.md

**As a developer:** Reference USER_STORIES.md for acceptance criteria and SCENARIOS.md for edge cases

**As a PM:** Start with PERSONAS.md → USER_STORIES.md for prioritization

**As support:** Reference SCENARIOS.md for troubleshooting flows

---

_These documents are living documents. Update them when features change, personas evolve, or new scenarios emerge._
