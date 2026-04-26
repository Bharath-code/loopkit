# LoopKit — Build Status

**Last updated:** April 26, 2026 (Week 3 P0 sprint COMPLETE)  
**Version:** 0.1.0  
**Overall:** MVP complete · Weeks 1-2 shipped · Week 3 P0 done · Ready for public launch

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

---

### Web Dashboard
- [x] Next.js 16 App Router, Tailwind v4, dark theme
- [x] Landing page (hero, demo, pricing, footer, SEO, animations)
- [x] Dashboard routes (overview, pulse inbox, loop history) with live Convex queries
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
| W1 | **`loopkit celebrate`** | S | `commands/celebrate.ts` (new) | ASCII confetti + "You shipped!" card with score, streak, shareable text. Auto-triggered after `ship`. |
| W2 | **"Unstuck me" mode** | M | `commands/loop.ts` | Detect 0 tasks this week → offer 3 micro-tasks from brief context. |
| F3 | **Keyboard shortcuts** | M | `ui/theme.ts` | `?` help, `q` quit, `s` skip, `Enter` default in Clack prompts. |
| F4 | **Better empty states** | S | All command files | Helpful next steps when no data: "No tasks yet. Run `loopkit track --add`." |
| D4 | **Dashboard mobile responsive** | M | All dashboard pages | Collapsible sidebar, stacked cards, touch-friendly on <768px. |
| STRAT-1 | **Telemetry module** | M | `cli/src/analytics/telemetry.ts` | Opt-in anonymous collection. Local by default, aggregated only, exportable/deletable. |
| STRAT-2 | **Benchmark tool** | M | `web/src/app/dashboard/benchmarks/` | "How do you compare?" Percentile rankings vs anonymized data. Shareable cards. |
| STRAT-3 | **Monthly Insights #1** | S | `docs/content/` (new) | First data-driven piece: "What [N] founders taught us in [Month]". Blog + Twitter + newsletter. |

| IE-1 | **Shipping DNA v1** | M | `cli/src/analytics/dna.ts` (new), `commands/loop.ts` | After 4 weeks, generate "Shipping DNA" profile: pattern (Marathoner/Sprinter/etc.), velocity trend, peak day, completion style, risk warnings. |
| IE-2 | **Smart Benchmarks CLI** | S | `cli/src/analytics/benchmarks.ts` (new), `commands/track.ts` | Show percentile rankings vs anonymized founders (same project type, same week). "You ship faster than 72% of SaaS founders." |
| IE-3 | **Snooze Oracle** | S | `commands/track.ts`, `cli/src/analytics/oracle.ts` (new) | When snoozing, show probability of completion based on historical data. "67% of snoozed tasks are never done." |

**Why P1:** Delight moments (celebrate/unstuck) drive retention. Telemetry unblocks all metrics. Benchmarks + content build the data moat. Intelligence Engine features create identity attachment and switching costs.

---

### P2 — Ship Within 4 Weeks (Week 6)

| # | Task | Effort | Files | Acceptance Criteria |
|---|---|---|---|---|
| S3 | **CSRF protection** | S | `web/src/app/api/**/route.ts` | `Origin` / `Referer` header checks on AI proxy and auth routes. |
| P2 | **Merge config reads** | S | `ai/client.ts` | Single `resolveAuth()` returning `{ anthropic, token }`. Eliminate duplicate `readConfig()` calls. |
| P3 | **Cache AI results** | M | `storage/cache.ts` (new) | Hash `(command, system, prompt, schema)` → `.loopkit/cache/`. Reuse on identical calls. |
| P5 | **Optimize git hook** | S | `commands/track.ts` | Read `.git/COMMIT_EDITMSG` directly instead of `execSync`. Target <50ms. |
| STRAT-4 | **Founder archetype detection** | L | `convex/analytics.ts` + dashboard widget | Cluster users into 5 types (Sprinter, Marathoner, Perfectionist, Reactor, All-Star). Show in dashboard. |
| IE-4 | **Churn Guardian v1** | M | `cli/src/analytics/churn.ts` (new), `commands/track.ts`, `commands/loop.ts` | Rule-based detection: declining shipping score for 2+ weeks, skipped loops, rising override rate. Proactive intervention with actionable suggestions. |
| IE-5 | **Auto-Loop (Sunday Ritual Assistant)** | M | `convex/crons.ts`, `cli/src/analytics/autoLoop.ts` (new) | If user misses Sunday `loop`, auto-generate draft on Monday from tasks/ships/pulse. Email/notification with one-click confirm. |
| IE-6 | **Success Predictor v1** | S | `cli/src/analytics/predictor.ts` (new), `commands/loop.ts` | After 8 weeks, predict probability of first revenue within 6 months based on behavioral heuristics. Show strengths, risks, and probability shift from fixes. |

**Why P2:** Security hardening (CSRF), performance wins (config merge, cache, hook), and first data products (archetypes, churn guard, auto-loop, success prediction).

---

### P3 — Future Roadmap (Week 7+)

| # | Task | Effort | Files | Acceptance Criteria |
|---|---|---|---|---|
| D3 | **Dashboard task CRUD** | L | New files in `dashboard/` | Create/edit tasks from web. Sync with local `tasks.md`. Drag-to-reorder. |
| F5 / W6 | **Project templates** | M | `commands/init.ts`, `templates/` (new) | `loopkit init --template [saas\|api\|mobile\|cli\|newsletter\|agency]` pre-fills hints. |
| W3 | **Weekly email digest** | L | `convex/crons.ts` (new) | Sunday cron: tasks done, shipping score, streak, BIP post, next week rec. |
| W4 | **Public ship log** | L | `commands/ship.ts`, new web route | `loopkit ship --public` → shareable URL (`loopkit.dev/@username/ships`). |
| W5 | **GitHub Issues sync** | L | `commands/track.ts`, `sync/` module | `loopkit track --sync` two-way sync. ID mapping table. |
| STRAT-5 | **Annual report framework** | L | `web/src/app/state-of-solo-founders/` | Landing page + data pipeline for "State of Solo Founders 2027". Launch Month 9. |
| IE-7 | **Anonymous Peer Inspiration** | M | `cli/src/analytics/peers.ts` (new), `commands/loop.ts` | Show what anonymized founders with similar projects shipped this week. "SaaS founders at Week 12 shipped: Stripe billing, webhook retry..." Opt-in. |
| IE-8 | **Trending Validations** | S | `convex/analytics.ts`, `web/src/app/dashboard/trends/` (new) | Surface trending ICPs, problems, MVP categories from aggregate data. Feed into Monthly Insights (STRAT-3). |
| IE-9 | **Pattern Interrupt** | M | `commands/init.ts`, `cli/src/analytics/patterns.ts` (new) | Detect repeated failure patterns (e.g., 4th project in 6 months). Interrupt with data: "Founders with this pattern have 15% success rate." Suggest `--narrow` ICP refinement. |
| IE-10 | **AI Coach v1** | L | `cli/src/analytics/coach.ts` (new), all command files | Rule-based coaching layer. Week 3: "Add validation tasks to track." Week 8: "Ship something public." Week 16: "Tension detected: pulse wants API, tasks focus on UI." |
| IE-11 | **Churn Guardian v2 (ML)** | L | `convex/analytics.ts` + model training pipeline | Replace rule-based Churn Guardian with ML model trained on proprietary behavioral data. |
| IE-12 | **Success Predictor v2 (ML)** | L | `convex/analytics.ts` + model training pipeline | Replace heuristics with ML model correlating 8+ weeks of behavior with actual revenue/outcome reports. |
| IE-13 | **AI Coach v2 (ML-powered)** | L | `cli/src/analytics/coach.ts`, `convex/analytics.ts` | ML-powered coaching interventions calibrated to individual user patterns + aggregate success data. |

**Why P3:** CLI-first means dashboard task CRUD is secondary. Intelligence Engine Phase 3+ needs critical mass (500+ users, 12+ weeks data). These are the ultimate moat features — they compound over time and cannot be replicated by competitors without catching up on data depth.

---

## 📅 Execution Order

```
WEEK 3 (P0 — Launch Blockers)     ✅ COMPLETE
├── T1: Schema validation tests          ✅ 41 tests
├── T2: Prompt builder tests             ✅ 30 tests
├── T3: Storage I/O tests                ✅ 58 tests
├── S2: Input sanitization               ✅ HTML strip + 500-char limit + rate limit
└── D2: Real-time pulse inbox            ✅ Convex subscription + slide-in animation

WEEK 4 (P1 — Delight + Polish)          ← NEXT SPRINT
├── W1: loopkit celebrate
├── W2: "Unstuck me" mode
├── F3: Keyboard shortcuts
└── F4: Better empty states

WEEK 5 (P1 — Strategic Foundation + IE Phase 1)
├── STRAT-1: Telemetry module
├── STRAT-2: Benchmark tool
├── STRAT-3: Monthly Insights #1
├── IE-1: Shipping DNA v1
├── IE-2: Smart Benchmarks CLI
├── IE-3: Snooze Oracle
└── D4: Dashboard mobile responsive

WEEK 6 (P2 — Performance + Security + IE Phase 2)
├── S3: CSRF protection
├── P2: Merge config reads
├── P3: Cache AI results
├── P5: Optimize git hook
├── STRAT-4: Founder archetypes
├── IE-4: Churn Guardian v1
├── IE-5: Auto-Loop
└── IE-6: Success Predictor v1

WEEK 7-8 (P3 — IE Phase 3 Early)
├── IE-7: Anonymous Peer Inspiration
├── IE-8: Trending Validations
└── IE-9: Pattern Interrupt

WEEK 9-12 (P3 — Platform Expansion)
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
| No automated tests (zero coverage) | High | ✅ Resolved — 129 tests (41 shared + 88 CLI) |
| No AI streaming | High | ✅ Resolved (P1) |
| Auth token stored unencrypted | Medium | ✅ Resolved (S1) |
| "Fast" and "creative" tiers same model | Medium | ✅ Resolved (P4) |
| Dashboard uses placeholder data | Medium | ✅ Resolved (D1) |
| `config.json` parsed 2-3x per command | Low | Planned (P2 — Week 6) |
| Pulse `--share` missing | Low | ✅ Resolved (F1) |
| No rate limiting on free tier | Medium | ✅ Resolved (S4) |
| No input sanitization on pulse form | High | ✅ Resolved (S2 — Week 3) |
| Next.js Turbopack workspace root warn | Info | Cosmetic — no functional impact |

---

## Metrics to Hit

| Metric | Target | Current | Tracking Method |
|---|---|---|---|
| Break-even paid users | 10 | 0 (pre-launch) | Polar.sh dashboard |
| `init` session completion | ≥ 70% | Unknown | Telemetry (STRAT-1) |
| `track` weekly active retention | ≥ 65% | Unknown | Telemetry (STRAT-1) |
| `ship` draft use rate | ≥ 50% | Unknown | Telemetry (STRAT-1) |
| `pulse` widget response rate | ≥ 8% | 0 (form ready) | Convex pulseResponses count |
| `loop` Sunday run rate | ≥ 75% | Unknown | Telemetry (STRAT-1) |
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
- [ ] Tests pass: `pnpm --filter @loopkit/cli test` (129 tests total)
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

# Run landing page
cd packages/web && npx next dev -p 3099
# open http://localhost:3099
```