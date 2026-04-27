# LoopKit — Build Status

**Last updated:** April 27, 2026 (Week 6 P2 sprint COMPLETE · IE Phase 3: IE-8 + IE-15 IMPLEMENTED + AUDIT FIXES · IE-16 COMPLETE · IE-17 COMPLETE)  
**Version:** 0.1.0  
**Overall:** MVP complete · Weeks 1-2 shipped · Week 3 P0 done · Week 4 P1 done · Week 5 P1 done · Week 6 P2 done · Strategic + IE Phase 2 shipped · IE Phase 3: IE-8 (Trending Validations) + IE-15 (Competitor Ship Radar) implemented · Audit fixes applied (17 issues resolved, 5 nice-to-haves shipped) · IE-16 (Keyword Opportunity Finder) COMPLETE · IE-17 (Market Timing Signal) COMPLETE

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

| # | Task | Effort | Files | Acceptance Criteria |
|---|---|---|---|---|
| T1 | **Schema validation tests** | S | `shared/src/__tests__/` | ✅ All Zod schemas tested with valid/invalid data. `ConfigSchema.parse()` handles corruption. (41 tests) |
| T2 | **Prompt builder tests** | M | `cli/src/ai/__tests__/` | ✅ Prompt builders produce correct shape. Edge cases: empty data, missing fields. (30 tests) |
| T3 | **Storage I/O tests** | M | `cli/src/storage/__tests__/` | ✅ `readConfig/writeConfig`, `saveBrief`, `readTasksFile`, `appendToCut`, `readPulseResponses` tested with temp dirs. (58 tests) |
| S2 | **Input sanitization on pulse form** | S | `web/src/app/api/pulse/submit/route.ts`, `convex/pulse.ts` | ✅ Strip HTML tags, 500-char limit server-side, IP rate limiting (3 req/min) on public form. |
| D2 | **Real-time pulse inbox** | M | `web/src/app/dashboard/pulse/page.tsx` | ✅ Convex subscription for new feedback. "New" badge with slide-in + pulse animation. No refresh required. |

**Why P0:** Zero test coverage = every refactor is risky. Public pulse form without sanitization = XSS/injection. These block public launch.

---

### P1 — Ship Within 2 Weeks (Weeks 4-5)

| # | Task | Effort | Files | Acceptance Criteria |
|---|---|---|---|---|
| W1 | **`loopkit celebrate`** | S | `commands/celebrate.ts` (new) | ✅ ASCII confetti + "You shipped!" card with score, streak, shareable text. Auto-triggered after `ship`. |
| W2 | **"Unstuck me" mode** | M | `commands/loop.ts`, `ai/prompts/unstuck.ts` (new) | ✅ Detect 0 tasks this week → offer 3 micro-tasks from brief context. Added to tasks.md on confirm. |
| F3 | **Keyboard shortcuts** | M | `ui/theme.ts` | ✅ `?` help, `q` quit, `s` skip, `Enter` default hint shown in all Clack prompts. |
| F4 | **Better empty states** | S | All command files | ✅ Helpful next steps when no data: `emptyState()` utility with actionable commands. |
| D4 | **Dashboard mobile responsive** | M | All dashboard pages | ✅ Hamburger menu, slide-in sidebar overlay, 44px touch targets, scroll-lock on mobile, backdrop blur. |
| STRAT-1 | **Telemetry module** | M | `cli/src/analytics/telemetry.ts` | ✅ Opt-in consent at `loop`, local-first, export/delete, `telemetry` command. |
| STRAT-2 | **Benchmark tool** | M | `web/src/app/dashboard/benchmarks/`, `convex/analytics.ts` | ✅ Percentile rankings, shareable stat cards, overall score, trend indicators. |
| STRAT-3 | **Monthly Insights #1** | S | `docs/content/monthly-insights-001.md` | ✅ Blog post "Shipping Consistency Beats Brilliance" + 10-tweet thread + newsletter. |

| IE-1 | **Shipping DNA v1** | M | `cli/src/analytics/dna.ts` (new), `commands/loop.ts` | ✅ After 4 weeks, generates profile: Marathoner/Sprinter/Perfectionist/Reactor/All-Star pattern, velocity trend, strengths, risk warnings. |
| IE-2 | **Smart Benchmarks CLI** | S | `cli/src/analytics/benchmarks.ts` (new), `commands/track.ts` | ✅ Percentile rankings in track + track --week. "You ship faster than X% of founders." |
| IE-3 | **Snooze Oracle** | S | `commands/track.ts`, `cli/src/analytics/oracle.ts` (new) | ✅ Historical snooze completion analysis. Warning on snooze: "X% of snoozed tasks never done." |

**Why P1:** Delight moments (celebrate/unstuck) drive retention. Telemetry unblocks all metrics. Benchmarks + content build the data moat. Intelligence Engine features create identity attachment and switching costs.

---

### P2 — Ship Within 4 Weeks (Week 6) ✅ COMPLETE

| # | Task | Effort | Files | Acceptance Criteria |
|---|---|---|---|---|
| S3 | **CSRF protection** | S | `web/src/app/api/**/route.ts`, `_helpers.ts` | ✅ `Origin` header checks on all AI proxy, auth, and pulse share routes. Rejects cross-origin requests with 403. |
| P2 | **Merge config reads** | S | `ai/client.ts` | ✅ Single `resolveAuth()` returning `{ anthropicKey, token }`. Eliminated duplicate `readConfig()` calls. |
| P3 | **Cache AI results** | M | `storage/cache.ts` (new), `ai/client.ts` | ✅ Hash `(command, system, prompt, schema)` → `.loopkit/cache/`. 7-day TTL. Reuse on identical calls. |
| P5 | **Optimize git hook** | S | `commands/track.ts` | ✅ Standalone node script (`.git/hooks/loopkit-commit-msg.js`). No `execSync`. Content-hash based SHA. ~0ms overhead. |
| STRAT-4 | **Founder archetype detection** | L | `convex/analytics.ts`, `dashboard/page.tsx` | ✅ 5 archetype types (Sprinter, Marathoner, Perfectionist, Reactor, All-Star). Dashboard widget with emoji, description, metrics. |
| IE-4 | **Churn Guardian v1** | M | `cli/src/analytics/churn.ts` (new), `commands/loop.ts` | ✅ Rule-based detection: declining score (2+ weeks), skipped loops, rising override rate, low velocity. Proactive warnings with suggestions. |
| IE-5 | **Auto-Loop (Sunday Ritual Assistant)** | M | `cli/src/analytics/autoLoop.ts` (new), `commands/loop.ts` | ✅ Monday detection of missed Sunday loop. Auto-generates draft from tasks/ships/pulse data. One-click confirm. |
| IE-6 | **Success Predictor v1** | S | `cli/src/analytics/predictor.ts` (new), `commands/loop.ts` | ✅ After 8 weeks, predicts probability of first revenue within 6 months. Behavioral heuristics: consistency, score, velocity, trend, override rate, shipping habit. Shows strengths, risks, and shift factors. |

**Why P2:** Security hardening (CSRF), performance wins (config merge, cache, hook), and first data products (archetypes, churn guard, auto-loop, success prediction).

---

### P3 — Future Roadmap (Week 7+)

#### IE-8: Trending Validations (S) ✅ COMPLETE
*Aggregate what ICPs/problems LoopKit users are pursuing. Proprietary data no one else has.*

| Sub-Task | Effort | Files | Acceptance Criteria |
|---|---|---|---|
| IE-8.1 | **Telemetry ICP extraction** | S | `cli/src/analytics/telemetry.ts`, `convex/analytics.ts` | ✅ Opt-in telemetry captures anonymized ICP, problem, MVP category from brief. Stored as aggregate counts, not raw data. |
| IE-8.2 | **Convex trending query** | S | `convex/analytics.ts` | ✅ Query returns top 10 ICPs/problems by count, with 7d/30d trend deltas. Rate-limited, cached. |
| IE-8.3 | **Dashboard trends page** | S | `web/src/app/dashboard/trends/page.tsx` | ✅ Shows trending ICPs/problems as ranked list with sparkline trend indicators. "12 founders validating X this week." |
| IE-8.4 | **CLI trend hint** | S | `commands/init.ts` | ✅ After brief scoring, show: "X other founders are exploring similar spaces this month." |

#### IE-15: Competitor Ship Radar (M) ✅ COMPLETE
*Scan Product Hunt/HN/Twitter for launches in user's space. Alert: "3 competitors shipped this week."*

| Sub-Task | Effort | Files | Acceptance Criteria |
|---|---|---|---|
| IE-15.1 | **External API adapters** | M | `cli/src/analytics/competitorRadar.ts` (new) | ✅ Free APIs only: Product Hunt RSS, HN Algolia search API. No scraping, no API keys required. |
| IE-15.2 | **Category keyword mapping** | S | `cli/src/analytics/competitorRadar.ts`, `shared/src/index.ts` | ✅ Map brief category → search keywords. Zod schema for `CompetitorLaunchSchema`. |
| IE-15.3 | **Cached scan results** | S | `cli/src/analytics/competitorRadar.ts`, `storage/cache.ts` | ✅ Results cached 24h. Returns `{ launches: [{ name, url, date, platform, relevance }] }`. Handles API failures gracefully. |
| IE-15.4 | **CLI radar command** | S | `commands/radar.ts` (new) | ✅ `loopkit radar` → shows recent launches in user's category. Opt-in, respects telemetry consent. |
| IE-15.5 | **Dashboard radar widget** | M | `web/src/app/dashboard/page.tsx` | ✅ Widget on overview page. Shows trending validations with link to full trends page. |

#### IE-16: Keyword Opportunity Finder (M) ✅ COMPLETE

| Sub-Task | Effort | Files | Acceptance Criteria |
|---|---|---|---|
| IE-16.1 | **SEO data source adapters** | M | `cli/src/analytics/keywordFinder.ts` (new) | Free sources: Google Autocomplete, Reddit search API, GitHub repo count. No paid APIs. ✅ DONE |
| IE-16.2 | **Keyword scoring algorithm** | S | `cli/src/analytics/keywordFinder.ts` | Score = (search volume proxy) / (competition proxy). Competition = GitHub repos + suggestion count. Returns top 15 opportunities. ✅ DONE |
| IE-16.3 | **Zod schema + caching** | S | `shared/src/index.ts`, `storage/cache.ts` | `KeywordOpportunitySchema`: `{ keyword, score, volume, competition, sources[], suggestions[] }`. Cached 7d. ✅ DONE |
| IE-16.4 | **CLI keywords command** | S | `commands/keywords.ts` (new) | `loopkit keywords` → shows ranked list with score, volume, competition. "Low-hanging fruit" highlighted. ✅ DONE |
| IE-16.5 | **Dashboard keywords page** | M | `web/src/app/dashboard/keywords/page.tsx` | Table view with sort/filter. Export as CSV. "Content ideas for your niche." ✅ DONE |

#### IE-17: Market Timing Signal (M) ✅ COMPLETE
*Track funding rounds, job postings, GitHub stars in user's category. "Space is heating up" vs "cooling down."*

| Sub-Task | Effort | Files | Acceptance Criteria |
|---|---|---|---|
| IE-17.1 | **Market data adapters** | M | `cli/src/analytics/marketTiming.ts` (new) | Free sources: Crunchbase RSS (funding), GitHub API (repo growth), Indeed RSS (job postings). No scraping. All requests cached 7d. ✅ DONE |
| IE-17.2 | **Signal computation** | S | `cli/src/analytics/marketTiming.ts` | 3 signals: funding velocity (rounds/30d), dev activity (GitHub stars/30d), hiring demand (postings/30d). Each: ↑ ↓ → trend. Composite score 0-100. ✅ DONE |
| IE-17.3 | **Zod schema + Convex storage** | S | `shared/src/index.ts`, `convex/marketTiming.ts`, `convex/schema.ts` | `MarketSignalSchema`: `{ category, fundingTrend, devTrend, hiringTrend, compositeScore, lastUpdated }`. Stored per-category, updated weekly via cron. ✅ DONE |
| IE-17.4 | **CLI timing command** | S | `commands/timing.ts` (new) | `loopkit timing` → shows composite score, 3 trend arrows, and interpretation. Opt-in, respects telemetry consent. ✅ DONE |
| IE-17.5 | **Dashboard signal widget** | M | `web/src/app/dashboard/page.tsx` | Gauge card showing composite score + 3 trend arrows on overview page. ✅ DONE |

#### Remaining P3 (Other)

| # | Task | Effort | Files | Acceptance Criteria |
|---|---|---|---|---|
| D3 | **Dashboard task CRUD** | L | New files in `dashboard/` | Create/edit tasks from web. Sync with local `tasks.md`. Drag-to-reorder. |
| F5 / W6 | **Project templates** | M | `commands/init.ts`, `templates/` (new) | `loopkit init --template [saas\|api\|mobile\|cli\|newsletter\|agency]` pre-fills hints. |
| W3 | **Weekly email digest** | L | `convex/crons.ts` (new) | Sunday cron: tasks done, shipping score, streak, BIP post, next week rec. |
| W4 | **Public ship log** | L | `commands/ship.ts`, new web route | `loopkit ship --public` → shareable URL (`loopkit.dev/@username/ships`). |
| W5 | **GitHub Issues sync** | L | `commands/track.ts`, `sync/` module | `loopkit track --sync` two-way sync. ID mapping table. |
| STRAT-5 | **Annual report framework** | L | `web/src/app/state-of-solo-founders/` | Landing page + data pipeline for "State of Solo Founders 2027". Launch Month 9. |
| IE-7 | **Anonymous Peer Inspiration** | M | `cli/src/analytics/peers.ts` (new), `commands/loop.ts` | Show what anonymized founders with similar projects shipped this week. Opt-in. |
| IE-9 | **Pattern Interrupt** | M | `commands/init.ts`, `cli/src/analytics/patterns.ts` (new) | Detect repeated failure patterns. Interrupt with data. Suggest `--narrow` ICP refinement. |
| IE-10 | **AI Coach v1** | L | `cli/src/analytics/coach.ts` (new), all command files | Rule-based coaching layer. Week 3/8/16 contextual suggestions. |
| IE-11 | **Churn Guardian v2 (ML)** | L | `convex/analytics.ts` + model training pipeline | Replace rule-based with ML model trained on proprietary behavioral data. |
| IE-12 | **Success Predictor v2 (ML)** | L | `convex/analytics.ts` + model training pipeline | Replace heuristics with ML model correlating behavior with revenue/outcome reports. |
| IE-13 | **AI Coach v2 (ML-powered)** | L | `cli/src/analytics/coach.ts`, `convex/analytics.ts` | ML-powered coaching interventions calibrated to individual patterns + aggregate data. |

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

WEEK 7-8 (P3 — IE Phase 3: Trending + Radar)  ✅ COMPLETE
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
└── IE-7: Anonymous Peer Inspiration             (next)

WEEK 9-10 (P3 — IE Phase 3: Keywords + Timing)  ✅ COMPLETE
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
└── IE-9: Pattern Interrupt                           (next)

WEEK 11-12 (P3 — Platform Expansion)
├── D3: Dashboard task CRUD
├── F5/W6: Project templates
├── W3: Weekly email digest
├── W4: Public ship log
├── W5: GitHub sync
└── IE-10: AI Coach v1

WEEK 13+ (P3 — IE Phase 4-5 ML)
├── IE-11: Churn Guardian v2 (ML)
├── IE-12: Success Predictor v2 (ML)
├── IE-13: AI Coach v2 (ML-powered)
└── STRAT-5: Annual report
```

---

## Known Issues

| Issue | Severity | Status |
|---|---|---|
| No automated tests (zero coverage) | High | ✅ Resolved — 135 tests (41 shared + 94 CLI) |
| No AI streaming | High | ✅ Resolved (P1) |
| Auth token stored unencrypted | Medium | ✅ Resolved (S1) |
| "Fast" and "creative" tiers same model | Medium | ✅ Resolved (P4) |
| Dashboard uses placeholder data | Medium | ✅ Resolved (D1) |
| `config.json` parsed 2-3x per command | Low | ✅ Resolved (P2 — Week 6: resolveAuth()) |
| Pulse `--share` missing | Low | ✅ Resolved (F1) |
| No rate limiting on free tier | Medium | ✅ Resolved (S4) |
| No input sanitization on pulse form | High | ✅ Resolved (S2 — Week 3) |
| No CSRF protection on API routes | High | ✅ Resolved (S3 — Week 6) |
| Next.js Turbopack workspace root warn | Info | Cosmetic — no functional impact |

---

## Metrics to Hit

| Metric | Target | Current | Tracking Method |
|---|---|---|---|
| Break-even paid users | 10 | 0 (pre-launch) | Polar.sh dashboard |
| `init` session completion | ≥ 70% | Measuring | Telemetry (STRAT-1) |
| `track` weekly active retention | ≥ 65% | Measuring | Telemetry (STRAT-1) |
| `ship` draft use rate | ≥ 50% | Measuring | Telemetry (STRAT-1) |
| `pulse` widget response rate | ≥ 8% | 0 (form ready) | Convex pulseResponses count |
| `loop` Sunday run rate | ≥ 75% | Measuring | Telemetry (STRAT-1) |
| Month 3 paid users | 35 | 0 (pre-launch) | Polar.sh dashboard |

### Strategic Metrics (Month 3-6)

| Metric | Month 3 | Month 6 | Tracking |
|---|---|---|---|
| Telemetry opt-in rate | 50% | 70% | Consent prompt at `loopkit loop` |
| Founder-weeks in database | 200 | 1,000 | Convex aggregation |
| Benchmark tool usage | 50/week | 500/week | Dashboard analytics |
| Content-driven signups | 5% | 20% | UTM tracking |
| Newsletter subscribers | 50 | 500 | Beehiiv/Substack |
| Press mentions | 0 | 1 | Manual tracking |

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