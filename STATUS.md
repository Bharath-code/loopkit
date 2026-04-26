# LoopKit — Build Status

**Last updated:** April 26, 2026 (Week 1: T0+P1+P4+F2 ✅ · Week 2: F1+D1+S1+S4 ✅)  
**Version:** 0.1.0  
**Overall:** MVP complete · Week 2 improvements shipped · Improvement plan created (see §Post-v0.1 Plan)

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

All Zod schemas defined and building:

- [x] `BriefSchema` — AI output from `loopkit init` (includes `overallScore`)
- [x] `TaskSchema` — task entries with status, section, timestamps
- [x] `ShipDraftsSchema` — HN title+body, Twitter tweets[], IH body
- [x] `PulseClusterSchema` — Fix now / Validate later / Noise clusters
- [x] `LoopSynthesisSchema` — oneThing, rationale, tension, bipPost
- [x] `ConfigSchema` — version, activeProject, auth (BYOK), preferences
- [x] Helpers: `slugify()`, `getWeekNumber()`, `formatDate()`

---

### `loopkit init` — Define Phase

- [x] 5-question Clack prompt flow (name, problem, ICP, why unsolved, MVP)
- [x] Solution-in-disguise detection on Q2 (client-side regex + AI flag)
- [x] Soft warning for short answers (< 5 words)
- [x] AI scoring via Vercel AI SDK `generateObject()` with Zod schema
- [x] Score bar visualization in terminal (colored ████░░)
- [x] Brief rendered as box with: bet, 3 scores, riskiest assumption, validate action, MVP
- [x] `overallScore` field — average of ICP + Problem + MVP scores, shown as `**Overall: X/10**`
- [x] `brief.md` (human readable) + `brief.json` (machine readable) saved
- [x] Session resume on Ctrl+C — saves `draft.json`, resumes from last question
- [x] Project collision handling: overwrite / new version / resume
- [x] Graceful fallback when AI unavailable — saves answers without scores
- [x] `--analyze [name]` flag — run AI on existing saved answers
- [x] Active project set in `config.json` after init
- [x] System prompt with full PRD spec, 3 few-shot calibration examples
- [x] Anti-hallucination rules (word caps, JSON output only, no sycophancy)

Remaining:
- [x] Free vs paid tier gating (scores shown, notes hidden for free)

---

### `loopkit track` — Develop Phase

- [x] `tasks.md` parser — reads `## This Week` and `## Backlog` sections
- [x] Task ID extraction from `#N` patterns
- [x] Done/open detection from `[x]` / `[ ]` markdown
- [x] Board view: done tasks (✓), open tasks (○), age labels for stale tasks
- [x] Shipping score progress bar (done/total × 100)
- [x] Git hook installer (`commit-msg`) — **append-only, never overwrites**
- [x] `[#N]` pattern detection in commit messages — auto-closes tasks
- [x] Multi-task close in single commit (`[#2] [#4]`)
- [x] Stale task detection (3+ days) — keep / snooze / cut prompt
- [x] `--add "task title"` flag — inline task add (stores `created:YYYY-MM-DD` metadata)
- [x] `--week` flag — full week summary with comparison data
- [x] `--repair` flag — re-assigns sequential IDs
- [x] Graceful no-git-repo handling (warns once, runs in manual mode)
- [x] Snooze date tracking — `snoozed:YYYY-MM-DD` written to task metadata, hides task until date
- [x] Resurfaced task alert — `↑ N snoozed task(s) resurfaced today` shown on board
- [x] `cut.md` archive — cut tasks moved to `.loopkit/projects/[slug]/cut.md` (never deleted)

Remaining:
- [x] `loopkit track --project [name]` for switching active project

---

### `loopkit ship` — Deliver Phase

- [x] Reads brief.json for context (bet, ICP, problem) if available
- [x] Reads tasks.md and extracts completed tasks for AI context
- [x] Single question: "What's the main thing you shipped?"
- [x] Self-reported pre-launch checklist (README, landing, analytics, feedback)
- [x] AI generates all 3 platform drafts in one call (Vercel AI SDK)
- [x] HN: title + body | Twitter: 3 tweets | IH: narrative
- [x] Per-draft actions: `[u]se` / `[e]dit` / `[r]egenerate` / `[s]kip`
- [x] `[r]egenerate` — re-calls AI for that platform, loops back to show new draft
- [x] `[e]dit` — opens draft in `$EDITOR` (fallback: `nano`), reads back edited content
- [x] Ship log saved to `.loopkit/ships/YYYY-MM-DD.md`
- [x] Existing ship log detection — overwrite / append / skip
- [x] Graceful fallback without brief (inline questions)
- [x] Graceful fallback when AI fails (saves log without drafts)
- [x] Ship prompt with full PRD copywriting rules (no hype, developer tone)

---

### `loopkit pulse` — Feedback Phase (V1)

- [x] Local JSON storage for responses (`.loopkit/pulse/responses.json`)
- [x] Raw mode for < 5 responses (skips AI, shows list)
- [x] AI clustering with 3 fixed buckets: Fix now / Validate later / Noise
- [x] Per-cluster: count, pattern description, representative quotes
- [x] Confidence score display
- [x] Outlier responses shown separately
- [x] Tag "Fix now" cluster to sprint (creates task in tasks.md)
- [x] `--raw` flag — skip clustering, show raw responses
- [x] `--setup` flag — explains V1 setup, guides toward responses.json
- [x] `--add "response text"` flag — append a single response inline, shows count + remaining to threshold
- [x] Clustering prompt with anti-hallucination rule ("NEVER invent quotes")
- [x] Graceful fallback on clustering failure (shows raw)
- [x] Pulse I/O centralized in `storage/local.ts` (`readPulseResponses`, `appendPulseResponse`)

Remaining (Phase 7):
- [x] Hosted feedback form URL (`/pulse/[projectId]`)
- [x] Convex write for realtime response collection
- [x] JS embed widget (`/api/pulse/widget`)
- [x] Convex offline queueing for form submissions

---

### `loopkit loop` — Iterate Phase

- [x] Instant local data aggregation (< 1 second, no API call)
- [x] Week summary: tasks done, open, shipping score, shipped Friday
- [x] Mid-week check-in mode (skips AI by default on non-Sunday)
- [x] First-week handling — 2 inline questions, no AI required
- [x] AI synthesis: one-thing recommendation with structured priority logic
- [x] Priority ranking: Fix now → Ship → Validate assumption → Next task
- [x] Tension detection: surfaces conflict between pulse and track plan
- [x] Accept / Change / Skip recommendation flow
- [x] Override reason recording for product signal tracking
- [x] Override rate warning — after 4 weeks at ≥ 50%, surfaces actionable suggestion
- [x] BIP post generated with 280-char check
- [x] Loop log saved to `.loopkit/logs/week-N.md`
- [x] Graceful fallback when AI fails (saves week data without synthesis)
- [x] System prompt with if/else priority logic (not prose)
- [x] `nextStep("init")` shown after loop closes

Remaining:
- [x] Streak visualization (4-week streak rate metric)
- [x] Pulse data ingested from Convex

---

### `@loopkit/web` — Landing Page

- [x] Next.js 16 App Router scaffolded
- [x] Inter + JetBrains Mono fonts loaded
- [x] Dark theme global CSS (zinc-950 background)
- [x] Tailwind v4 with custom design tokens
- [x] Sticky nav bar — logo, "How it works" / "Pricing" / "GitHub" anchors, "Sign in" + "Get started" CTAs
- [x] Hero section: headline, subheadline, install command CTA
- [x] Copy-to-clipboard on install command (client component, `navigator.clipboard` + fallback, ✓ feedback)
- [x] Terminal demo section: simulated `loopkit init` output
- [x] Pain points grid (4 relatable pains)
- [x] "How it works" — 5-phase loop explanation with icons
- [x] Pricing section — 3 tiers (Free / Solo $19 / Pro $39)
- [x] Footer with GitHub and Twitter links
- [x] SEO metadata (title, description, OG tags, keywords)
- [x] Glow effects, grid background, fade-up animations
- [x] Scroll anchor navigation

Remaining (Phase 7+):
- [x] Dashboard routes (project overview, pulse inbox, loop history)
- [x] Auth pages (login, signup via Convex)

---

### `storage/local.ts` — File I/O Layer

- [x] All `.loopkit/` path resolvers centralized (`getRoot`, `getProjectDir`, etc.)
- [x] `getCutPath(slug)` + `appendToCut(slug, line, date)` — cut archive helpers
- [x] `getPulseDir()` + `readPulseResponses()` + `appendPulseResponse(text)` — pulse I/O
- [x] `readLastNLoopLogs(n)` — reads last N week logs, parses override status

---

### Documentation

- [x] `README.md` — product overview, 5 commands, quick start, pricing
- [x] `CLAUDE.md` — codebase guide for Claude AI
- [x] `AGENTS.md` — agentic coding guidelines
- [x] `STATUS.md` — this file
- [x] `docs/PERSONAS.md` — 4 primary personas (Sarah, Marcus, Alex, Jordan) with goals, pain points, and interaction flows
- [x] `docs/USER_STORIES.md` — 25+ user stories with acceptance criteria, mapped to personas and features
- [x] `docs/SCENARIOS.md` — 30+ interaction scenarios including happy paths, edge cases, and error recovery
- [x] `docs/USER_GUIDE.md` — end-user friendly guide explaining philosophy, 5-phase loop, tips, and FAQ
- [x] `docs/QUICK_START.md` — 15-minute getting started guide with first-week checklist
- [x] `docs/README.md` — documentation directory index

---

## 🔜 REMAINING

### Phase 7 — Auth + Payments + AI Proxy

| Task | Priority | Notes |
|---|---|---|
| `loopkit auth` command | 🔴 High | [x] Login via browser OAuth, save token to config.json |
| Convex Auth setup in web | 🔴 High | [x] GitHub + email auth, session management (replaced Better Auth) |
| Polar.sh integration | 🔴 High | [x] Solo ($19) + Pro ($39) plans, webhook for tier updates |
| Tier gating in CLI | 🔴 High | [x] Free = no AI; Solo = AI on; Pro = BYOK + unlimited |
| AI proxy API routes | 🟡 Medium | [x] `/api/ai/init`, `/api/ai/ship`, etc. — users skip API key setup |
| Pulse hosted form | 🟡 Medium | [x] Next.js route: `/pulse/[projectId]` + embed widget |
| Convex schema + mutations | 🟡 Medium | [x] `pulseResponses`, `projects`, `loopLogs`, `subscriptions` tables |

---

### Phase 8 — Web Dashboard

| Task | Priority | Notes |
|---|---|---|
| Dashboard layout + auth guard | 🟡 Medium | [x] Sidebar, project switcher |
| Project overview page | 🟡 Medium | [x] Active project, shipping score trend, last loop |
| Pulse inbox page | 🟡 Medium | [x] Responses + clusters, tag-to-sprint |
| Loop history page | 🟡 Medium | [x] Week-over-week: shipped, decided, BIP posts, 4-week streak |
| Free tier read-only dashboard | 🟢 Low | [x] Read-only mode for free tier with upgrade CTA |

---

### Phase 9 — Remaining Polish

| Task | Priority | Notes |
|---|---|---|
| `loopkit auth` token refresh | 🟡 Medium | [x] Catch 401 and handle expired sessions gracefully |
| `loopkit track --project [name]` | 🟡 Medium | [x] Switch active project from CLI |
| Streak visualization in `loopkit loop` | 🟢 Low | [x] 4-week streak rate metric |
| PostHog analytics events | 🟢 Low | [x] Track command usage, upgrade triggers |
| Free vs paid tier gating | 🔴 High | [x] Implemented in Phase 7 with Polar.sh + Convex |

---

## Known Issues

| Issue | Severity | Status |
|---|---|---|
| No automated tests (zero coverage) | High | Test infra added (vitest). Actual tests planned — see §Testing |
| No AI streaming — users stare at spinner for 3-10s | High | ✅ Resolved — P1: `streamObject` with progress output |
| Auth token stored unencrypted in `config.json` | Medium | ✅ Resolved — S1: AES-256-GCM encryption with machine-derived key |
| "Fast" and "creative" tiers use same model | Medium | ✅ Resolved — P4: Haiku for fast, Sonnet for creative |
| Dashboard uses placeholder data, not live Convex | Medium | ✅ Resolved — D1: Overview, Pulse Inbox, and Loop History all use live `useQuery` |
| `config.json` parsed 2-3x per command invocation | Low | Planned — see §Performance P2 |
| Pulse `--share` missing — no easy way to deploy feedback form | Low | Planned — see §Friction F1 |
| No rate limiting enforcement on free tier AI calls | Medium | ✅ Resolved — S4: 10/day free, 100/day Solo, 1000/day Pro enforced server-side |
| Next.js Turbopack warns about workspace root | Info | Cosmetic — no functional impact |

---

## Metrics to Hit (from PRD §10)

| Metric | Target | Current |
|---|---|---|
| Break-even paid users | 10 | 0 (pre-launch) |
| `init` session completion | ≥ 70% | Unknown |
| `track` weekly active retention | ≥ 65% | Unknown |
| `ship` draft use rate | ≥ 50% | Unknown |
| `pulse` widget response rate | ≥ 8% | Blocked — no widget yet |
| `loop` Sunday run rate | ≥ 75% | Unknown |
| Month 3 paid users | 35 | 0 (pre-launch) |

---

## 📋 Post-v0.1 Improvement Plan

### Priority Legend
- 🔴 **P0** — Blocks launch quality
- 🟡 **P1** — High impact, ship within 2 weeks
- 🟢 **P2** — Nice to have, ship within 4 weeks
- 🔵 **P3** — Future roadmap

---

### Performance

| # | Task | Pri | Effort | Files |
|---|---|---|---|---|
| P1 | [x] **Stream AI responses token-by-token** — Replace `generateObject()` with `streamObject()` in `ai/client.ts`. Render tokens as they arrive via `process.stdout.write()` with spinner toggle. Target: perceived latency <1s to first token. | 🟡 P1 | M | `ai/client.ts`, all command files |
| P2 | **Merge config reads to single pass** — `getAnthropicClient()` and `getLoopKitToken()` both call `readConfig()`. Refactor to single `resolveAuth()` that returns `{ anthropic, token }` once. | 🟢 P2 | S | `ai/client.ts` |
| P3 | **Cache AI results** — Hash `(command, system, prompt, schema)` → store in `.loopkit/cache/`. Reuse on identical calls. Invalidate on schema version bump. | 🟢 P2 | M | `storage/cache.ts` (new) |
| P4 | [x] **Use Haiku for "fast" tier** — `getModelId("fast")` → `claude-3-5-haiku-latest`. Keep Sonnet for "creative". Reduces cost ~80% for simple scoring calls. | 🟡 P1 | S | `ai/client.ts:28-35` |
| P5 | **Optimize git hook** — Replace `execSync` for commit SHA with reading `.git/COMMIT_EDITMSG` directly. Target: hook execution <50ms. | 🟢 P2 | S | `commands/track.ts` |

---

### Friction Reduction

| # | Task | Pri | Effort | Files |
|---|---|---|---|---|
| F1 | [x] **`loopkit pulse --share`** — Generate and return a shareable feedback URL (`https://loopkit.dev/pulse/[projectId]`). Creates project in Convex if needed. Show QR code in terminal. | 🟡 P1 | M | `commands/pulse.ts` |
| F2 | [x] **`loopkit track --add` with `$EDITOR`** — When `--add` has no argument, open `$EDITOR` for multi-line task text. Same pattern as `ship [e]dit`. | 🟡 P1 | S | `commands/track.ts` |
| F3 | **Keyboard shortcuts** — `?` for help, `q` to quit, `s` to skip, `Enter` for default in Clack prompts. | 🟢 P2 | M | `ui/theme.ts` |
| F4 | **Better empty states** — When no tasks/projects/pulse data, show helpful next steps instead of blank screens. E.g., "No tasks yet. Run `loopkit track --add` to create your first task." | 🟢 P2 | S | All command files |
| F5 | **`loopkit init --template`** — `--template [saas\|api\|mobile\|cli]` pre-fills hints for each question. Reduces blank-page paralysis. | 🔵 P3 | M | `commands/init.ts`, `templates/` (new) |

---

### Dashboard — Live Data

| # | Task | Pri | Effort | Files |
|---|---|---|---|---|
| D1 | [x] **Replace placeholder data with live Convex queries** — Dashboard overview, pulse inbox, and loop history pages all wired to real `useQuery` calls. | 🟡 P1 | L | `web/src/app/dashboard/**/*.tsx` |
| D2 | **Real-time pulse inbox** — Use Convex subscriptions so new feedback appears without refresh. Show "New" badge with enter animation. | 🟡 P1 | M | `web/src/app/dashboard/pulse/page.tsx` |
| D3 | **Task management in dashboard** — CRUD tasks from web UI. Sync with local `tasks.md` via Convex. Add drag-to-reorder for priority. | 🔵 P3 | L | New files in `dashboard/` |
| D4 | **Dashboard mobile responsive** — Current dashboard is desktop-only. Add collapsible sidebar, stacked cards on mobile. | 🟢 P2 | M | All dashboard pages |

---

### Testing (zero current coverage → build from scratch)

| # | Task | Pri | Effort | Files |
|---|---|---|---|---|
| T0 | [x] **Add test runner** — Install `vitest` in CLI and shared packages. Add `"test": "vitest run"` scripts. | 🟡 P1 | S | `package.json` in cli + shared |
| T1 | **Schema validation tests** — Test all Zod schemas with valid/invalid data. Ensure `ConfigSchema.parse()` handles corruption gracefully. | 🟡 P1 | S | `shared/src/__tests__/` |
| T2 | **Prompt builder tests** — Verify prompt builders produce correct output shape given known inputs. Test edge cases (empty data, missing fields). | 🟡 P1 | M | `cli/src/ai/__tests__/` |
| T3 | **Storage I/O tests** — Test `readConfig/writeConfig`, `saveBrief`, `readTasksFile`, `appendToCut`, `readPulseResponses` with temp dirs. | 🟡 P1 | M | `cli/src/storage/__tests__/` |
| T4 | **Command integration tests** — Test full command flows with mocked AI. Verify file outputs, exit codes, error handling, Ctrl+C behavior. | 🟢 P2 | L | `cli/src/commands/__tests__/` |

---

### Security Hardening

| # | Task | Pri | Effort | Files |
|---|---|---|---|---|
| S1 | [x] **Encrypt auth token at rest** — Uses `node:crypto` AES-256-GCM with machine-derived key (`scryptSync` of hostname + username + salt). Backward-compatible with plaintext legacy tokens. | 🟡 P1 | M | `storage/local.ts` |
| S2 | **Input sanitization on pulse form** — Strip HTML tags, enforce 500-char limit server-side, add IP-based rate limiting (3 req/min) on public form route. | 🟡 P1 | S | `web/src/app/pulse/*`, `web/app/api/pulse/*` |
| S3 | **CSRF protection on API routes** — Add `Origin` / `Referer` header check to AI proxy and auth routes. | 🟢 P2 | S | `web/src/app/api/**/route.ts` |
| S4 | [x] **Rate limiting for free tier** — Enforces max 10 AI calls/day on free tier, 100/day on Solo, 1000/day on Pro. Server-side enforcement in Convex via `aiUsage` table. All AI proxy routes check limits before calling AI and return 429 when exceeded. | 🟡 P1 | M | `convex/rateLimits.ts` (new), AI proxy routes |

---

### Wow Features — Delight Users

| # | Task | Pri | Effort | Notes |
|---|---|---|---|---|
| W1 | **`loopkit celebrate`** — After shipping, ASCII confetti animation + "You shipped! 🚀" card with shipping score, streak count, and a shareable text card. Triggered automatically after `ship` completes. | 🟢 P2 | S | `commands/celebrate.ts` (new) |
| W2 | **"Unstuck me" mode** — `loopkit loop` detects 0 tasks completed this week → offers "Want me to suggest 3 micro-tasks?" → AI generates tiny actionable tasks from brief context. | 🟢 P2 | M | `commands/loop.ts` |
| W3 | **Weekly email digest** — Cron job sends Sunday summary: tasks done, shipping score, streak, BIP post, next week recommendation. | 🔵 P3 | L | `convex/crons.ts` (new), email integration |
| W4 | **Public ship log page** — `loopkit ship --public` uploads to Convex and returns shareable URL (`loopkit.dev/@username/ships`). Timeline view of shipping history. | 🔵 P3 | L | `commands/ship.ts`, new web route |
| W5 | **GitHub Issues sync** — `loopkit track --sync` pulls open issues as tasks, pushes completed tasks as closed issues. Two-way sync with ID mapping table. | 🔵 P3 | L | `commands/track.ts`, `sync/` module (new) |
| W6 | **Project templates** — `loopkit init --template saas` pre-fills ICP/problem/MVP hints. Built-in: SaaS, Mobile App, API, CLI Tool, Newsletter, Agency. | 🔵 P3 | M | `commands/init.ts`, `templates/` (new) |

---

### Execution Order (4-week sprint)

```
Week 1: T0 + P1 + P4 + F2  ✅ DONE
  → Test infra, AI streaming, Haiku tier, $EDITOR for track

Week 2: F1 + D1 + S1 + S4  ✅ DONE
  → Pulse --share, live dashboard, encrypted auth, rate limiting

Week 3: T1 + T2 + T3 + S2 + D2
  → Schema/prompt/storage tests, input sanitization, real-time pulse

Week 4: W1 + W2 + P2 + F3 + D4
  → Celebrate, unstuck mode, config merge, keyboard shortcuts, mobile

Week 5+: P3 + W3-W6 + D3 + F5 + P5 + F4
  → Caching, weekly digest, GitHub sync, templates, empty states
```

---

### Definition of Done (per task)

- [ ] `pnpm --filter @loopkit/cli build` → 0 errors
- [ ] Web changed? → `cd packages/web && npx next build` → clean
- [ ] New AI paths: `generateStructured()` still works for both auth paths (Anthropic direct + proxy)
- [ ] Ctrl+C exits gracefully at every prompt
- [ ] New tests pass: `pnpm --filter @loopkit/cli test`
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
