# CLAUDE.md — LoopKit Codebase Guide

This file tells Claude how to work effectively in the LoopKit codebase.
Read this before touching any code.

---

## Keep in mind
1. think before coding.
2. simplicity first.
3. don't use any heavy libraries.
4. follow the codebase strcuture exactly.
5. simple and clean code.
6. never use any paid service unless user explicitely wants.
7. surgical edits only.
8. goal-driven targets before starting any task.
9. test your code before writing. I mean TDD.
10. don't repeat yourself.
11. Always run tsc --noEmit before running any command.
12. Always run pnpm lint before running any command.
13. Always run pnpm format before running any command. 


## What This Product Is

LoopKit is **the CLI for solo technical founders shipping weekly**.
Five primary commands close the weekly loop: Define → Develop → Deliver → Feedback → Iterate.
Secondary intelligence commands support the loop but should not become the center of gravity.

```
loopkit init    → scored product brief + uncomfortable truth (AI)
loopkit track   → task management synced to git commits
loopkit ship    → launch post generator (HN, Twitter, IH)
loopkit pulse   → async feedback clustering (AI)
loopkit loop    → proof loop + weekly synthesis + BIP post (AI)
```

The PRD is the source of truth: `prd.md` in the root.

---

## Monorepo Structure

```
loopkit/
├── packages/
│   ├── cli/          # loopkit (npm) — the npm-published CLI
│   ├── shared/       # @loopkit/shared — Zod schemas + types
│   └── web/          # @loopkit/web — Next.js 16 landing + dashboard
├── turbo.json
├── pnpm-workspace.yaml
└── prd.md
```

**Key rule:** `@loopkit/shared` is the single source of truth for all data shapes.
Never define a type in `cli` or `web` that belongs in `shared`.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| CLI runtime | Node.js 22+ | NOT Bun runtime (Bun used for toolchain only) |
| CLI prompts | `@clack/prompts` | Not Inquirer, not Ink |
| CLI framework | `commander` | For command routing |
| AI SDK | Vercel AI SDK (`ai`) | `generateObject()` for all structured output |
| AI provider | `@ai-sdk/anthropic` | Claude models |
| Schemas | `zod` | All AI output shapes validated here |
| Web | Next.js 16 App Router | Tailwind CSS v4 |
| Styling | Tailwind CSS v4 | Dark theme, violet/cyan/emerald palette |
| Database | Convex | Pulse responses + cloud sync (Phase 7) |
| Auth | Convex Auth | Replaced Better Auth (Phase 7) |
| Payments | Polar.sh | Phase 7 |

---

## CLI Package (`packages/cli/src/`)

### Directories

```
src/
├── index.ts              # Entry — Commander routes primary loop + secondary add-ons
├── commands/
│   ├── init.ts           # loopkit init
│   ├── track.ts          # loopkit track
│   ├── ship.ts           # loopkit ship
│   ├── pulse.ts          # loopkit pulse
│   ├── loop.ts           # loopkit loop
│   ├── auth.ts           # loopkit auth
│   ├── celebrate.ts      # loopkit celebrate
│   ├── telemetry.ts      # loopkit telemetry
│   ├── radar.ts          # loopkit radar
│   ├── keywords.ts       # loopkit keywords
│   ├── timing.ts         # loopkit timing
│   └── coach.ts          # loopkit coach
├── analytics/
│   ├── telemetry.ts      # Opt-in usage collection (on/off/export/delete)
│   ├── dna.ts            # Shipping DNA profile (founder pattern detection)
│   ├── benchmarks.ts     # Smart percentile rankings vs baseline
│   ├── oracle.ts         # Snooze completion probability oracle
│   ├── churn.ts          # Churn Guardian: declining score, skipped loops, override rate
│   ├── autoLoop.ts       # Auto-Loop: missed Sunday detection + auto-draft
│   └── predictor.ts      # Success Predictor: revenue probability heuristic
├── ai/
│   ├── client.ts         # generateStructured() wrapper (resolveAuth + cache)
│   └── prompts/
│       ├── init.ts       # System prompt + few-shot examples
│       ├── ship.ts       # Launch copy system prompt
│       ├── pulse.ts      # Clustering system prompt
│       ├── loop.ts       # Weekly synthesis system prompt
│       └── unstuck.ts    # Micro-task generation prompt
├── storage/
│   ├── local.ts          # All .loopkit/ file operations
│   ├── sync.ts           # CLI → Convex sync for loop/ship/radar/timing
│   └── cache.ts          # AI result cache (hash-based, 7-day TTL)
└── ui/
    └── theme.ts           # Colors, scoreBar, box, header helpers
```

### Critical: Local Storage Layout

```
.loopkit/                        ← created in user's project root
├── config.json                  ← ConfigSchema (activeProject, auth, prefs, telemetry)
├── projects/
│   └── [slug]/
│       ├── brief.md             ← human-readable markdown
│       ├── brief.json           ← { answers, brief, createdAt }
│       ├── draft.json           ← partial answers for session resume
│       ├── tasks.md             ← plain markdown checkboxes
│       └── cut.md               ← archived cut tasks (append-only)
├── ships/
│   └── YYYY-MM-DD.md            ← ship log
├── logs/
│   └── week-N.md                ← loop log
├── cache/
│   └── <hash>.json              ← cached AI results (7-day TTL)
├── telemetry/
│   └── week-N.json              ← anonymous event records (opt-in only)
└── pulse/
    └── responses.json           ← local feedback array (V1)
```

### Key Storage Helpers (`storage/local.ts`)

| Function | Purpose |
|---|---|
| `getRoot()` | Returns `.loopkit/` path |
| `readConfig()` / `writeConfig()` | Config CRUD |
| `readBriefJson(slug)` | Reads `brief.json` for a project |
| `readTasksFile(slug)` / `writeTasksFile(slug, content)` | tasks.md CRUD |
| `appendToCut(slug, line, date)` | Archives a cut task line to `cut.md` |
| `readPulseResponses()` | Reads `.loopkit/pulse/responses.json` |
| `appendPulseResponse(text)` | Appends a single response and saves |
| `saveShipLog(content, date)` | Writes ship log |
| `saveLoopLog(weekNum, content)` | Writes loop log |
| `readLastNLoopLogs(n)` | Returns last N loop logs with override status |
| `getConsecutiveWeeksStreak(weekNum)` | Counts unbroken loop log streak |

### Analytics Helpers (`analytics/`)

| Module | Purpose |
|---|---|
| `telemetry.ts` | `startTelemetryPrompt()`, `recordEvent()`, `isTelemetryEnabled()`, `telemetryCommand()` |
| `dna.ts` | `computeShippingDNA()` — founder pattern, velocity, strengths, risks |
| `benchmarks.ts` | `computeBenchmarks()`, `renderBenchmarks()` — percentile rankings |
| `oracle.ts` | `getSnoozeWarning()` — historical snooze completion stats |
| `churn.ts` | `detectChurnRisk()`, `renderChurnWarning()` — declining score, skipped loops, overrides |
| `autoLoop.ts` | `checkMissedSunday()`, `saveAutoLoopDraft()` — Monday auto-draft generation |
| `predictor.ts` | `predictSuccess()`, `renderPrediction()` — 8-week revenue probability heuristic |
| `cache.ts` | `getCachedResult()`, `setCachedResult()` — hash-based AI result reuse, 7-day TTL |

### AI Usage Pattern

Always use `generateStructured()` from `ai/client.ts`:

```typescript
const result = await generateStructured({
  system: SYSTEM_PROMPT,
  prompt: buildPrompt(data),
  schema: ZodSchema,        // from @loopkit/shared
  tier: "fast",             // "fast" | "creative"
  temperature: 0.3,         // 0.3 for structured, 0.6 for creative
});
```

`generateStructured()` automatically:
1. Resolves auth via `resolveAuth()` (single config read)
2. Checks the cache for identical inputs (hash-based, 7-day TTL)
3. Calls AI or proxy as needed
4. Caches the result before returning

Never call `generateText()` directly — always use structured output with Zod.

### Error Handling Rules (from PRD)

- **Never crash** — always degrade gracefully
- **API down** → save locally, show friendly message, suggest retry command
- **Invalid JSON from AI** → retry once silently. If second fails → show raw text, never crash
- **Disk write failure** → print output to stdout as fallback
- **No brief** → ask 3 inline questions and continue anyway
- All user-facing errors use `colors.danger()` from `ui/theme.ts`

---

## Shared Package (`packages/shared/src/index.ts`)

Contains all Zod schemas. When adding a new data type:
1. Add it to `shared/src/index.ts`
2. Build shared: `pnpm --filter @loopkit/shared build`
3. Use in CLI or web via `import { ... } from "@loopkit/shared"`

Schemas defined:
- `BriefSchema` — AI output from `loopkit init` (includes `overallScore` + `uncomfortableTruth`)
- `TaskSchema` — single task entry
- `ShipDraftsSchema` — HN + Twitter + IH drafts
- `PulseClusterSchema` — AI clustering output
- `LoopSynthesisSchema` — week win + one thing + BIP post + founder note
- `LoopLogSchema` — weekly proof metrics (`previousScore`, `currentScore`, `scoreDelta`, `weeksActive`, `decisionsMade`, `feedbackResponses`, `feedbackActedOn`)
- `ConfigSchema` — user config
- Helpers: `slugify()`, `getWeekNumber()`, `formatDate()`

---

## Web Package (`packages/web/`)

- Next.js 16 App Router with Tailwind v4
- Dark theme: background `#09090b` (zinc-950)
- Brand colors: violet-600 primary, cyan-500 secondary
- Fonts: Inter (body), JetBrains Mono (code blocks)
- All new routes go under `src/app/`
- Client components (e.g. `CopyButton`) use `"use client"` directive — keep as leaf nodes

### Color Palette

```
Primary:   #7C3AED (violet-600)
Secondary: #06B6D4 (cyan-500)
Success:   #10B981 (emerald-500)
Warning:   #F59E0B (amber-500)
Danger:    #EF4444 (red-500)
Muted:     #6B7280 (gray-500)
```

---

## Build Commands

```bash
# Root
pnpm install                          # install all deps
pnpm build                            # build all packages (Turborepo)

# Shared
pnpm --filter @loopkit/shared build   # must run before CLI if schemas changed

# CLI (package renamed to 'loopkit' — use direct cd)
cd packages/cli && pnpm build         # tsup → dist/index.js
cd packages/cli && pnpm dev           # watch mode

# Web
cd packages/web && npx next dev -p 3099   # dev server

# Test CLI locally
node packages/cli/dist/index.js --help
node packages/cli/dist/index.js init
```

---

## Coding Rules

### DO
- Use `@clack/prompts` for all interactive terminal UX (`p.text`, `p.confirm`, `p.select`, `p.spinner`, `p.intro`, `p.outro`)
- Use `p.isCancel()` after every prompt and handle gracefully
- Use `colors.*` from `ui/theme.ts` for all terminal output coloring
- Use `generateStructured()` — never raw `fetch` to AI APIs
- Validate all AI output against Zod schemas before using
- Keep commands under ~200 lines — extract helpers to storage/local.ts or ai/client.ts
- Always show `nextStep("commandname")` at the end of each command

### DON'T
- Don't use `console.log` for user-facing output — use `p.log.info()`, `colors.*`, or `box()`
- Don't use `Ink` or `React` in the CLI
- Don't store secrets in `.loopkit/config.json` (only tokens, not raw API keys in plaintext for free users)
- Don't modify existing git hooks — append-only only
- Don't block on any single failure — degrade and continue
- Don't add new npm dependencies without checking if existing ones cover the need
- Don't build features not in the PRD without explicit user approval

### Git Hook Safety (CRITICAL)
The git hook in `track.ts` MUST be append-only:
```typescript
// CORRECT: append to existing hook, use standalone node script
const hookLine = `\n# ── LoopKit ──\nnode .git/hooks/loopkit-commit-msg.js "$1"\n`;
const existing = fs.existsSync(hookPath) ? fs.readFileSync(hookPath, "utf-8") : "#!/bin/sh\n";
fs.writeFileSync(hookPath, existing + hookLine);

// WRONG: never overwrite
fs.writeFileSync(hookPath, hookScript);  // ← NEVER DO THIS
```
The hook writes a standalone `.js` file to `.git/hooks/loopkit-commit-msg.js` — no inline eval, no shell spawn overhead.

---

## AI Prompt Rules

When editing system prompts in `ai/prompts/`:

1. **Temperature** — 0.3 for scoring/analysis, 0.6 for creative writing (ship command)
2. **Never remove few-shot examples** — they calibrate scoring distribution
3. **Output format** — always JSON, no markdown fences, enforced by `generateObject()`
4. **Word caps** — init: 250 words, pulse: 200 words, loop: 150 words — keep them
5. **Critical rules section** — always includes anti-sycophancy rules ("NEVER say Great!")

When adding a new AI feature:
1. Define the output Zod schema in `shared/src/index.ts` first
2. Write the system prompt in `ai/prompts/[command].ts`
3. Add a `buildXxxPrompt()` function that injects context
4. Call via `generateStructured()` with that schema

---

## Phase Status

| Phase | Status | Description |
|---|---|---|
| 0 — Foundation | ✅ Done | Monorepo, Turborepo, TypeScript |
| 1 — `init` | ✅ Done | 5-question flow, AI scoring, brief.md, overallScore |
| 2 — `track` | ✅ Done | tasks.md, git hook, shipping score, snooze tracking, cut.md archive |
| 3 — `ship` | ✅ Done | 3-platform AI drafts, ship log, regenerate, $EDITOR |
| 4 — `loop` | ✅ Done | Weekly synthesis, BIP post, override rate warning |
| 5 — `pulse` | ✅ Done (V1) | Local JSON, AI clustering, --add flag |
| 6 — Landing page | ✅ Done | Next.js 16, dark premium design, nav bar, clipboard |
| 7 — Auth + Payments | ✅ Done | Convex Auth, Polar.sh, AI proxy |
| 8 — Dashboard | ✅ Done | Project overview, pulse inbox, benchmarks, archetypes |
| 9 — npm publish | ✅ Done | `npx loopkit init` ready, .npmignore set |
| 10 — Analytics Phase 1 | ✅ Done | Telemetry, Shipping DNA, Benchmarks CLI, Snooze Oracle |
| 11 — Analytics Phase 2 | ✅ Done | CSRF, resolveAuth, AI cache, git hook opt, Archetypes, Churn, Auto-Loop, Predictor |

---

## PRD Reference

The `prd.md` file in the root defines every acceptance criterion, error state, and success metric.
Before implementing any command feature, check the relevant section:

- `loopkit init` → §9.1 (line ~332)
- `loopkit track` → §9.2 (line ~720)
- `loopkit ship` → §9.3 (line ~871)
- `loopkit pulse` → §9.4 (line ~1060)
- `loopkit loop` → §9.5 (line ~1250)

When the PRD and this file conflict, **the PRD wins**.

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
