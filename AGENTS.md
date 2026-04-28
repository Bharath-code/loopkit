# AGENTS.md — Agentic Coding Guidelines for LoopKit

Read `CLAUDE.md` for full architecture context. This file adds agent-specific rules.

---

## Quick Start

```bash
# Verify build before touching anything
pnpm --filter @loopkit/shared build
pnpm --filter @loopkit/cli build
node packages/cli/dist/index.js --help
```

---

## File Map — What to Touch

```
packages/cli/src/
  commands/        ← one file per command (init, track, ship, pulse, loop, auth, celebrate, telemetry, radar, keywords, timing, coach)
  analytics/       ← telemetry, benchmarks, dna, oracle, churn, autoLoop, predictor, competitorRadar, keywordFinder, marketTiming, patterns, peers, coach
  templates/       ← project template scaffolds (saas, api, mobile, cli, newsletter, agency, open-source, marketplace, ai-wrapper)
  ai/prompts/      ← system prompts
  ai/client.ts     ← generateStructured() wrapper (with cache + resolveAuth)
  storage/local.ts ← all .loopkit/ file I/O
  storage/sync.ts  ← CLI → Convex push (loop logs + ship logs + radar + timing)
  storage/cache.ts ← AI result cache (hash-based, 7-day TTL)
  ui/theme.ts      ← terminal colors/UI helpers

packages/shared/src/index.ts  ← ALL Zod schemas (single source of truth)

packages/web/src/app/         ← Next.js pages (dashboard, radar, timing, keywords, trends, benchmarks, pulse, loop)
packages/web/src/app/api/     ← API routes (all have CSRF protection, includes /sync/radar and /sync/timing)
packages/web/convex/          ← Convex backend (schema, queries, mutations, analytics, competitorRadar, marketTiming)
```

**Never touch:** `node_modules/`, `dist/`, `.next/`, `pnpm-lock.yaml`, `.git/hooks/`

---

## Build-Verify Loop (run after every change)

```bash
pnpm --filter @loopkit/shared build   # if schemas changed
pnpm --filter @loopkit/cli build           # always
node packages/cli/dist/index.js --help
```

---

## Safety Rules — Never Break These

| Rule                                            | Reason                          |
| ----------------------------------------------- | ------------------------------- |
| Git hooks must be **append-only**               | Overwriting corrupts user repos |
| Never silently delete task data                 | Data loss destroys trust        |
| Always handle `p.isCancel()` after every prompt | Ctrl+C must exit cleanly        |
| Wrap every AI call in try/catch                 | API downtime cannot crash CLI   |
| Never write raw API keys to disk                | Security                        |

---

## Common Mistakes

| Mistake                                     | Fix                                              |
| ------------------------------------------- | ------------------------------------------------ |
| Editing `dist/` files                       | Edit `src/` only — dist is generated             |
| Not rebuilding `shared` after schema change | `pnpm --filter @loopkit/shared build`            |
| Using `console.log` in commands             | Use `colors.*` from `ui/theme.ts`                |
| Hardcoding `.loopkit/` path                 | Use `getRoot()` from `storage/local.ts`          |
| Forgetting `p.isCancel()` check             | Always check after every `p.text/confirm/select` |

---

## AI Output Pattern

```typescript
// Always use this — never call generateText() + JSON.parse()
const result = await generateStructured({
  system: SYSTEM_PROMPT,
  prompt: buildPrompt(data),
  schema: ZodSchema, // from @loopkit/shared
  tier: "fast",
  temperature: 0.3,
});
```

---

## Out of Scope (don't build without asking)

- Team collaboration
- Mobile app / VS Code extension
- Zapier/Make integrations
- Any 13th command beyond the current 12 (init/track/ship/pulse/loop/auth/celebrate/telemetry/radar/keywords/timing/coach)
- New npm deps that duplicate existing functionality

---

## Definition of Done

- [ ] `pnpm --filter @loopkit/cli build` → 0 errors
- [ ] Web changed? → `cd packages/web && npx next build` → clean
- [ ] Tests pass: `pnpm --filter @loopkit/cli test` + `pnpm --filter @loopkit/web test` + `pnpm --filter @loopkit/shared test` (369 total)
- [ ] Acceptance criteria from relevant PRD section pass
- [ ] Ctrl+C exits gracefully at every prompt
- [ ] AI failure is handled gracefully (fallback, not crash)

---

## Environment

```bash
ANTHROPIC_API_KEY=sk-ant-...   # required for AI features
```

CLI reads key from env first, then from `.loopkit/config.json` (`auth.apiKey`) for BYOK Pro users.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.

<!-- convex-ai-end -->
