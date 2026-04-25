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
  commands/        ← one file per command
  ai/prompts/      ← system prompts
  ai/client.ts     ← generateStructured() wrapper
  storage/local.ts ← all .loopkit/ file I/O
  ui/theme.ts      ← terminal colors/UI helpers

packages/shared/src/index.ts  ← ALL Zod schemas (single source of truth)

packages/web/src/app/         ← Next.js pages
```

**Never touch:** `node_modules/`, `dist/`, `.next/`, `pnpm-lock.yaml`, `.git/hooks/`

---

## Build-Verify Loop (run after every change)

```bash
pnpm --filter @loopkit/shared build   # if schemas changed
pnpm --filter @loopkit/cli build      # always
node packages/cli/dist/index.js --help
```

---

## Safety Rules — Never Break These

| Rule | Reason |
|---|---|
| Git hooks must be **append-only** | Overwriting corrupts user repos |
| Never silently delete task data | Data loss destroys trust |
| Always handle `p.isCancel()` after every prompt | Ctrl+C must exit cleanly |
| Wrap every AI call in try/catch | API downtime cannot crash CLI |
| Never write raw API keys to disk | Security |

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| Editing `dist/` files | Edit `src/` only — dist is generated |
| Not rebuilding `shared` after schema change | `pnpm --filter @loopkit/shared build` |
| Using `console.log` in commands | Use `colors.*` from `ui/theme.ts` |
| Hardcoding `.loopkit/` path | Use `getRoot()` from `storage/local.ts` |
| Forgetting `p.isCancel()` check | Always check after every `p.text/confirm/select` |

---

## AI Output Pattern

```typescript
// Always use this — never call generateText() + JSON.parse()
const result = await generateStructured({
  system: SYSTEM_PROMPT,
  prompt: buildPrompt(data),
  schema: ZodSchema,       // from @loopkit/shared
  tier: "fast",
  temperature: 0.3,
});
```

---

## Out of Scope (don't build without asking)

- Team collaboration
- Mobile app / VS Code extension
- Zapier/Make integrations
- Any 6th command beyond init/track/ship/pulse/loop
- New npm deps that duplicate existing functionality

---

## Definition of Done

- [ ] `pnpm --filter @loopkit/cli build` → 0 errors
- [ ] Web changed? → `cd packages/web && npx next build` → clean
- [ ] Acceptance criteria from relevant PRD section pass
- [ ] Ctrl+C exits gracefully at every prompt
- [ ] AI failure is handled gracefully (fallback, not crash)

---

## Environment

```bash
ANTHROPIC_API_KEY=sk-ant-...   # required for AI features
```

CLI reads key from env first, then from `.loopkit/config.json` (`auth.apiKey`) for BYOK Pro users.
