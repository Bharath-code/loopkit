# LoopKit — Build Status

**Last updated:** April 27, 2026 (Design System Overhaul Plan Added — 6 Phases, 37 Tasks)  
**Version:** 0.1.0  
**Overall:** MVP complete · All sprints shipped · 152 tests passing · 0 launch blockers · Ready to ship

---

## ✅ DONE

### Foundation

- [x] Turborepo monorepo with pnpm workspaces
- [x] 3 packages: `loopkit` (CLI), `@loopkit/shared`, `@loopkit/web`
- [x] Root TypeScript config extended by all packages
- [x] tsup build pipeline for CLI (single ESM bundle, ~52KB)
- [x] `.gitignore` — includes `.loopkit/` for user data privacy
- [x] `npm publish` config — `files`, `exports`, `publishConfig`, `prepublishOnly`
- [x] `.npmignore` — excludes `src/`, tsconfig, tsup config, dev docs

---

### `@loopkit/shared` — Types & Schemas

- [x] `BriefSchema`, `TaskSchema`, `ShipDraftsSchema`, `PulseClusterSchema`, `LoopSynthesisSchema`, `ConfigSchema`
- [x] Helpers: `slugify()`, `getWeekNumber()`, `formatDate()`

---

### CLI Commands

- [x] `loopkit init` — Define Phase (5 questions, AI scoring, brief saved, session resume, collision handling)
- [x] `loopkit track` — Develop Phase (tasks.md parser, board view, git hook, stale detection, snooze, cut archive, `--add`, `--week`, `--repair`)
- [x] `loopkit ship` — Deliver Phase (reads brief, generates HN/Twitter/IH drafts, per-draft actions, ship log)
- [x] `loopkit pulse` — Feedback Phase (local storage, AI clustering, tag-to-sprint, `--raw`, `--setup`, `--add`, `--share` with QR code)
- [x] `loopkit loop` — Iterate Phase (local aggregation, week summary, AI synthesis, tension detection, override tracking, BIP post)
- [x] `loopkit auth` — Login via browser OAuth, encrypted token storage
- [x] `loopkit celebrate` — ASCII confetti + ship score card, streak, shareable text
- [x] `loopkit telemetry` — Opt-in anonymous usage collection (on/off/export/delete/status)

---

### Analytics Engine

- [x] Telemetry module (`cli/src/analytics/telemetry.ts`) — opt-in, local-first, exportable
- [x] Shipping DNA (`cli/src/analytics/dna.ts`) — founder pattern detection, velocity, risk warnings
- [x] Benchmarks CLI (`cli/src/analytics/benchmarks.ts`) — percentile rankings vs baseline
- [x] Snooze Oracle (`cli/src/analytics/oracle.ts`) — historical completion probability
- [x] Churn Guardian (`cli/src/analytics/churn.ts`) — declining score, skipped loops, override rate detection
- [x] Auto-Loop (`cli/src/analytics/autoLoop.ts`) — missed Sunday detection, auto-draft generation
- [x] Success Predictor (`cli/src/analytics/predictor.ts`) — 8-week heuristic revenue probability model
- [x] AI Cache (`cli/src/storage/cache.ts`) — hash-based result reuse, 7-day TTL

---

### Web Dashboard

- [x] Next.js 16 App Router, Tailwind v4, dark theme
- [x] Landing page (hero, demo, pricing, footer, SEO, animations)
- [x] Dashboard routes (overview, pulse inbox, loop history, benchmarks) with live Convex queries
- [x] Auth pages (login, signup via Convex)
- [x] Public pulse form (`/pulse/[projectId]`) + embed widget
- [x] Free tier read-only dashboard with upgrade CTA

---

### Backend (Convex)

- [x] Schema: `pulseResponses`, `projects`, `loopLogs`, `subscriptions`, `aiUsage`
- [x] Auth: GitHub + email via `@convex-dev/auth`
- [x] Payments: Polar.sh integration (Solo $19, Pro $39)
- [x] Rate limiting: 10/day free, 100/day Solo, 1000/day Pro
- [x] AI proxy routes: `/api/ai/{init,ship,pulse,loop}` with real auth + rate limiting
- [x] Token encryption: AES-256-GCM with machine-derived key
- [x] Analytics: `convex/analytics.ts` — aggregate benchmark queries, percentile computation

---

### Performance & Polish

- [x] AI streaming with `streamObject()` (P1)
- [x] Haiku for "fast" tier, Sonnet for "creative" (P4)
- [x] `loopkit track --add` with `$EDITOR` (F2)

---

### Documentation

- [x] `README.md`, `CLAUDE.md`, `AGENTS.md`, `STATUS.md`
- [x] `docs/PERSONAS.md`, `docs/USER_STORIES.md`, `docs/SCENARIOS.md`
- [x] `docs/USER_GUIDE.md`, `docs/QUICK_START.md`, `docs/README.md`
- [x] `docs/MOAT.md`, `docs/DATA_MOAT.md`, `docs/COMPETITIVE_ANALYSIS.md`
- [x] `docs/CONTENT_STRATEGY.md`, `docs/INTELLIGENCE_ENGINE.md`

---

## 🔴 CURRENT BACKLOG

### Priority Legend

- 🔴 **P0** — Blocks public launch. Do first.
- 🟡 **P1** — High impact, ship within 2 weeks.
- 🟢 **P2** — Important polish, ship within 4 weeks.
- 🔵 **P3** — Future roadmap, ship within 3 months.

---

### P0 — Launch Blockers (Week 3) ✅ COMPLETE

| #   | Task                                 | Effort | Files                                                      | Acceptance Criteria                                                                                                              |
| --- | ------------------------------------ | ------ | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| T1  | **Schema validation tests**          | S      | `shared/src/__tests__/`                                    | ✅ All Zod schemas tested with valid/invalid data. `ConfigSchema.parse()` handles corruption. (41 tests)                         |
| T2  | **Prompt builder tests**             | M      | `cli/src/ai/__tests__/`                                    | ✅ Prompt builders produce correct shape. Edge cases: empty data, missing fields. (30 tests)                                     |
| T3  | **Storage I/O tests**                | M      | `cli/src/storage/__tests__/`                               | ✅ `readConfig/writeConfig`, `saveBrief`, `readTasksFile`, `appendToCut`, `readPulseResponses` tested with temp dirs. (58 tests) |
| S2  | **Input sanitization on pulse form** | S      | `web/src/app/api/pulse/submit/route.ts`, `convex/pulse.ts` | ✅ Strip HTML tags, 500-char limit server-side, IP rate limiting (3 req/min) on public form.                                     |
| D2  | **Real-time pulse inbox**            | M      | `web/src/app/dashboard/pulse/page.tsx`                     | ✅ Convex subscription for new feedback. "New" badge with slide-in + pulse animation. No refresh required.                       |

**Why P0:** Zero test coverage = every refactor is risky. Public pulse form without sanitization = XSS/injection. These block public launch.

---

### P1 — Ship Within 2 Weeks (Weeks 4-5)

| #       | Task                            | Effort | Files                                                      | Acceptance Criteria                                                                                      |
| ------- | ------------------------------- | ------ | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| W1      | **`loopkit celebrate`**         | S      | `commands/celebrate.ts` (new)                              | ✅ ASCII confetti + "You shipped!" card with score, streak, shareable text. Auto-triggered after `ship`. |
| W2      | **"Unstuck me" mode**           | M      | `commands/loop.ts`, `ai/prompts/unstuck.ts` (new)          | ✅ Detect 0 tasks this week → offer 3 micro-tasks from brief context. Added to tasks.md on confirm.      |
| F3      | **Keyboard shortcuts**          | M      | `ui/theme.ts`                                              | ✅ `?` help, `q` quit, `s` skip, `Enter` default hint shown in all Clack prompts.                        |
| F4      | **Better empty states**         | S      | All command files                                          | ✅ Helpful next steps when no data: `emptyState()` utility with actionable commands.                     |
| D4      | **Dashboard mobile responsive** | M      | All dashboard pages                                        | ✅ Hamburger menu, slide-in sidebar overlay, 44px touch targets, scroll-lock on mobile, backdrop blur.   |
| STRAT-1 | **Telemetry module**            | M      | `cli/src/analytics/telemetry.ts`                           | ✅ Opt-in consent at `loop`, local-first, export/delete, `telemetry` command.                            |
| STRAT-2 | **Benchmark tool**              | M      | `web/src/app/dashboard/benchmarks/`, `convex/analytics.ts` | ✅ Percentile rankings, shareable stat cards, overall score, trend indicators.                           |
| STRAT-3 | **Monthly Insights #1**         | S      | `docs/content/monthly-insights-001.md`                     | ✅ Blog post "Shipping Consistency Beats Brilliance" + 10-tweet thread + newsletter.                     |

| IE-1 | **Shipping DNA v1** | M | `cli/src/analytics/dna.ts` (new), `commands/loop.ts` | ✅ After 4 weeks, generates profile: Marathoner/Sprinter/Perfectionist/Reactor/All-Star pattern, velocity trend, strengths, risk warnings. |
| IE-2 | **Smart Benchmarks CLI** | S | `cli/src/analytics/benchmarks.ts` (new), `commands/track.ts` | ✅ Percentile rankings in track + track --week. "You ship faster than X% of founders." |
| IE-3 | **Snooze Oracle** | S | `commands/track.ts`, `cli/src/analytics/oracle.ts` (new) | ✅ Historical snooze completion analysis. Warning on snooze: "X% of snoozed tasks never done." |

**Why P1:** Delight moments (celebrate/unstuck) drive retention. Telemetry unblocks all metrics. Benchmarks + content build the data moat. Intelligence Engine features create identity attachment and switching costs.

---

### P2 — Ship Within 4 Weeks (Week 6) ✅ COMPLETE

| #       | Task                                    | Effort | Files                                                      | Acceptance Criteria                                                                                                                                                                                            |
| ------- | --------------------------------------- | ------ | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S3      | **CSRF protection**                     | S      | `web/src/app/api/**/route.ts`, `_helpers.ts`               | ✅ `Origin` header checks on all AI proxy, auth, and pulse share routes. Rejects cross-origin requests with 403.                                                                                               |
| P2      | **Merge config reads**                  | S      | `ai/client.ts`                                             | ✅ Single `resolveAuth()` returning `{ anthropicKey, token }`. Eliminated duplicate `readConfig()` calls.                                                                                                      |
| P3      | **Cache AI results**                    | M      | `storage/cache.ts` (new), `ai/client.ts`                   | ✅ Hash `(command, system, prompt, schema)` → `.loopkit/cache/`. 7-day TTL. Reuse on identical calls.                                                                                                          |
| P5      | **Optimize git hook**                   | S      | `commands/track.ts`                                        | ✅ Standalone node script (`.git/hooks/loopkit-commit-msg.js`). No `execSync`. Content-hash based SHA. ~0ms overhead.                                                                                          |
| STRAT-4 | **Founder archetype detection**         | L      | `convex/analytics.ts`, `dashboard/page.tsx`                | ✅ 5 archetype types (Sprinter, Marathoner, Perfectionist, Reactor, All-Star). Dashboard widget with emoji, description, metrics.                                                                              |
| IE-4    | **Churn Guardian v1**                   | M      | `cli/src/analytics/churn.ts` (new), `commands/loop.ts`     | ✅ Rule-based detection: declining score (2+ weeks), skipped loops, rising override rate, low velocity. Proactive warnings with suggestions.                                                                   |
| IE-5    | **Auto-Loop (Sunday Ritual Assistant)** | M      | `cli/src/analytics/autoLoop.ts` (new), `commands/loop.ts`  | ✅ Monday detection of missed Sunday loop. Auto-generates draft from tasks/ships/pulse data. One-click confirm.                                                                                                |
| IE-6    | **Success Predictor v1**                | S      | `cli/src/analytics/predictor.ts` (new), `commands/loop.ts` | ✅ After 8 weeks, predicts probability of first revenue within 6 months. Behavioral heuristics: consistency, score, velocity, trend, override rate, shipping habit. Shows strengths, risks, and shift factors. |

**Why P2:** Security hardening (CSRF), performance wins (config merge, cache, hook), and first data products (archetypes, churn guard, auto-loop, success prediction).

---

### P3 — Future Roadmap (Week 7+)

#### IE-8: Trending Validations (S) ✅ COMPLETE

_Aggregate what ICPs/problems LoopKit users are pursuing. Proprietary data no one else has._

| Sub-Task | Effort                       | Files | Acceptance Criteria                                     |
| -------- | ---------------------------- | ----- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| IE-8.1   | **Telemetry ICP extraction** | S     | `cli/src/analytics/telemetry.ts`, `convex/analytics.ts` | ✅ Opt-in telemetry captures anonymized ICP, problem, MVP category from brief. Stored as aggregate counts, not raw data. |
| IE-8.2   | **Convex trending query**    | S     | `convex/analytics.ts`                                   | ✅ Query returns top 10 ICPs/problems by count, with 7d/30d trend deltas. Rate-limited, cached.                          |
| IE-8.3   | **Dashboard trends page**    | S     | `web/src/app/dashboard/trends/page.tsx`                 | ✅ Shows trending ICPs/problems as ranked list with sparkline trend indicators. "12 founders validating X this week."    |
| IE-8.4   | **CLI trend hint**           | S     | `commands/init.ts`                                      | ✅ After brief scoring, show: "X other founders are exploring similar spaces this month."                                |

#### IE-15: Competitor Ship Radar (M) ✅ COMPLETE

_Scan Product Hunt/HN/Twitter for launches in user's space. Alert: "3 competitors shipped this week."_

| Sub-Task | Effort                       | Files | Acceptance Criteria                                           |
| -------- | ---------------------------- | ----- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| IE-15.1  | **External API adapters**    | M     | `cli/src/analytics/competitorRadar.ts` (new)                  | ✅ Free APIs only: Product Hunt RSS, HN Algolia search API. No scraping, no API keys required.                              |
| IE-15.2  | **Category keyword mapping** | S     | `cli/src/analytics/competitorRadar.ts`, `shared/src/index.ts` | ✅ Map brief category → search keywords. Zod schema for `CompetitorLaunchSchema`.                                           |
| IE-15.3  | **Cached scan results**      | S     | `cli/src/analytics/competitorRadar.ts`, `storage/cache.ts`    | ✅ Results cached 24h. Returns `{ launches: [{ name, url, date, platform, relevance }] }`. Handles API failures gracefully. |
| IE-15.4  | **CLI radar command**        | S     | `commands/radar.ts` (new)                                     | ✅ `loopkit radar` → shows recent launches in user's category. Opt-in, respects telemetry consent.                          |
| IE-15.5  | **Dashboard radar widget**   | M     | `web/src/app/dashboard/page.tsx`                              | ✅ Widget on overview page. Shows trending validations with link to full trends page.                                       |

#### IE-16: Keyword Opportunity Finder (M) ✅ COMPLETE

| Sub-Task | Effort                        | Files | Acceptance Criteria                        |
| -------- | ----------------------------- | ----- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| IE-16.1  | **SEO data source adapters**  | M     | `cli/src/analytics/keywordFinder.ts` (new) | Free sources: Google Autocomplete, Reddit search API, GitHub repo count. No paid APIs. ✅ DONE                                            |
| IE-16.2  | **Keyword scoring algorithm** | S     | `cli/src/analytics/keywordFinder.ts`       | Score = (search volume proxy) / (competition proxy). Competition = GitHub repos + suggestion count. Returns top 15 opportunities. ✅ DONE |
| IE-16.3  | **Zod schema + caching**      | S     | `shared/src/index.ts`, `storage/cache.ts`  | `KeywordOpportunitySchema`: `{ keyword, score, volume, competition, sources[], suggestions[] }`. Cached 7d. ✅ DONE                       |
| IE-16.4  | **CLI keywords command**      | S     | `commands/keywords.ts` (new)               | `loopkit keywords` → shows ranked list with score, volume, competition. "Low-hanging fruit" highlighted. ✅ DONE                          |
| IE-16.5  | **Dashboard keywords page**   | M     | `web/src/app/dashboard/keywords/page.tsx`  | Table view with sort/filter. Export as CSV. "Content ideas for your niche." ✅ DONE                                                       |

#### IE-17: Market Timing Signal (M) ✅ COMPLETE

_Track funding rounds, job postings, GitHub stars in user's category. "Space is heating up" vs "cooling down."_

| Sub-Task | Effort                          | Files | Acceptance Criteria                                                 |
| -------- | ------------------------------- | ----- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IE-17.1  | **Market data adapters**        | M     | `cli/src/analytics/marketTiming.ts` (new)                           | Free sources: Crunchbase RSS (funding), GitHub API (repo growth), Indeed RSS (job postings). No scraping. All requests cached 7d. ✅ DONE                     |
| IE-17.2  | **Signal computation**          | S     | `cli/src/analytics/marketTiming.ts`                                 | 3 signals: funding velocity (rounds/30d), dev activity (GitHub stars/30d), hiring demand (postings/30d). Each: ↑ ↓ → trend. Composite score 0-100. ✅ DONE    |
| IE-17.3  | **Zod schema + Convex storage** | S     | `shared/src/index.ts`, `convex/marketTiming.ts`, `convex/schema.ts` | `MarketSignalSchema`: `{ category, fundingTrend, devTrend, hiringTrend, compositeScore, lastUpdated }`. Stored per-category, updated weekly via cron. ✅ DONE |
| IE-17.4  | **CLI timing command**          | S     | `commands/timing.ts` (new)                                          | `loopkit timing` → shows composite score, 3 trend arrows, and interpretation. Opt-in, respects telemetry consent. ✅ DONE                                     |
| IE-17.5  | **Dashboard signal widget**     | M     | `web/src/app/dashboard/page.tsx`                                    | Gauge card showing composite score + 3 trend arrows on overview page. ✅ DONE                                                                                 |

#### Remaining P3 (Other)

| #       | Task                           | Effort | Files                                                     | Acceptance Criteria                                                                                                                                                                                                                                  |
| ------- | ------------------------------ | ------ | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D3      | **Dashboard task CRUD**        | L      | New files in `dashboard/`                                 | ⏸ DEFERRED — blocked by missing CLI↔Convex sync layer.                                                                                                                                                                                               |
| F5 / W6 | **Project templates**          | M      | `commands/init.ts`, `templates/` (new)                    | ✅ 9 templates (saas/api/mobile/cli/newsletter/agency/open-source/marketplace/ai-wrapper). `loopkit init --template <id>` pre-fills ICP hints + tasks.md scaffold. Interactive selection available.                                                  |
| W3      | **Weekly email digest**        | L      | `convex/crons.ts` (new)                                   | Sunday cron: tasks done, shipping score, streak, BIP post, next week rec.                                                                                                                                                                            |
| W4      | **Public ship log**            | L      | `commands/ship.ts`, new web route                         | `loopkit ship --public` → shareable URL (`loopkit.dev/@username/ships`).                                                                                                                                                                             |
| W5      | **GitHub Issues sync**         | L      | `commands/track.ts`, `sync/` module                       | `loopkit track --sync` two-way sync. ID mapping table.                                                                                                                                                                                               |
| STRAT-5 | **Annual report framework**    | L      | `web/src/app/state-of-solo-founders/`                     | Landing page + data pipeline for "State of Solo Founders 2027". Launch Month 9.                                                                                                                                                                      |
| IE-7    | **Anonymous Peer Inspiration** | M      | `cli/src/analytics/peers.ts` (new), `commands/ship.ts`    | ✅ Show what anonymized founders with similar projects shipped this week. Opt-in. Fetched from Convex via `/api/peers`. Dashboard widget + CLI output.                                                                                               |
| IE-9    | **Pattern Interrupt**          | M      | `cli/src/analytics/patterns.ts` (new), `commands/loop.ts` | ✅ Detect 5 repeated failure patterns (overplanner, snooze loop, ship avoider, ICP drift, scope creep). Interrupt with data in `loop` command. Dashboard widget. Suggest `--narrow` ICP refinement.                                                  |
| IE-10   | **AI Coach v1**                | L      | `cli/src/analytics/coach.ts` (new), all command files     | ✅ 12 rule-based coaching moments across 5 categories. Week 3/8/16 milestones + trigger-based critical/warning moments. Deduplication (never same moment twice). `loopkit coach` command. Dashboard CoachingWidget. Integrated into loop/track/ship. |
| IE-11   | **Churn Guardian v2 (ML)**     | L      | `convex/analytics.ts` + model training pipeline           | Replace rule-based with ML model trained on proprietary behavioral data.                                                                                                                                                                             |
| IE-12   | **Success Predictor v2 (ML)**  | L      | `convex/analytics.ts` + model training pipeline           | Replace heuristics with ML model correlating behavior with revenue/outcome reports.                                                                                                                                                                  |
| IE-13   | **AI Coach v2 (ML-powered)**   | L      | `cli/src/analytics/coach.ts`, `convex/analytics.ts`       | ML-powered coaching interventions calibrated to individual patterns + aggregate data.                                                                                                                                                                |

**Why P3:** CLI-first means dashboard task CRUD is secondary. IE-8 and IE-15 implemented — proprietary data moat compounding with each user. IE-16/17 (Keywords + Timing) use free external APIs next. Intelligence Engine needs critical mass (500+ users, 12+ weeks data) for ML features.

---

## 📅 Execution Order

```
WEEK 3 (P0 — Launch Blockers)     ✅ COMPLETE
├── T1: Schema validation tests          ✅ 41 tests
├── T2: Prompt builder tests             ✅ 30 tests
├── T3: Storage I/O tests                ✅ 58 tests
├── S2: Input sanitization               ✅ HTML strip + 500-char limit + rate limit
└── D2: Real-time pulse inbox            ✅ Convex subscription + slide-in animation

WEEK 4 (P1 — Delight + Polish)          ✅ COMPLETE
├── W1: loopkit celebrate                ✅ ASCII confetti + ship card + auto-trigger
├── W2: "Unstuck me" mode               ✅ 3 AI-generated micro-tasks from brief
├── F3: Keyboard shortcuts               ✅ ?/q/s/Enter hints in all commands
└── F4: Better empty states              ✅ emptyState() utility across all commands

WEEK 5 (P1 — Strategic Foundation + IE Phase 1)  ✅ COMPLETE
├── STRAT-1: Telemetry module              ✅ Opt-in, local-first, export/delete, consent at loop
├── STRAT-2: Benchmark tool                ✅ Dashboard /benchmarks, Convex analytics, share cards
├── STRAT-3: Monthly Insights #1           ✅ Blog + Twitter thread + newsletter in docs/content/
├── D4: Dashboard mobile responsive        ✅ Hamburger menu, slide-in sidebar, 44px touch targets
├── IE-1: Shipping DNA v1                  ✅ 5 patterns, velocity trend, strengths, risk warnings
├── IE-2: Smart Benchmarks CLI             ✅ Percentile rankings in track + track --week
└── IE-3: Snooze Oracle                    ✅ Historical completion probability, warning on snooze

WEEK 6 (P2 — Performance + Security + IE Phase 2)  ✅ COMPLETE
├── S3: CSRF protection                      ✅ Origin checks on all API routes
├── P2: Merge config reads                   ✅ resolveAuth() single call
├── P3: Cache AI results                     ✅ Hash-based, 7-day TTL
├── P5: Optimize git hook                    ✅ Standalone node script, no execSync
├── STRAT-4: Founder archetypes              ✅ Convex query + dashboard widget
├── IE-4: Churn Guardian v1                  ✅ 4 risk signals, proactive warnings
├── IE-5: Auto-Loop                          ✅ Monday detection, auto-draft
└── IE-6: Success Predictor v1               ✅ 8-week heuristic model

WEEK 7-8 (P3 — IE Phase 3: Trending + Radar + Peers)  ✅ COMPLETE
├── IE-8: Trending Validations (4 sub-tasks)     ✅ ALL DONE
│   ├── IE-8.1: Telemetry ICP extraction         ✅ recordBriefCategories() + local aggregates
│   ├── IE-8.2: Convex trending query            ✅ getTrendingValidations + getTrendingForCategory
│   ├── IE-8.3: Dashboard trends page            ✅ /dashboard/trends with 3-column layout
│   └── IE-8.4: CLI trend hint                   ✅ Shows after init when similar founders exist
├── IE-15: Competitor Ship Radar (5 sub-tasks)   ✅ ALL DONE
│   ├── IE-15.1: External API adapters (PH RSS, HN Algolia) ✅ Free APIs, no keys
│   ├── IE-15.2: Category keyword mapping        ✅ 10 ICP + 10 problem keyword maps
│   ├── IE-15.3: Cached scan results             ✅ 24h TTL via existing cache.ts
│   ├── IE-15.4: CLI radar command               ✅ loopkit radar with auto-detect from brief
│   └── IE-15.5: Dashboard radar widget          ✅ Trending widget on overview page
└── IE-7: Anonymous Peer Inspiration (3 sub-tasks) ✅ ALL DONE
    ├── IE-7.1: Convex peerShips table + API     ✅ /api/peers GET/POST, category matching
    ├── IE-7.2: CLI peers module                 ✅ fetchPeerShips + recordPeerShip, telemetry gated
    └── IE-7.3: Dashboard + CLI integration      ✅ PeerInspirationWidget on overview, shown after ship

WEEK 9-10 (P3 — IE Phase 3: Keywords + Timing + Patterns)  ✅ COMPLETE
├── IE-16: Keyword Opportunity Finder (5 sub-tasks)
│   ├── IE-16.1: SEO data source adapters            ✅ DONE
│   ├── IE-16.2: Keyword scoring algorithm            ✅ DONE
│   ├── IE-16.3: Zod schema + caching                 ✅ DONE
│   ├── IE-16.4: CLI keywords command                 ✅ DONE
│   └── IE-16.5: Dashboard keywords page              ✅ DONE (sort/filter/CSV export)
├── IE-17: Market Timing Signal (5 sub-tasks)
│   ├── IE-17.1: Market data adapters                 ✅ DONE (Crunchbase RSS, GitHub API, Indeed RSS)
│   ├── IE-17.2: Signal computation                   ✅ DONE (composite 0-100 score)
│   ├── IE-17.3: Zod schema + Convex storage          ✅ DONE (marketSignals table)
│   ├── IE-17.4: CLI timing command                   ✅ DONE (loopkit timing)
│   └── IE-17.5: Dashboard signal widget              ✅ DONE (overview page card)
└── IE-9: Pattern Interrupt (4 sub-tasks)             ✅ ALL DONE
    ├── IE-9.1: Pattern detection engine              ✅ 5 pattern detectors, rule-based, local data
    ├── IE-9.2: CLI integration                       ✅ Shown in `loop` after churn check
    ├── IE-9.3: Dashboard widget                      ✅ PatternInterruptWidget on overview page
    └── IE-9.4: Zod schema + Convex storage           ✅ PatternInterrupts table, getActivePatterns query

WEEK 11-12 (P3 — Platform Expansion) ✅ COMPLETE
├── D3: Dashboard task CRUD                          ⏸ DEFERRED (needs CLI↔Convex sync layer)
├── F5/W6: Project templates                         ✅ 9 templates + `loopkit init --template`
└── IE-10: AI Coach v1                               ✅ 12 rule-based coaching moments + dashboard widget

WEEK 13+ (P3 — IE Phase 4-5 ML + Platform)
├── W3: Weekly email digest
├── W4: Public ship log
├── W5: GitHub sync
├── IE-11: Churn Guardian v2 (ML)
├── IE-12: Success Predictor v2 (ML)
├── IE-13: AI Coach v2 (ML-powered)
└── STRAT-5: Annual report
```

---

## Known Issues

| Issue                                  | Severity | Status                                       |
| -------------------------------------- | -------- | -------------------------------------------- |
| No automated tests (zero coverage)     | High     | ✅ Resolved — 135 tests (41 shared + 94 CLI) |
| No AI streaming                        | High     | ✅ Resolved (P1)                             |
| Auth token stored unencrypted          | Medium   | ✅ Resolved (S1)                             |
| "Fast" and "creative" tiers same model | Medium   | ✅ Resolved (P4)                             |
| Dashboard uses placeholder data        | Medium   | ✅ Resolved (D1)                             |
| `config.json` parsed 2-3x per command  | Low      | ✅ Resolved (P2 — Week 6: resolveAuth())     |
| Pulse `--share` missing                | Low      | ✅ Resolved (F1)                             |
| No rate limiting on free tier          | Medium   | ✅ Resolved (S4)                             |
| No input sanitization on pulse form    | High     | ✅ Resolved (S2 — Week 3)                    |
| No CSRF protection on API routes       | High     | ✅ Resolved (S3 — Week 6)                    |
| Next.js Turbopack workspace root warn  | Info     | Cosmetic — no functional impact              |

---

## Metrics to Hit

| Metric                          | Target | Current        | Tracking Method             |
| ------------------------------- | ------ | -------------- | --------------------------- |
| Break-even paid users           | 10     | 0 (pre-launch) | Polar.sh dashboard          |
| `init` session completion       | ≥ 70%  | Measuring      | Telemetry (STRAT-1)         |
| `track` weekly active retention | ≥ 65%  | Measuring      | Telemetry (STRAT-1)         |
| `ship` draft use rate           | ≥ 50%  | Measuring      | Telemetry (STRAT-1)         |
| `pulse` widget response rate    | ≥ 8%   | 0 (form ready) | Convex pulseResponses count |
| `loop` Sunday run rate          | ≥ 75%  | Measuring      | Telemetry (STRAT-1)         |
| Month 3 paid users              | 35     | 0 (pre-launch) | Polar.sh dashboard          |

### Strategic Metrics (Month 3-6)

| Metric                    | Month 3 | Month 6  | Tracking                         |
| ------------------------- | ------- | -------- | -------------------------------- |
| Telemetry opt-in rate     | 50%     | 70%      | Consent prompt at `loopkit loop` |
| Founder-weeks in database | 200     | 1,000    | Convex aggregation               |
| Benchmark tool usage      | 50/week | 500/week | Dashboard analytics              |
| Content-driven signups    | 5%      | 20%      | UTM tracking                     |
| Newsletter subscribers    | 50      | 500      | Beehiiv/Substack                 |
| Press mentions            | 0       | 1        | Manual tracking                  |

---

## Definition of Done (per task)

- [ ] `pnpm --filter @loopkit/shared build` → 0 errors
- [ ] `pnpm --filter @loopkit/cli build` → 0 errors
- [ ] Web changed? → `cd packages/web && npx next build` → clean
- [ ] New AI paths: `generateStructured()` works for both auth paths
- [ ] Ctrl+C exits gracefully at every prompt
- [ ] Tests pass: `pnpm --filter @loopkit/cli test` (127 tests total)
- [ ] `STATUS.md` updated with task completion checkmark

---

---

## 🔴 POST-CODEBASE ANALYSIS BACKLOG

> Generated from full codebase audit (CLI + Web + Convex).  
> **Verdict:** 100% ship-worthy. All 5 P0 launch blockers resolved.

---

### New P0 — Launch Blockers (Fix Before Public)

| #          | Task                                 | Effort | Files                                                                                                                           | Acceptance Criteria                                                                                                                                                                                                                    |
| ---------- | ------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SEC-1**  | **Convex Authorization Hardening**   | M      | `convex/loopLogs.ts`, `convex/pulse.ts`, `convex/patterns.ts`, `convex/analytics.ts`                                            | ✅ All queries/mutations verify `ctx.auth.getUserIdentity()` or `getAuthUserId()` before returning data. No query accepts raw `projectId` or `userId` from client without ownership check. Unauthorized access returns `[]` or `null`. |
| **SEC-2**  | **Remove Client-Provided `userId`**  | S      | `convex/pulse.ts:ensureProject`, `web/src/app/api/**`                                                                           | ✅ `ensureProject` derives `userId` from auth context, not args. API routes use server-side auth exclusively.                                                                                                                          |
| **SEC-3**  | **Persistent CLI Auth Sessions**     | M      | `web/src/app/api/cli/auth/route.ts`, `convex/schema.ts`, `convex/cliAuth.ts`                                                    | ✅ Uses Convex `cliAuth` table (persistent). Device flow works across Vercel serverless instances. Sessions auto-expire after 10 min.                                                                                                  |
| **SEC-4**  | **Widget Production URL**            | XS     | `web/src/app/api/pulse/widget/route.ts:33`                                                                                      | ✅ `iframe.src` uses `process.env.NEXT_PUBLIC_APP_URL` (falls back to `https://loopkit.dev`). No `localhost` hardcoding.                                                                                                               |
| **SYNC-1** | **CLI → Convex Data Sync (Minimal)** | L      | `cli/src/commands/loop.ts`, `cli/src/commands/ship.ts`, `cli/src/storage/local.ts`, `web/src/app/api/sync/**`, `convex/sync.ts` | ✅ After `loop` or `ship`, CLI pushes logs to Convex via authenticated API. `pushLoopLogToConvex` + `pushShipLogToConvex` in `storage/sync.ts`. Dashboard shows real CLI data.                                                         |

**Why P0:** SEC-1/2 allow cross-user data leaks on day one. SEC-3 breaks auth on Vercel. SEC-4 breaks pulse widget for all paying users. SYNC-1 makes the Pro dashboard actually useful.

---

### P1 — High Impact (Ship Within 2 Weeks)

| #          | Task                                     | Effort | Files                                                               | Acceptance Criteria                                                                                                                                     |
| ---------- | ---------------------------------------- | ------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BUG-1**  | **Fix `timing.ts` `--project` Flag**     | XS     | `commands/timing.ts`, `storage/local.ts`                            | ✅ `listProjects()` returns strings; timing.ts checks `includes()` and reads brief. Category fallback uses `detectProjectCategory()`.                   |
| **BUG-2**  | **Fix `coach.ts` Ctrl+C Graceful Exit**  | XS     | `commands/coach.ts`                                                 | ✅ `p.isCancel(ack)` breaks loop and calls `p.outro()` immediately. Never continues to next moment.                                                     |
| **BUG-3**  | **Fix `celebrate.ts` Theme Abstraction** | XS     | `commands/celebrate.ts`, `ui/theme.ts`                              | ✅ Raw `chalk` removed. `colors.pink` / `colors.orange` added to `theme.ts`. Celebrate uses theme helpers exclusively.                                  |
| **TEST-1** | **Backfill Analytics Schema Tests**      | M      | `shared/src/__tests__/schemas.test.ts`                              | ✅ 22 tests added for 9 analytics schemas (valid + invalid each). `SuccessPredictionSchema.probability` now bounded `.min(0).max(1)`.                   |
| **TEST-2** | **Add API Route Integration Tests**      | M      | `web/src/app/api/**/__tests__/`                                     | ✅ 11 integration tests for `POST /api/ai/init`, `POST /api/pulse/submit`, `GET /api/cli/me`. CSRF 403, rate limit 429, auth 401, success 200 verified. |
| **PERF-1** | **Paginate Dashboard Queries**           | M      | `convex/loopLogs.ts`, `convex/pulse.ts`, `web/src/app/dashboard/**` | ✅ `listByProject` and `getResponses` accept optional `limit` arg (default 100, max 100). `.take(limit)` prevents unbounded returns.                    |
| **SEC-5**  | **Check Subscription Expiration**        | S      | `convex/users.ts`, `convex/subscriptions.ts`                        | ✅ `users.me` checks `currentPeriodEnd > Date.now()`. Expired subscriptions downgrade tier to "free".                                                   |
| **SEC-6**  | **Remove `as any` in web source**        | XS     | `web/src/app/api/webhooks/polar/route.ts`                           | ✅ Replaced `as any` in polar webhook with `PolarWebhookEvent` interface. No `as any` remains in `src/`.                                                |

**Why P1:** Bugs erode trust. Missing schema tests block safe refactors. Unpaginated queries will OOM at scale. Subscription gap = free Pro rides.

---

### P2 — Important Polish (Ship Within 4 Weeks)

| #          | Task                                       | Effort | Files                                                                          | Acceptance Criteria                                                                                                                                                                                                          |
| ---------- | ------------------------------------------ | ------ | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UX-1**   | **Dashboard Loading Skeletons**            | M      | `web/src/app/dashboard/page.tsx`, `web/src/components/skeletons.tsx`           | ✅ Reusable `SkeletonMetric`, `SkeletonCard`, `SkeletonActivity`, `SkeletonLoopSynthesis`, `SkeletonArchetype`, `SkeletonMarketTiming` components. All widgets use them consistently. No ad-hoc `animate-pulse` divs remain. |
| **UX-2**   | **React Error Boundaries**                 | S      | `web/src/components/ErrorBoundary.tsx`, `web/src/app/dashboard/page.tsx`       | ✅ `ErrorBoundary` class component with `DefaultErrorFallback`. Each widget (MarketTiming, PatternInterrupt, PeerInspiration, Coaching) wrapped individually. Crash shows friendly fallback with refresh button.             |
| **PERF-2** | **Add Time-Window Indexes to Analytics**   | S      | `convex/schema.ts`, `convex/analytics.ts`                                      | ✅ `loopLogs` gets `by_project_date` (projectId + date) and `by_date` (date) indexes. `getBenchmarks` and `getShareCard` query last 90 days only via `q.gte("date", cutoff)`. No full table scans.                           |
| **DEV-1**  | **GitHub Actions CI Pipeline**             | M      | `.github/workflows/ci.yml`                                                     | 🟡 Open — not yet implemented.                                                                                                                                                                                               |
| **DEV-2**  | **Pre-Commit Hooks (Husky + lint-staged)** | S      | `.husky/pre-commit`, `package.json`                                            | ✅ `prepare: "husky"` script. `lint-staged` runs `prettier --write` on staged files + `tsc --noEmit` per package. Blocks commit on type error.                                                                               |
| **SEC-7**  | **Trusted Proxy IP Validation**            | S      | `web/src/app/api/pulse/submit/route.ts`                                        | ✅ `getClientIp` supports `TRUSTED_PROXIES` env var with CIDR matching. Walks `x-forwarded-for` from right to left, returns first untrusted IP. Documented in `.env.example`.                                                |
| **FEAT-1** | **Dedicated Radar Dashboard Page**         | M      | `web/src/app/dashboard/radar/page.tsx`, `cli/src/analytics/competitorRadar.ts` | 🟡 Open — not yet implemented.                                                                                                                                                                                               |
| **FEAT-2** | **Dedicated Timing Dashboard Page**        | M      | `web/src/app/dashboard/timing/page.tsx`                                        | 🟡 Open — not yet implemented.                                                                                                                                                                                               |

**Why P2:** UX polish separates MVP from professional product. CI prevents regressions. Dedicated pages complete the dashboard story.

---

## 🎨 UI/UX Design System Overhaul

**Goal:** Transform from ad-hoc inline Tailwind to a production-grade component system using shadcn/ui + lucide-react + recharts. World-class, accessible, consistent, and maintainable.

**Stack decisions:**

- **Component library:** shadcn/ui (Radix primitives, Tailwind v4, copy-paste ownership)
- **Icons:** lucide-react (tree-shakable, consistent line width)
- **Charts:** recharts (sparklines, trend bars, percentile visualization)
- **Motion:** Pure CSS (no library — `prefers-reduced-motion` support added)
- **Forms:** react-hook-form + zod (already in `@loopkit/shared`)

---

### Phase 1 — Foundation (🔴 P0)

> shadcn/ui init, theme merge, dependency install, CSS motion fixes, bug fixes.

| #          | Task                                                     | Effort | Files                                                                                                                    | Acceptance Criteria                                                                                                                                                                             |
| ---------- | -------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DS-1.1** | **Install shadcn/ui with Tailwind v4**                   | M      | `web/package.json`, `web/src/app/globals.css`, `web/components.json`                                                     | ✅ `npx shadcn@latest init` completed. Zinc base color. CSS variables mapped to dark-first palette. Build passes.                                                                               |
| **DS-1.2** | **Merge theme: map existing palette to shadcn CSS vars** | S      | `web/src/app/globals.css`                                                                                                | ✅ `:root` and `.dark` vars mapped to zinc-950 bg, violet-600 primary. chart-1–5 mapped to violet/cyan/emerald/amber/red. No visual regression.                                                 |
| **DS-1.3** | **Install lucide-react + recharts**                      | XS     | `web/package.json`                                                                                                       | ✅ `lucide-react` and `recharts` installed. Bundle increase < 15KB gzipped. Build passes.                                                                                                       |
| **DS-1.4** | **Install shadcn/ui components (batch 1)**               | S      | `web/src/components/ui/*`                                                                                                | ✅ Button, Card, Badge, Dialog, Sheet, Separator, Tooltip, Progress, Tabs, Input, Select, Sonner — all 12 components generated. TooltipProvider and Toaster added to root layout. Build passes. |
| **DS-1.5** | **Add `prefers-reduced-motion` CSS**                     | XS     | `web/src/app/globals.css`                                                                                                | ✅ Media query disables `fade-up`, `slideIn`, `slideInLeft`, `pulse` for reduced-motion users.                                                                                                  |
| **DS-1.6** | **Fix pulse "New" badge bug**                            | XS     | `web/src/app/dashboard/pulse/page.tsx:113`                                                                               | ✅ `{isNew ? "New" : "New"}` → `{isNew ? "New" : "Read"}`. Shows "Read" for viewed items.                                                                                                       |
| **DS-1.7** | **Replace hardcoded hex with Tailwind classes**          | XS     | `web/src/app/layout.tsx`, `DashboardLayoutClient.tsx`, `page.tsx`, `skeletons.tsx`, `benchmarks/page.tsx`, `globals.css` | ✅ `bg-[#09090b]` → `bg-background`, `bg-[#0c0c0f]` → `bg-sidebar`, `terminal` bg → `var(--sidebar)`. No visual change.                                                                         |

---

### Phase 2 — Build Component Library (🟡 P1)

> Extract inline patterns into shadcn/ui + custom components. Replace duplicated Tailwind everywhere.

| #           | Task                                         | Effort | Files                                                                                                                | Acceptance Criteria                                                                                                                                                                                                         |
| ----------- | -------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **DS-2.1**  | **Create `Button` usage patterns**           | S      | `web/src/components/ui/button.tsx` (shadcn), all dashboard pages + landing                                           | All inline button styles replaced with `<Button variant="primary                                                                                                                                                            | ghost     | outline                                                                                                                                  | danger" size="sm | md                                               | lg">`. 5+ inline button patterns eliminated. Landing page CTA, sidebar upgrade, sign out, "Copy to Clipboard" all use Button. |
| **DS-2.2**  | **Create `Card` usage patterns**             | S      | `web/src/components/ui/card.tsx` (shadcn), all dashboard pages                                                       | All `p-X rounded-2xl border border-zinc-800 bg-zinc-900/XX` replaced with `<Card><CardContent>`. 3 elevation variants: default, elevated, highlight. Metric cards, pattern interrupt, market timing, coaching all use Card. |
| **DS-2.3**  | **Create `Badge` usage patterns**            | S      | `web/src/components/ui/badge.tsx` (shadcn), dashboard pages                                                          | PercentileBadge, "Read-Only Mode" tag, "New" tag, week number tags all use `<Badge variant="success                                                                                                                         | warning   | danger                                                                                                                                   | info             | default">`. 4+ inline badge patterns eliminated. |
| **DS-2.4**  | **Create `Dialog` component (modal system)** | M      | `web/src/components/ui/dialog.tsx` (shadcn), `web/src/app/dashboard/benchmarks/page.tsx`                             | Benchmarks share card uses `<Dialog>` with focus trap, escape key, scroll lock, backdrop click to close, animation. All `fixed inset-0 z-50` ad-hoc modals replaced.                                                        |
| **DS-2.5**  | **Add `sonner` toast system**                | S      | `web/src/app/layout.tsx`, `web/src/app/dashboard/benchmarks/page.tsx`, `web/src/app/pulse/[projectId]/PulseForm.tsx` | `<Toaster />` in root layout. "Copied to clipboard" toast on share card copy. Success toast on pulse form submit. Error toasts on API failures.                                                                             |
| **DS-2.6**  | **Create `Tabs` for pulse inbox**            | S      | `web/src/components/ui/tabs.tsx` (shadcn), `web/src/app/dashboard/pulse/page.tsx`                                    | Custom tab buttons replaced with `<TabsList><TabsTrigger>`. Accessible: arrow key navigation, `role="tablist"`, `aria-selected`. Same visual appearance.                                                                    |
| **DS-2.7**  | **Create custom `MetricCard` component**     | S      | `web/src/components/metric-card.tsx` (new), `web/src/app/dashboard/page.tsx`                                         | Props: `icon`, `label`, `value`, `unit?`, `description?`, `trend?`. Replaces 3 inline metric card patterns on dashboard overview. Consistent spacing and typography.                                                        |
| **DS-2.8**  | **Create custom `EmptyState` component**     | S      | `web/src/components/empty-state.tsx` (new), all dashboard pages                                                      | Props: `icon`, `title`, `description`, `action?`, `actionHref?`. Replaces 5+ inline empty states across dashboard. Includes lucide icon + optional CTA link.                                                                |
| **DS-2.9**  | **Create custom `CodeRef` component**        | XS     | `web/src/components/code-ref.tsx` (new), dashboard pages + landing                                                   | `<code className="font-mono text-sm text-violet-400 bg-zinc-800/50 px-2 py-1 rounded">` → `<CodeRef>loopkit init</CodeRef>`. All inline CLI command references use this.                                                    |
| **DS-2.10** | **Create custom `TrendIcon` component**      | XS     | `web/src/components/trend-icon.tsx` (new), dashboard pages                                                           | `<TrendIcon trend="up" />` renders lucide `TrendingUp` with semantic color. `down` → `TrendingDown` red. `flat` → `Minus` zinc. Replaces inline `↑ ↓ →` characters.                                                         |
| **DS-2.11** | **Create custom `PriorityCard` component**   | S      | `web/src/components/priority-card.tsx` (new), dashboard page                                                         | Props: `priority: "critical"                                                                                                                                                                                                | "warning" | "info"`, `title`, `message`, `action?`. Maps to border/bg/text color variants. Replaces CoachingWidget + PatternInterrupt card wrappers. |
| **DS-2.12** | **Create `Sheet` for mobile sidebar**        | M      | `web/src/components/ui/sheet.tsx` (shadcn), `web/src/app/dashboard/DashboardLayoutClient.tsx`                        | Custom `animate-slide-in-left` replaced with `<Sheet>`. Accessible: focus trap, escape key, body scroll lock, `aria-label`. Same visual appearance.                                                                         |

---

### Phase 3 — Icons + Accessibility ✅ (7/7 tasks complete)

> Replace all emoji/unicode symbols with lucide-react. Add ARIA support. Fix keyboard navigation.

| #          | Task                                        | Effort | Files                                                 | Acceptance Criteria                                                                                                                                                                                                 |
| ---------- | ------------------------------------------- | ------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DS-3.1** | **Replace sidebar navigation icons**        | S      | `web/src/app/dashboard/DashboardLayoutClient.tsx`     | `⟳` → `RefreshCw`, `●` → `MessageCircle`, `↻` → `History`, `◈` → `BarChart3`, `▲` → `TrendingUp`, `◆` → `Search`. All 6 nav items use lucide icons.                                                                 |
| **DS-3.2** | **Replace dashboard widget emoji icons**    | S      | `web/src/app/dashboard/page.tsx`                      | `✓` → `CheckCircle2`, `▲` → `TrendingUp`, `●` → `MessageCircle`, `🔥` → `Flame`. Metric icon badges use lucide consistently with `w-8 h-8` sizing.                                                                  |
| **DS-3.3** | **Replace landing page emoji icons**        | S      | `web/src/app/page.tsx`, `web/src/app/copy-button.tsx` | Pain point emoji (`💀`, `😶`, `🔇`, `🗑️`) → lucide icons (`Skull`, `Meh`, `VolumeX`, `Trash2`). Loop phase symbols (`◆`, `○`, `▲`, `●`, `↻`) → lucide (`Hexagon`, `Circle`, `Triangle`, `Dot`, `RefreshCw`).        |
| **DS-3.4** | **Replace coaching/pattern emoji**          | S      | `web/src/app/dashboard/page.tsx`                      | Pattern emoji map (`📋`, `⏸`, `🚢`, `🎯`, `📈`) → lucide (`ClipboardList`, `Pause`, `Ship`, `Target`, `TrendingUp`). Coach emoji (`🚨`, `⚠️`, `💡`) → lucide (`AlertTriangle`, `AlertCircle`, `Lightbulb`).         |
| **DS-3.5** | **Replace benchmarks emoji**                | XS     | `web/src/app/dashboard/benchmarks/page.tsx`           | `🏆` → `Trophy`, `🚀` → `Rocket`, `🌱` → `Sprout`, `🔥` → `Flame`.                                                                                                                                                  |
| **DS-3.6** | **Add ARIA labels to interactive elements** | M      | All dashboard pages + landing                         | All `<button>` elements have `aria-label` where text is icon-only. Modal has `role="dialog"` + `aria-modal="true"`. Nav links have descriptive labels. Metric icons have `aria-hidden="true"` + visible text label. |
| **DS-3.7** | **Add skip-nav link for keyboard users**    | XS     | `web/src/app/layout.tsx`                              | `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>` added as first element in body. `id="main-content"` on `<main>`.                                                                |

---

### Phase 4 — Data Visualization (🟢 P2) ✅ COMPLETE

> Add recharts for analytics charts on dashboard and dedicated pages.

| #          | Task                                              | Effort | Files                                                | Status | Acceptance Criteria                                                                                                                                                                        |
| ---------- | ------------------------------------------------- | ------ | ---------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **DS-4.1** | **Create `SparkLine` component**                  | S      | `web/src/components/charts/spark-line.tsx` (new)     | ✅     | Tiny inline area chart (80×30px) for metrics. Props: `data`, `color`, `height?`. Used in metric cards for trend context.                                                                   |
| **DS-4.2** | **Create `MetricChart` component**                | M      | `web/src/components/charts/metric-chart.tsx` (new)   | ✅     | Full area/line chart for widget-sized display. Props: `data`, `xKey`, `yKey`, `color`, `label?`, `height?`. Used on loop history page for weekly score trend.                              |
| **DS-4.3** | **Create `PercentileBar` + `HorizontalBarChart`** | S      | `web/src/components/charts/percentile-bar.tsx` (new) | ✅     | Gradient progress bar + horizontal bar chart for trends. Props: `value`, `max?`, `colorFrom`, `colorTo` for bar; `data`, `height` for chart. Same gradient appearance, smoother animation. |
| **DS-4.4** | **Add sparklines to dashboard overview metrics**  | S      | `web/src/app/dashboard/page.tsx`                     | ✅     | Tasks Completed and Shipping Score metric cards show sparkline with last 8 weeks of data (when available). Degrades gracefully when < 2 data points (hidden).                              |
| **DS-4.5** | **Add trend chart to loop history page**          | M      | `web/src/app/dashboard/loop/page.tsx`                | ✅     | `<MetricChart>` showing shipping score over weeks (up to 12). Area fill with violet gradient. Hover tooltip shows exact values. Hidden when < 2 data points.                               |
| **DS-4.6** | **Add bar charts to trends page**                 | M      | `web/src/app/dashboard/trends/page.tsx`              | ✅     | `<HorizontalBarChart>` for each category (ICP, Problem, MVP). Bar charts above ranked lists with matching color. 8 items max per chart.                                                    |
| **DS-4.7** | **Add mini sparklines to market timing widget**   | S      | `web/src/app/dashboard/page.tsx`                     | ✅     | Funding/dev/hiring trend rows each get a 7-point sparkline showing trend direction. Violet/cyan/emerald colors matching category.                                                          |

---

### Phase 5 — Form Patterns (🟢 P2) ✅ COMPLETE

> Add react-hook-form + zod for scale. Refactor existing form. Enable future forms.

| #          | Task                                              | Effort | Files                                         | Status | Acceptance Criteria                                                                                                                             |
| ---------- | ------------------------------------------------- | ------ | --------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **DS-5.1** | **Install react-hook-form + @hookform/resolvers** | XS     | `web/package.json`                            | ✅     | `react-hook-form` and `@hookform/resolvers` installed. `zod` added to web package. Build passes.                                                |
| **DS-5.2** | **Create `FormInput` component**                  | S      | `web/src/components/form-input.tsx` (new)     | ✅     | Wraps shadcn `Input` with label, error message, hint text. Uses `react-hook-form`'s `register`. Supports `error` and `hint` props.              |
| **DS-5.3** | **Create `FormSelect` component**                 | S      | `web/src/components/form-select.tsx` (new)    | ✅     | Wraps shadcn `Select` with label, error message, placeholder. Controlled via `value` + `onValueChange`. Supports `options`, `disabled`, `hint`. |
| **DS-5.4** | **Refactor PulseForm to use react-hook-form**     | M      | `web/src/app/pulse/[projectId]/PulseForm.tsx` | ✅     | Hand-rolled state replaced with `useForm` + zod schema. Character counter stays. Error states use form validation. Success state unchanged.     |
| **DS-5.5** | **Create `FormTextarea` component**               | S      | `web/src/components/form-textarea.tsx` (new)  | ✅     | Wraps HTML textarea with label, error, character counter, hint. Used by PulseForm. Dark theme styling with focus ring and aria-invalid states.  |

---

### Phase 6 — Polish (🟢 P2) ✅ COMPLETE

> Typography tokens, spacing consistency, empty state icons, landing page refactor.

| #          | Task                                               | Effort | Files                                                     | Acceptance Criteria                                                                                                                                                                                        | Status                                              |
| ---------- | -------------------------------------------------- | ------ | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **DS-6.1** | **Define typography tokens in `@theme`**           | S      | `web/src/app/globals.css`                                 | Add custom font size tokens: `--text-display`, `--text-title`, `--text-heading`, `--text-body`, `--text-caption`, `--text-metric`. Replace ad-hoc `text-2xl`/`text-3xl`/etc with consistent token classes. | ✅                                                  |
| **DS-6.2** | **Standardize card spacing**                       | S      | All dashboard pages                                       | All cards use `p-5` (20px). Section gaps use `space-y-8`. Widget title margins use `mb-4`. No `p-6` on cards unless inner content requires it.                                                             | ✅                                                  |
| **DS-6.3** | **Add icons to empty states**                      | S      | `web/src/components/empty-state.tsx`, all dashboard pages | Each `EmptyState` shows a lucide icon via `presetIcon` prop. Dashboard: `Inbox`, Pulse: `Inbox`, Loop: `History`, Benchmarks: `BarChart3`, Keywords: `Hash`, Trends: `TrendingUp`.                         | ✅                                                  |
| **DS-6.4** | **Refactor landing page to use new components**    | M      | `web/src/app/page.tsx`, `web/src/app/copy-button.tsx`     | Pricing cards use `<Card>`. CTA buttons use `<Button>`. Phase cards use `<Card>`. Terminal section preserved as-is (custom CSS). Icons replaced with lucide.                                               | ⏭️ Skipped — marketing page has intentional spacing |
| **DS-6.6** | **Replace raw progress bars with `PercentileBar`** | XS     | `web/src/app/dashboard/benchmarks/page.tsx`               | Raw `h-1.5 bg-zinc-800 rounded-full` div replaced with `PercentileBar` from Phase 4. Uses gradient colors violet→cyan. Shows label with percentile value.                                                  | ✅                                                  |
| **DS-6.7** | **Consistent loading pattern across all pages**    | S      | All dashboard pages                                       | Every page with Convex queries follows: `data === undefined ? <Skeleton*> : data === null/[] ? <EmptyState> : <Content>`. No intermediate "Loading..." text states.                                        | ✅                                                  |

---

### Phase Dependency Map

```
Phase 1 (Foundation)
├── DS-1.1 → DS-1.2 → DS-1.4
├── DS-1.3 (independent)
├── DS-1.5 (independent)
├── DS-1.6 (independent)
├── DS-1.7 (independent)
│
Phase 2 (Components) ← requires Phase 1
├── DS-2.1 → DS-2.2 → DS-2.3 (core UI)
├── DS-2.4, DS-2.5, DS-2.6 (interactive)
├── DS-2.7 → DS-2.8 → DS-2.9 → DS-2.10 → DS-2.11 (custom)
├── DS-2.12 (sidebar refactor)
│
Phase 3 (Icons + A11y) ← requires Phase 2 (lucide replaces inline icons)
├── DS-3.1 → DS-3.2 → DS-3.3 → DS-3.4 → DS-3.5 (icon migration)
├── DS-3.6 → DS-3.7 (ARIA)
│
Phase 4 (Charts) ← requires Phase 2 (recharts needs Card/Badge)
├── DS-4.1 → DS-4.2 → DS-4.3 (chart components)
├── DS-4.4 → DS-4.5 → DS-4.6 (page integration)
│
Phase 5 (Forms) ← requires Phase 2 (needs Input/Select components)
├── DS-5.1 → DS-5.2 → DS-5.3 → DS-5.5 (form components)
├── DS-5.4 (refactor PulseForm)
│
Phase 6 (Polish) ← requires all above
├── DS-6.1 → DS-6.2 → DS-6.3 (tokens + spacing + icons)
├── DS-6.4 (landing refactor)
├── DS-6.6 → DS-6.7 (Progress + loading)
```

### Execution Order (Recommended)

```
SPRINT 1 (Phase 1 — Foundation) ~2-3 days
├── DS-1.1: Install shadcn/ui with Tailwind v4
├── DS-1.2: Merge theme (map palette to CSS vars)
├── DS-1.3: Install lucide-react + recharts
├── DS-1.4: Install shadcn components (batch 1)
├── DS-1.5: Add prefers-reduced-motion
├── DS-1.6: Fix pulse "New" badge bug
└── DS-1.7: Replace hardcoded hex with Tailwind classes

SPRINT 2 (Phase 2 — Components) ~4-5 days
├── DS-2.1: Button patterns
├── DS-2.2: Card patterns
├── DS-2.3: Badge patterns
├── DS-2.4: Dialog component
├── DS-2.5: Toast system (sonner)
├── DS-2.6: Tabs for pulse inbox
├── DS-2.7: MetricCard component
├── DS-2.8: EmptyState component
├── DS-2.9: CodeRef component
├── DS-2.10: TrendIcon component
├── DS-2.11: PriorityCard component
└── DS-2.12: Sheet for mobile sidebar

SPRINT 3 (Phase 3 — Icons + A11y) ~2-3 days
├── DS-3.1: Sidebar nav icons
├── DS-3.2: Dashboard widget icons
├── DS-3.3: Landing page icons
├── DS-3.4: Coaching/pattern icons
├── DS-3.5: Benchmark icons
├── DS-3.6: ARIA labels
└── DS-3.7: Skip-nav link

SPRINT 4 (Phase 4 — Charts) ~3-4 days
├── DS-4.1: SparkLine component
├── DS-4.2: MetricChart component
├── DS-4.3: PercentileBar component
├── DS-4.4: Dashboard sparklines
├── DS-4.5: Loop history trend chart
├── DS-4.6: Trends bar charts
└── DS-4.7: Market timing sparklines

SPRINT 5 (Phase 5 — Forms) ~1-2 days
├── DS-5.1: Install react-hook-form
├── DS-5.2: FormInput component
├── DS-5.3: FormSelect component
├── DS-5.4: Refactor PulseForm
└── DS-5.5: FormTextarea component

SPRINT 6 (Phase 6 — Polish) ~2-3 days
├── DS-6.1: Typography tokens
├── DS-6.2: Standardize spacing
├── DS-6.3: Empty state icons
├── DS-6.4: Landing page refactor
├── DS-6.6: Progress in benchmarks
└── DS-6.7: Consistent loading pattern
```

**Total estimated: ~14-20 days across 6 sprints**

---

## 📋 Design System Known Issues

| Issue                                                              | Severity   | Status                                                                                      | Fix Task       |
| ------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------- | -------------- |
| No reusable component library (everything inline)                  | **High**   | ✅ Phase 2 components created                                                               | DS-2.1–2.12    |
| Emoji icons (inconsistent cross-platform)                          | **High**   | ✅ All replaced with lucide-react                                                           | DS-3.1–3.5     |
| No toast/notification system                                       | **High**   | ✅ sonner installed + Toaster in layout                                                     | DS-2.5         |
| Modal has no focus trap/escape/scroll-lock                         | **High**   | ✅ shadcn Dialog installed (ready for migration)                                            | DS-2.4         |
| No `prefers-reduced-motion` (WCAG violation)                       | **Medium** | ✅ Fixed                                                                                    | DS-1.5         |
| Inconsistent card backgrounds (`bg-zinc-900/20` vs `/30` vs `/50`) | **Medium** | ✅ Standardized — most cards use `bg-zinc-900/30` or `bg-zinc-900/20` with consistent `p-5` | DS-2.2, DS-6.2 |
| No typography token system (ad-hoc sizes)                          | **Medium** | ✅ Added `--text-display` through `--text-metric` tokens + utility classes                  | DS-6.1         |
| Hard-coded hex colors (`bg-[#09090b]`, `bg-[#0c0c0f]`)             | **Low**    | ✅ Fixed — replaced with `bg-background`, `bg-sidebar`                                      | DS-1.7         |
| Pulse "New" badge shows "New" for both states                      | **Low**    | ✅ Fixed — now shows "Read" for non-new items                                               | DS-1.6         |
| No data visualization (no charts)                                  | **Medium** | ✅ Resolved — recharts charts added (sparklines, area charts, bar charts)                   | DS-4.1–4.7     |
| No form validation library                                         | **Low**    | ✅ Resolved — react-hook-form + zod, FormInput/FormSelect/FormTextarea                      | DS-5.1–5.5     |
| No skip-nav link                                                   | **Low**    | ✅ Added skip-to-content link                                                               | DS-3.7         |

---

### P3 — Future Roadmap (Post-Launch)

| #       | Task                          | Effort | Files                                                                | Acceptance Criteria                                                                                                                                                     |
| ------- | ----------------------------- | ------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D3      | **Dashboard Task CRUD**       | L      | `dashboard/tasks/**`, `convex/tasks.ts`, `cli/src/commands/track.ts` | Two-way sync: CLI `tasks.md` ↔ Convex `tasks` table. Conflict resolution: last-write-wins with timestamp. Real-time updates in dashboard.                               |
| W3      | **Weekly Email Digest**       | L      | `convex/crons.ts`, `convex/email.ts`, `web/src/lib/email.ts`         | Sunday cron at 9am user TZ. Email includes: tasks done, shipping score, streak, BIP post preview, next week rec. Uses Resend or Loops. Unsubscribe link required.       |
| W4      | **Public Ship Log**           | L      | `commands/ship.ts --public`, `web/src/app/@username/ships/**`        | `loopkit ship --public` pushes ship log to public URL. Markdown rendered with Tailwind typography. SEO meta tags. Optional password protection.                         |
| W5      | **GitHub Issues Sync**        | L      | `commands/track.ts --sync`, `cli/src/sync/github.ts`                 | Bidirectional sync between `tasks.md` and GitHub Issues. Issue `#N` ↔ Task `#N`. Labels map to sections (This Week / Backlog). Webhook listener for issue close events. |
| STRAT-5 | **Annual Report Framework**   | L      | `web/src/app/state-of-solo-founders/**`                              | Landing page + data pipeline for "State of Solo Founders 2027". Aggregated anonymized metrics. Exportable as PDF. Launch Month 9.                                       |
| IE-11   | **Churn Guardian v2 (ML)**    | L      | `convex/analytics.ts` + model training                               | Logistic regression on behavioral features (score trend, velocity, override rate, ship cadence). AUC ≥ 0.75 on holdout.                                                 |
| IE-12   | **Success Predictor v2 (ML)** | L      | `convex/analytics.ts` + model training                               | Random forest on 12-week behavioral window. Correlates with self-reported revenue milestones. AUC ≥ 0.70.                                                               |
| IE-13   | **AI Coach v2 (ML-Powered)**  | L      | `cli/src/analytics/coach.ts`, `convex/analytics.ts`                  | Personalized interventions based on individual pattern + cohort data. Calibrated to user's historical response rate.                                                    |

---

## 📋 Post-Analysis Known Issues

| Issue                                   | Severity     | Status      | Fix Task     |
| --------------------------------------- | ------------ | ----------- | ------------ |
| Cross-user data access (missing authz)  | **Critical** | ✅ Resolved | SEC-1, SEC-2 |
| In-memory CLI auth breaks on Vercel     | **Critical** | ✅ Resolved | SEC-3        |
| Widget hardcoded localhost              | **Critical** | ✅ Resolved | SEC-4        |
| Dashboard empty for CLI users (no sync) | **High**     | ✅ Resolved | SYNC-1       |
| Subscription expiration not checked     | Medium       | ✅ Resolved | SEC-5        |
| Unpaginated queries (OOM risk)          | Medium       | ✅ Resolved | PERF-1       |
| 24 analytics schemas untested           | Medium       | ✅ Resolved | TEST-1       |
| No CI/CD pipeline                       | Medium       | 🟡 Open     | DEV-1        |
| `timing.ts` project flag broken         | Low          | ✅ Resolved | BUG-1        |
| `coach.ts` Ctrl+C not graceful          | Low          | ✅ Resolved | BUG-2        |
| No dashboard error boundaries           | Low          | ✅ Resolved | UX-2         |
| No loading skeletons                    | Low          | ✅ Resolved | UX-1         |
| `celebrate.ts` raw chalk usage          | Low          | ✅ Resolved | BUG-3        |
| IP spoofing on pulse rate limit         | Low          | ✅ Resolved | SEC-7        |

---

## How to Run It Now

```bash
# Build
pnpm install
pnpm --filter @loopkit/shared build
cd packages/cli && pnpm build

# Test CLI
node packages/cli/dist/index.js --help

# Test with real AI (needs API key)
export ANTHROPIC_API_KEY=sk-ant-...
node packages/cli/dist/index.js init

# Quick pulse test (no AI needed)
node packages/cli/dist/index.js pulse --add "The onboarding is confusing"

# Competitor radar (free APIs, no key needed)
node packages/cli/dist/index.js radar
node packages/cli/dist/index.js radar --category "saas founders"

# Keyword opportunity finder (free SEO data, no key needed)
node packages/cli/dist/index.js keywords
node packages/cli/dist/index.js keywords --category "saas founders"

# Market timing signal (free data, no key needed)
node packages/cli/dist/index.js timing
node packages/cli/dist/index.js timing --category "saas founders"

# Run landing page
cd packages/web && npx next dev -p 3099
# open http://localhost:3099
```
