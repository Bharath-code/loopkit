# LoopKit Documentation

Welcome to the LoopKit documentation. This directory contains everything you need to understand, use, and improve LoopKit.

## For End Users

| Document | Purpose | Read This If... |
|----------|---------|-----------------|
| **[QUICK_START.md](QUICK_START.md)** | 15-minute getting started guide | You just installed LoopKit and want to ship something today |
| **[USER_GUIDE.md](USER_GUIDE.md)** | Complete product philosophy and usage guide | You want to understand *why* LoopKit works and how to get the most out of it |

## For Product & Design

| Document | Purpose | Read This If... |
|----------|---------|-----------------|
| **[PERSONAS.md](PERSONAS.md)** | User personas with goals, pains, and journeys | You're building features, writing copy, or prioritizing the roadmap |
| **[USER_STORIES.md](USER_STORIES.md)** | User stories with acceptance criteria | You're implementing features or writing tests |
| **[SCENARIOS.md](SCENARIOS.md)** | All interaction scenarios including edge cases | You're doing QA, designing flows, or handling support |

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

*These documents are living documents. Update them when features change, personas evolve, or new scenarios emerge.*
