# Progress log

One dated entry per session: what was done, verification results, and the next step.
At the start of a session, read PLAN.md, this file, DECISIONS.md and HUMAN_TODO.md, then
resume at the first unchecked task.

## 2026-10-03 — session 1: branch + progress files + 0.1 monorepo

Done:
- Created branch `feat/mobile-app` from `fix/category-rename` @ `9eefeb6` (keeps the
  category-rename fix).
- Added the four progress files under `docs/mobile-port/`.
- Task 0.1: `git mv` of the Nuxt app into `apps/web` (pure move), then a root
  `package.json` declaring npm workspaces plus the regenerated root lockfile.
- Retargeted `.claude/launch.json` at `apps/web`.

Verification:
- (fill in: `npm run typecheck -w apps/web`, `npm run build -w apps/web`, built-server
  `/api/health`, `npm run dev -w apps/web`.)

Next step:
- Task 0.2: create `packages/core`, move the shared pure logic, add Vitest.
