# LoopKit v0.2.0 Implementation Plan

Strategic priority: **retention first, features second.**

**Phases:**
- Phase 0: Pre-Flight (Day 1)
- Phase 1: Cut Scope & Sharpen the Core (Week 1)
- Phase 2: Refactor the God File (Week 2)
- Phase 3: Make Sync Honest & Bidirectional (Week 3-4)
- Phase 4: The Holy Sh*t Features (Week 5-6)
- Phase 5: Public Wins & Acquisition (Week 7)
- Phase 6: Polish, Test, and Performance (Week 8)

---

## Phase 0: Pre-Flight (Day 1, 2-3 hours)

**Goal:** Lock the plan, baseline current state.

| Task | Files | Output |
|---|---|---|
| Tag current state as `v0.1.0-pre-overhaul` | git | Safety net |
| Capture test count, bundle size, p50 latency | `pnpm test`, `du` | Baseline metrics |

```bash
pnpm test 2>&1 | tail -3
du -sh packages/cli/dist
git tag v0.1.0-pre-overhaul
```

---

## Phase 1: Cut Scope & Sharpen the Core (Week 1)

**Goal:** Stop feature bloat. Make the 5-command loop the obvious product.

### 1.1 Labs Flag for Intelligence Commands (S)
**Files:** `packages/cli/src/index.ts`, `commands/{radar,keywords,timing}.ts`

```typescript
// In each secondary command, add at the top:
if (!process.env.LOOPKIT_LABS && !config.labsEnabled) {
  clog.warn(`${cmd} is in labs. Set LOOPKIT_LABS=1 or run \`loopkit labs on\`.`);
  return;
}
```

- Add `loopkit labs [on|off]` to `commands/aliases.ts` (rename) or new `commands/labs.ts`
- Update `index.ts` help to show "(labs)" tag on 3 commands
- Update landing page (`packages/web/src/app/page.tsx`) to remove radar/keywords/timing from primary narrative
- **Tests:** 4 (labs flag on/off, env var, command dispatch)

### 1.2 Defer `update` (Investor Updates) (S)
- Move `commands/update.ts` content into `commands/labs-update.ts`
- Keep file but mark as deprecated in `--help`
- Move `update` AI client to opt-in
- **Tests:** 2 (command still loads, default exits with labs message)

### 1.3 Documentation Pruning (S)
- **Files:** `README.md`, `docs/QUICK_START.md`, `packages/web/src/app/page.tsx`
- Remove radar/keywords/timing from quickstart
- Reorder: 5 core commands first, then 5 secondaries, then labs
- Add "Why we cut features" section to `docs/MOAT.md`
- **Tests:** N/A (docs only)

**Definition of Done (Phase 1):**
- [ ] `loopkit help` shows 15 commands; 3 marked "(labs)"
- [ ] `LOOPKIT_LABS=0 loopkit radar` shows warning and exits 0
- [ ] Landing page hero shows only `init → track → ship → pulse → loop`
- [ ] All 369 tests still pass
- [ ] Commit: `chore: gate intelligence commands behind labs flag`

---

## Phase 2: Refactor the God File (Week 2)

**Goal:** Make `loop.ts` maintainable. 1,074 lines → 6 modules of ~150 lines each.

### 2.1 Extract Loop Pipeline Modules (L)
**New files:** `packages/cli/src/commands/loop/`

```
loop/
├── index.ts          (40 lines — public entry)
├── context.ts        (100 lines — gather data, no I/O beyond reads)
├── telemetry.ts      (60 lines — telemetry consent + event recording)
├── autoLoop.ts       (80 lines — missed Sunday detection)
├── unstuck.ts        (100 lines — micro-task generation)
├── synthesis.ts      (180 lines — AI call + fallback)
├── score.ts          (already exists, import from analytics)
├── postActions.ts    (200 lines — accept/change/skip, BIP, proof card)
├── pipeline.ts       (300 lines — orchestrator)
└── render.ts         (200 lines — display helpers)
```

**Migration strategy:**
1. Create `loop/` directory with empty files
2. Move functions one at a time, keeping `loop/index.ts` as a facade
3. Each move: compile + test
4. Final: delete `commands/loop.ts`

**Tests to add:**
- `loop/__tests__/context.test.ts` — 8 tests
- `loop/__tests__/synthesis.test.ts` — 6 tests (with mock AI)
- `loop/__tests__/pipeline.test.ts` — 12 tests (orchestration order)

### 2.2 Replace Regex Parsing with YAML Frontmatter (M)
**Files:** `packages/cli/src/analytics/{score,dna,churn,predictor,patterns}.ts`, `commands/loop/saveLoopLog.ts`

**Current problem:** 5+ analytics files regex-parse loop logs like `/Shipping score:\s*(\d+)%/i`. Silent breakage if format changes.

**Solution:** Embed YAML frontmatter in `.loopkit/logs/week-N.md`:

```markdown
---
week: 23
date: 2026-06-12
project: proposalai
tasksCompleted: 4
tasksTotal: 5
shippingScore: 80
loopkitScore: 74
streak: 6
override: false
tension: null
---

# Week 23 — 2026-06-12

## What Moved Forward
...
```

**Implementation:**
1. Add `parseLoopLogFrontmatter(content: string): LoopLogFrontmatter` in `storage/local.ts`
2. Update `saveLoopLog` in loop to write frontmatter
3. Migrate all 5 analytics modules to use parser
4. Keep regex as fallback for backward compat with old logs
5. **Tests:** 15 (frontmatter parser: valid, invalid, missing, partial)

### 2.3 Remove Dynamic Imports (XS)
**Files:** `commands/loop.ts` (3 locations: lines 337, 563, 750), `commands/track.ts` (line 54)

Replace `await import("../storage/local.js")` with static imports at top.

**Tests:** Verify no behavior change.

**Definition of Done (Phase 2):**
- [ ] `loop.ts` no longer exists; replaced by `loop/` directory
- [ ] `pnpm test` shows 410+ tests (added ~45)
- [ ] `pnpm --filter @loopkit/cli build` → 0 errors
- [ ] Manual: `loopkit loop` runs end-to-end with same UX
- [ ] Loop logs written today can be parsed by both regex and frontmatter
- [ ] Commit: `refactor: split loop.ts into pipeline modules + frontmatter`

---

## Phase 3: Make Sync Honest & Bidirectional (Week 3-4)

**Goal:** Dashboard isn't a ghost town. Users edit tasks from anywhere.

### 3.1 Surface Sync Failures (S)
**Files:** `packages/cli/src/storage/sync.ts:51-72`, `commands/loop.ts`, `commands/ship.ts`

**Current:** `console.debug` on failure. Free-tier users never see dashboard data.

**Fix:**
```typescript
// Add to ConfigSchema
syncStatus: z.object({
  lastAttempt: z.string().optional(),
  lastSuccess: z.string().optional(),
  failureCount: z.number().default(0),
  lastError: z.string().optional(),
}).optional(),

// In postSync:
if (!res.ok) {
  const config = readConfig();
  config.syncStatus = {
    ...config.syncStatus,
    lastAttempt: new Date().toISOString(),
    failureCount: (config.syncStatus?.failureCount || 0) + 1,
    lastError: `HTTP ${res.status}`,
  };
  writeConfig(config);
}

// Add new command:
loopkit sync status   // show last sync state
loopkit sync retry    // re-push failed payloads
```

- Show banner in `loopkit track` if `failureCount > 3`: "Your dashboard isn't syncing. Run `loopkit sync status`."
- **Tests:** 8 (status command, retry logic, banner trigger)

### 3.2 Two-Way Task Sync (L)
**New files:** `packages/cli/src/sync/tasks.ts`, `packages/cli/src/sync/conflict.ts`

**Architecture:**
```
CLI tasks.md  ←→  Convex tasks table
                ↑↓
         Last-write-wins with timestamp
         + ID mapping table (task.id ↔ convex._id)
```

**Schema additions in `packages/web/convex/schema.ts`:**
```typescript
tasks: defineTable({
  projectId: v.id("projects"),
  cliTaskId: v.number(),          // matches local [1], [2], etc.
  title: v.string(),
  status: v.union(v.literal("open"), v.literal("done"), v.literal("snoozed"), v.literal("cut")),
  section: v.union(v.literal("week"), v.literal("backlog")),
  createdAt: v.string(),
  closedAt: v.string().optional(),
  closedVia: v.string().optional(),
  updatedAt: v.string(),          // ISO timestamp
  lastModifiedBy: v.union(v.literal("cli"), v.literal("web")),
})
  .index("by_project", ["projectId"])
  .index("by_cli_id", ["projectId", "cliTaskId"]),
```

**CLI side:** `commands/track.ts`
```typescript
// On every track command:
const localTasks = parseTasksFile();
const remoteTasks = await fetchRemoteTasks(projectId);
const merged = mergeTasks(localTasks, remoteTasks);  // LWW per task
writeTasksFile(slug, renderTasks(merged));
pushTaskChanges(projectId, merged);
```

**Conflict resolution (`sync/conflict.ts`):**
```typescript
function resolveConflict(local: Task, remote: Task): Task {
  // Same status, same title → keep
  // Different status → newer wins (compare updatedAt)
  // Different title → newer wins, log warning
  // Both modified since last sync → keep newer, surface "conflict" banner
}
```

**Tests:** 25 (CRUD, conflict resolution, ID mapping, network failure)

### 3.3 Dashboard Task CRUD UI (L)
**New files:** `packages/web/src/app/dashboard/tasks/page.tsx`, `packages/web/src/components/TaskRow.tsx`, `packages/web/src/components/TaskEditor.tsx`

**Convex functions:**
- `tasks.listByProject(projectId)` — paginated, indexed
- `tasks.update({id, patch})` — auth-checked
- `tasks.create({projectId, title, section})` — auth-checked
- `tasks.delete({id})` — auth-checked
- `tasks.markDone({id, commitSha?})` — for git hook integration

**UI:** Reuse `<Card>`, `<Button>`, `<Checkbox>` from shadcn. Drag-to-reorder via `@dnd-kit/core`. Real-time via `useQuery` subscription.

**Tests:** 12 (component, mutation, auth check, optimistic update)

**Definition of Done (Phase 3):**
- [ ] `loopkit track` shows banner if sync failing
- [ ] `loopkit sync status` works
- [ ] Edit task in dashboard → next `loopkit track` shows updated state
- [ ] Edit task in CLI → dashboard live-updates
- [ ] 60+ new tests; total ~485
- [ ] Commit: `feat: bidirectional task sync + dashboard CRUD`

---

## Phase 4: The Holy Sh*t Features (Week 5-6)

**Goal:** Ship the wow features that make founders screenshot LoopKit.

### 4.1 `loopkit audit` — The Founder Therapy Command (L)
**New files:** `packages/cli/src/commands/audit.ts`, `packages/cli/src/analytics/audit.ts`, `packages/cli/src/ai/prompts/audit.ts`

**What it does:** Reads last 8 weeks of loop logs, ships, and tasks. Generates a 2-page structured report.

```typescript
// analytics/audit.ts
export interface AuditReport {
  periodWeeks: number;
  shippedHours: number;          // estimated from completed tasks
  velocityTrend: 'accelerating' | 'steady' | 'declining' | 'volatile';
  patternEvolution: Array<{
    week: number;
    dominantTaskType: string;     // 'distribution' | 'product' | 'admin'
  }>;
  overrideRate: number;
  feedbackActedOnRate: number;
  biggestInsight: string;          // AI-generated
  topAvoidancePattern: string;     // AI-generated, e.g. "you skip distribution tasks"
  oneChangeForNextMonth: string;   // AI-generated, single concrete action
  comparedToCohort: {              // anonymized peer comparison
    shippingScore: { you: number; cohort: number };
    streak: { you: number; cohort: number };
  };
}
```

**Prompt strategy:** Single AI call, structured output. Few-shot examples in `prompts/audit.ts` to get the right tone (blunt, specific, not motivational).

**UI:** Render as a printable report. Option to export as PDF (`pdfkit`) and as Markdown.

**Tests:** 15 (data gathering, AI call, rendering, PDF export)

### 4.2 Pricing Copilot `loopkit price` (M)
**New files:** `packages/cli/src/commands/price.ts`, `packages/cli/src/ai/prompts/price.ts`

**What it does:** Given your brief + recent ships + feedback, suggest 3 pricing tiers.

**Output schema:**
```typescript
{
  recommendation: {
    model: 'freemium' | 'one-time' | 'subscription' | 'usage-based',
    rationale: string,
  },
  tiers: Array<{
    name: 'Free' | 'Pro' | 'Team',
    price: number,
    cadence: 'monthly' | 'annual' | 'one-time',
    features: string[],
    targetCustomer: string,
  }>,
  validationExperiment: string,   // "Charge 5 customers $X, time-bound, measure conversion"
  risksToTest: string[],
}
```

**UI:** Render tier comparison table with CTA "Run experiment: `loopkit price --experiment 30`" which adds a 30-day reminder to track conversion.

**Tests:** 10

### 4.3 Email Digest (W3) (M)
**New files:** `packages/web/convex/crons.ts`, `packages/web/convex/email.ts`, `packages/web/src/lib/email.tsx` (Resend)

**Cron:** Every Sunday 9am user TZ.

**Email content:**
- Subject: "Week 23: 4/5 shipped. Score 80. Streak 🔥 6."
- Body: tasks done, score, streak, BIP preview, "→ [Open dashboard]"
- Footer: Unsubscribe link, preferences link

**Convex cron:**
```typescript
// convex/crons.ts
crons.weekly(
  "send-sunday-digest",
  { dayOfWeek: "sunday", hourUTC: 13, minuteUTC: 0 },  // 9am ET
  api.email.sendWeeklyDigest
);
```

**Tests:** 8 (cron trigger, email render, unsubscribe, bounce handling)

### 4.4 Voice → Task (M)
**New files:** `packages/cli/src/commands/track-voice.ts`, `packages/cli/src/voice/transcribe.ts`

**Provider options:**
- OpenAI Whisper API (paid, accurate)
- `whisper.cpp` local (free, slower)
- macOS SFSpeechRecognizer (free, on-device)

**Default:** OpenAI if `OPENAI_API_KEY` set; else SFSpeechRecognizer on macOS; else "voice not available, use --add".

**Flow:**
```bash
$ lk track --voice
🎙️  Recording... (max 60s)
[user speaks: "Shipped the auth flow, fixed a bug in the parser, started on the dashboard"]
🔇 Stopped. Transcribing...

→ Transcribed 14s. Extracting tasks:
  1. [done] Shipped the auth flow
  2. [done] Fixed a bug in the parser
  3. [open] Started on the dashboard

✓ Added to tasks.md. Run `lk track` to confirm.
```

**Tests:** 10 (transcription wrapper, task extraction, fallback)

**Definition of Done (Phase 4):**
- [ ] `loopkit audit` generates 2-page report, exports to PDF/MD
- [ ] `loopkit price` returns 3 pricing tiers with rationale
- [ ] Sunday email digest reaches inbox by 9am user TZ
- [ ] `loopkit track --voice` works on macOS without OpenAI key
- [ ] 60+ new tests; total ~545
- [ ] Commits per feature: `feat(audit)`, `feat(price)`, `feat(email-digest)`, `feat(voice)`

---

## Phase 5: Public Wins & Acquisition (Week 7)

**Goal:** Turn shipped work into distribution.

### 5.1 Public `/wins` Feed as Homepage Hero (M)
**New files:** `packages/web/src/app/wins/page.tsx`, `packages/web/src/app/wins/[username]/page.tsx`, `packages/web/convex/wins.ts`

**Convex:**
- `wins.list({limit, cursor})` — paginated, indexed by `createdAt desc`
- `wins.byUsername({username})` — for profile pages

**UI:** Real-time feed of recent `loopkit ship --share` posts. Each card shows: founder handle, week, score, what shipped. Click → founder's full year.

**SEO:** `generateMetadata` per profile page, OG tags for sharing.

**Tests:** 12 (queries, pagination, real-time updates, SEO)

### 5.2 Annual Streak Card (M)
**New files:** `packages/web/src/app/wins/[username]/[year]/route.tsx` (PNG generation), `packages/cli/src/commands/celebrate.ts` (add `--annual`)

**Tech:** `@vercel/og` (Satori-based) for PNG generation. Or `puppeteer` for more control.

**Output:** Single 1200×630 PNG with:
- Year + handle
- 52 weekly scores as a heatmap
- Archetype + biggest shipping moment
- LoopKit logo, "Made with LoopKit"

**Trigger:** `loopkit celebrate --annual 2026` or auto-suggested on Dec 31.

**Tests:** 6 (PNG generation, data aggregation, share intent)

### 5.3 Onboarding Flow Rewrite (M)
**New files:** `packages/web/src/app/onboarding/page.tsx`, `packages/web/src/components/OnboardingStep.tsx`

**Current:** Doc-driven. User lands on docs, hopes to figure it out.

**New:** 5-step interactive flow on `loopkit.dev`:
1. "What are you building?" (one input)
2. "Why does it matter?" (textarea)
3. "How will you know in 4 weeks?" (3 options: revenue / users / shipped)
4. "Install the CLI" (copy-paste + verify)
5. "Your first task" (auto-generated based on step 1-3)

**Why this matters:** `init` takes 5 minutes. The web onboarding primes them so the CLI feels like continuation, not a wall.

**Tests:** 10 (step transitions, state persistence, deep link to CLI)

**Definition of Done (Phase 5):**
- [ ] `loopkit.dev/wins` is the homepage hero
- [ ] `loopkit celebrate --annual 2026` generates a sharable PNG
- [ ] `/onboarding` is 5 steps, 4 minutes total
- [ ] 30+ new tests; total ~575
- [ ] Commits: `feat(wins)`, `feat(annual-card)`, `feat(onboarding)`

---

## Phase 6: Polish, Test, and Performance (Week 8)

**Goal:** Ship-quality release. v0.2.0.

### 6.1 Performance Audit (M)
**Files:** `packages/cli/src/**`, `packages/web/src/app/dashboard/**`

**Targets:**
- CLI cold start: < 200ms (currently ~150ms, baseline)
- `loopkit track` warm: < 300ms
- Dashboard p50: < 800ms
- Dashboard p95: < 2s

**Actions:**
- Lazy-load secondary commands in CLI
- Add Convex query indexes for `loopLogs.byProjectDate` (already done in PERF-2)
- Add `unstable_cache` to dashboard trends query
- Optimize `readTasksFile` for large tasks.md (>200 tasks)

**Tests:** Add benchmark script in `packages/cli/__bench__/`

### 6.2 Test Coverage Push (M)
**Current:** 369 tests. **Target:** 600+.

**Gaps to fill:**
- `commands/{init,ship,pulse,revenue}.ts` — 0 tests each
- `ui/{ceremony,layout,prompts}.ts` — partial
- `analytics/{peers,autoLoop,benchmarks}.ts` — partial
- Convex functions — 37 tests, need 60+

**New tests:** 230+ covering the 5 core commands end-to-end with mocked AI.

### 6.3 Remove Hardcoded Mock Counts (XS)
**Files:** `commands/loop/index.ts` (milestones section)

Replace:
- "70% of founders quit by week 2" → real aggregated number from opt-in telemetry
- "47 other founders ran loopkit loop yesterday" → real count or remove
- "Multiple warning signs detected" — keep, this is fine

**Test:** N/A (copy change + telemetry query)

### 6.4 Documentation Pass (S)
**Files:** `README.md`, `docs/USER_GUIDE.md`, `docs/QUICK_START.md`, `packages/web/src/app/page.tsx`

- Update quickstart to 4 commands (no labs)
- Add GIF demo of `init` to landing
- Update persona docs to reflect "10 features, not 30"
- Add "Why we removed X" section explaining cuts

### 6.5 Security Hardening Sweep (S)
- [ ] Audit all `useQuery` calls in web for missing auth checks
- [ ] Add CSP headers in `next.config.mjs`
- [ ] Rate limit `loopkit audit` (expensive AI call)
- [ ] Verify Polar.sh webhook signature validation
- [ ] Pen-test the `/api/sync/*` routes for IDOR

**Tests:** 8 (auth bypass attempts, rate limit, CSP)

**Definition of Done (Phase 6):**
- [ ] v0.2.0 release notes written
- [ ] 600+ tests passing
- [ ] Bundle size: CLI < 60KB, web < 300KB JS gzipped
- [ ] Lighthouse score: 95+ on landing, 90+ on dashboard
- [ ] Security audit checklist signed off
- [ ] Commit: `chore: v0.2.0 release prep`

---

## Resource & Risk Plan

### Team Sizing
- 1 senior eng (you) full-time, 8 weeks
- 1 designer 50% for Phase 4-5 UI
- 1 part-time QA for Phase 6 test push

### Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Two-way sync conflict logic breaks users' tasks | Medium | High | Feature flag, gradual rollout, easy rollback |
| Email digest triggers spam complaints | Low | High | Resend reputation monitoring, easy unsubscribe |
| Voice transcription eats API budget | Medium | Medium | Default to local SFSpeechRecognizer, paid opt-in only |
| PDF generation in `audit` is slow | Medium | Low | Pre-compute in background, cache for 24h |
| Public `/wins` exposes sensitive info | Low | Medium | Default opt-out, per-post visibility settings |

### Rollback Strategy
- Each phase ends with a tagged release (`v0.1.1`, `v0.1.2`, ...)
- Feature flags in `config.json` for: `auditEnabled`, `priceEnabled`, `emailDigestEnabled`, `voiceEnabled`, `publicWinsEnabled`
- Convex mutations are versioned; old clients keep working

### Success Metrics (End of Week 8)
- [ ] 50 founders using for 4+ consecutive weeks
- [ ] ≥ 65% weekly retention on `loopkit loop`
- [ ] 8+ founders share their annual card publicly
- [ ] 0 P0 bugs in production
- [ ] 600+ tests, all green
- [ ] LCP < 1.5s on dashboard

---

## Execution Order Summary

```
Week 1 ── Phase 1 ── Cut scope, gate labs
Week 2 ── Phase 2 ── Refactor loop.ts, frontmatter
Week 3-4 ─ Phase 3 ── Bidirectional sync + dashboard CRUD
Week 5-6 ─ Phase 4 ── audit, price, email digest, voice
Week 7 ── Phase 5 ── /wins feed, annual card, onboarding
Week 8 ── Phase 6 ── Perf, test push, polish, v0.2.0
```

**Total estimated code changes:**
- ~3,500 lines added
- ~1,800 lines refactored (loop.ts split, regex → frontmatter)
- ~250 new tests
- 8 weeks calendar time
