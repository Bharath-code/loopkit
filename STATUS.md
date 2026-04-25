# LoopKit — Build Status

**Last updated:** April 25, 2026  
**Version:** 0.1.0  
**Overall:** MVP CLI complete · Landing page live · Phase 9 polish done · Auth & Dashboard built · Payments pending

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
- [ ] Free vs paid tier gating (scores shown, notes hidden for free)

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
- [ ] `loopkit track --project [name]` for switching active project

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
- [x] Hosted feedback form URL (web route in Next.js) (Convex integration started)
- [x] Convex write for realtime response collection
- [ ] JS embed widget (Shadow DOM isolated)
- [ ] localStorage retry queue for offline submissions

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

---

## 🔜 REMAINING

### Phase 7 — Auth + Payments + AI Proxy

| Task | Priority | Notes |
|---|---|---|
| `loopkit auth` command | 🔴 High | [x] Login via browser OAuth, save token to config.json |
| Convex Auth setup in web | 🔴 High | [x] GitHub + email auth, session management (replaced Better Auth) |
| Polar.sh integration | 🔴 High | [ ] Solo ($19) + Pro ($39) plans, webhook for tier updates |
| Tier gating in CLI | 🔴 High | [ ] Free = no AI; Solo = AI on; Pro = BYOK + unlimited |
| AI proxy API routes | 🟡 Medium | [ ] `/api/ai/init`, `/api/ai/ship`, etc. — users skip API key setup |
| Pulse hosted form | 🟡 Medium | [ ] Next.js route: `/pulse/[projectId]` — submit → Convex |
| Convex schema + mutations | 🟡 Medium | [x] `pulseResponses`, `projects`, `loopLogs` tables |

---

### Phase 8 — Web Dashboard

| Task | Priority | Notes |
|---|---|---|
| Dashboard layout + auth guard | 🟡 Medium | [x] Sidebar, project switcher |
| Project overview page | 🟡 Medium | [x] Active project, shipping score trend, last loop |
| Pulse inbox page | 🟡 Medium | [x] Responses + clusters, tag-to-sprint |
| Loop history page | 🟡 Medium | [x] Week-over-week: shipped, decided, BIP posts, 4-week streak |
| Free tier read-only dashboard | 🟢 Low | [ ] 1 project, no export — conversion trigger |

---

### Phase 9 — Remaining Polish

| Task | Priority | Notes |
|---|---|---|
| `loopkit auth` token refresh | 🟡 Medium | Handle expired sessions gracefully |
| `loopkit track --project [name]` | 🟡 Medium | Switch active project from CLI |
| Streak visualization in `loopkit loop` | 🟢 Low | 4-week streak rate metric |
| PostHog analytics events | 🟢 Low | Track command usage, upgrade triggers |
| Free vs paid tier gating | 🔴 High | Implement in Phase 7 with Better Auth |

---

## Known Issues

| Issue | Severity | Status |
|---|---|---|
| No automated tests | Medium | Manual testing only for now |
| Pulse V1 requires manual entry or `--add` flag | Low | Hosted form in Phase 7 |
| Free vs paid tier gating not enforced | High | Implement in Phase 7 with Convex Auth / Polar.sh |
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
