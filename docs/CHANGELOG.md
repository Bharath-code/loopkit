# Changelog

All notable changes to LoopKit are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and this project
adheres to [Semantic Versioning](https://semver.org/).

## [0.2.0] — 2026-06-12

The "Loop Closes Both Ways" release. v0.2.0 is what happens when the
CLI and the dashboard stop being two different products and start being
two ends of the same loop.

### Added

- **`loopkit sync [status|retry]`** — surface CLI→dashboard sync failures
  with a banner in `track`/`ship`/`loop` when 3+ consecutive pushes
  have failed. Closes the "free-tier users never knew their dashboard
  was empty" problem.
- **`loopkit audit [--weeks N] [--export md|pdf]`** — the founder
  therapy command. Reads 8 weeks of loop logs + ships + pulse,
  surfaces the one pattern you keep avoiding, the non-obvious
  insight the data shows, and one concrete change for next month.
  Blunt, not motivational. Optional PDF export.
- **`loopkit price [--local] [--export md] [--experiment N]`** —
  pricing copilot. Recommends 2-3 tier model + 30-day validation
  experiment based on the brief, pulse pricing signals, and
  pay-intent phrases. Detects 7 model types (freemium, one-time,
  subscription, usage-based, tiered, donation, open-core).
- **`loopkit celebrate --annual [year]`** — year-in-review preview
  with a 4×13 heatmap, headline metrics, and inferred archetype
  (All-Star / Marathoner / Sprinter / Perfectionist / Reactor).
- **`loopkit voice [--max N] [--no-preview]`** — record a 60s standup
  → transcribed via OpenAI Whisper → tasks extracted via AI → appended
  to `tasks.md`. Records via `rec` (sox) / `arecord` / `ffmpeg`.
  Graceful fallback if no backend or API key.
- **`/onboarding`** — 5-step web onboarding flow (product, problem,
  success metric, install, first task). State persists in
  sessionStorage. Generates `npx loopkit init <slug> --from-web <base64>`
  for one-click continuation.
- **`/wins`, `/wins/[handle]`, `/wins/[handle]/[year]/card`** — public
  distribution engine. Real-time feed of `celebrate --share` posts,
  per-handle profiles, and screenshot-ready year-in-review cards.
  Sample data on day 1 for populated feel.
- **Bidirectional task sync** — `loopkit track --push / --pull / --sync`
  CLI flags + `/dashboard/tasks` web page. Convex `tasks` table with
  LWW (last-write-wins) on `updatedAt`. CLI is canonical seed for
  new tasks; web mutations override when newer. CLI/WEB badge on
  every task shows provenance.
- **9 new schemas in `@loopkit/shared`**: `AuditReportSchema`,
  `AuditCohortSchema`, `AuditPatternEvolutionSchema`,
  `PricingRecommendationSchema`, `PricingTierSchema`, `PricingModelEnum`,
  `syncStatus` (in `ConfigSchema`).
- **YAML frontmatter in loop logs** — analytics modules read structured
  fields instead of regex. Old logs still parse via legacy fallback.

### Changed

- **Labs flag for 4 commands** — `radar`, `keywords`, `timing`, `update`
  are gated behind `loopkit labs on` (or `LOOPKIT_LABS=1`). The 5
  core loop commands are unaffected. `update` is now also marked
  deprecated.
- **Hardcoded mock counts removed** — "70% of founders quit by week 2"
  and "47 other founders ran loopkit loop yesterday" replaced with
  honest copy. Mocking future founders to coach present ones is
  bad product.
- **CLI bundle: 364KB → 16KB** (22.7x reduction). Lazy-loaded all
  15 command bodies. Cold start for `loopkit --help`: 194ms.
- **Refactored `commands/loop.ts`** — 1,074 lines → 839 lines. Extracted
  to `commands/loop/{helpers,frontmatter,saveLoopLog,revenue-flag,
  post-actions}.ts`. Pure helpers, single-responsibility orchestrator.
- **Removed dynamic imports** in `loop.ts` — static `import` for
  `writeTasksFile` and `writeConfig`. 3 fewer roundtrips per loop.
- **`loop --async` grace window** tightened to 7 days (was unbounded).
- **Help output** has a dedicated `Labs` section separating gated
  commands. Primary command help shows top 3 flags only.

### Fixed

- **CLI auth was breaking on Vercel** (SEC-3) — replaced in-memory
  sessions with persistent Convex `cliAuth` table. Survives
  serverless cold starts.
- **Dashboard widget hardcoded localhost** (SEC-4) — uses
  `NEXT_PUBLIC_APP_URL` with `loopkit.dev` fallback.
- **Cross-user data access** (SEC-1) — every Convex query/mutation
  now verifies project ownership via `userOwnsProject`.
- **Subscription expiration not checked** (SEC-5) — `users.me`
  downgrades expired subscriptions to `free`.
- **Unbounded Convex queries** (PERF-1) — `listByProject` and
  `getResponses` paginated (max 100-500).
- **Turbopack workspace warning** — cosmetic, no functional impact.

### Security

- **CSRF protection** on all `/api/sync/*` routes (Origin header check).
- **IP rate limiting** on public pulse form (3 req/min via
  `getClientIp` + trusted-proxy env var).
- **AES-256-GCM token encryption** for `auth.apiKey` and
  `anthropicKey` in `config.json` (host-derived key, scrypt).
- **Convex auth on every query/mutation** — no query accepts a raw
  `projectId` or `userId` from the client without ownership check.

### Performance

- **CLI cold start**: 364KB → 16KB (22.7x). 194ms for `--help`.
- **Loop log reads**: frontmatter-based, no more regex.
- **Convex queries**: paginated, indexed.
- **AI calls**: cached at 7-day TTL via `(command, system, prompt,
  schema)` hash.

### Tests

- **438 CLI tests** (was 327 → +111 new in v0.2.0)
- **43 web tests** (was 37 → +6)
- **101 shared tests** (was 75 → +26)
- **582 total tests** across the monorepo, all passing
- All commands have `isCancel()` graceful exits on Ctrl+C
- All Convex mutations auth-check project ownership

## [0.1.0] — 2026-04-25

Initial public release. 15 CLI commands, 5-core-loop ritual,
Convex-backed dashboard, share-in-public wins, billing via Polar.sh.

---

[0.2.0]: https://github.com/loopkit/loopkit/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/loopkit/loopkit/releases/tag/v0.1.0
